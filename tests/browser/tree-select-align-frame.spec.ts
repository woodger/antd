import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-align-frame-reference.json' with { type: 'json' };
import {
  treeSelectAlignFrameSamples,
  type TreeSelectAlignFrameAction
} from './fixtures/tree-select-align-frame-cases';
import { readTreeSelectAlignFrame } from './tree-select-align-frame-metrics';

type Projection = ReturnType<typeof readTreeSelectAlignFrame>;
type SourceProjection = (typeof reference.cases)[number]['initial'];

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    const projection = await page.evaluate(readTreeSelectAlignFrame);
    const key = JSON.stringify(projection);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 6) return projection;
    previous = key;
  }
  throw Error('TreeSelect alignment frame did not settle after 150 frames');
}

async function act(page: Page, action: TreeSelectAlignFrameAction) {
  await page.locator('[data-align-frame-command]').evaluate((node, detail) => {
    node.dispatchEvent(new CustomEvent('alignframeupdate', { detail }));
  }, action);
}

function verify(projection: Projection, expected: SourceProjection) {
  expect(projection.view).toEqual(expected.view);
  expect(projection.raw.hostTransform).toBe(expected.raw.hostTransform);
  // Native keeps its fixed top-layer popup in the existing inline host.
  // The physical Source result is compared without adapting coordinates or placement classes.
  expect(projection.raw.popupPosition).toBe('fixed');
  expect(projection.raw.offsetParent).toBeNull();
  expect(projection.raw.container).toBe('host');
}

test.use({ viewport: reference.reference.viewport });
for (const entry of reference.cases) {
  test(`TreeSelect preserves cached alignment through ${entry.id}`, async ({ page }) => {
    expect(reference.reference.errors).toEqual([]);
    expect(reference.reference.warnings).toEqual([]);
    expect(treeSelectAlignFrameSamples.some(sample => sample.id === entry.id)).toBe(true);
    if (entry.id === 'host-rotate-invariant') {
      for (const step of entry.steps) {
        expect(step.view.host).toEqual(entry.initial.view.host);
        expect(step.raw.axes).toEqual(entry.initial.raw.axes);
      }
    }
    await page.goto('/?fixture=tree-select-align-frame');
    await page.getByRole('combobox', { name: 'TreeSelect frame sample', exact: true })
      .selectOption(entry.id);
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-align-frame-case]'))
      .toHaveAttribute('data-align-frame-bound', 'true');
    verify(await settle(page), entry.initial);
    const identity = await page.evaluateHandle(() => {
      const host = document.querySelector('[data-align-frame-case]')!;
      const root = host.querySelector('[data-align-frame-root]') ?? host.querySelector('.ant-select')!;
      const refs: { root?: Element; control?: {
        focus?: unknown; blur?: unknown; scrollTo?: unknown;
      } } = {};
      host.querySelector('[data-align-frame-command]')!
        .dispatchEvent(new CustomEvent('alignframerefs', { detail: refs }));
      return {
        root,
        popup: document.querySelector('.ant-tree-select-dropdown'),
        focus: refs.control?.focus,
        blur: refs.control?.blur,
        scrollTo: refs.control?.scrollTo
      };
    });
    const observed = () => identity.evaluate(old => {
      const host = document.querySelector('[data-align-frame-case]')!;
      const root = host.querySelector('[data-align-frame-root]') ?? host.querySelector('.ant-select')!;
      const refs: { root?: Element; control?: {
        focus?: unknown; blur?: unknown; scrollTo?: unknown;
      } } = {};
      host.querySelector('[data-align-frame-command]')!
        .dispatchEvent(new CustomEvent('alignframerefs', { detail: refs }));
      return {
        sameRoot: old.root === root,
        samePopup: old.popup === document.querySelector('.ant-tree-select-dropdown'),
        rootIsPublicRef: refs.root === root,
        focusMethod: typeof refs.control?.focus === 'function',
        blurMethod: typeof refs.control?.blur === 'function',
        scrollToMethod: typeof refs.control?.scrollTo === 'function',
        sameFocus: old.focus === refs.control?.focus,
        sameBlur: old.blur === refs.control?.blur,
        sameScrollTo: old.scrollTo === refs.control?.scrollTo,
        oldRootConnected: old.root.isConnected
      };
    });
    // React recreates these three imperative methods on the recorded public updates.
    // Native retains its established stable-method contract; all DOM/ref observations stay raw.
    const nativeObserved = (source: typeof entry.initial.observed) => ({
      ...source, sameFocus: true, sameBlur: true, sameScrollTo: true
    });
    try {
      expect(await observed()).toEqual(nativeObserved(entry.initial.observed));
      for (const step of entry.steps) {
        await act(page, step.action as TreeSelectAlignFrameAction);
        verify(await settle(page), step);
        expect(await observed()).toEqual(nativeObserved(step.observed));
      }
    } finally {
      await identity.dispose();
    }
  });
}
