import { test, expect } from '../test';
import { selectSurfaceSamples } from '../fixtures/select-surface-cases';
import { selectSurfaceReference } from '../select-surface-reference';
import { actSelectSurface, prepareSelectSurface } from '../select-surface-driver';
import { settleSelectSurface, verifySelectSurfacePoint, type NativeSurfaceOwner } from '../select-surface-assertions';

test.use({ viewport: { width: 1200, height: 900 } });
for (const entry of selectSurfaceReference.cases) {
  test(`Select surface follows the independent original for ${entry.id}`, async ({ page }, testInfo) => {
    const sample = selectSurfaceSamples.find(sample => sample.id === entry.id)!;
    const trace: unknown[] = [], failures: string[] = [], errors: string[] = [], warnings: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (['warning', 'error'].includes(message.type())) warnings.push(message.text());
    });
    await page.goto('/?fixture=select-surface');
    await page.getByRole('combobox', { name: 'Select surface sample', exact: true }).selectOption(sample.id);

    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const capture = await page.evaluateHandle(() => {
      const detail: {
        read?: () => NativeSurfaceOwner;
        readRefs?: () => Record<string, unknown>;
        dispose?: () => void
      } = {};
      document.querySelector('[data-surface-fixture-command]')!
        .dispatchEvent(new CustomEvent('surfacecapture', { detail }));
      if (!detail.read || !detail.readRefs || !detail.dispose) {
        throw Error('Actual public owner capture is unavailable');
      }
      return { read: detail.read, readRefs: detail.readRefs, dispose: detail.dispose };
    });
    const retained = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
        publicRoot?: HTMLElement; publicEditor?: HTMLInputElement } = {};
      document.querySelector('[data-surface-command]')!
        .dispatchEvent(new CustomEvent('surfacerefs', { detail: refs }));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const bindings = { root: true, editor: true, parent: true, control: true, publicRoot: true,
      publicEditor: true, focus: true, blur: true, scrollTo: true };
    const verify = async (source: typeof entry.initial, label: string, initial = false) => {
      const actual = await settleSelectSurface(page);
      trace.push({ label, actual });
      try { verifySelectSurfacePoint(actual, source, entry, sample, label, initial); }
      catch (error) { failures.push(String(error)); }
      expect(await retained.evaluate(before => {
        const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
          publicRoot?: HTMLElement; publicEditor?: HTMLInputElement } = {};
        document.querySelector('[data-surface-command]')!
          .dispatchEvent(new CustomEvent('surfacerefs', { detail: refs }));
        return { root: refs.root === before.root, editor: refs.editor === before.editor,
          parent: refs.editor?.parentNode === before.parent, control: refs.control === before.control,
          publicRoot: refs.publicRoot === refs.root, publicEditor: refs.publicEditor === refs.editor,
          focus: refs.control?.focus === before.focus, blur: refs.control?.blur === before.blur,
          scrollTo: refs.control?.scrollTo === before.scrollTo };
      }), label).toEqual(bindings);
    };
    try {
      await verify(entry.initial, 'initial', true);
      for (const [index, step] of entry.steps.entries()) {
        await actSelectSurface(page, step.action);
        await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }
      const beforeDispose = await capture.evaluate(value => value.read());
      await capture.evaluate(value => value.dispose());
      await expect(page.locator('[data-surface-case]')).toHaveCount(0);
      const readCleanup = async () => ({
        owner: await capture.evaluate(value => value.read()),
        refs: await capture.evaluate(value => value.readRefs()),
        dom: await retained.evaluate(before => ({ rootConnected: before.root?.isConnected,
          editorConnected: before.editor?.isConnected, popupCount: document.querySelectorAll('.ant-select-dropdown').length }))
      });
      const disposed = await readCleanup();
      trace.push({ label: 'disposed', actual: disposed });
      expect(disposed.dom).toEqual({ rootConnected: entry.cleanup.rootConnected,
        editorConnected: entry.cleanup.editorConnected, popupCount: entry.cleanup.popupCount });
      for (const [name, value] of Object.entries(disposed.refs)) expect(
        value == null,
        `${name} binding cleared`
      ).toBe(true);
      expect(disposed.owner.alive).toBe(false);
      expect(disposed.owner.events).toEqual(beforeDispose.events);
      expect(disposed.owner.rawEvents).toEqual(beforeDispose.rawEvents);
      expect(disposed.owner.calls).toEqual(beforeDispose.calls);
      await page.waitForTimeout(1000);
      const later = await readCleanup();
      trace.push({ label: 'disposed-after-1000ms', actual: later });
      expect(later).toEqual(disposed);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach('actual-select-surface-raw', { body: JSON.stringify({ sample, trace, failures,
        errors, warnings }, null, 2), contentType: 'application/json' });
      await retained.dispose();
      await capture.dispose();
    }
  });
}
