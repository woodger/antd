import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-tooltip-unique-delegates-reference.json' with { type: 'json' };

type Frame = (typeof reference.cases)[number]['snapshots'][number];
type PanelHandle = Awaited<ReturnType<Locator['elementHandle']>>;
const popup = '.study-delegate-popup';
const shell = `${popup}[data-ant-tooltip-unique]`;
const background = '[data-ant-tooltip-unique-background]';

/** Select the mode for a pair scenario in stand-alone browser fixture. */
async function select(page: Page, mode: string) {
  await page.goto('/?fixture=tooltip-unique-delegates');
  await page.getByRole('combobox', { name: 'Delegate case', exact: true }).selectOption(mode);
}

/** Returns trigger, equally addressed in scenarios Tooltip, Popover and Popconfirm. */
function trigger(page: Page, id: string) {
  return page.locator(`#unique-delegate-${id}`);
}

/** Compares visible panels and already visited independent shells. */
async function nativePanels(page: Page, frame: Frame) {
  const visited = frame.panels.map(panel => panel.contents);
  return page.locator(popup).evaluateAll((nodes, visited) => nodes.flatMap(node => {
    const contents = node.querySelector('[data-study-content]')?.getAttribute('data-study-content') ?? null;
    const visible = node.matches(':popover-open');
    const visitedContent = contents !== null && visited.includes(contents);
    if (!visible && !node.hasAttribute('data-ant-tooltip-unique') && !visitedContent) {
      return [];
    }

    return [{
      contents,
      visible,
      classes: [...node.classList].filter(name => /-(unique-controlled|placement-.+)$/.test(name)).sort(),
      arrows: node.querySelectorAll('[data-ant-tooltip-arrow], [data-ant-popover-arrow]').length
    }];
  }).sort((a, b) => (a.contents ?? '').localeCompare(b.contents ?? '')), visited);
}

/** Compares the setting that the user sees, with the projection pinned UMD. */
function sourcePanels(frame: Frame) {
  return frame.panels.map(({ contents, visible, classes, arrows }) => ({
    contents, visible, classes: [...classes].sort(), arrows
  })).sort((a, b) => (a.contents ?? '').localeCompare(b.contents ?? ''));
}

/** Saves actual DOM identity without saving internal data Svelte. */
async function sameNode(locator: Locator, original: PanelHandle) {
  expect(await locator.evaluate((node, original) => node === original, original)).toBe(true);
}

test.use({ viewport: { width: 960, height: 720 } });

for (const { profile, snapshots } of reference.cases) {
  test(`Tooltip.UniqueProvider follows the pinned ${profile.mode} profile`, async ({ page }) => {
    await select(page, profile.mode);
    let original: { shell: PanelHandle; background: PanelHandle; } | undefined;
    const events: Frame['callbacks'] = [];

    for (const frame of snapshots) {
      if (frame.action === 'escape') {
        await page.keyboard.press('Escape');
      }
      else if (frame.action.startsWith('hover:')) {
        const target = frame.action.split(':')[1];
        await trigger(page, target).hover();
      }
      events.push(...frame.callbacks);

      await expect.poll(() => nativePanels(page, frame)).toEqual(sourcePanels(frame));
      await expect(page.locator(background)).toHaveCount(frame.backgrounds.length);
      if (profile.unique) {
        await expect(page.getByTestId('delegate-events')).toHaveText(JSON.stringify(events));
        if (!frame.backgrounds.length) continue;

        // React leaves the preset Popover background transparent. In Svelte the same color follows
        // the active owner on a painted general background.
        const expectedBackground = frame.backgrounds[0].background === 'rgba(0, 0, 0, 0)'
          ? 'rgb(22, 119, 255)' : frame.backgrounds[0].background;
        await expect(page.locator(background)).toHaveCSS('background-color', expectedBackground);
        for (const name of frame.backgrounds[0].className) {
          await expect(page.locator(background)).toHaveClass(new RegExp(`(?:^| )${name}(?: |$)`));
        }
        if (original) {
          await sameNode(page.locator(shell), original.shell);
          await sameNode(page.locator(background), original.background);
        }
        else {
          const initialShell = await page.locator(shell).elementHandle();
          const initialBackground = await page.locator(background).elementHandle();
          original = { shell: initialShell, background: initialBackground };
        }
      }
      else {
        // Independent cards complete the motion each in their cycle.
        await expect.poll(async () => {
          const text = await page.getByTestId('delegate-events').textContent();
          const recorded: Frame['callbacks'] = JSON.parse(text ?? '[]');
          return recorded.sort((a, b) => a.id.localeCompare(b.id));
        }).toEqual([...events].sort((a, b) => a.id.localeCompare(b.id)));
      }
    }

    const getters = page.getByTestId('delegate-getters');
    if (profile.unique) {
      await expect(getters).toHaveText('0');
    }
    else {
      await expect(getters).toHaveText(/^[1-9][0-9]*$/);
      await expect(page.locator('#delegate-requested-container [data-ant-popover]')).toHaveCount(2);
    }
  });
}

test('switching from Tooltip to Popover updates role, IDREF and ref ownership on the same div',
  async ({ page }) => {
    await select(page, 'mixed-opt-in');
    const first = trigger(page, 'a');
    const second = trigger(page, 'b');
    await first.hover();
    await expect(first).toHaveAttribute('aria-describedby', 'external-id-a');
    const shared = page.locator(shell);
    await expect(shared).toHaveRole('tooltip');
    await expect(shared).toHaveId('external-id-a');
    const original = await shared.elementHandle();

    await second.hover();

    const dialog = page.getByRole('dialog', { name: 'Dialog b', exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(node => node instanceof HTMLDivElement)).toBe(true);
    await sameNode(dialog, original);
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(second).toHaveAttribute('aria-controls', 'external-id-b');
    await expect(first).not.toHaveAttribute('aria-describedby');
    await expect(page.getByTestId('delegate-refs')).toHaveText('[null,"external-id-b"]');
  });

test('click-open shared Popover supports input focus and Escape without replacing its shell',
  async ({ page }) => {
    await select(page, 'keyboard');
    const first = trigger(page, 'a');
    const second = trigger(page, 'b');
    const shared = page.locator(shell);
    await expect(shared).toHaveCount(0);
    await expect(page.getByTestId('delegate-refs')).toHaveText('[null,null]');

    await first.focus();
    await page.keyboard.press('Enter');
    const editor = page.getByRole('textbox', { name: 'Value a' });
    await expect(editor).toBeFocused();
    await editor.fill('changed value');
    const original = await shared.elementHandle();

    await page.keyboard.press('Escape');

    await expect(first).toBeFocused();
    await expect(shared).toBeHidden();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await second.focus();
    await page.keyboard.press('Space');

    await expect(page.getByRole('textbox', { name: 'Value b' })).toBeFocused();
    await sameNode(shared, original);
    await expect(first).not.toHaveAttribute('aria-controls');
    await expect(page.getByTestId('delegate-refs')).toHaveText('[null,"external-id-b"]');
  });

test('a pending grouped Popconfirm parks focus and its late result leaves the next owner open',
  async ({ page }) => {
    await select(page, 'pending');
    await trigger(page, 'a').click();
    const shared = page.locator(shell);
    const dialog = page.getByRole('dialog', { name: 'Payload a' });
    await expect(dialog).toHaveAccessibleDescription('Confirm description a');
    await dialog.getByRole('button', { name: 'Confirm a', exact: true }).click();
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.locator('[data-ant-popconfirm-content]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    const original = await shared.elementHandle();

    await trigger(page, 'b').click();

    const second = page.getByRole('dialog', { name: 'Payload b' });
    await expect(second).toHaveAccessibleDescription('Confirm description b');
    await expect(second).not.toHaveAttribute('aria-busy');
    await sameNode(second, original);
    await page.getByRole('button', { name: 'Resolve confirmation', exact: true })
      .evaluate(button => (button as HTMLButtonElement).click());

    await expect(page.getByTestId('delegate-events')).toHaveText(JSON.stringify([
      { id: 'a', type: 'request', open: true },
      { id: 'b', type: 'request', open: true },
      { id: 'a', type: 'request', open: false }
    ]));
    await expect(second).toBeVisible();
    await expect(trigger(page, 'b')).toHaveAttribute('aria-expanded', 'true');
  });

test('a controlled owner releases focus before its editor is replaced by another owner',
  async ({ page }) => {
    await select(page, 'controlled');
    await page.getByRole('button', { name: 'Open A', exact: true }).click();
    const shared = page.locator(shell);
    const firstEditor = shared.getByRole('textbox', { name: 'Value a' });
    await firstEditor.focus();
    await expect(firstEditor).toBeFocused();
    const original = await shared.elementHandle();

    await page.getByRole('button', { name: 'Open B', exact: true })
      .evaluate(button => (button as HTMLButtonElement).click());

    await expect(trigger(page, 'a')).toBeFocused();
    await expect(trigger(page, 'a')).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page, 'b')).toHaveAttribute('aria-expanded', 'true');
    await expect(shared.getByRole('textbox', { name: 'Value b' })).toBeVisible();
    await sameNode(shared, original);
    await expect(page.getByTestId('delegate-events')).toHaveText('[]');
  });
