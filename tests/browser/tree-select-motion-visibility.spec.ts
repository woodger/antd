import type { Page } from '@playwright/test';
import { test, expect } from './test';
import { actTreeSelectMotion } from './tree-select-motion-driver';
import {
  advanceTreeSelectMotionFrames, installTreeSelectMotionClock, readTreeSelectMotion
} from './tree-select-motion-metrics';

type VisibilityWindow = Window & {
  treeSelectMotionFrameClock?: { pending: () => number; stop: () => void };
};

async function drain(page: Page) {
  await page.evaluate(advanceTreeSelectMotionFrames, 0);
  await page.locator('[data-motion-command]').dispatchEvent('motionshadowstyles');
  await page.evaluate(advanceTreeSelectMotionFrames, 0);
}

test.use({ viewport: { width: 1200, height: 800 } });

test('TreeSelect closes an offscreen Native popup without a CSS end and reopens the retained panel', async (
  { page },
  testInfo
) => {
  await page.addInitScript(installTreeSelectMotionClock);
  await page.goto('/?fixture=tree-select-motion');
  await page.getByRole('combobox', { name: 'TreeSelect motion sample', exact: true })
    .selectOption('custom-animation');
  await page.mouse.move(0, 0);

  await expect(page.locator('[data-motion-case]')).toHaveAttribute('data-motion-bound', 'true');
  await drain(page);
  await actTreeSelectMotion(page, { type: 'click' });
  await actTreeSelectMotion(page, { type: 'frame', count: 6 });
  await drain(page);

  expect((await page.evaluate(readTreeSelectMotion)).view.popup?.motionClasses)
    .toEqual(['audit-custom-appear', 'audit-custom-appear-active', 'audit-custom']);
  const identity = await page.evaluateHandle(() => {
    const root = document.querySelector<HTMLElement>('.motion-audit-root')!;
    const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    const popup = document.querySelector<HTMLElement>('.motion-audit-popup')!;
    const draft = popup.querySelector<HTMLInputElement>('[data-motion-draft]')!;
    return {
      root,
      editor,
      popup,
      draft,
      animations: new Set(popup.getAnimations({ subtree: false }))
    };
  });
  const trace: unknown[] = [];
  const ledger = [['focus'], ['open', true]];
  const snapshot = async (action: string) => {
    const projection = await page.evaluate(readTreeSelectMotion);
    const visibility = await page.evaluate(() => {
      const popup = document.querySelector<HTMLElement>('.motion-audit-popup')!;
      const root = document.querySelector<HTMLElement>('.motion-audit-root')!;
      const bounds = root.getBoundingClientRect();
      return {
        popoverOpen: popup.matches(':popover-open'),
        rootOffscreen: bounds.right <= 0 || bounds.bottom <= 0
          || bounds.left >= innerWidth || bounds.top >= innerHeight,
        pending: (window as VisibilityWindow).treeSelectMotionFrameClock!.pending()
      };
    });
    const identities = await identity.evaluate(old => {
      const root = document.querySelector('.motion-audit-root');
      const editor = root?.querySelector('input[role="combobox"]');
      const popup = document.querySelector('.motion-audit-popup');
      const draft = popup?.querySelector('[data-motion-draft]');
      for (const animation of popup?.getAnimations({ subtree: false }) ?? []) old.animations.add(animation);
      return {
        root: old.root === root, editor: old.editor === editor,
        popup: old.popup === popup, draft: old.draft === draft
      };
    });
    const result = { action, ...projection, visibility, identities };
    trace.push(result);
    expect(identities, action).toEqual({ root: true, editor: true, popup: true, draft: true });
    expect(projection.view.events, action).toEqual(ledger);
    expect(projection.view.popup?.draft, action).toEqual({
      value: 'Panel draft',
      selection: [11, 11]
    });
    return result;
  };
  const closed = async (action: string, rootOffscreen: boolean) => {
    const result = await snapshot(action);
    expect(result.view.editor?.expanded, action).toBe('false');
    expect(result.view.popup?.hidden, action).toBe(true);
    expect(result.view.popup?.motionClasses, action).toEqual([]);
    expect(result.raw.popup?.display, action).toBe('none');
    expect(result.raw.popup?.animations, action).toEqual([]);
    expect(result.visibility, action).toEqual({ popoverOpen: false, rootOffscreen, pending: 0 });
  };
  try {
    await actTreeSelectMotion(page, {
      type: 'end', target: 'popup', event: 'animationend', name: 'any-own-effect'
    });
    await actTreeSelectMotion(page, { type: 'frame', count: 4 });
    await drain(page);
    const stable = await snapshot('stable-open');
    expect(stable.view.popup?.hidden).toBe(false);
    expect(stable.view.popup?.motionClasses).toEqual([]);
    expect(stable.visibility.popoverOpen).toBe(true);

    // This preserves Native anchor visibility; explicit Source alignment props are a separate contract.
    await actTreeSelectMotion(page, { type: 'left', value: 2000 });
    await actTreeSelectMotion(page, { type: 'frame', count: 4 });
    await drain(page);
    const offscreen = await snapshot('offscreen-open');
    expect(offscreen.view.editor?.expanded).toBe('true');
    expect(offscreen.view.popup?.hidden).toBe(true);
    expect(offscreen.visibility.rootOffscreen).toBe(true);
    expect(offscreen.visibility.popoverOpen).toBe(false);

    await actTreeSelectMotion(page, { type: 'open', value: false });
    await actTreeSelectMotion(page, { type: 'frame', count: 8 });
    await drain(page);
    await closed('offscreen-closed-frame8', true);
    await actTreeSelectMotion(page, { type: 'frame', count: 30 });
    await drain(page);
    await closed('offscreen-closed-frame38', true);
    await page.waitForTimeout(1000);
    await drain(page);
    await closed('offscreen-closed-late1000ms', true);

    await actTreeSelectMotion(page, { type: 'left', value: 300 });
    await actTreeSelectMotion(page, { type: 'frame', count: 4 });
    await drain(page);
    await closed('returned-anchor-closed', false);
    await actTreeSelectMotion(page, { type: 'frame', count: 30 });
    await page.waitForTimeout(1000);
    await drain(page);
    await closed('returned-anchor-closed-late1000ms', false);

    await actTreeSelectMotion(page, { type: 'open', value: true });
    await drain(page);
    const prepare = await snapshot('reopen-prepare');
    expect(prepare.view.popup?.motionClasses)
      .toEqual(['audit-custom-enter', 'audit-custom-enter-prepare', 'audit-custom']);
    await actTreeSelectMotion(page, { type: 'frame', count: 6 });
    await drain(page);
    const reopened = await snapshot('reopen-active');
    expect(reopened.view.editor?.expanded).toBe('true');
    expect(reopened.view.popup?.hidden).toBe(false);
    expect(reopened.visibility.popoverOpen).toBe(true);
    expect(reopened.view.popup?.motionClasses)
      .toEqual(['audit-custom-enter', 'audit-custom-enter-active', 'audit-custom']);
    await actTreeSelectMotion(page, { type: 'clock', time: 500 });
    await drain(page);
    const halfway = await snapshot('reopen-clock500');
    expect(halfway.raw.popup?.animations.map(animation => ({
      kind: animation.kind, state: animation.playState, currentTime: animation.currentTime
    }))).toEqual([{ kind: 'CSSAnimation', state: 'paused', currentTime: 500 }]);

    // Dispose the pending enter through the existing keyed fixture selector, without a runtime hook.
    await page.getByRole('combobox', { name: 'TreeSelect motion sample', exact: true })
      .selectOption('transition-empty');
    await expect(page.locator('[data-motion-case]')).toHaveAttribute(
      'data-motion-case',
      'transition-empty'
    );
    await expect(page.locator('[data-motion-case]')).toHaveAttribute('data-motion-bound', 'true');
    await actTreeSelectMotion(page, { type: 'frame', count: 4 });
    await drain(page);
    const readDisposal = () => identity.evaluate(old => ({
      rootConnected: old.root.isConnected, editorConnected: old.editor.isConnected,
      popupConnected: old.popup.isConnected, draftConnected: old.draft.isConnected,
      oldPopupCount: [...document.querySelectorAll('.motion-audit-popup')]
        .filter(popup => popup === old.popup).length,
      pending: (window as VisibilityWindow).treeSelectMotionFrameClock!.pending(),
      animations: [...old.animations].map(animation => ({
        kind: animation.constructor.name, state: animation.playState, currentTime: animation.currentTime
      }))
    }));
    const expectedDisposal = {
      rootConnected: false, editorConnected: false, popupConnected: false, draftConnected: false,
      oldPopupCount: 0, pending: 0,
      animations: [
        { kind: 'CSSAnimation', state: 'idle', currentTime: null },
        { kind: 'CSSAnimation', state: 'idle', currentTime: null }
      ]
    };
    const disposed = await readDisposal();
    trace.push({ action: 'disposal', ...disposed });
    expect(disposed).toEqual(expectedDisposal);
    await page.waitForTimeout(1000);
    await actTreeSelectMotion(page, { type: 'frame', count: 4 });
    await drain(page);
    const lateDisposed = await readDisposal();
    trace.push({ action: 'disposal-late1000ms', ...lateDisposed });
    expect(lateDisposed).toEqual(expectedDisposal);
    await expect(page.locator('[data-motion-events]')).toHaveText('[]');
  } finally {
    await testInfo.attach('tree-select-native-visibility-trace', {
      body: JSON.stringify(trace, null, 2), contentType: 'application/json'
    });
    await identity.dispose();
    await page.evaluate(() => {
      (window as VisibilityWindow).treeSelectMotionFrameClock?.stop();
    });
  }
});
