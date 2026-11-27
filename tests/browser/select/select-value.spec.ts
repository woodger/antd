import { test, expect } from '../test';
import { selectValueSamples } from '../fixtures/select-value-cases';
import { selectValueLiveSamples } from '../fixtures/select-value-live-cases';
import { actSelectValueLive } from '../select-value-live-driver';
import { prepareSelectValue } from '../select-value-driver';
import { settleSelectValue, verifySelectValue } from '../select-value-assertions';
import { selectValueReference, selectValueLiveReference, selectValueNativeCase } from '../select-value-reference';

test.use({ viewport: selectValueReference.reference.viewport });
for (const primary of [...selectValueReference.cases, ...selectValueLiveReference.cases]) {
  const entry = selectValueNativeCase(primary);
  test(`Select selected values follow original for ${entry.id}`, async ({ page }, testInfo) => {
    const sample = [...selectValueSamples, ...selectValueLiveSamples].find(sample => sample.id === entry.id)!;
    const errors: string[] = [], warnings: string[] = [], trace: unknown[] = [], failures: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (['warning', 'error'].includes(message.type())) warnings.push(message.text());
    });
    await page.goto('/?fixture=select-value');
    await page.getByRole('combobox', { name: 'Select value sample', exact: true }).selectOption(sample.id);

    await expect(page.locator('[data-select-value-case]')).toHaveAttribute(
      'data-select-value-bound',
      'true'
    );
    await prepareSelectValue(page);
    const identity = await page.evaluateHandle(() => {
      const refs: {
        root?: HTMLElement;
        editor?: HTMLInputElement;
        control?: Record<string, unknown>
      } = {};
      document.querySelector('[data-select-value-command]')!.dispatchEvent(new CustomEvent(
        'valuerefs',
        { detail: refs }
      ));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const stable = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
        publicRoot?: HTMLElement; publicEditor?: HTMLInputElement } = {};
      document.querySelector('[data-select-value-command]')!.dispatchEvent(new CustomEvent(
        'valuerefs',
        { detail: refs }
      ));
      return { root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: refs.publicRoot === refs.root, publicEditor: refs.publicEditor === refs.editor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur, scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    const bindings = { root: true, editor: true, parent: true, control: true, publicRoot: true, publicEditor: true,
      focus: true, blur: true, scrollTo: true };
    const verify = async (source: typeof entry.initial, label: string) => {
      const actual = await settleSelectValue(page);
      trace.push({ phase: label, actual });
      try { verifySelectValue(actual, source, sample, label); }
      catch (error) { failures.push(String(error)); }
      expect(await stable(), label).toEqual(bindings);
    };
    try {
      await verify(entry.initial, 'initial');
      for (const [index, step] of entry.steps.entries()) {
        await actSelectValueLive(page, step.action);
        await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach(
        'actual-select-value-raw',
        {
          body: JSON.stringify({ sample, trace, failures, errors, warnings }, null, 2),
          contentType: 'application/json'
        }
      );
      await identity.dispose();
    }
  });
}
