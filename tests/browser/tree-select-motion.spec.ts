import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-motion-reference.json' with { type: 'json' };
import nativeReference from './fixtures/ant-design-tree-select-motion-native-reference.json' with { type: 'json' };
import prefixReference from './fixtures/ant-design-tree-select-motion-prefix-reference.json' with { type: 'json' };
import flowReference from './fixtures/ant-design-tree-select-motion-flow-reference.json' with { type: 'json' };
import {
  treeSelectMotionSamples, type TreeSelectMotionAction, type TreeSelectMotionSample
} from './fixtures/tree-select-motion-cases';
import { actTreeSelectMotion } from './tree-select-motion-driver';
import {
  advanceTreeSelectMotionFrames, installTreeSelectMotionClock, readTreeSelectMotion
} from './tree-select-motion-metrics';
import { treeSelectMotionNativeObserved, treeSelectMotionNativeView } from './tree-select-motion-native';

type Projection = ReturnType<typeof readTreeSelectMotion>;
type SourceSnapshot = (typeof reference.cases)[number]['initial']
  | (typeof reference.cases)[number]['steps'][number]
  | (typeof nativeReference.cases)[number]['initial']
  | (typeof nativeReference.cases)[number]['steps'][number]
  | (typeof prefixReference.cases)[number]['initial']
  | (typeof prefixReference.cases)[number]['steps'][number]
  | (typeof flowReference.cases)[number]['initial']
  | (typeof flowReference.cases)[number]['steps'][number];

async function drain(page: Page) {
  await page.evaluate(advanceTreeSelectMotionFrames, 0);
  await page.locator('[data-motion-command]').dispatchEvent('motionshadowstyles');
  await page.evaluate(advanceTreeSelectMotionFrames, 0);
}
function verify(
  actual: Projection, expected: SourceSnapshot, sample: TreeSelectMotionSample, action: string
) {
  expect(actual.view, action).toEqual(treeSelectMotionNativeView(expected.view, sample.id));
  expect(actual.raw.document).toEqual(expected.raw.document);
  expect(actual.raw.root.dir).toBe(sample.slot?.startsWith('root-') ? expected.raw.root.dir : 'ltr');
  if (expected.raw.popup) {
    expect(actual.raw.popup).not.toBeNull();
    expect(actual.raw.popup?.position).toBe('fixed');
    expect(actual.raw.popup?.offsetParent).toBeNull();
    expect(actual.raw.popup?.container).toBe(sample.container ?? 'host');
    expect(actual.raw.popup?.pointerEvents).toBe(expected.raw.popup.pointerEvents);
    // Native keeps its fixed top layer. Source raw axes, offsetParent and CSS clocks remain unmodified.
    // A projected transform transition owns a real Animation clock on the same popup, observable via WAAPI.
    for (const transition of expected.raw.popup.animations.filter(animation => animation.kind === 'CSSTransition')) {
      expect(actual.raw.popup?.animations.some(animation =>
        ['Animation', 'CSSTransition'].includes(animation.kind)
          && animation.currentTime === transition.currentTime
          && animation.timing?.duration === transition.timing?.duration)).toBe(true);
    }
  }
  else expect(actual.raw.popup).toBeNull();
}

test.use({ viewport: reference.reference.viewport });
for (const rawEntry of reference.cases) {
  const flowCounterpart = rawEntry.id === 'multiple-choice'
    ? flowReference.cases.find(candidate => candidate.id === rawEntry.id) : undefined;
  const prefixCounterpart = ['local-prefix-default', 'global-local-animation'].includes(rawEntry.id)
    ? prefixReference.cases.find(candidate => candidate.id === rawEntry.id) : undefined;
  const entry = flowCounterpart
    ?? nativeReference.cases.find(candidate => candidate.id === rawEntry.id)
    ?? prefixCounterpart ?? rawEntry;
  test(`TreeSelect matches actual Source CSS motion and retained state for ${rawEntry.id}`, async ({ page }) => {
    const sample = treeSelectMotionSamples.find(sample => sample.id === rawEntry.id)!;
    if (entry !== rawEntry) {
      // Each accepted Native boundary has a separate actual public Source run, retaining primary raw evidence.
      expect([
        'multiple-choice', 'hidden-content-cache', 'context-live',
        'local-prefix-default', 'global-local-animation'
      ]).toContain(rawEntry.id);
      expect(entry.steps.map(step => step.action)).toEqual(rawEntry.steps.map(step => step.action));
    }
    await page.emulateMedia({ reducedMotion: sample.reduced ? 'reduce' : 'no-preference' });
    await page.addInitScript(installTreeSelectMotionClock);
    await page.goto('/?fixture=tree-select-motion');
    await page.getByRole('combobox', { name: 'TreeSelect motion sample', exact: true })
      .selectOption(rawEntry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-motion-case]')).toHaveAttribute('data-motion-bound', 'true');
    await drain(page);
    verify(await page.evaluate(readTreeSelectMotion), entry.initial, sample, 'initial');
    const identity = await page.evaluateHandle(() => {
      const host = document.querySelector('[data-motion-host]')!;
      const root = host.querySelector('[data-motion-root]') ?? host.querySelector('.motion-audit-root')!;
      const editor = root.querySelector('[data-motion-editor],input[role="combobox"],textarea[role="combobox"]');
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
      const root = host.querySelector('[data-motion-root]') ?? host.querySelector('.motion-audit-root')!;
      const editor = root.querySelector('[data-motion-editor],input[role="combobox"],textarea[role="combobox"]');
      const shadow = document.querySelector('[data-motion-shadow]')?.shadowRoot;
      const popup = shadow?.querySelector<HTMLElement>('.motion-audit-popup')
        ?? document.querySelector<HTMLElement>('.motion-audit-popup');
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
        await drain(page);
        verify(await page.evaluate(readTreeSelectMotion), step, sample, JSON.stringify(step.action));
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
