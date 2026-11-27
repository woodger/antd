import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import source from '../fixtures/ant-design-menu-popup-alignment-reference.json' with { type: 'json' };

const menu = (page: Page) => page.getByRole('menu', { name: 'Alignment menu', exact: true });
const branch = (page: Page) => menu(page).getByRole('menuitem', { name: 'Branch', exact: true });
const pane = (page: Page) => page.locator('.alignment-pane:popover-open');
const deep = (page: Page) => page.locator('.alignment-deep:popover-open');

type Measurement = {
  anchor: readonly number[] | null;
  popup: readonly number[] | null;
  placement?: string | null;
};

// Upgrades openKeys through the owner, keeping the focus inside the current popup.
async function setOpen(page: Page, keys: readonly string[]) {
  await page.getByRole('textbox', { name: 'Alignment open keys' }).evaluate(
    (input: HTMLInputElement, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    keys.join(',')
  );
}

// Allows the open popup to perform the measurement after updating props.
function afterFrame(page: Page) {
  return page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

// Reads the dimensions and current name of the position from the surface, opened in the top layer.
async function position(anchor: Locator, popup: Locator) {
  const [target, surface, name] = await Promise.all([
    anchor.boundingBox(),
    popup.boundingBox(),
    popup.evaluate(element => [...element.classList].find(
      token => token.includes('-submenu-placement-')
    ))
  ]);
  if (!target || !surface) {
    return undefined;
  }

  return {
    anchor: [target.x, target.y, target.width, target.height],
    popup: [surface.x, surface.y, surface.width, surface.height],
    placement: name ?? undefined
  };
}

// Checks the distance between the specified angles at different sizes of the native header and
// list. Trigger rounds the final coordinates down to the pixel.
function gap(
  measurement: Measurement | undefined,
  corner: 'topLeft' | 'bottomLeft' | 'topRight',
  popupEdge: 'top' | 'bottom' = 'top'
) {
  if (!measurement?.anchor || !measurement.popup) {
    return undefined;
  }

  const [x, y, width, height] = measurement.anchor;
  const [left, top, , popupHeight] = measurement.popup;
  const anchorX = corner === 'topRight' ? x + width : x;
  const anchorY = corner === 'bottomLeft' ? y + height : y;
  const popupY = popupEdge === 'bottom' ? top + popupHeight : top;
  return {
    x: left - Math.floor(anchorX),
    y: popupY - Math.floor(anchorY),
    placement: measurement.placement
  };
}

// More has the same opening point, but the list is wider and higher.
function origin(measurement: Measurement | undefined) {
  return {
    anchor: measurement?.anchor,
    popup: measurement?.popup?.slice(0, 2),
    placement: measurement?.placement
  };
}

test.use({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-popup-alignment');
  await expect(menu(page)).toBeVisible();
});

for (const { options, result } of source.cases) {
  test(`places a submenu using the React reference for ${options.id}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Alignment sample' }).selectOption(options.id);
    const overflow = options.id === 'overflow-builtin';
    const popup = overflow ? page.locator('.alignment-overflow:popover-open') : pane(page);
    const anchor = overflow ? menu(page).getByRole('menuitem', { name: 'ellipsis' }) : branch(page);
    await setOpen(page, overflow ? ['rc-menu-more'] : ['branch']);

    await expect(menu(page)).not.toHaveAttribute('builtinplacements');
    if (!result.shown) {
      await expect(anchor).toHaveAttribute('aria-expanded', 'true');
      await expect(popup).toHaveCount(0);
      const children = menu(page).getByRole('menuitem', { name: /^(Child|Inner)$/ });
      await expect(children).toHaveCount(result.inlineChildren);
      return;
    }

    await expect(popup).toBeVisible();
    if (overflow) {
      await expect.poll(async () => origin(await position(anchor, popup))).toEqual(origin(result));
    }
    else if (options.mode === 'horizontal') {
      const above = result.placement === 'ant-menu-submenu-placement-topLeft';
      const corner = above ? 'topLeft' : 'bottomLeft';
      const edge = above ? 'bottom' : 'top';
      await expect.poll(async () => gap(await position(anchor, popup), corner, edge)).toEqual(
        gap(result, corner, edge)
      );
    }
    else {
      await expect.poll(() => position(anchor, popup)).toEqual({
        anchor: result.anchor,
        popup: result.popup,
        placement: result.placement
      });
    }
  });
}

test('applies offset and map updates at the next alignment without replacing an open popup',
  async ({ page }) => {
    await page.getByRole('combobox', { name: 'Alignment sample' }).selectOption(source.live.live.id);
    await setOpen(page, ['branch']);
    await expect(pane(page)).toBeVisible();
    await expect.poll(async () => gap(await position(branch(page), pane(page)), 'bottomLeft'))
      .toEqual(gap(source.live.beforeInner, 'bottomLeft'));
    await setOpen(page, ['branch', 'inner']);

    const inner = pane(page).getByRole('menuitem', { name: 'Inner', exact: true });
    const leaf = deep(page).getByRole('menuitem', { name: 'Leaf', exact: true });
    await leaf.focus();
    const originalLeaf = await leaf.elementHandle();
    const before = await position(inner, deep(page));

    for (const [label, step] of [
      [undefined, source.live.before],
      ['Update inner offset', source.live.afterOffset],
      ['Replace placement', source.live.afterMapping],
      ['resize', source.live.resized]
    ] as const) {
      if (label === 'resize') {
        await page.setViewportSize({ width: 990, height: 690 });
      }
      else if (label) {
        await page.getByRole('button', { name: label }).evaluate((button: HTMLButtonElement) => {
          button.click();
        });
      }
      await afterFrame(page);

      const corner = label === 'resize' ? 'bottomLeft' : 'topRight';
      await expect.poll(async () => gap(await position(inner, deep(page)), corner)).toEqual(
        gap(step, corner)
      );
      if (label && label !== 'resize') {
        expect((await position(inner, deep(page)))?.popup).toEqual(before?.popup);
      }
      await expect(leaf).toBeFocused();
      expect(await leaf.evaluate((element, original) => element === original, originalLeaf))
        .toBe(true);
    }
  });
