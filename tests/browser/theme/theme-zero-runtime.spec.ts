import type { Page } from '@playwright/test';
import reference from '../../reference/ant-design-theme-zero-runtime-observation.json'
  with { type: 'json' };
import { expect, test } from '../test';

/** Selects a fresh consumer so its first render observes the requested setting. */
async function selectScenario(page: Page, label: string) {
  await page.getByLabel('Zero-runtime scenario').selectOption({ label });
}

/** Reads only the rules that belong to an explicit Button CSS prefix. */
function registeredButtonPrefixes(page: Page) {
  return page.locator('style[data-ant-svelte-theme^="button-prefix:"]').evaluateAll(styles => {
    const names = styles.map(style => style.getAttribute('data-ant-svelte-theme')?.split(':')[1]);
    return [...new Set(names)].sort();
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=theme-zero-runtime');
});

const samples = [
  { scenario: 'Prebuilt CSS', name: 'zeroWithCss' },
  { scenario: 'Custom prefix with zero runtime', name: 'zeroCustomPrefixWithCss' },
  { scenario: 'Custom prefix with runtime styles', name: 'runtimeCustomPrefix' },
  { scenario: 'Inherited zero runtime', name: 'zeroNestedInheritance' },
  { scenario: 'Nested runtime styles', name: 'zeroNestedOverride' }
];
for (const { scenario, name } of samples) {
  const source = reference.cases.find(sample => sample.sample === name);
  if (!source) {
    throw new Error(`Missing source case ${name}`);
  }

  test(`${scenario} keeps token output and follows source style registration`, async ({ page }) => {
    await selectScenario(page, scenario);

    for (const [id, button] of Object.entries(source.buttons)) {
      const control = page.locator(`#${id}-button`);
      const prefix = new RegExp(`(?:^| )${button.className}(?: |$)`);
      await expect(control).toHaveClass(prefix);
      await expect(page.locator(`#${id}-primary`)).toHaveText(button.primaryToken);
    }

    const prefixes = source.buttonStylePrefixes.map(prefix => `${prefix}-btn`);
    await expect.poll(() => registeredButtonPrefixes(page)).toEqual(prefixes);

    if (name === 'zeroWithCss' || name === 'runtimeCustomPrefix') {
      const control = page.locator('#outer-button');
      await expect(control).toHaveCSS('background-color', source.buttons.outer.background);
      await expect(control).toHaveCSS('font-size', source.buttons.outer.fontSize);
    }
    const variables = page.locator('style[data-ant-svelte-theme="zero-outer"]');
    await expect(page.locator('#outer-button')).toHaveCSS('--ant-color-primary',
      reference.settings.colorPrimary);
    await expect.poll(() => variables.evaluate(sheet => (sheet as HTMLStyleElement).nonce))
      .toBe('zero-runtime-nonce');
  });
}

test('a prebuilt stylesheet for a custom prefix can read the scoped tokens', async ({ page }) => {
  await selectScenario(page, 'Custom prefix with zero runtime');
  await page.addStyleTag({ content: `
    .suite-btn[data-ant-button-prefix="suite-btn"] {
      background-color: var(--suite-color-primary);
      font-size: var(--suite-button-content-font-size);
    }
  ` });

  const control = page.locator('#outer-button');
  await expect(control).toHaveCSS('background-color', 'rgb(171, 50, 31)');
  await expect(control).toHaveCSS('font-size', `${reference.settings.contentFontSize}px`);
  await expect.poll(() => registeredButtonPrefixes(page)).toEqual([]);
});

test('keeps registered rules, focus, and token updates across live mode changes', async ({ page }) => {
  await selectScenario(page, 'Live zero runtime');
  const input = page.getByRole('textbox', { name: 'outer draft' });
  const sheet = page.locator('style[data-ant-svelte-theme="button-prefix:stable-btn:ant"]');
  const originalSheet = await sheet.elementHandle();
  const advance = page.getByRole('button', { name: 'Advance zero-runtime phase' });
  const [initial, ...transitions] = reference.live.phases;
  await expect(page.locator('#outer-button')).toHaveCSS('background-color', initial.buttons.outer.background);
  await input.fill('The current draft');
  await input.evaluate(node => (node as HTMLInputElement).setSelectionRange(4, 11));

  for (const { buttonStylePrefixes, buttons } of transitions) {
    await advance.dispatchEvent('click');

    await expect.poll(() => registeredButtonPrefixes(page)).toEqual(
      buttonStylePrefixes.map(prefix => `${prefix}-btn`)
    );
    for (const [id, button] of Object.entries(buttons)) {
      await expect(page.locator(`#${id}-primary`)).toHaveText(button.primaryToken);
    }
    await expect(page.locator('#outer-button')).toHaveCSS('background-color', buttons.outer.background);
    expect(await sheet.evaluate((node, first) => node === first, originalSheet)).toBe(true);
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('The current draft');
    const selection = await input.evaluate(node => {
      const editor = node as HTMLInputElement;
      return [editor.selectionStart, editor.selectionEnd];
    });
    expect(selection).toEqual([4, 11]);
  }

  await page.getByRole('button', { name: 'Remove themed controls' }).click();

  await expect(sheet).toHaveCount(0);
  await expect(page.locator('style[data-ant-svelte-theme="zero-outer"]')).toHaveCount(0);
});

test('uses the instance setting for a renamed prefix and a tooltip opened later', async ({ page }) => {
  await selectScenario(page, 'Renamed prefixes');
  const advance = page.getByRole('button', { name: 'Advance zero-runtime phase' });
  const original = await page.locator('#outer-button').elementHandle();

  for (const sample of reference.prefixChanges.slice(1)) {
    await advance.dispatchEvent('click');

    await expect(page.locator('#zero-phase')).toHaveText(String(sample.phase));
    await expect.poll(() => registeredButtonPrefixes(page)).toEqual(
      sample.registered.filter(prefix => prefix !== 'ant-btn').sort()
    );
    expect(await page.locator('#outer-button').evaluate((node, first) => node === first, original))
      .toBe(true);

    if (sample.phase === 1) {
      await page.getByRole('button', { name: 'Open existing tooltip' }).click();
      await expect(page.getByRole('tooltip')).toHaveText('Existing tooltip');
      await expect(page.locator('style[data-ant-svelte-theme="tooltip-prefix:active-tip"]'))
        .toHaveCount(1);
    }
  }
  await expect(page.locator('#late-button')).toHaveClass(/\bstopped-rename-btn\b/);
});

for (const zeroRuntime of [false, true]) {
  const name = zeroRuntime ? 'Prebuilt responsive CSS' : 'Generated responsive CSS';
  const source = reference.layout.cases.find(sample =>
    sample.zeroRuntime === zeroRuntime && sample.staticCSS === zeroRuntime);
  if (!source) {
    throw new Error(`Missing responsive layout source case ${name}`);
  }

  test(`${name} sizes Grid and Modal at the source breakpoints`, async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 720 });
    await selectScenario(page, name);
    const dialog = page.getByRole('dialog', { name: 'Responsive modal' });
    const column = page.locator('#zero-grid-col');
    await expect(dialog).toBeVisible();

    for (const { width, columnWidth, modalWidth } of source.geometry) {
      await page.setViewportSize({ width, height: 720 });

      await expect(column).toHaveCSS('width', `${columnWidth}px`);
      await expect(dialog).toHaveCSS('width', `${modalWidth}px`);
    }

    await expect.poll(() => page.locator('style[data-ant-svelte-theme]').evaluateAll(styles =>
      styles.filter(style => /@media\s*\(min-width:\s*960px\)/.test(style.textContent ?? '')).length
    )).toBe(zeroRuntime ? 0 : 2);
  });
}

test('plays the packaged Dropdown motion with zero runtime', async ({ page }) => {
  await selectScenario(page, 'Prebuilt Dropdown motion');
  const trigger = page.getByRole('button', { name: 'Open dropdown' });

  await trigger.click();

  const menu = page.locator('[data-ant-dropdown-static-motion]');
  await expect(menu).toHaveCSS('animation-name', 'antSlideUpIn');
  await expect(menu.getByRole('menuitem', { name: 'Download file' })).toBeVisible();
  await expect(page.locator('style[data-ant-svelte-theme^="dropdown-motion:"]')).toHaveCount(0);
});
