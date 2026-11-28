import { test, expect } from '../test';
import type { Locator, Page } from '@playwright/test';
import reference from '../fixtures/ant-design-form-dom-observation.json' with { type: 'json' };

async function act(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).evaluate(
    (button: HTMLButtonElement) => { button.click(); }
  );
}

async function readScrollPosition(box: Locator) {
  return box.evaluate((element) => [element.scrollTop, element.scrollLeft]);
}

async function scrollNatively(input: Locator, alignment: ScrollLogicalPosition) {
  return input.evaluate((element, block) => {
    // Keep the native comparison inside the same boundary as the Form action.
    const options = { block, inline: block, behavior: 'instant', container: 'nearest' } as const;
    element.scrollIntoView(options);
    const box = element.closest('[data-testid="scroll-box"]');
    if (!box) {
      throw new Error('Missing scroll box');
    }

    return [box.scrollTop, box.scrollLeft];
  }, alignment);
}

const controls = [
  'input', 'password', 'search', 'textarea', 'number', 'checkbox', 'radio', 'switch',
  'select', 'slider', 'range', 'otp', 'date', 'dates', 'time', 'times', 'rate',
  'mentions', 'autocomplete', 'tree-select', 'cascader', 'checkbox-group', 'radio-group'
];

for (const name of controls) {
  test(`Form focusField reaches the ${name} control and preserves its ref`, async ({ page }) => {
    await page.goto('/?fixture=form-dom');
    await act(page, `Focus ${name}`);

    const field = page.locator(`[data-dom-field="${name}"]`);
    const source = reference.cases.find(({ id }) => id === `focus-${name}`);

    expect(await field.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
    if (source) {
      expect(await page.evaluate(() =>
        document.activeElement?.closest<HTMLElement>('[data-dom-field]')?.dataset.domField
      )).toBe(source.active.tag);
    }
    const snapshot = page.getByRole('status', { name: 'DOM snapshot', exact: true });
    const first = JSON.parse((await snapshot.textContent())!);

    expect(first).toMatchObject({ tag: name, instance: true });
    if (first.sameRef !== null) expect(first.sameRef).toBe(true);

    await act(page, `Focus ${name}`);

    expect(JSON.parse((await snapshot.textContent())!)).toMatchObject({ stable: true });
    if (name === 'otp') await expect(field.locator('input').first()).toBeFocused();
    if (name === 'slider' || name === 'range') {
      // Published Svelte Slider ref preserves native range, not React div.
      await expect(field.locator('input[type="range"]').first()).toBeFocused();
    }
    if (name === 'select') await expect(field.getByRole('combobox')).toBeFocused();
  });
}

test('Form keeps literal and typed paths distinct when their upstream ref keys collide', async ({ page }) => {
  await page.goto('/?fixture=form-dom');
  for (const tag of ['nested', 'literal', 'numeric', 'string']) {
    await act(page, `Focus ${tag}`);
    await expect(page.locator(`[data-dom-field="${tag}"] input`)).toBeFocused();
  }
});

test('Form delegates the exact custom ref with its receiver and supports native id fallback', async ({ page }) => {
  await page.goto('/?fixture=form-dom');
  await act(page, 'Focus custom');

  await expect(page.getByRole('textbox', { name: 'Custom input', exact: true })).toBeFocused();
  await expect(page.getByRole('status', { name: 'Custom focus calls', exact: true })).toHaveText('1');
  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: true, sameRef: true });

  await act(page, 'Focus raw');

  await expect(page.locator('#dom-raw')).toBeFocused();
  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: true, sameRef: true });

  await act(page, 'Focus fallback');

  await expect(page.locator('#dom-fallback')).toBeFocused();
  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: false });
  await act(page, 'Focus missing');

  await expect(page.locator('#dom-fallback')).toBeFocused();
  await act(page, 'Focus disabled');

  await expect(page.locator('#dom-fallback')).toBeFocused();
  await act(page, 'Focus transfer');

  await expect(page.locator('#dom-fallback')).toBeFocused();
  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: true, sameRef: true });
});

test('Form follows keyed List refs through move and removal without replacing the surviving control', async ({ page }) => {
  await page.goto('/?fixture=form-dom');
  await act(page, 'Focus first person');
  const anna = page.locator('[data-dom-field="person-0"] input');
  const bob = page.locator('[data-dom-field="person-1"] input');

  await expect(anna).toBeFocused();
  const oldAnna = await anna.elementHandle();

  await act(page, 'Move DOM person');
  await act(page, 'Focus first person');

  await expect(bob).toBeFocused();
  await act(page, 'Remove DOM person');

  await expect(bob).toHaveCount(0);
  await act(page, 'Focus first person');

  await expect(anna).toBeFocused();
  expect(await anna.evaluate((element, previous) => element === previous, oldAnna)).toBe(true);
});

test('Form releases removed refs, registers reset controls and detaches a replaced model', async ({ page }) => {
  await page.goto('/?fixture=form-dom');
  const input = page.locator('[data-dom-field="input"] input');
  await act(page, 'Focus input');
  const previous = await input.elementHandle();
  await act(page, 'Reset DOM input');

  await expect(input).toBeFocused();
  expect(await input.evaluate((element, old) => element === old, previous)).toBe(false);
  await expect(page.getByRole('status', { name: 'DOM snapshot' }))
    .toHaveText('{"tag":"input","instance":true,"stable":false,"sameRef":null}');

  await act(page, 'Toggle DOM field');

  await expect(page.locator('[data-dom-field="removable"]')).toHaveCount(0);
  await act(page, 'Focus removable');

  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: false });
  await act(page, 'Toggle DOM field');
  await act(page, 'Focus removable');

  await expect(page.locator('[data-dom-field="removable"] input')).toBeFocused();

  await act(page, 'Replace DOM model');

  await expect(page.getByRole('status', { name: 'DOM snapshot' })).toHaveText('{"oldInstance":false}');
  await expect(input).toBeFocused();
  await act(page, 'Toggle DOM form');

  await expect(input).toHaveCount(0);
  await act(page, 'Focus input');

  expect(JSON.parse((await page.getByRole('status', { name: 'DOM snapshot' }).textContent())!))
    .toMatchObject({ instance: false });
});

test('Form focusField preserves typed input text and selection', async ({ page }) => {
  await page.goto('/?fixture=form-dom');
  const input = page.locator('[data-dom-field="input"] input');
  await input.fill('Draft text');
  await input.evaluate((element: HTMLInputElement) => { element.setSelectionRange(1, 4); });
  await act(page, 'Focus input');

  await expect(input).toHaveValue('Draft text');
  await expect(input).toBeFocused();
  expect(await input.evaluate((element: HTMLInputElement) =>
    [element.selectionStart, element.selectionEnd]
  )).toEqual([1, 4]);
});

test('Form scrollToField matches source nearest, alignment, custom actions and optional focus', async ({ page }) => {
  await page.goto('/?fixture=form-dom-scroll');
  const actions: Record<string, string> = {
    missing: 'Scroll missing', nearest: 'Scroll nearest', visible: 'Scroll visible',
    start: 'Scroll start', center: 'Scroll center', 'end-focus': 'Scroll end', custom: 'Custom scroll'
  };
  for (const sample of reference.scrollCases) {
    if (sample.id === 'start' || sample.id === 'custom') await act(page, 'Reset scroll');
    await act(page, actions[sample.id]);
    await expect(page.getByRole('status', { name: 'Scroll snapshot', exact: true }))
      .toHaveText(JSON.stringify(sample));
  }
  await expect(page.getByRole('status', { name: 'Scroll actions', exact: true }))
    .toHaveText(JSON.stringify(reference.custom));
  await expect(page.getByRole('status', { name: 'Scroll focus calls', exact: true })).toHaveText('1');
  await act(page, 'Custom scroll focus');

  await expect(page.getByRole('textbox', { name: 'Scroll target', exact: true })).toBeFocused();
  await expect(page.getByRole('status', { name: 'Scroll focus calls', exact: true })).toHaveText('2');
});

test('Form scopes scroll boundaries and can skip hidden overflow in nested containers', async ({ page }) => {
  await page.goto('/?fixture=form-dom-scroll');
  await page.getByLabel('Nested scrolling', { exact: true }).check();
  const box = page.getByTestId('scroll-box');
  const outer = page.locator('.outer');
  await act(page, 'Bounded scroll');

  expect(await box.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await outer.evaluate((element) => element.scrollTop)).toBe(0);

  await act(page, 'Reset scroll');
  await act(page, 'Predicate scroll');

  expect(await box.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await outer.evaluate((element) => element.scrollTop)).toBe(0);

  await act(page, 'Reset scroll');
  await page.getByLabel('Hidden overflow', { exact: true }).check();
  await act(page, 'Skip hidden scroll');

  expect(await box.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await outer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await act(page, 'Reset scroll');
  await act(page, 'Scroll nearest');

  expect(await box.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});

test('Form completes smooth scrolling with the field scroll margins', async ({ page }) => {
  await page.goto('/?fixture=form-dom-scroll');
  const box = page.getByTestId('scroll-box');
  const input = page.getByRole('textbox', { name: 'Scroll target', exact: true });
  await act(page, 'Smooth scroll');
  await expect.poll(() => readScrollPosition(box)).toEqual([184, 220]);
  await act(page, 'Reset scroll');
  await page.getByLabel('Scroll margin', { exact: true }).check();
  const expected = await scrollNatively(input, 'nearest');

  await act(page, 'Reset scroll');
  await act(page, 'Smooth scroll');

  await expect.poll(() => readScrollPosition(box)).toEqual(expected);
});

const marginCases = [
  { name: 'asymmetric margins', margin: '12px 7px 4px 3px', transform: '' },
  { name: 'mixed margins', margin: '-8px 2px 10px -4px', transform: '' },
  { name: 'reversed edges', margin: '-100px', transform: '' },
  { name: 'transformed field', margin: '12px 7px 4px 3px', transform: 'scale(1.25)' }
];
const alignmentActions = {
  nearest: 'Scroll nearest', start: 'Scroll start', center: 'Scroll center', end: 'Align end'
};

for (const sample of marginCases) {
  test(`Form aligns ${sample.name} like the browser and keeps repeated scroll stable`, async ({ page }) => {
    await page.goto('/?fixture=form-dom-scroll');
    const box = page.getByTestId('scroll-box');
    const input = page.getByRole('textbox', { name: 'Scroll target', exact: true });
    await input.evaluate((element: HTMLInputElement, { margin, transform }) => {
      element.style.scrollMargin = margin;
      element.style.transform = transform;
    }, sample);

    for (const alignment of ['nearest', 'start', 'center', 'end'] as const) {
      await act(page, 'Reset scroll');
      const expected = await scrollNatively(input, alignment);
      await act(page, 'Reset scroll');
      const action = alignmentActions[alignment];
      await act(page, action);

      expect(await readScrollPosition(box), alignment).toEqual(expected);

      await act(page, action);

      expect(await readScrollPosition(box), alignment).toEqual(expected);
    }
  });
}

test('Form sends the current margins to custom scroll behavior for a visible field', async ({ page }) => {
  await page.goto('/?fixture=form-dom-scroll');
  const box = page.getByTestId('scroll-box');
  const input = page.getByRole('textbox', { name: 'Scroll target', exact: true });
  const margin = page.getByLabel('Scroll margin', { exact: true });
  const actions = page.getByRole('status', { name: 'Scroll actions', exact: true });
  await act(page, 'Scroll nearest');
  const withoutMargin = await readScrollPosition(box);
  await margin.check();

  await act(page, 'Custom scroll');

  expect(await readScrollPosition(box)).toEqual(withoutMargin);
  const [top, left] = await scrollNatively(input, 'nearest');
  expect([top, left]).not.toEqual(withoutMargin);
  await expect(actions).toHaveText(JSON.stringify([{ box: true, top, left }]));
  await expect(margin).toBeFocused();

  await box.evaluate((element, [top, left]) => element.scroll({ top, left }), withoutMargin);
  await act(page, 'Scroll nearest');
  await act(page, 'Custom scroll');

  expect(await readScrollPosition(box)).toEqual([top, left]);
  await expect(actions).toHaveText('[]');
});

test('Form targets its own control when adjacent forms share an explicit native id', async ({ page }) => {
  await page.goto('/?fixture=form-dom-scroll');
  await act(page, 'Focus first form');

  await expect(page.getByRole('textbox', { name: 'First form input' })).toBeFocused();
  await act(page, 'Focus second form');

  await expect(page.getByRole('textbox', { name: 'Second form input' })).toBeFocused();
});
