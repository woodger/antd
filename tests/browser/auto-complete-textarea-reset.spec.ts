import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import type { SelectRef } from 'antd-svelte';

interface Capture {
  read: () => { model: string | undefined | null; changes: Array<string | undefined>; resets: number; prevented: boolean; mounted: boolean };
  readRefs: () => { form?: HTMLFormElement; control?: SelectRef; root?: HTMLDivElement; editor?: HTMLInputElement | HTMLTextAreaElement };
  dispose: () => void;
}
const cases = [
  { id: 'uncontrolled', label: 'Uncontrolled textarea completion', resetValue: 'seed', model: null, prevented: false },
  { id: 'controlled', label: 'Controlled textarea completion', resetValue: 'draft', model: 'draft', prevented: false },
  { id: 'cancelled', label: 'Cancelled textarea completion', resetValue: 'draft', model: null, prevented: true }
] as const;
for (const sample of cases) test(`AutoComplete custom textarea preserves ${sample.id} form reset`, async ({ page }) => {
  await page.goto('/?fixture=autocomplete-textarea-reset');
  const editor = page.getByRole('combobox', { name: sample.label, exact: true });
  await expect(editor).toHaveValue('seed');
  const capture = await page.evaluateHandle(id => {
    const detail = { id } as Capture & { id: string };
    document.querySelector('[data-textarea-reset-command]')!.dispatchEvent(new CustomEvent('textarearesetcapture', { detail }));
    return detail;
  }, sample.id);
  const retained = await capture.evaluateHandle(owner => {
    const refs = owner.readRefs();
    return { ...refs, read: owner.read, readRefs: owner.readRefs, focus: refs.control?.focus,
      blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
  });
  const read = () => retained.evaluate(old => {
    const current = old.readRefs(), editor = old.editor! as HTMLTextAreaElement;
    return { owner: old.read(), tag: editor.tagName, connected: editor.isConnected, rootConnected: old.root!.isConnected,
      value: editor.value, defaultValue: editor.defaultValue, text: editor.textContent,
      formData: [...new FormData(old.form!).entries()], focus: document.activeElement === editor,
      caret: [editor.selectionStart, editor.selectionEnd, editor.selectionDirection],
      classes: [...editor.classList].filter(token => !token.startsWith('svelte-') && !/^s-[A-Za-z0-9]+$/.test(token)),
      same: { form: current.form === old.form, root: current.root === old.root, editor: current.editor === old.editor,
        control: current.control === old.control, focus: current.control?.focus === old.focus,
        blur: current.control?.blur === old.blur, scrollTo: current.control?.scrollTo === old.scrollTo },
      refsCleared: current.control == null && current.root == null && current.editor == null };
  });
  const stable = async () => { await drainSelectSurface(page); return read(); };
  const same = { form: true, root: true, editor: true, control: true, focus: true, blur: true, scrollTo: true };
  try {
    const initial = await stable();
    expect(initial).toMatchObject({ tag: 'TEXTAREA', connected: true, rootConnected: true, value: 'seed', defaultValue: 'seed', text: 'seed',
      classes: ['ant-select-input'], formData: [['query', 'seed']], same,
      owner: { model: sample.id === 'controlled' ? 'seed' : null, changes: [], resets: 0, prevented: false, mounted: true } });
    expect(await retained.evaluate(old => [typeof old.focus, typeof old.blur, typeof old.scrollTo])).toEqual(['function', 'function', 'function']);
    await editor.fill('draft');
    await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(1, 4, 'backward'));
    const edited = await stable();
    expect(edited).toMatchObject({ value: 'draft', defaultValue: 'draft', text: 'draft', focus: true, caret: [1, 4, 'backward'],
      classes: ['ant-select-input'], formData: [['query', 'draft']], same,
      owner: { model: sample.model, changes: ['draft'], resets: 0, prevented: false, mounted: true } });
    // A real form.reset() keeps focus on the editor instead of moving it to a button.
    await retained.evaluate(old => old.form!.reset());
    const reset = await stable();
    expect(reset).toMatchObject({ tag: 'TEXTAREA', connected: true, rootConnected: true, value: sample.resetValue,
      defaultValue: sample.resetValue, text: sample.resetValue, formData: [['query', sample.resetValue]],
      classes: ['ant-select-input'], same, focus: true, refsCleared: false,
      owner: { model: sample.model, changes: ['draft'], resets: 1, prevented: sample.prevented, mounted: true } });
    if (sample.id !== 'uncontrolled') expect(reset.caret).toEqual(edited.caret);
    else {
      expect(reset.caret[0]).toBeGreaterThanOrEqual(0);
      expect(reset.caret[1]).toBeLessThanOrEqual(sample.resetValue.length);
    }
    await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
    await capture.evaluate(owner => owner.dispose());
    await expect(editor).toHaveCount(0);
    const disposed = await stable();
    expect(disposed).toMatchObject({ connected: false, rootConnected: false, refsCleared: true, formData: [],
      owner: { ...reset.owner, mounted: false } });
    await page.waitForTimeout(1000);
    expect(await stable()).toEqual(disposed);
  } finally { await retained.dispose(); await capture.dispose(); }
});
