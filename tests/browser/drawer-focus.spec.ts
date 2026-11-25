import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-drawer-focus-reference.json' with { type: 'json' };

type Profile = (typeof reference.cases)[number]['profile'];
type Frame = (typeof reference.cases)[number]['frames'][number];
const baseline = reference.cases.find(sample => sample.profile.name === 'default')?.frames ?? [];
const nativeProfiles = new Set([
  'default', 'inline-default', 'nested-maskless', 'nested-keyboard-disabled',
  'local-mask-fields', 'provider-masks-nested', 'live-mask'
]);
const manualTraps = new Set(['maskless-trap', 'masked-no-auto', 'focus-fields']);

/** Выбирает сценарий до открытия диалога, пока доступны все controls страницы. */
async function select(page: Page, profile: string) {
  await page.goto('/?fixture=drawer-focus');
  await page.getByRole('combobox', { name: 'Drawer focus profile' }).selectOption(profile);
}

/** Вызывает программное изменение owner state во время отображения маски. */
async function owner(page: Page, action: string) {
  await page.getByTestId(action).evaluate(button => {
    if (button instanceof HTMLButtonElement) button.click();
  });
}

/** Передаёт реальный Tab, Escape и click по координатам, включая попадание на маску. */
async function act(page: Page, action: string) {
  if (action === 'open') await page.locator('#before').click();
  else if (action === 'escape') await page.keyboard.press('Escape');
  else if (action === 'focus-outside') {
    await page.locator('#outside').evaluate(node => node.focus());
  }
  else if (action === 'click-outside') {
    const bounds = await page.locator('#outside').boundingBox();
    if (!bounds) throw new Error('Missing outside button bounds');
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  }
  else if (action === 'focus-last' || action === 'focus-parent-last') {
    await page.locator('#a-last').evaluate(node => node.focus());
  }
  else if (action === 'tab-last' || action === 'shift-first') {
    const selector = action === 'tab-last' ? '#a-last' : '#a-root [data-ant-drawer-close]';
    await page.locator(selector).evaluate(node => node.focus());
    await page.keyboard.press(action === 'tab-last' ? 'Tab' : 'Shift+Tab');
  }
  else await owner(page, action);
}

/** Читает видимые оболочки, состояние маски и доступность прокрутки. */
async function nativePanels(page: Page) {
  return page.evaluate(() => ({
    panels: ['a', 'b'].map(id => {
      const panel = document.getElementById(`${id}-root`);
      if (!(panel instanceof HTMLDialogElement) || !panel.open) return null;

      const mask = panel.querySelector(':scope > [data-ant-drawer-mask]');
      return {
        mask: Boolean(mask),
        blur: Boolean(mask?.matches('[class*="-mask-blur"]')),
        visible: panel.getClientRects().length > 0,
        native: panel.matches(':modal'),
        rootHeight: panel.getBoundingClientRect().height
      };
    }),
    locked: [document.documentElement, document.body].some(
      node => getComputedStyle(node).overflowY === 'hidden'
    )
  }));
}

/** Приводит нативную кнопку закрытия и пользовательские controls к именам UMD-фикстуры. */
async function focused(page: Page) {
  return page.evaluate(() => {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;

    const close = element?.closest('[data-ant-drawer-close]');
    if (close) {
      return close.closest('dialog')?.id === 'b-root' ? 'b-close' : 'a-close';
    }
    return element?.id || element?.nodeName.toLowerCase();
  });
}

/** Учитывает нативный первый control и замыкание Tab в явно удерживаемой области. */
async function checkFocus(page: Page, profile: Profile, frame: Frame, native: boolean) {
  const action = frame.action;
  if (native && frame.panels[0]
    && ['tab-last', 'shift-first', 'focus-outside', 'click-outside'].includes(action)) {
    // Native dialog может передать Tab адресной строке, но не control фоновой страницы.
    await expect.poll(() => focused(page)).toMatch(/^(a-|b-|body)/);
    return;
  }

  let target = frame.focus;
  if (native && target === 'a-root') target = 'a-close';
  if (manualTraps.has(profile.name) && action === 'tab-last') target = 'a-close';
  await expect.poll(() => focused(page)).toBe(target);
}

test.use({ viewport: { width: 960, height: 720 } });

for (const { profile, frames } of reference.cases) {
  test(`Drawer follows pinned mask, focus and Escape for ${profile.name}`, async ({ page }) => {
    await select(page, profile.name);
    const events: unknown[][] = [];
    // Существующий getContainer=false без focusable сохраняет нативную модальность Svelte.
    const expectedFrames = profile.name === 'inline-default' ? baseline : frames;
    expect(expectedFrames.length).toBe(frames.length);

    for (const frame of expectedFrames) {
      await act(page, frame.action);
      const native = Boolean(frame.panels[0]?.mask && nativeProfiles.has(profile.name));
      const panels = frame.panels.map((panel, index) => panel && ({
        mask: panel.mask,
        blur: panel.blur,
        visible: panel.visible,
        native: index === 0 && native,
        ...('rootHeight' in panel ? { rootHeight: panel.rootHeight } : {})
      }));
      events.push(...frame.events);

      await expect.poll(() => nativePanels(page)).toMatchObject({ panels, locked: frame.locked });
      await expect(page.getByTestId('drawer-focus-events')).toHaveText(JSON.stringify(events));
      await expect(page.getByTestId('outside-clicks')).toHaveText(String(frame.outsideClicks));
      await checkFocus(page, profile, frame, native);
    }
  });
}

test('Drawer live mask changes preserve the editor and leave the page usable in ShadowRoot',
  async ({ page }) => {
    await select(page, 'live-mask');
    await owner(page, 'use-shadow');
    await act(page, 'open');

    const dialog = page.getByRole('dialog', { name: 'Drawer a', exact: true });
    const input = dialog.getByRole('textbox', { name: 'Last a', exact: true });
    await input.fill('Preserved draft');
    await input.evaluate(node => {
      if (node instanceof HTMLInputElement) node.setSelectionRange(2, 5);
    });
    const before = await input.elementHandle();
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');

    await owner(page, 'mask-off');

    await expect(dialog).not.toHaveAttribute('aria-modal');
    await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
    await expect(input).toBeFocused();
    expect(await input.evaluate((node, original) => node === original, before)).toBe(true);
    expect(await input.evaluate(node => node instanceof HTMLInputElement
      ? [node.selectionStart, node.selectionEnd] : undefined)).toEqual([2, 5]);
    await expect(input).toHaveValue('Preserved draft');

    await page.locator('#outside').click();
    await expect(page.getByTestId('outside-clicks')).toHaveText('1');
    await owner(page, 'mask-on');

    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(input).toHaveValue('Preserved draft');
    expect(await input.evaluate((node, original) => node === original, before)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#before')).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  });

test('Drawer keeps focus in its portaled Popover and handles Escape below it', async ({ page }) => {
  await select(page, 'maskless-trap');
  await owner(page, 'use-extra');
  await act(page, 'open');
  await page.locator('#portal-trigger').click();
  const editor = page.locator('#portal-input');
  await expect(editor).toBeFocused();
  await editor.fill('Portal draft');

  await page.keyboard.press('Escape');

  await expect(editor).toBeHidden();
  await expect(page.locator('#portal-trigger')).toBeFocused();
  await expect(page.locator('#a-root')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#a-root')).toBeHidden();
});

test('Drawer yields managed focus and Escape to its nested native Modal', async ({ page }) => {
  await select(page, 'maskless-trap');
  await owner(page, 'use-extra');
  await act(page, 'open');
  const trigger = page.locator('#modal-trigger');
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Covering modal', exact: true });
  const editor = modal.getByRole('textbox', { name: 'Modal editor', exact: true });
  await editor.fill('Native editor');
  await expect(editor).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#a-root')).toBeVisible();
});

test('Drawer with no mask lets the page scroll while open', async ({ page }) => {
  await select(page, 'mask-false');
  await act(page, 'open');

  await page.mouse.move(30, 500);
  await page.mouse.wheel(0, 280);

  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('#a-root')).toBeVisible();
});
