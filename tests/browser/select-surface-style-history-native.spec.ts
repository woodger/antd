import { test, expect } from './test';
import { selectSurfaceStyleHistorySamples } from './fixtures/select-surface-style-history-cases';
import { selectSurfaceStyleHistoryNativeReference } from './select-surface-style-history-native-reference';
import { prepareSelectSurface } from './select-surface-driver';
import { settleNativeStyleHistory, verifyNativeStyleHistory, type NativeStyleHistoryOwner } from './select-surface-style-history-native-assertions';

test.use({ viewport: { width: 1200, height: 900 } });
for (const original of selectSurfaceStyleHistoryNativeReference.cases) {
  test(`Select actual CSS setter history follows original for ${original.id}`, async ({ page }, testInfo) => {
    const sample = selectSurfaceStyleHistorySamples.find(sample => sample.id === original.id)!;
    const trace: unknown[] = [], failures: string[] = [];
    await page.goto('/?fixture=select-surface-style-history-native');
    await page.getByRole('combobox', { name: 'Select surface style history sample', exact: true }).selectOption(sample.id);
    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const capture = await page.evaluateHandle(() => {
      const detail: { read?: () => NativeStyleHistoryOwner; readRefs?: () => Record<string, unknown>; dispose?: () => void } = {};
      document.querySelector('[data-surface-fixture-command]')!.dispatchEvent(new CustomEvent('surfacecapture', { detail }));
      if (!detail.read || !detail.readRefs || !detail.dispose) throw Error('Actual style history capture missing');
      return { read: detail.read, readRefs: detail.readRefs, dispose: detail.dispose };
    });
    const retained = await page.evaluateHandle(() => {
      const detail: { root?: HTMLElement; editor?: HTMLElement; control?: Record<string, unknown> } = {};
      document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent('surfacerefs', { detail }));
      return { ...detail, parent: detail.editor?.parentNode, focus: detail.control?.focus,
        blur: detail.control?.blur, scrollTo: detail.control?.scrollTo };
    });
    const verify = async (source: typeof original.initial, label: string) => {
      const actual = await settleNativeStyleHistory(page);
      trace.push({ label, actual });
      try { verifyNativeStyleHistory(actual, source, original, sample.control, label); }
      catch (error) { failures.push(String(error)); }
      expect(await retained.evaluate(before => {
        const refs: { root?: HTMLElement; editor?: HTMLElement; control?: Record<string, unknown> } = {};
        document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent('surfacerefs', { detail: refs }));
        return { root: refs.root === before.root, editor: refs.editor === before.editor,
          parent: refs.editor?.parentNode === before.parent, control: refs.control === before.control,
          focus: refs.control?.focus === before.focus, blur: refs.control?.blur === before.blur,
          scrollTo: refs.control?.scrollTo === before.scrollTo };
      }), label).toEqual({ root: true, editor: true, parent: true, control: true, focus: true, blur: true, scrollTo: true });
      return actual;
    };
    try {
      const initial = await verify(original.initial, 'initial');
      let final = initial;
      for (const [index, step] of original.steps.entries()) {
        if (step.action.type === 'click') {
          const root = await retained.evaluateHandle(value => value.root!);
          try { await root.asElement()!.click(); } finally { await root.dispose(); }
        } else if (step.action.type === 'outside') await page.locator('[data-surface-outside]').click();
        else await page.evaluate(action => document.querySelector('[data-surface-command]')!
          .dispatchEvent(new CustomEvent('historyupdate', { detail: action })), step.action);
        await page.mouse.move(0, 0);
        final = await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }
      expect(final.owner.maps).toEqual(initial.owner.maps);
      for (const target of ['root', 'input'] as const) expect(final.border[target].computed.borderTopColor,
        `Restored identical maps retain ${target} CSS setter history`).not.toBe(initial.border[target].computed.borderTopColor);
      const beforeDispose = await capture.evaluate(value => value.read());
      await capture.evaluate(value => value.dispose());
      await expect(page.locator('[data-surface-case]')).toHaveCount(0);
      const cleanup = async () => ({ owner: await capture.evaluate(value => value.read()),
        refs: await capture.evaluate(value => value.readRefs()),
        dom: await retained.evaluate(value => ({ rootConnected: value.root?.isConnected,
          editorConnected: value.editor?.isConnected, popupCount: document.querySelectorAll('.ant-select-dropdown').length })) });
      const disposed = await cleanup();
      trace.push({ label: 'disposed', actual: disposed });
      expect(disposed.dom).toEqual(original.cleanup);
      expect(disposed.owner.alive).toBe(false);
      expect(disposed.owner.events).toEqual(beforeDispose.events);
      expect(disposed.owner.rawEvents).toEqual(beforeDispose.rawEvents);
      expect(disposed.owner.calls).toEqual(beforeDispose.calls);
      for (const [name, value] of Object.entries(disposed.refs)) expect(value == null, `${name} cleared`).toBe(true);
      await page.waitForTimeout(1000);
      expect(await cleanup()).toEqual(disposed);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach('actual-select-style-history-raw', { body: JSON.stringify({ sample, trace, failures }, null, 2), contentType: 'application/json' });
      await retained.dispose();
      await capture.dispose();
    }
  });
}
