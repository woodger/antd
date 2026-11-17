import { test, expect } from './test';
import { autocompleteRenderSamples, type AutocompleteRenderAction } from './autocomplete-render-cases.mjs';
import { autocompleteRenderReference } from './autocomplete-render-reference';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { settleNativeAutocompleteRender, verifyAutocompletePoint, verifyAutocompleteLifecycle, type NativeAutocompleteRenderOwner } from './autocomplete-render-assertions';

test.use({ viewport: { width: 1200, height: 900 } });
for (const source of autocompleteRenderReference.cases) {
  test(`AutoComplete renderers match independent Original for ${source.id}`, async ({ page }, testInfo) => {
    const sample = autocompleteRenderSamples.find(s => s.id === source.id)!;
    const trace: unknown[] = [], failures: string[] = [];
    await page.goto('/?fixture=autocomplete-render');
    await page.getByRole('combobox', { name: 'AutoComplete render sample', exact: true }).selectOption(sample.id);
    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-case', sample.id);
    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const capture = await page.evaluateHandle(() => {
      const detail: { read?: () => NativeAutocompleteRenderOwner; readRefs?: () => Record<string, unknown>;
        update?: (action: AutocompleteRenderAction) => void; dispose?: () => void } = {};
      document.querySelector('[data-ac-render-fixture-command]')!.dispatchEvent(new CustomEvent('acrendercapture', { detail }));
      if (!detail.read || !detail.readRefs || !detail.update || !detail.dispose) throw Error('Actual public AutoComplete renderer capture missing');
      Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
      return { read: detail.read, readRefs: detail.readRefs, update: detail.update, dispose: detail.dispose };
    });
    const retained = await page.evaluateHandle(() => {
      const detail: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown } } = {};
      document.querySelector('[data-ac-render-command]')!.dispatchEvent(new CustomEvent('surfacerefs', { detail }));
      return { ...detail, parent: detail.editor?.parentNode, focus: detail.control?.focus, blur: detail.control?.blur, scrollTo: detail.control?.scrollTo };
    });
    let initialResources: Awaited<ReturnType<typeof settleNativeAutocompleteRender>>['nodes']['resources'] | undefined;
    const verify = async (point: typeof source.initial, label: string) => {
      const actual = await settleNativeAutocompleteRender(page);
      trace.push({ label, actual }); failures.push(...verifyAutocompletePoint(actual, point, source, label));
      initialResources ??= actual.nodes.resources;
      if (JSON.stringify(actual.nodes.resources) !== JSON.stringify(initialResources)) failures.push(label + '/unexpected new resource entries');
      const refs = await retained.evaluate(old => {
        const current: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
          control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown } } = {};
        document.querySelector('[data-ac-render-command]')!.dispatchEvent(new CustomEvent('surfacerefs', { detail: current }));
        return { root: current.root === old.root, editor: current.editor === old.editor, parent: current.editor?.parentNode === old.parent,
          control: current.control === old.control, focus: current.control?.focus === old.focus,
          blur: current.control?.blur === old.blur, scrollTo: current.control?.scrollTo === old.scrollTo };
      });
      if (!Object.values(refs).every(Boolean)) failures.push(label + '/Native public refs, parent or method identity changed: ' + JSON.stringify(refs));
    };
    try {
      await verify(source.initial, 'initial');
      for (const [index, step] of source.steps.entries()) {
        const action = step.action;
        const editor = page.locator('[data-surface-case]').getByRole('combobox', { name: 'Surface value', exact: true });
        if (action.type === 'props' || action.type === 'value') await capture.evaluate((value, action) => value.update(action), action);
        else if (action.type === 'click') await editor.click();
        else if (action.type === 'fill') await editor.fill(action.text);
        else if (action.type === 'press') await editor.press(action.key);
        else if (action.type === 'outside') await page.locator('[data-surface-outside]').click();
        else if (action.type === 'scroll') await page.evaluate(top => {
          const holder = document.querySelector<HTMLElement>('.ant-select-dropdown-list-holder');
          if (!holder) throw Error('Actual Native virtual holder absent');
          holder.scrollTop = top; holder.dispatchEvent(new Event('scroll', { bubbles: true }));
        }, action.top);
        await page.mouse.move(0, 0);
        await verify(step, index + '/' + JSON.stringify(action));
      }
      const before = await capture.evaluate(value => value.read());
      await capture.evaluate(value => value.dispose());
      await expect(page.locator('[data-surface-case]')).toHaveCount(0);
      await drainSelectSurface(page);
      const cleanup = async () => ({ owner: await capture.evaluate(value => value.read()), refs: await capture.evaluate(value => value.readRefs()),
        nodes: await retained.evaluate(value => ({ root: Boolean(value.root?.isConnected), editor: Boolean(value.editor?.isConnected),
          popupCount: document.querySelectorAll('.ant-select-dropdown').length })) });
      const disposed = await cleanup(); trace.push({ label: 'disposed', actual: disposed, before });
      expect(disposed.nodes).toEqual({ root: false, editor: false, popupCount: 0 });
      expect(Object.values(disposed.refs).every(value => value == null)).toBe(true);
      expect(disposed.owner.events).toEqual(before.events); expect(disposed.owner.rawEvents).toEqual(before.rawEvents);
      expect(disposed.owner.calls).toEqual(before.calls);
      verifyAutocompleteLifecycle(disposed.owner.lifecycle, source.cleanup.owner.lifecycle, source, 'disposed', true);
      expect(disposed.owner.alive).toBe(false);
      await page.waitForTimeout(1000); expect(await cleanup()).toEqual(disposed);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach('actual-autocomplete-render-raw', { body: JSON.stringify({ sample, trace, failures }, null, 2), contentType: 'application/json' });
      await retained.dispose(); await capture.dispose();
    }
  });
}
