import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-align-reference.json' with { type: 'json' };
import nativeFlowReference from './fixtures/ant-design-tree-select-align-native-flow-reference.json' with { type: 'json' };
import nativeEditorReference from './fixtures/tree-select-align-native-editor-reference.json' with { type: 'json' };
import activationReference from './fixtures/ant-design-tree-select-align-activation-reference.json' with { type: 'json' };
import { treeSelectAlignSamples, type TreeSelectAlignAction, type TreeSelectAlignSample } from './fixtures/tree-select-align-cases';
import { treeSelectAlignActivationSamples } from './fixtures/tree-select-align-activation-cases';
import { readTreeSelectAlign } from './tree-select-align-metrics';
import { treeSelectAlignNativeExpected } from './tree-select-align-native';

type Projection = ReturnType<typeof readTreeSelectAlign>;

async function field(page: Page) {
  const marked = page.locator('[data-align-case] [data-align-editor]');
  if (await marked.count()) {
    return marked.first();
  }
  const input = page.locator('[data-align-case] input[role="combobox"],[data-align-case] textarea[role="combobox"]');
  return await input.count() ? input.first() : page.locator('[data-align-root]').first();
}
async function settle(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    await page.locator('[data-align-command]').dispatchEvent('alignshadowstyles');
    const projection = await page.evaluate(readTreeSelectAlign), key = JSON.stringify(projection);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 6) {
      return projection;
    }
    previous = key;
  }
  throw Error('TreeSelect alignment did not settle after 150 frames');
}
async function act(page: Page, action: TreeSelectAlignAction) {
  if (action.type === 'click') {
    await (await field(page)).click();
  }
  else if (action.type === 'focus') {
    await (await field(page)).focus();
  }
  else if (action.type === 'fill') {
    await (await field(page)).fill(action.text);
  }
  else if (action.type === 'caret') {
    await (await field(page)).evaluate((node, range) => {
      if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
        throw Error('Expected editable field');
      }
      node.setSelectionRange(range.start, range.end);
    }, action);
  }
  else if (action.type === 'props' || action.type === 'host') {
    await page.locator('[data-align-command]').evaluate((
      node,
      detail
    ) => {
      node.dispatchEvent(new CustomEvent('alignupdate', { detail }));
    }, action);
  }
  else if (action.type === 'viewport') {
    await page.setViewportSize({
      width: action.width,
      height: action.height
    });
  }
  else if (action.type === 'scroll') {
    await page.locator('[data-align-scroller]').evaluate((
      node,
      position
    ) => {
      node.scrollTop = position.top;
      node.scrollLeft = position.left;
    }, action);
  }
  else if (action.type === 'outside') {
    await page.getByRole(
      'button',
      { name: 'Outside align', exact: true }
    ).click();
  }
  else if (action.type === 'choose') {
    await page.getByText(
      action.value === 'a' ? 'Alpha' : 'Beta',
      { exact: true }
    ).last().click();
  }
  else if (action.type === 'remove') {
    await page.locator('.ant-select-selection-item').filter({ hasText: action.value === 'a' ? 'Alpha' : 'Beta' })
      .locator('.ant-select-selection-item-remove').click();
  }
}
function verify(projection: Projection, expected: Projection, sample: TreeSelectAlignSample) {
  expect(projection.view).toEqual(treeSelectAlignNativeExpected(expected.view, sample.id));
  expect(projection.raw.document.compatMode).toBe(expected.raw.document.compatMode);
  // Existing Native ownership puts provider dir on the default root. Descriptor roots keep their own attrs.
  expect(projection.raw.rootDir).toBe(sample.slot?.startsWith('root-') ? expected.raw.rootDir : expected.view.root.direction);
  expect(projection.raw.editorDir).toBe(expected.raw.editorDir);
  if (expected.raw.popup) {
    expect(projection.raw.popup).not.toBeNull();
    expect(projection.raw.popup?.visible).toBe(expected.raw.popup.visible);
    expect(projection.raw.popup?.placementClasses).toEqual(expected.raw.popup.placementClasses);
    expect(projection.raw.popup?.semanticMarker).toBe(expected.raw.popup.semanticMarker);
    // Native retains a fixed top-layer surface. Source axes/offsetParent remain recorded verbatim in the golden;
    // their physical result, pending-option lifecycle and placement classes are compared above without adaptation.
    expect(projection.raw.popup?.position).toBe('fixed');
    expect(projection.raw.popup?.offsetParent).toBeNull();
    expect(projection.raw.popup?.container).toBe(sample.container ?? 'host');
  }
  else {
    expect(projection.raw.popup).toBeNull();
  }
}

test.use({ viewport: reference.reference.viewport });
for (const rawEntry of [...reference.cases, ...activationReference.cases]) {
  const entry = rawEntry.id === 'multiple-choice-live'
    ? nativeFlowReference.cases.find(item => item.id === rawEntry.id)! : rawEntry;
  test(`TreeSelect matches Source cached alignment, CSS-frame geometry and public props for ${entry.id}`, async ({ page }) => {
    const sample = [...treeSelectAlignSamples, ...treeSelectAlignActivationSamples].find(item => item.id === entry.id)!;
    if (sample.multiple) {
      // Source's original four-pixel editor stays visible in the original evidence. A separate actual Source
      // counterpart sets the published Native805 root heights32/60/32 through public top-level style.height.
      // Root/popup coordinates and all semantics/events come from that independent Source run; only editor.box
      // uses the separately captured Native805 default-flow contract.
      expect(nativeFlowReference.reference.counterpart.nativeBaseline.baseCommit).toBe(nativeEditorReference.reference.baseCommit);
      expect(nativeFlowReference.reference.publishedRootHeights).toEqual(nativeEditorReference.reference.publishedRootHeights);
      expect(nativeFlowReference.reference.errors).toEqual([]);
      expect(nativeFlowReference.reference.warnings).toEqual([]);
      expect(rawEntry.initial.view.editor?.box.width).toBe(4);
      for (const step of rawEntry.steps) expect(step.view.editor?.box.width).toBe(4);
      expect(entry.steps.map(step => step.action)).toEqual(rawEntry.steps.map(step => step.action));
    }
    await page.goto('/?fixture=tree-select-align');
    await page.getByRole('combobox', { name: 'TreeSelect alignment sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-align-case]')).toHaveAttribute('data-align-bound', 'true');
    verify(await settle(page), entry.initial, sample);
    const previous = await page.evaluateHandle(() => {
      const host = document.querySelector('[data-align-case]')!;
      const root = host.querySelector('[data-align-root]') ?? host.querySelector('.ant-select')!;
      const editor = root.querySelector('[data-align-editor],input,textarea');
      return {
        root,
        editor,
        editorParent: editor?.parentNode ?? null,
        popup: null as HTMLElement | null
      };
    });
    const observed = () => previous.evaluate(old => {
      const host = document.querySelector('[data-align-case]')!;
      const root = host.querySelector('[data-align-root]') ?? host.querySelector('.ant-select')!;
      const editor = root.querySelector('[data-align-editor],input,textarea');
      const shadow = document.querySelector('[data-align-shadow]')?.shadowRoot;
      const popup = shadow?.querySelector<HTMLElement>('.ant-tree-select-dropdown') ?? document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
      const samePopup = !old.popup || !popup || old.popup === popup;
      old.popup ??= popup;
      const refs: {
        root?: Element;
        control?: { focus?: unknown; blur?: unknown };
        getterArguments?: Element[]
      } = {};
      host.querySelector('[data-align-command]')!.dispatchEvent(new CustomEvent(
        'alignrefs',
        { detail: refs }
      ));
      return { sameRoot: old.root === root, sameEditor: old.editor === editor,
        sameEditorParent: old.editorParent === (editor?.parentNode ?? null), samePopup,
        rootIsPublicRef: refs.root === root, focusMethod: typeof refs.control?.focus === 'function',
        blurMethod: typeof refs.control?.blur === 'function',
        getterUsesRoot: refs.getterArguments?.length ? refs.getterArguments.every(node => node === root) : null };
    });
    try {
      expect(await observed()).toEqual({ ...entry.initial.observed, sameEditorParent: true });
      for (const step of entry.steps) {
        await act(page, step.action as TreeSelectAlignAction);
        verify(await settle(page), step, sample);
        expect(await observed()).toEqual({ ...step.observed, sameEditorParent: true });
      }
    } finally { await previous.dispose(); }
  });
}
