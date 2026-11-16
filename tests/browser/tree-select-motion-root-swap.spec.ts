import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-motion-root-swap-reference.json' with { type: 'json' };
import type { TreeSelectMotionRootSwapAction } from './fixtures/tree-select-motion-root-swap-cases';
import { actTreeSelectMotion } from './tree-select-motion-driver';
import {
  advanceTreeSelectMotionFrames, installTreeSelectMotionClock, readTreeSelectMotion
} from './tree-select-motion-metrics';
import { treeSelectMotionNativeObserved } from './tree-select-motion-native';

test.use({ viewport: reference.reference.viewport });
for (const entry of reference.cases) {
  test(`TreeSelect retains the popup clock and cached coordinates through ${entry.id}`, async ({ page }) => {
    await page.addInitScript(installTreeSelectMotionClock);
    await page.goto('/?fixture=tree-select-motion');
    await page.getByRole('combobox', { name: 'TreeSelect motion sample', exact: true })
      .selectOption(entry.id);
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-motion-case]')).toHaveAttribute('data-motion-bound', 'true');
    const drain = async () => {
      await page.evaluate(advanceTreeSelectMotionFrames, 0);
      await page.locator('[data-motion-command]').dispatchEvent('motionshadowstyles');
      await page.evaluate(advanceTreeSelectMotionFrames, 0);
    };
    await drain();
    expect((await page.evaluate(readTreeSelectMotion)).view).toEqual(entry.initial.view);
    const identity = await page.evaluateHandle(() => {
      const root = document.querySelector('[data-motion-root]')!;
      const popup = document.querySelector('.motion-audit-popup')!;
      const refs: { control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown } } = {};
      document.querySelector('[data-motion-command]')!
        .dispatchEvent(new CustomEvent('motionrefs', { detail: refs }));
      return {
        root, popup, draft: popup.querySelector('[data-motion-draft]'),
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo
      };
    });
    const observed = () => identity.evaluate(old => {
      const root = document.querySelector('[data-motion-root]')!;
      const popup = document.querySelector('.motion-audit-popup')!;
      const editor = root.querySelector('[data-motion-editor],input[role="combobox"]');
      const refs: {
        root?: Element;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown };
        getterArguments?: Element[];
      } = {};
      document.querySelector('[data-motion-command]')!
        .dispatchEvent(new CustomEvent('motionrefs', { detail: refs }));
      return {
        sameRoot: old.root === root,
        sameEditor: editor === null,
        sameEditorParent: editor === null,
        samePopup: old.popup === popup,
        sameDraft: old.draft === popup.querySelector('[data-motion-draft]'),
        rootIsPublicRef: refs.root === root,
        focusMethod: typeof refs.control?.focus === 'function',
        blurMethod: typeof refs.control?.blur === 'function',
        scrollToMethod: typeof refs.control?.scrollTo === 'function',
        getterUsesRoot: refs.getterArguments?.length
          ? refs.getterArguments.every(argument => argument === root) : null,
        sameFocus: old.focus === refs.control?.focus,
        sameBlur: old.blur === refs.control?.blur,
        sameScrollTo: old.scrollTo === refs.control?.scrollTo
      };
    });
    try {
      expect(await observed()).toEqual(treeSelectMotionNativeObserved(entry.initial.observed));
      for (const step of entry.steps) {
        await actTreeSelectMotion(page, step.action as TreeSelectMotionRootSwapAction);
        await drain();
        const actual = await page.evaluate(readTreeSelectMotion);
        expect(actual.view, JSON.stringify(step.action)).toEqual(step.view);
        expect(actual.raw.popup?.position).toBe('fixed');
        expect(actual.raw.popup?.offsetParent).toBeNull();
        expect(await observed()).toEqual(treeSelectMotionNativeObserved(step.observed));
      }
      expect(await identity.evaluate(old => ({
        oldConnected: old.root.isConnected,
        newRoot: old.root !== document.querySelector('[data-motion-root]')
      }))).toEqual({ oldConnected: false, newRoot: true });
    } finally {
      await identity.dispose();
      await page.evaluate(() => {
        const scope = window as Window & { treeSelectMotionFrameClock?: { stop: () => void } };
        scope.treeSelectMotionFrameClock?.stop();
      });
    }
  });
}
