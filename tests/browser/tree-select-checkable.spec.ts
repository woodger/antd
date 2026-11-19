import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-checkable-reference.json' with { type: 'json' };
import diagnostic from './fixtures/ant-design-tree-select-checkable-diagnostic-reference.json' with { type: 'json' };
import native from './fixtures/ant-design-tree-select-checkable-native-reference.json' with { type: 'json' };
import type { TreeSelectCheckableAction } from './fixtures/tree-select-checkable-cases';
import { actTreeSelectCheckable } from './tree-select-checkable-driver';
import { readTreeSelectCheckable } from './tree-select-checkable-metrics';
import { treeSelectCheckableNativeObserved, treeSelectCheckableNativeView } from './tree-select-checkable-native';

type Snapshot = (typeof reference.cases)[number]['initial'] | (typeof reference.cases)[number]['steps'][number];

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const projection = await page.evaluate(readTreeSelectCheckable);
    const key = JSON.stringify(projection);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 2) {
      return projection;
    }
    previous = key;
  }
  throw Error('TreeSelect checkable DOM did not settle');
}

function verify(
  actual: ReturnType<typeof readTreeSelectCheckable>,
  expected: Snapshot,
  id: string,
  phase: 'initial' | 'step',
  label: string
) {
  expect(actual.view, label).toEqual(treeSelectCheckableNativeView(expected.view, id, phase));
  expect(actual.view.ignored).toEqual({ renderCalls: 0, iteratorCalls: 0, thenReads: 0 });
  for (const slot of ['classNames', 'styles'] as const) {
    const original = expected.raw.semantic[slot];
    const snippet = actual.view.descriptor === 'element-empty' || actual.view.descriptor === 'element-rich';
    expect(actual.raw.semantic[slot]).toEqual({
      type: snippet ? 'function' : original.type, scalar: original.scalar,
      arrayLength: original.arrayLength, sameOriginal: true, nativeSnippet: snippet
    });
  }
}

test.use({ viewport: reference.reference.viewport });
test('pins independent Source content, diagnostics and public focus-owner evidence', () => {
  for (const [file, sha256] of [
    ['ant-design-tree-select-checkable-reference.json', 'dce396087d3bf67fd35e33470eef6f856e810557ad8cc8d003588a3a3b7c542a'],
    ['ant-design-tree-select-checkable-diagnostic-reference.json', 'e89a80123c4fa24d8760ca76a48181ff478d638c0986f9cc385c3545f3e0dc09'],
    ['ant-design-tree-select-checkable-native-reference.json', 'a88b6a68569cc20aebc9d3626892ff64521fb1ce62c3060ced56cba32e847b72']
  ]) {
    expect(createHash('sha256').update(readFileSync(new URL('./fixtures/' + file, import.meta.url)))
      .digest('hex')).toBe(sha256);
  }
  expect(reference.cases).toHaveLength(37);
  expect(reference.cases.reduce((sum, entry) => sum + entry.steps.length, 0)).toBe(194);
  expect(diagnostic.cases).toHaveLength(1);
  expect(diagnostic.cases[0].steps).toHaveLength(4);
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toHaveLength(4);
  expect(diagnostic.reference.errors).toEqual([]);
  expect(diagnostic.reference.warnings.map(warning => warning.message)).toEqual([
    'Warning: [antd: TreeSelect] `multiple` will always be `true` when `treeCheckable` is true'
  ]);
  expect(native.cases.map(entry => entry.id)).toEqual(['live-values', 'live-reference-reuse']);
  expect(native.reference.errors).toEqual([]);
});

for (const raw of [...reference.cases, ...diagnostic.cases]) {
  const entry = native.cases.find(entry => entry.id === raw.id) ?? raw;
  test(`TreeSelect preserves original ignored checkable content for ${entry.id}`, async ({ page }) => {
    expect(entry.steps.map(step => step.action)).toEqual(raw.steps.map(step => step.action));
    await page.goto('/?fixture=tree-select-checkable');
    await page.getByRole('combobox', { name: 'TreeSelect checkable sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-checkable-case]')).toHaveAttribute(
      'data-checkable-bound',
      'true'
    );
    verify(await settle(page), entry.initial, entry.id, 'initial', entry.id + '/initial');
    const identity = await page.evaluateHandle(() => {
      const refs: {
        root?: HTMLElement;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown }
      } = {};
      document.querySelector('[data-checkable-command]')!
        .dispatchEvent(new CustomEvent('checkablerefs', { detail: refs }));
      const root = refs.root!;
      const editor = root.querySelector('[data-checkable-editor],input[role="combobox"]');
      return { root, editor, parent: editor?.parentNode ?? null, popup: null as Element | null,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const observe = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; ignored?: unknown;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown } } = {};
      document.querySelector('[data-checkable-command]')!
        .dispatchEvent(new CustomEvent('checkablerefs', { detail: refs }));
      const root = refs.root!;
      const editor = root.querySelector('[data-checkable-editor],input[role="combobox"]');
      const popup = document.querySelector('.checkable-audit-popup');
      const samePopup = !old.popup || !popup || old.popup === popup;
      old.popup ??= popup;
      return { sameRoot: old.root === root, sameEditor: old.editor === editor,
        sameEditorParent: old.parent === (editor?.parentNode ?? null), samePopup,
        rootIsPublicRef: refs.root === document.querySelector('[data-checkable-root],.checkable-audit-root'),
        focusMethod: typeof refs.control?.focus === 'function', blurMethod: typeof refs.control?.blur === 'function',
        scrollToMethod: typeof refs.control?.scrollTo === 'function', sameFocus: old.focus === refs.control?.focus,
        sameBlur: old.blur === refs.control?.blur, sameScrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    try {
      expect(await observe()).toEqual(treeSelectCheckableNativeObserved(entry.initial.observed));
      for (const [index, step] of entry.steps.entries()) {
        await actTreeSelectCheckable(page, step.action as TreeSelectCheckableAction);
        verify(
          await settle(page),
          step,
          entry.id,
          'step',
          `${entry.id}/${index + 1}/${JSON.stringify(step.action)}`
        );
        expect(await observe()).toEqual(treeSelectCheckableNativeObserved(step.observed));
        const counters = await page.locator('[data-checkable-command]').evaluate(node => {
          const refs: { ignored?: unknown } = {};
          node.dispatchEvent(new CustomEvent('checkablerefs', { detail: refs }));
          return refs.ignored;
        });
        expect(counters).toEqual({ renderCalls: 0, iteratorCalls: 0, thenReads: 0 });
      }
    } finally {
      await identity.dispose();
    }
  });
}
