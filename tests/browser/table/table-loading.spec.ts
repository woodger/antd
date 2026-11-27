import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-loading-reference.json' with { type: 'json' };

test.use({ locale: 'en-US', reducedMotion: 'reduce' });

const fixture = '/?fixture=table-loading&profile=';
const root = '#table-loading-fixture';
const spinHost = `${root} [data-ant-table-part="wrapper"] > [data-ant-spin-root]`;
type State = (typeof source.cases)[number]['initial'];

/** Reads only those boundaries Spin and Table, which were observed in the standard. */
function snapshot() {
  const wrapper = document.querySelector('#table-loading-fixture [data-ant-table-part="wrapper"]');
  const spin = wrapper?.querySelector<HTMLElement>(':scope > [data-ant-spin-root]');
  if (!spin) {
    throw new Error('Missing Table Spin');
  }

  const prefix = spin.dataset.antSpinPrefix ?? 'ant-spin';
  const section = spin.querySelector<HTMLElement>('[data-ant-spin-part="section"]');
  const content = spin.querySelector<HTMLElement>('[data-ant-spin-part="container"]');
  const description = spin.querySelector('[data-ant-spin-part="description"]');
  const row = content?.querySelector('tr[data-row-key]');
  return {
    spinning: spin.classList.contains(`${prefix}-spinning`),
    fullscreen: spin.classList.contains(`${prefix}-fullscreen`),
    size: spin.classList.contains(`${prefix}-sm`) ? 'small'
      : spin.classList.contains(`${prefix}-lg`) ? 'large' : 'medium',
    section: Boolean(section), sectionColor: section?.style.color ?? null,
    description: description?.textContent ?? null,
    rootMargin: spin.style.marginInlineStart,
    containerMinWidth: content?.style.minWidth ?? null,
    wrapsTable: Boolean(content?.querySelector('table')),
    customIndicator: spin.querySelector('[data-saving-indicator]')?.textContent ?? null,
    semantic: [spin, ...spin.querySelectorAll('[class*="saving-"]')].flatMap(node =>
      [...node.classList].filter(name => name.startsWith('saving-') && !name.startsWith(prefix))
    ),
    empty: content?.querySelector('.ant-table-placeholder')?.textContent.trim() ?? null,
    draft: row?.querySelector('input')?.value ?? null
  };
}

/** Boolean loading leaves the former separate indicator and hides an empty cell. */
function expectedState(state: State, simpleLoading = false) {
  const { sameEditor: _sameEditor, ...visual } = state;
  return simpleLoading ? { ...visual, spinning: false, section: false, sectionColor: null, empty: '' }
    : visual;
}

for (const { profile, initial, settled, finished } of source.cases) {
  test(`Table loading matches the observed ${profile.id} behavior`, async ({ page }) => {
    const time = new Date('2026-10-30T12:00:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(time.getTime() + 1000);
    await page.goto(fixture + profile.id);

    const field = page.locator(`${root} input[aria-label="Row draft"]`);
    const oldField = profile.data === 'editor' ? await field.elementHandle() : null;
    const simpleLoading = profile.loading === true;

    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedState(initial, simpleLoading));
    await page.clock.runFor(610);
    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedState(settled, simpleLoading));

    if (simpleLoading) {
      await expect(page.locator(`${root} .loading-state[role="status"]`)).toBeVisible();
    }
    if (oldField) {
      await field.evaluate((input: HTMLInputElement) => { input.value = 'Draft'; });
    }

    await page.getByRole('button', { name: 'Finish table loading' }).dispatchEvent('click');

    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedState(finished));
    if (oldField) {
      expect(await field.evaluate((node, previous) => node === previous, oldField))
        .toBe(finished.sameEditor);
    }
  });
}

test('Table parks and restores the same editor across loading forms', async ({ page }) => {
  await page.goto(fixture + 'object-editor&idle');
  const field = page.locator(`${root} input[aria-label="Row draft"]`);
  const spin = page.locator(spinHost);
  const initial = await field.elementHandle();
  await field.fill('Uncommitted draft');
  await field.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 8, 'backward'));

  await page.getByRole('button', { name: 'Apply loading options' }).dispatchEvent('click');

  await expect(spin).toBeFocused();
  await expect(spin.locator('[data-ant-spin-part="container"]')).toHaveAttribute('inert', '');
  await expect(spin.locator('table')).toHaveAttribute('aria-busy', 'true');
  await expect(spin.getByRole('status', { name: 'Saving', exact: true })).toBeVisible();
  await expect(spin.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '35');
  await field.evaluate((input: HTMLInputElement) => input.focus());

  await expect(spin).toBeFocused();

  await page.getByRole('button', { name: 'Use boolean loading' }).dispatchEvent('click');

  await expect(field).toBeFocused();
  await expect(field).toHaveValue('Uncommitted draft');
  await expect(spin.locator('[data-ant-spin-part="container"]')).not.toHaveAttribute('inert');
  expect(await field.evaluate((node, previous) => node === previous, initial)).toBe(true);
  expect(await field.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd, input.selectionDirection
  ])).toEqual([3, 8, 'backward']);

  const outside = page.getByRole('button', { name: 'Apply loading options', exact: true });
  await outside.dispatchEvent('click');
  await expect(spin).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(outside).toBeFocused();
  await page.getByRole('button', { name: 'Finish table loading' }).dispatchEvent('click');

  await expect(outside).toBeFocused();
  await expect(spin.locator('table')).not.toHaveAttribute('aria-busy');
  await expect(spin.getByRole('button', { name: 'Name', exact: true })).toBeEnabled();
});

test('Table cancels delayed loading and restores the editor before the timer fires', async ({
  page
}) => {
  const time = new Date('2026-10-30T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time.getTime() + 1000);
  await page.goto(fixture + 'deferred&idle');
  const field = page.getByRole('textbox', { name: 'Row draft' });
  const spin = page.locator(spinHost);
  await field.fill('Draft during cancelled request');

  await page.getByRole('button', { name: 'Apply loading options' }).dispatchEvent('click');
  await expect(spin).toBeFocused();
  await expect(spin.locator('[data-ant-spin-part="section"]')).toHaveCount(0);
  await page.clock.runFor(200);
  await page.getByRole('button', { name: 'Finish table loading' }).dispatchEvent('click');
  await page.clock.runFor(610);

  await expect(field).toBeFocused();
  await expect(field).toHaveValue('Draft during cancelled request');
  await expect(spin.locator('[data-ant-spin-part="section"]')).toHaveCount(0);
  await expect(spin.locator('[data-ant-spin-part="container"]')).not.toHaveAttribute('inert');
});

for (const customPrefix of [false, true]) {
  test(`Table loading keeps the table and indicator themes with ${customPrefix ? 'custom' : 'default'} CSS variables`, async ({
    page
  }) => {
    const query = 'object-editor&idle&themed' + (customPrefix ? '&theme-prefix' : '');
    await page.goto(fixture + query);
    const cell = page.locator(`${root} tbody tr[data-row-key] td`);
    const section = page.locator(spinHost + ' [data-ant-spin-part="section"]');

    await expect(cell).toHaveCSS('color', 'rgb(114, 46, 209)');
    await expect(cell).toHaveCSS('line-height', '28px');
    await expect(cell).toHaveCSS('border-bottom-width', '2px');

    await page.getByRole('button', { name: 'Apply loading options' }).dispatchEvent('click');

    await expect(section).toHaveCSS('color', 'rgb(250, 84, 28)');
    await expect(cell).toHaveCSS('color', 'rgb(114, 46, 209)');
    await expect(cell).toHaveCSS('line-height', '28px');
    await expect(cell).toHaveCSS('border-bottom-width', '2px');
  });
}
