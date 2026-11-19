import { test, expect } from './test';
import type { JSHandle } from '@playwright/test';
import { selectSurfaceContextReference } from './select-surface-context-reference';
import { actSelectSurfaceContext, settleSelectSurfaceContext } from './select-surface-context-driver';
import { verifySelectSurfaceContextPoint } from './select-surface-context-assertions';

test.use({ viewport: { width: 1200, height: 900 } });
for (const original of selectSurfaceContextReference.cases) {
  test(`Select popup isolates and retains public Form context for ${original.id}`, async (
    { page },
    testInfo
  ) => {
    const trace: unknown[] = [];
    await page.goto('/?fixture=select-surface-context');
    await page.getByRole('combobox', { name: 'Select surface context sample', exact: true }).selectOption(original.id);

    await expect(page.locator('[data-surface-context-case]')).toHaveAttribute(
      'data-surface-context-bound',
      'true'
    );
    await page.mouse.move(0, 0);
    const retained = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLElement; control?: unknown } = {};
      document.querySelector('[data-surface-context-command]')!.dispatchEvent(new CustomEvent(
        'contextrefs',
        { detail: refs }
      ));
      return { ...refs, parent: refs.editor?.parentNode };
    });
    let inside: JSHandle<HTMLInputElement | null> | undefined;
    const verify = async (source: typeof original.initial, label: string) => {
      const actual = await settleSelectSurfaceContext(page);
      trace.push({ label, actual });
      verifySelectSurfaceContextPoint(actual, source, label, original.calls);
      expect(await retained.evaluate(before => {
        const refs: { root?: HTMLElement; editor?: HTMLElement; control?: unknown } = {};
        document.querySelector('[data-surface-context-command]')!.dispatchEvent(new CustomEvent(
          'contextrefs',
          { detail: refs }
        ));
        return { root: refs.root === before.root, editor: refs.editor === before.editor,
          parent: refs.editor?.parentNode === before.parent, control: refs.control === before.control };
      })).toEqual({ root: true, editor: true, parent: true, control: true });
      if (inside) expect(await inside.evaluate(node => node === document.querySelector('[aria-label="Inside context input"]'))).toBe(true);
    };
    try {
      await verify(original.initial, 'initial');
      for (const [index, step] of original.steps.entries()) {
        await actSelectSurfaceContext(page, step.action);
        if (step.action.type === 'fill') inside = await page.evaluateHandle(() =>
          document.querySelector<HTMLInputElement>('[aria-label="Inside context input"]'));
        await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }
      await page.locator('[data-surface-context-unmount]').click();
      await expect(page.locator('[data-surface-context-case]')).toHaveCount(0);
      expect(await retained.evaluate(before => ({ rootConnected: before.root?.isConnected,
        editorConnected: before.editor?.isConnected, popupCount: document.querySelectorAll('.ant-select-dropdown').length })))
        .toEqual(original.cleanup);
      if (inside) expect(await inside.evaluate(node => node?.isConnected)).toBe(false);
    } finally {
      await testInfo.attach(
        'actual-select-surface-context',
        {
          body: JSON.stringify({ id: original.id, trace }, null, 2),
          contentType: 'application/json'
        }
      );
      await retained.dispose();
      await inside?.dispose();
    }
  });
}
