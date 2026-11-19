import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-motion-leave-reference.json' with { type: 'json' };
import {
  treeSelectMotionLeaveActions, treeSelectMotionLeaveSamples
} from './fixtures/tree-select-motion-leave-cases';
import type { TreeSelectMotionAction } from './fixtures/tree-select-motion-cases';
import { actTreeSelectMotion } from './tree-select-motion-driver';
import {
  advanceTreeSelectMotionFrames, installTreeSelectMotionClock, readTreeSelectMotion
} from './tree-select-motion-metrics';
import { treeSelectMotionNativeObserved } from './tree-select-motion-native';

test.use({ viewport: reference.reference.viewport });
for (const entry of reference.cases) {
  test(`TreeSelect keeps rendered leave DOM until Source activation after early own end for ${entry.id}`, async ({ page }) => {
    const sample = treeSelectMotionLeaveSamples.find(sample => sample.id === entry.id)!;

    expect(entry.steps.map(step => step.action)).toEqual(treeSelectMotionLeaveActions(sample));
    // These are independently observed Source facts: own end in ACTIVE precedes render-ready ACTIVATED.
    expect(entry.steps[7].view.popup?.hidden).toBe(false);
    expect(entry.steps[8].view.popup?.hidden).toBe(false);
    expect(entry.steps[9].view.popup?.hidden).toBe(true);
    await page.addInitScript(installTreeSelectMotionClock);
    await page.goto('/?fixture=tree-select-motion');
    await page.getByRole('combobox', { name: 'TreeSelect motion sample', exact: true })
      .selectOption(sample.fixtureId);
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
      const host = document.querySelector('[data-motion-host]')!;
      const root = host.querySelector('.motion-audit-root')!;
      const editor = root.querySelector('input[role="combobox"]');
      const refs: { control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown } } = {};
      host.querySelector('[data-motion-command]')!
        .dispatchEvent(new CustomEvent('motionrefs', { detail: refs }));
      return {
        root, editor, editorParent: editor?.parentNode ?? null,
        popup: null as HTMLElement | null, draft: null as HTMLInputElement | null,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo
      };
    });
    const observed = () => identity.evaluate(old => {
      const host = document.querySelector('[data-motion-host]')!;
      const root = host.querySelector('.motion-audit-root')!;
      const editor = root.querySelector('input[role="combobox"]');
      const popup = document.querySelector<HTMLElement>('.motion-audit-popup');
      const draft = popup?.querySelector<HTMLInputElement>('[data-motion-draft]') ?? null;
      const samePopup = !old.popup || !popup || old.popup === popup;
      const sameDraft = !old.draft || !draft || old.draft === draft;
      old.popup ??= popup;
      old.draft ??= draft;
      const refs: {
        root?: Element;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown };
        getterArguments?: Element[];
      } = {};
      host.querySelector('[data-motion-command]')!
        .dispatchEvent(new CustomEvent('motionrefs', { detail: refs }));
      return {
        sameRoot: old.root === root,
        sameEditor: old.editor === editor,
        sameEditorParent: old.editorParent === (editor?.parentNode ?? null),
        samePopup, sameDraft,
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
        await actTreeSelectMotion(page, step.action as TreeSelectMotionAction);
        await drain();
        const actual = await page.evaluate(readTreeSelectMotion);
        expect(actual.view, JSON.stringify(step.action)).toEqual(step.view);
        expect(actual.raw.popup?.position).toBe('fixed');
        expect(actual.raw.popup?.offsetParent).toBeNull();
        expect(actual.raw.popup?.pointerEvents).toBe(step.raw.popup?.pointerEvents);
        expect(await observed()).toEqual(treeSelectMotionNativeObserved(step.observed));
      }
    } finally {
      await identity.dispose();
      await page.evaluate(() => {
        const scope = window as Window & { treeSelectMotionFrameClock?: { stop: () => void } };
        scope.treeSelectMotionFrameClock?.stop();
      });
    }
  });
}
