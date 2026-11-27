import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import { drainSelectSurface } from '../select-surface-driver';

interface Snapshot {
  model?: string | string[]; open: boolean; focusCalls: Array<Array<FocusOptions | undefined>>;
  focusOrder: string[];
  changes: unknown[]; deselections: string[]; searches: string[]; clears: number;
  blurCalls: Array<{ type: string; tag?: string }>; validatorCalls: unknown[]; touched: boolean;
}
type Bridge = { read(): Snapshot; focus(): void };
async function mount(page: Page, sample: string) {
  await page.goto('/?fixture=select-components-regression');
  await page.getByRole('combobox', { name: 'Component regression sample', exact: true }).selectOption(sample);
  await expect(page.locator('[data-component-regression]')).toHaveAttribute(
    'data-component-regression',
    sample
  );
  await drainSelectSurface(page);
}
async function read(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const bridge = {} as Bridge;
    document.querySelector('[data-component-regression]')!.dispatchEvent(new CustomEvent(
      'componentregressioncapture',
      { detail: bridge }
    ));
    return bridge.read();
  });
}

// Pinned rc-select1.10.1 es/BaseSelect/index.js:425 calls the container once.
// es/SelectInput/index.js:93 forwards options, including one explicit undefined;
// :222 marks clear mousedown lazy, while :234 performs clear only on click.
for (const sample of ['select-input', 'ac-input']) for (const activation of ['pointer', 'Enter', 'Space'])
  test(`component clear focuses composite exactly once ${sample}/${activation}`, async ({ page }) => {
    await mount(page, sample);
    const clear = page.getByRole('button', { name: 'Regression clear', exact: true });

    expect((await read(page)).focusCalls).toStrictEqual([]);
    if (activation === 'pointer') {
      const box = await clear.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      const down = await read(page);
      expect(down.focusCalls).toStrictEqual([]);
      expect(down.clears).toBe(0);
      await page.mouse.up();
    }
    else {
      await clear.focus();
      await clear.press(activation);
    }
    await expect.poll(async () => (await read(page)).clears).toBe(1);
    await drainSelectSurface(page);
    const actual = await read(page);

    expect(actual.focusCalls).toStrictEqual([[undefined]]);
    expect(actual.model).toBe(sample === 'ac-input' ? '' : undefined);
    expect(actual.clears).toBe(1);
  });

// Pinned rc-select1.10.1 es/SelectInput/index.js:128 calls inputRef.focus()
// directly for a suffix pointer target, preserving a zero-argument invocation.
for (const sample of ['select-input', 'ac-input'])
  test(`component suffix focuses composite once with no arguments ${sample}`, async ({ page }) => {
    await mount(page, sample);
    await page.locator('[data-component-regression-suffix]').click();
    await drainSelectSurface(page);
    const actual = await read(page);

    expect(actual.focusCalls).toStrictEqual([[]]);
    expect(actual.focusOrder).toEqual(['composite-focus', 'public-focus']);
  });

// BaseSelect/index.js:111 exposes containerRef.focus directly. SelectInput/index.js:93
// wraps that method and forwards options, so root/input have different call arity.
for (const family of ['select', 'ac']) for (const slot of ['root', 'input'])
  test(`public focus preserves composite argument arity ${family}/${slot}`, async ({ page }) => {
    await mount(page, family + '-' + slot);
    await page.evaluate(() => {
      const bridge = {} as Bridge;
      document.querySelector('[data-component-regression]')!.dispatchEvent(new CustomEvent(
        'componentregressioncapture',
        { detail: bridge }
      ));
      bridge.focus();
    });
    await drainSelectSurface(page);

    expect((await read(page)).focusCalls).toStrictEqual(slot === 'root' ? [[]] : [[undefined]]);
  });

// Pinned rc-select1.10.1 es/BaseSelect/index.js:257 removes the final enabled
// display value on Backspace; that path has no imperative focus call.
for (const slot of ['root', 'input']) for (const state of ['closed', 'open'])
  test(`component Backspace removes the last enabled value without refocusing ${slot}/${state}`, async ({ page }) => {
    await mount(page, slot + '-backspace-' + state);
    const editor = page.locator('[data-component-regression-editor]');
    await editor.focus();

    expect((await read(page)).focusCalls).toStrictEqual([]);
    await editor.press('Backspace');

    await expect.poll(async () => (await read(page)).model).toEqual(['a', 'locked']);
    await drainSelectSurface(page);
    const actual = await read(page);

    expect(actual.focusCalls).toStrictEqual([]);
    expect(actual.changes).toEqual([['a', 'locked']]);
    expect(actual.deselections).toEqual(['b']);
    expect(actual.open).toBe(state === 'open');
    expect(actual.searches).toEqual([]);
    expect(actual.clears).toBe(0);
  });

// Native FormItem.svelte onBlur owns touch/validation. It has no public
// validateTrigger prop; this checks its existing rules/blur contract directly.
test('default Select forwards one blur to FormItem and the public callback', async ({ page }) => {
  await mount(page, 'default-blur');

  expect((await read(page)).validatorCalls).toEqual([]);
  const editor = page.getByRole('combobox', { name: 'Regression value', exact: true });
  await editor.focus();
  await page.locator('[data-component-regression-outside]').click();

  await expect.poll(async () => (await read(page)).validatorCalls).toEqual(['a']);
  await drainSelectSurface(page);
  const actual = await read(page);

  expect(actual.touched).toBe(true);
  expect(actual.blurCalls).toEqual([{ type: 'focusout', tag: 'DIV' }]);
  expect(actual.validatorCalls).toEqual(['a']);
  expect(actual.model).toBe('a');
  expect(actual.changes).toEqual([]);
  expect(actual.clears).toBe(0);
  expect(actual.searches).toEqual([]);
});
