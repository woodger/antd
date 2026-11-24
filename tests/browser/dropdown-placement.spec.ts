import type { Locator, Page } from '@playwright/test';
import { test, expect } from './test';
import {
  dropdownPlacementCases, type PlacementAction, type PlacementCase, type PlacementFrame
} from './dropdown-placement-reference';

test.use({ viewport: { width: 1000, height: 700 } });

// Передаёт реальные координаты pointer. Disabled-кнопка тоже получает contextmenu от браузера.
async function act(page: Page, action: PlacementAction) {
  const trigger = page.locator('#trigger');
  switch (action[0]) {
    case 'initial':
      return;
    case 'unmount':
      return clickFixtureButton(page, 'unmount');
    case 'choose':
      return page.getByRole('menuitem', { name: 'Alpha', exact: true }).click();
    case 'owner':
      return clickFixtureButton(page, action[1] ? 'set-owner-open' : 'set-owner-closed');
    case 'scroll':
      return page.evaluate(y => window.scrollTo(0, y), action[1]);
    case 'scroll-parent':
      return page.locator('#' + action[1]).evaluate(node => { node.scrollTop = 37; });
    case 'resize':
      return page.setViewportSize({ width: action[1][0], height: action[1][1] });
    case 'clock':
      return page.clock.runFor(action[1]);
    case 'Escape':
      return page.keyboard.press('Escape');
    case 'Shift+F10':
    case 'ContextMenu':
      await trigger.focus();
      return page.keyboard.press(action[0]);
    case 'away':
      return page.mouse.move(430, 16);
    case 'outside':
    case 'outside-context':
      return page.mouse.click(430, 16, { button: action[0] === 'outside' ? 'left' : 'right' });
    default: {
      const bounds = await trigger.boundingBox();
      if (!bounds) throw new Error('Dropdown trigger has no rendered bounds');

      const x = bounds.x + action[1][0];
      const y = bounds.y + action[1][1];
      if (action[0] === 'move') return page.mouse.move(x, y);
      if (action[0] === 'tap') return page.touchscreen.tap(x, y);
      return page.mouse.click(x, y, { button: action[0] === 'context' ? 'right' : 'left' });
    }
  }
}

// Меняет props владельца без перемещения указателя и передачи фокуса кнопке фикстуры.
function clickFixtureButton(page: Page, id: string) {
  return page.locator('#' + id).evaluate((node: HTMLButtonElement) => node.click());
}

// Корневой callback Native сообщает только trigger. Нативный click кнопки идёт до обёртки.
function expectedEvents(events: PlacementFrame['state']['events']) {
  const projected = events.filter(([kind, , source]) => kind !== 'container'
    && !(kind === 'open' && source === 'menu'));
  for (let i = 1; i < projected.length; i++) {
    const before = projected[i - 1];
    const current = projected[i];
    if (before[0] === 'open' && current[0] === 'child-click') {
      [projected[i - 1], projected[i]] = [current, before];
    }
  }
  return projected;
}

// Проверяет положение поверхности и стрелки по реальным границам в окне браузера.
function popupLayout(popup: Locator) {
  return popup.evaluate(panel => {
    function locate(element: Element | null) {
      if (!element) return null;

      const { left, top, width, height } = element.getBoundingClientRect();
      return { left, top, width, height };
    }

    const arrow = panel.querySelector('[data-ant-dropdown-arrow]');
    return {
      placement: panel.getAttribute('data-ant-dropdown-placement') ?? undefined,
      geometry: locate(panel),
      minWidth: getComputedStyle(panel).minWidth,
      arrow: locate(arrow)
    };
  });
}

function testPlacement({ profile, frames }: PlacementCase) {
  test(`Dropdown aligns and handles trigger actions like React for ${profile.id}`, async ({ page }) => {
    const manualClock = Boolean(profile.mouseEnterDelay);
    if (manualClock) {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
      await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    }

    await page.goto('/?fixture=dropdown-placement&sample=' + profile.id);
    await expect(page.locator('#trigger')).toBeVisible();
    let original: Awaited<ReturnType<Locator['elementHandle']>> | undefined;
    let previousEvents = 0;
    const entries: unknown[][] = [];
    for (const { action, state } of frames) {
      await act(page, action);
      if (manualClock) await page.clock.runFor(action[0] === 'unmount' ? 364 : 64);

      const panel = page.locator('.context-popup');
      const popup = state.popup;
      if (popup?.visible) {
        await expect(panel, action[0]).toBeVisible();
        if (!original) original = await panel.elementHandle();
        const placement = popup.className.match(/\bant-dropdown-placement-([a-zA-Z]+)/)?.[1];
        await expect.poll(() => popupLayout(panel), { message: action[0] }).toEqual({
          placement, geometry: popup.geometry, minWidth: popup.minWidth, arrow: popup.arrow
        });
        if (profile.portal) expect(await panel.evaluate(node => node.parentElement?.id))
          .toBe(popup.container);
        expect(await panel.evaluate((node, before) => node === before, original)).toBe(true);

        if (profile.manyItems) {
          await expect.poll(() => page.locator('#context-menu').evaluate(node => node.scrollTop))
            .toBe(state.menuScroll);
        }
        if (profile.autoFocus) {
          const expected = state.focusedRole === 'menuitem'
            ? panel.getByRole('menuitem', { name: 'Alpha', exact: true })
            : page.locator('#trigger');
          await expect(expected).toBeFocused();
        }
      }
      else {
        await expect(panel, action[0]).toBeHidden();
        if (profile.autoFocus && action[0] === 'Escape') {
          // Native возвращает фокус после открытия как мышью, так и клавиатурой.
          await expect(page.locator('#trigger')).toBeFocused();
        }
      }

      entries.push(...expectedEvents(state.events.slice(previousEvents)));
      previousEvents = state.events.length;
      const containers = state.events.filter(([kind]) => kind === 'container');
      await expect.poll(async () => {
        const encoded = await page.locator('#placement-events').textContent();
        const ledger: unknown[][] = JSON.parse(encoded ?? '[]');
        return {
          events: ledger.filter(([kind]) => kind !== 'container'),
          containers: ledger.filter(([kind]) => kind === 'container')
        };
      }, { message: action[0] }).toEqual({ events: entries, containers });
    }
    await expect(page.locator('.context-popup')).toHaveCount(0);
  });
}

for (const entry of dropdownPlacementCases) {
  if (entry.profile.touch) {
    test.describe('touch input', () => {
      test.use({ hasTouch: true });
      testPlacement(entry);
    });
  }
  else {
    testPlacement(entry);
  }
}

test('Dropdown retargets an open menu when trigger actions change', async ({ page }) => {
  await page.goto('/?fixture=dropdown-placement&sample=context-only');
  await act(page, ['context', [130, 33]]);
  const panel = page.locator('.context-popup');
  const command = panel.getByRole('menuitem', { name: 'Alpha', exact: true });
  await command.focus();
  const original = await panel.elementHandle();

  await clickFixtureButton(page, 'set-trigger-click');

  await expect.poll(() => popupLayout(panel)).toMatchObject({
    placement: 'bottomLeft', geometry: { left: 64, width: 260 }, minWidth: '260px'
  });
  await expect(command).toBeFocused();
  expect(await panel.evaluate((node, before) => node === before, original)).toBe(true);

  await clickFixtureButton(page, 'set-trigger-context');

  await expect.poll(() => popupLayout(panel)).toMatchObject({
    placement: 'rightTop', geometry: { left: 194, width: 132.03125 }, minWidth: '0px'
  });
  await expect(command).toBeFocused();
  expect(await panel.evaluate((node, before) => node === before, original)).toBe(true);

  await page.keyboard.press('Escape');

  await expect(panel).toBeHidden();
  await expect(page.locator('#trigger')).toBeFocused();
  await expect(page.locator('#placement-events')).toHaveText(
    '[["open",true,"trigger"],["child-context",194,153,true],["open",false,"trigger"]]'
  );
});
