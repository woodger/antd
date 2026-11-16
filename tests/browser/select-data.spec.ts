import { test, expect } from './test';
import { selectDataSamples } from './fixtures/select-data-cases';
import { actSelectData, prepareSelectData } from './select-data-driver';
import { settleSelectData, verifySelectData } from './select-data-assertions';
import { selectDataReference as reference, selectDataSourceDiagnostic, selectDataNativeCase } from './select-data-reference';
import { readSelectDataAriaIntegrity } from './select-data-native';


test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.diagnostics).toEqual([selectDataSourceDiagnostic]);
});
for (const primary of reference.cases) {
  const entry = selectDataNativeCase(primary);
  test(`Select data raw callbacks and mapped options follow Source for ${entry.id}`, async ({ page }, testInfo) => {
    const sample = selectDataSamples.find(sample => sample.id === entry.id)!;
    const errors: string[] = [], warnings: string[] = [], trace: unknown[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['warning', 'error'].includes(message.type())) warnings.push(message.text()); });
    await page.goto('/?fixture=select-data');
    await page.getByRole('combobox', { name: 'Select data sample', exact: true }).selectOption(entry.id);
    await expect(page.locator('[data-select-data-case]')).toHaveAttribute('data-select-data-bound', 'true');
    await prepareSelectData(page);
    const identity = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement; control?: Record<string, unknown> } = {};
      document.querySelector('[data-select-data-command]')!.dispatchEvent(new CustomEvent('datarefs', { detail: refs }));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const stable = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement; control?: Record<string, unknown>;
        publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-select-data-command]')!.dispatchEvent(new CustomEvent('datarefs', { detail: refs }));
      return { root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: refs.publicRoot === refs.root, publicEditor: refs.publicEditor === refs.editor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur, scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    const bindings = { root: true, editor: true, parent: true, control: true, publicRoot: true, publicEditor: true,
      focus: true, blur: true, scrollTo: true };
    try {
      const initial = await settleSelectData(page);
      trace.push({ phase: 'initial', actual: initial });
      verifySelectData(initial, entry.initial, sample, `${entry.id}/initial`);
      expect(await stable()).toEqual(bindings);
      expect(await page.evaluate(readSelectDataAriaIntegrity)).toBe(true);
      for (const [index, step] of entry.steps.entries()) {
        await actSelectData(page, step.action);
        const actual = await settleSelectData(page);
        const label = `${entry.id}/${index}/${JSON.stringify(step.action)}`;
        trace.push({ action: step.action, actual });
        verifySelectData(actual, step, sample, label);
        expect(await stable(), label).toEqual(bindings);
        expect(await page.evaluate(readSelectDataAriaIntegrity), label).toBe(true);
      }
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await testInfo.attach('actual-select-data-raw', { body: JSON.stringify({ trace, errors, warnings }, null, 2), contentType: 'application/json' });
      await identity.dispose();
    }
  });
}
