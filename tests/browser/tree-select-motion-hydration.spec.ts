import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-motion-reference.json' with { type: 'json' };
import type { TreeSelectMotionAction } from './fixtures/tree-select-motion-cases';
import { actTreeSelectMotion } from './tree-select-motion-driver';
import {
  advanceTreeSelectMotionFrames, installTreeSelectMotionClock, readTreeSelectMotion
} from './tree-select-motion-metrics';
import { treeSelectMotionNativeHydrationExpected } from './tree-select-motion-native';

interface MotionDisposeSnapshot {
  ledger: unknown[][];
  rootConnected: boolean;
  editorConnected: boolean;
}
interface MotionDisposeTrace {
  phase: 'disposing' | 'disposed';
  before: MotionDisposeSnapshot;
  afterCall: MotionDisposeSnapshot | null;
  afterAwait: MotionDisposeSnapshot | null;
  probes: Array<MotionDisposeSnapshot & {
    type: string;
    phase: 'disposing' | 'disposed';
    targetIsEditor: boolean;
    trusted: boolean;
    relatedTarget: string | null;
  }>;
}
declare global {
  interface Window {
    motionHydrationResources?: {
      observers: () => number;
      mutations: () => number;
      frames: () => number;
      timers: () => number;
      animations: () => Array<{ kind: string; state: string }>;
    };
    motionHydrationDisposal?: { trace: MotionDisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'tree-select-motion-hydration-'
  ));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir: cache
  });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

const scenarios = [
  { id: 'custom-animation', pending: 'appear', events: [['focus'], ['open', true]] },
  { id: 'custom-transition', pending: 'leave', events: [['focus'], ['open', true]] },
  { id: 'default-open-appear', pending: 'appear', events: [['focus']] },
  { id: 'controlled-initial-open', pending: 'appear', events: [['focus']] },
  {
    id: 'custom-root-composite', pending: 'appear',
    events: [['focus'], ['open', true], ['root-input', 'Motion draft']]
  }
];

for (const { id, pending, events } of scenarios) {
  test(`TreeSelect ${id} strictly hydrates and disposes pending ${pending} work`, async (
    { page },
    testInfo
  ) => {
    const source = reference.cases.find(entry => entry.id === id)!;
    const initialPanel = id === 'default-open-appear' || id === 'controlled-initial-open';
    const module = await server.ssrLoadModule(fileURLToPath(
      new URL('./fixtures/tree-select-motion-hydration.server.ts', import.meta.url)
    ));
    const rendered = module.renderTreeSelectMotion(id);
    await page.addInitScript(installTreeSelectMotionClock);
    await page.goto(`/tree-select-motion-hydration.html?sample=${id}`);
    // A real SSR page loads its stylesheet before its markup; late CSS would animate the control's height.
    await page.addScriptTag({ type: 'module', url: '/tree-select-motion-styles.client.ts' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
      const observers = new Set<Set<Element>>();
      const mutations = new Set<MutationObserver>();
      const OriginalResize = window.ResizeObserver;
      const OriginalMutation = window.MutationObserver;
      window.ResizeObserver = class extends OriginalResize {
        targets = new Set<Element>();
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          observers.add(this.targets);
        }
        observe(target: Element, options?: ResizeObserverOptions) {
          this.targets.add(target);
          super.observe(target, options);
        }
        unobserve(target: Element) {
          this.targets.delete(target);
          super.unobserve(target);
        }
        disconnect() {
          this.targets.clear();
          super.disconnect();
        }
      };
      window.MutationObserver = class extends OriginalMutation {
        observe(target: Node, options?: MutationObserverInit) {
          mutations.add(this);
          super.observe(target, options);
        }
        disconnect() {
          mutations.delete(this);
          super.disconnect();
        }
      };
      const frames = new Set<number>();
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        const frame = request(time => {
          frames.delete(frame);
          callback(time);
        });
        frames.add(frame);
        return frame;
      };
      window.cancelAnimationFrame = frame => {
        frames.delete(frame);
        cancel(frame);
      };
      const timers = new Set<number>();
      const browser: Window = window;
      const schedule = browser.setTimeout.bind(browser);
      const clear = browser.clearTimeout.bind(browser);
      browser.setTimeout = (handler, timeout, ...args) => {
        if (typeof handler !== 'function') throw Error('Expected a function timer during hydration');
        const timer = schedule(() => {
          timers.delete(timer);
          handler(...args);
        }, timeout);
        timers.add(timer);
        return timer;
      };
      browser.clearTimeout = timer => {
        if (timer !== undefined) timers.delete(timer);
        clear(timer);
      };
      const animations = new Set<Animation>();
      const originalAnimations = Element.prototype.getAnimations;
      Element.prototype.getAnimations = function(options?: GetAnimationsOptions) {
        const result = originalAnimations.call(this, options);
        if (this.classList.contains('motion-audit-popup'))
          for (const animation of result) animations.add(animation);
        return result;
      };
      window.motionHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size,
        frames: () => frames.size,
        timers: () => timers.size,
        animations: () => [...animations].filter(animation => animation.playState !== 'idle')
          .map(animation => ({ kind: animation.constructor.name, state: animation.playState }))
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Motion outside draft"]')!;
      outside.value = 'Outside motion hydration draft';
      outside.setSelectionRange(1, 10);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/tree-select-motion-hydration.client.ts' });
    await page.waitForFunction(() => window.treeSelectMotionHydration);

    await expect(page.locator('[data-motion-case]')).toHaveAttribute('data-motion-bound', 'true');
    const drain = async () => {
      await page.evaluate(advanceTreeSelectMotionFrames, 0);
      await page.locator('[data-motion-command]').dispatchEvent('motionshadowstyles');
      await page.evaluate(advanceTreeSelectMotionFrames, 0);
    };
    await drain();

    expect((await page.evaluate(readTreeSelectMotion)).view)
      .toEqual(treeSelectMotionNativeHydrationExpected(source.initial.view, initialPanel));
    const identity = await page.evaluateHandle(() => {
      const state = window.treeSelectMotionHydration!;
      const refs = state.refs();
      return {
        control: refs.control, focus: refs.control?.focus, blur: refs.control?.blur,
        scrollTo: refs.control?.scrollTo, popup: null as HTMLElement | null,
        draft: null as HTMLInputElement | null
      };
    });
    const readIdentity = () => identity.evaluate(old => {
      const state = window.treeSelectMotionHydration!;
      const refs = state.refs();
      const host = document.querySelector('[data-motion-host]')!;
      const root = host.querySelector('[data-motion-root]') ?? host.querySelector('.motion-audit-root');
      const popup = document.querySelector<HTMLElement>('.motion-audit-popup');
      const draft = popup?.querySelector<HTMLInputElement>('[data-motion-draft]') ?? null;
      const samePopup = !old.popup || !popup || old.popup === popup;
      const sameDraft = !old.draft || !draft || old.draft === draft;
      old.popup ??= popup;
      old.draft ??= draft;
      return {
        root: refs.root === state.root && root === state.root,
        editor: refs.editor === state.editor,
        parent: state.editor?.parentNode === state.editorParent,
        control: refs.control === old.control,
        focus: refs.control?.focus === old.focus,
        blur: refs.control?.blur === old.blur,
        scrollTo: refs.control?.scrollTo === old.scrollTo,
        popup: samePopup,
        draft: sameDraft,
        initialPopup: !state.initialPopup || state.initialPopup === popup,
        initialDraft: !state.initialDraft || state.initialDraft === draft,
        getters: refs.getterArguments.every(argument => argument === state.root),
        outside: state.outside.value,
        outsideSelection: [state.outside.selectionStart, state.outside.selectionEnd]
      };
    });
    const expectedIdentity = {
      root: true, editor: true, parent: true, control: true, focus: true,
      blur: true, scrollTo: true, popup: true, draft: true, initialPopup: true,
      initialDraft: true, getters: true, outside: 'Outside motion hydration draft',
      outsideSelection: [1, 10]
    };
    try {
      expect(await readIdentity()).toEqual(expectedIdentity);
      let closing = false;
      for (const step of source.steps) {
        const action = step.action as TreeSelectMotionAction;
        if (action.type === 'open' && !action.value || action.type === 'outside') closing = true;
        if (action.type === 'end' && action.target === 'popup'
          && (pending === 'appear' || closing)) break;
        await actTreeSelectMotion(page, action);
        await drain();
        expect((await page.evaluate(readTreeSelectMotion)).view, JSON.stringify(action))
          .toEqual(treeSelectMotionNativeHydrationExpected(step.view, initialPanel));
        expect(await readIdentity()).toEqual(expectedIdentity);
      }
      expect((await page.evaluate(readTreeSelectMotion)).view.popup?.motionClasses
        .some(name => name.endsWith(`-${pending}-active`))).toBe(true);
      await page.evaluate(() => window.treeSelectMotionHydration!.refs().control!.focus({ preventScroll: true }));
      expect(await page.evaluate(() => window.treeSelectMotionHydration!.events())).toEqual(events);
      expect(await readIdentity()).toEqual(expectedIdentity);
      await page.evaluate(async () => {
        const state = window.treeSelectMotionHydration!;
        const editor = state.editor!;
        const snapshot = (): MotionDisposeSnapshot => ({
          ledger: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: editor.isConnected
        });
        const trace: MotionDisposeTrace = {
          phase: 'disposing', before: snapshot(), afterCall: null, afterAwait: null, probes: []
        };
        const record = (event: FocusEvent) => trace.probes.push({
          ...snapshot(), type: event.type, phase: trace.phase,
          targetIsEditor: event.target === editor, trusted: event.isTrusted,
          relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null
        });
        editor.addEventListener('blur', record, true);
        editor.addEventListener('focusout', record, true);
        window.motionHydrationDisposal = {
          trace,
          stop() {
            editor.removeEventListener('blur', record, true);
            editor.removeEventListener('focusout', record, true);
          }
        };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      expect(await page.evaluate(() => window.treeSelectMotionHydration!.cleaned))
        .toEqual({ root: true, editor: true, control: true });
      await expect(page.locator('[data-motion-case]')).toHaveCount(0);
      await expect(page.locator('[popover]')).toHaveCount(0);
      await identity.evaluate(old => {
        old.popup?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
        old.popup?.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
        old.draft?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      });
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(1000);
      const disposal = await page.evaluate(() => window.motionHydrationDisposal!.trace);
      await testInfo.attach('tree-select-motion-disposal-timing', {
        body: JSON.stringify({ id, pending, disposal }, null, 2), contentType: 'application/json'
      });
      console.log('TreeSelect motion disposal timing:', JSON.stringify({ id, pending, disposal }));
      const disposed = {
        ledger: [...events, ['blur']], rootConnected: false, editorConnected: false
      };
      // Existing Native removal emits one trusted connected blur before refs/DOM are cleared.
      expect(disposal).toEqual({
        phase: 'disposed',
        before: { ledger: events, rootConnected: true, editorConnected: true },
        afterCall: disposed,
        afterAwait: disposed,
        probes: ['blur', 'focusout'].map(type => ({
          ledger: events, rootConnected: true, editorConnected: true,
          type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null
        }))
      });
      expect(await page.evaluate(() => ({
        observers: window.motionHydrationResources!.observers(),
        mutations: window.motionHydrationResources!.mutations(),
        frames: window.motionHydrationResources!.frames(),
        timers: window.motionHydrationResources!.timers(),
        animations: window.motionHydrationResources!.animations(),
        events: window.treeSelectMotionHydration!.events()
      }))).toEqual({
        observers: 0, mutations: 0, frames: 0, timers: 0, animations: [], events: disposed.ledger
      });
    } finally {
      await page.evaluate(() => {
        window.motionHydrationDisposal?.stop();
        const scope = window as Window & { treeSelectMotionFrameClock?: { stop: () => void } };
        scope.treeSelectMotionFrameClock?.stop();
      });
      await identity.dispose();
    }
  });
}
