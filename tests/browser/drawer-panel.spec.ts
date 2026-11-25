import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-drawer-panel-reference.json' with { type: 'json' };

type Case = (typeof reference.cases)[number];
type Frame = Case['frames'][number];
type ProbeWindow = Window & {
  drawerPanelInputs?: { nodes: WeakMap<Element, number>; sequence: number; };
};

/** Читает видимость, поведение кнопки и семантические слои независимо от тегов React. */
async function readPanel(page: Page, semantic: boolean) {
  return page.evaluate(readSemantic => {
    const root = document.getElementById('study-root');
    const find = (slot: string) => root?.querySelector<HTMLElement>(`[data-ant-drawer-${slot}]`);
    const header = find('header');
    const close = root?.querySelector<HTMLButtonElement>('[data-ant-drawer-close]');
    const section = find('section');
    const skeleton = find('body')?.querySelector<HTMLElement>('[data-ant-skeleton-main]');
    const wrap = root?.querySelector('#render-host');
    const input = root?.querySelector<HTMLInputElement>('#body-input');
    const view = window as ProbeWindow;
    const probe = view.drawerPanelInputs ??= { nodes: new WeakMap(), sequence: 0 };
    if (input && !probe.nodes.has(input)) {
      probe.nodes.set(input, ++probe.sequence);
    }

    let button;
    if (close) {
      const style = getComputedStyle(close);
      button = {
        placement: close.parentElement === header ? 'end' : 'start',
        disabled: close.disabled,
        label: close.getAttribute('aria-label'),
        data: close.getAttribute('data-close-owner'),
        text: close.textContent.trim(),
        fallbackIcon: Boolean(close.querySelector('svg')),
        customIcon: Boolean(close.querySelector('[data-close-icon]')),
        marginStart: Number.parseFloat(style.marginInlineStart),
        marginEnd: Number.parseFloat(style.marginInlineEnd)
      };
    }

    const slots = ['root', 'mask', 'wrapper', 'section', 'header', 'title', 'extra', 'body',
      'footer', 'dragger', 'close'];
    const semantics: Record<string, unknown> = {};
    if (readSemantic) {
      for (const slot of slots) {
        const node = slot === 'root' ? root : find(slot === 'wrapper' ? 'content-wrapper' : slot);
        semantics[slot] = node ? {
          provider: node.style.getPropertyValue(`--provider-${slot}`),
          local: node.style.getPropertyValue(`--local-${slot}`),
          shared: node.style.getPropertyValue('--study-shared'),
          classNames: ['provider', 'local'].map(name => node.classList.contains(`${name}-${slot}`))
        } : null;
      }
    }

    return {
      visible: root?.hasAttribute('open') ?? false,
      header: Boolean(header),
      closeOnly: Boolean(header?.matches('[class*="-header-close-only"]')),
      button: button ?? null,
      title: find('title')?.textContent.trim() ?? null,
      extra: Boolean(find('extra')),
      footer: Boolean(find('footer')),
      input: input ? { node: probe.nodes.get(input), value: input.value } : null,
      skeleton: skeleton ? {
        active: skeleton.hasAttribute('data-ant-skeleton-active'),
        rows: skeleton.querySelectorAll('li').length,
        display: getComputedStyle(skeleton).display
      } : null,
      wrap: wrap ? {
        containsSection: Boolean(section && wrap.contains(section)),
        replacement: Boolean(wrap.querySelector('#replacement'))
      } : null,
      ref: document.getElementById('panel-ref-state')?.textContent,
      providerPanel: Boolean(section?.classList.contains('provider-panel')),
      providerPanelStyle: section?.style.getPropertyValue('--provider-panel') ?? '',
      semantic: semantics,
      requests: JSON.parse(document.getElementById('panel-requests')?.textContent ?? '[]')
    };
  }, semantic);
}

/** Обновляет состояние настройки за маской, как это может делать родительский компонент. */
async function runOwnerAction(page: Page, action: string) {
  await page.locator(`[data-step="${action}"]`).evaluate(node => {
    if (node instanceof HTMLButtonElement) node.click();
  });
}

/** Выполняет операцию владельца или взаимодействие непосредственно с панелью. */
async function perform(page: Page, step: string) {
  if (step === 'click-close') {
    await page.locator('[data-ant-drawer-close]').evaluate(node => {
      if (node instanceof HTMLButtonElement) node.click();
    });
  }
  else if (step === 'edit') {
    await page.locator('#body-input').fill('edited');
  }
  else {
    await runOwnerAction(page, step);
  }
}

/** Дожидается DOM-обновления и проверяет состояние всех наблюдаемых частей. */
async function assertFrame(page: Page, frame: Frame, semantic: boolean) {
  const { step, ...expected } = frame;
  await expect.poll(() => readPanel(page, semantic), { message: step }).toEqual(expected);
}

/** Снимает выигравшие CSS-свойства в одной фазе с публичными уведомлениями. */
async function readMotion(page: Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector('[data-ant-drawer-content-wrapper]');
    const mask = document.querySelector('[data-ant-drawer-mask]');
    const events = document.getElementById('panel-visibility')?.textContent ?? '[]';
    return {
      transform: wrapper ? getComputedStyle(wrapper).transform : null,
      opacity: mask ? getComputedStyle(mask).opacity : null,
      events: JSON.parse(events)
    };
  });
}

test.use({ viewport: { width: 1000, height: 600 }, reducedMotion: 'reduce' });

for (const { name, frames } of reference.cases) {
  test(`Drawer follows the pinned panel profile ${name}`, async ({ page }) => {
    await page.goto('/?fixture=drawer-panel');
    await page.getByRole('combobox', { name: 'Drawer panel profile' }).selectOption(name);
    if (frames[0].visible) {
      await runOwnerAction(page, 'open');
    }

    for (const frame of frames) {
      if (frame.step !== 'initial') {
        await perform(page, frame.step);
      }
      await assertFrame(page, frame, name === 'semantic');
    }
  });
}

test('RTL Drawer places close after extra and restores focus', async ({ page }) => {
  await page.goto('/?fixture=drawer-panel');
  await page.getByRole('combobox', { name: 'Drawer panel profile' }).selectOption('provider-local');
  const opener = page.getByRole('button', { name: 'Open', exact: true });
  await opener.click();

  const drawer = page.getByRole('dialog', { name: 'Drawer study' });
  const extra = drawer.getByRole('button', { name: 'Extra' });
  const close = drawer.getByRole('button', { name: 'Local close' });
  await expect(extra).toBeFocused();
  await expect(close).toHaveClass(/probe-drawer-close-end/);
  expect(await close.evaluate(node => {
    const closeRect = node.getBoundingClientRect();
    const extraRect = document.getElementById('extra-action')?.getBoundingClientRect();
    return Boolean(extraRect && closeRect.right <= extraRect.left);
  })).toBe(true);

  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator('#panel-requests')).toHaveText('["click"]');
});

test('Drawer preserves inline CSS and visibility callbacks during movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?fixture=drawer-panel');
  await page.getByRole('combobox', { name: 'Drawer panel profile' }).selectOption('motion-style');
  const dialog = page.locator('#study-root');
  const expected = reference.motionStyles;

  await runOwnerAction(page, 'open');
  await expect(dialog).toHaveAttribute('open', '');
  await expect.poll(() => readMotion(page)).toEqual(expected.opening);

  await runOwnerAction(page, 'clear-motion-style');
  await expect.poll(async () => (await readMotion(page)).transform)
    .not.toBe(expected.opening.transform);
  await runOwnerAction(page, 'set-motion-style');
  await expect.poll(() => readMotion(page)).toEqual(expected.opening);
  await expect.poll(() => readMotion(page)).toEqual(expected.open);

  await runOwnerAction(page, 'hide');
  await expect.poll(() => readMotion(page)).toEqual(expected.closing);
  await expect(dialog).toBeHidden();
  await expect(page.locator('#panel-visibility')).toHaveText(JSON.stringify(expected.closed.events));
});
