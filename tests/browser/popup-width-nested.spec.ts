import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popup-width-nested-reference.json' with { type: 'json' };
import {
  popupWidthActions, popupWidthNestedSamples,
  type PopupWidthAction, type PopupWidthNestedFamily, type PopupWidthNestedSample
} from './fixtures/popup-width-cases';
import { actPopupWidth, drainPopupWidth, preparePopupWidth } from './popup-width-driver';
import { readPopupWidth } from './popup-width-metrics';

type Projection = ReturnType<typeof readPopupWidth>;
type View = Projection['view'];
type SourceCase = (typeof reference.cases)[number];
const frozen = '6c00e68fa3ec812e48be78724f1fb4c8f34aefaaa11de9dd4d4b6b458950b4b6';
const families: readonly PopupWidthNestedFamily[] = ['pagination', 'calendar', 'color-picker', 'cascader'];

/** Width ownership is common; natural nested layout and existing native selected-input values stay raw. */
function ownership(view: View) {
  return { family: view.family, active: view.active, receipts: view.receipts,
    model: view.model, query: view.query, events: view.events, viewport: view.viewport, leaks: view.leaks,
    editor: view.editor ? { focused: view.editor.focused, readonly: view.editor.readonly,
      disabled: view.editor.disabled } : null };
}

function withoutReceipts(view: View) {
  return { family: view.family, active: view.active, model: view.model, query: view.query,
    events: view.events, anchor: view.anchor, popup: view.popup, editor: view.editor,
    viewport: view.viewport, leaks: view.leaks };
}

function getterOwners(projection: Projection) {
  const calls = projection.raw.getterCalls as { scope: string; role: string }[];
  return [...new Set(calls.map(call => `${call.scope}/${call.role}`))].sort();
}

function verify(
  projection: Projection,
  source: Projection,
  sample: PopupWidthNestedSample,
  label: string
) {
  expect(projection.raw.root, `${label}/actual nested root`).not.toBeNull();
  expect(projection.view.anchor, `${label}/actual nested anchor`).not.toBeNull();
  expect(ownership(projection.view), `${label}/Source width owner receipts and public state`).toEqual(ownership(source.view));
  expect(Boolean(projection.view.popup), `${label}/Source popup outcome`).toBe(Boolean(source.view.popup));
  expect(getterOwners(projection), `${label}/Source local/user/global container priority`).toEqual(getterOwners(source));
  if (sample.family !== 'color-picker') {
    for (const call of projection.raw.getterCalls as { tag: string; anchor: boolean }[]) {
      expect(call.anchor, `${label}/actual global or user getter receives the alignment anchor`).toBe(true);
      expect(call.tag).toBe(projection.raw.anchor!.tag.toLowerCase());
    }
  }
  if (sample.family === 'cascader') {
    expect(projection.view, `${label}/existing Cascader local width and global nonreader`).toEqual(source.view);
  }
  if (!projection.view.popup || !source.view.popup) {
    return;
  }
  expect(projection.view.popup.placement, `${label}/Source placement outcome`).toEqual(source.view.popup.placement);
  expect(projection.view.popup.stretch, `${label}/Source width versus min-width declaration`).toEqual(source.view.popup.stretch);
  const actualPopup = projection.raw.popups.filter(node => node.visible);
  const sourcePopup = source.raw.popups.filter(node => node.visible);
  expect(actualPopup, `${label}/one visible nested popup`).toHaveLength(1);
  expect(sourcePopup).toHaveLength(1);
  expect(actualPopup[0].css.position, `${label}/Native fixed top-layer surface`).toBe('fixed');
  expect(actualPopup[0].offsetParent).toBeNull();
  expect(actualPopup[0].parent?.kind, `${label}/Source effective container kind`).toBe(sourcePopup[0].parent?.kind);
  if (sample.family === 'pagination' || sample.family === 'calendar') {
    const actualWidth = projection.view.popup.box!.width;
    const actualAnchor = projection.view.anchor!.width;
    const sourceWidth = source.view.popup.box!.width;
    const sourceAnchor = source.view.anchor!.width;
    if (source.view.popup.stretch.width && !source.view.popup.stretch.minWidth) {
      // Both observations prove the stretch relation without substituting Source anchor geometry.
      expect(sourceWidth, `${label}/Source true stretches to its actual anchor`).toBe(sourceAnchor);
      expect(actualWidth, `${label}/Native true stretches to its actual anchor`).toBe(actualAnchor);
    }
    else if (source.view.popup.stretch.width) {
      expect(actualWidth, `${label}/actual Source numeric width`).toBe(sourceWidth);
    }
    else {
      expect(sourceWidth).toBeGreaterThanOrEqual(sourceAnchor);
      expect(actualWidth, `${label}/Native false keeps its actual anchor minimum`).toBeGreaterThanOrEqual(actualAnchor);
      if (sourceWidth > sourceAnchor)
        expect(actualWidth, `${label}/wide natural content grows beyond the actual anchor`).toBeGreaterThan(actualAnchor);
    }
    if (sample.family === 'pagination') {
      expect(projection.raw.itemContents.map(node => node.text))
        .toEqual(source.raw.itemContents.map(node => node.text));
    }
  }
  if (sample.family === 'color-picker') {
    expect(projection.view.popup.box!.width, `${label}/Source format numeric width`).toBe(source.view.popup.box!.width);
    expect(projection.view.popup.box!.height, `${label}/Source compact format height`).toBe(source.view.popup.box!.height);
    expect(projection.raw.rows.map(node => ({ text: node.text, height: node.box!.height,
      minHeight: node.css.minHeight, padding: node.css.padding })), `${label}/Source compact option rows`)
      .toEqual(source.raw.rows.map(node => ({ text: node.text, height: node.box!.height,
        minHeight: node.css.minHeight, padding: node.css.padding })));
    expect(projection.raw.itemContents.map(node => ({ text: node.text, fontSize: node.css.fontSize,
      lineHeight: node.css.lineHeight })), `${label}/Source compact option content font`)
      .toEqual(source.raw.itemContents.map(node => ({ text: node.text, fontSize: node.css.fontSize,
        lineHeight: node.css.lineHeight })));
  }
}

async function settle(page: Page) {
  let previous = '';
  let equal = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainPopupWidth(page);
    const projection = await page.evaluate(readPopupWidth);
    const key = JSON.stringify(projection);
    equal = key === previous ? equal + 1 : 0;
    if (equal >= 3) {
      return projection;
    }
    previous = key;
  }
  throw Error('Native nested popup width projection did not settle');
}

async function capture(
  page: Page,
  sample: PopupWidthNestedSample,
  source: SourceCase,
  captures: { id: string; states: Projection[]; bindings: unknown[] }[]
) {
  await page.setViewportSize(reference.reference.viewport);
  await page.goto('/?fixture=popup-width-nested');
  await page.getByRole('combobox', { name: 'Popup width nested sample', exact: true }).selectOption(sample.id);
  await expect(page.locator('[data-width-case]')).toHaveAttribute('data-width-case', sample.id);
  await expect(page.locator('[data-width-case]')).toHaveAttribute('data-width-bound', 'true');
  await preparePopupWidth(page);
  const states = [await settle(page)];
  const bindings: unknown[] = [];
  captures.push({ id: sample.id, states, bindings });
  const identity = await page.evaluateHandle(() => {
    const refs: { control?: object; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
    const owner = document.querySelector<HTMLElement>('[data-width-case]')!;
    owner.querySelector('[data-width-command]')!
      .dispatchEvent(new CustomEvent('widthrefs', { detail: refs }));
    return { owner, control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
      fields: new Map<string, {
        root?: HTMLElement;
        anchor?: HTMLElement;
        editor?: HTMLElement;
        parent: ParentNode | null
      }>(),
      popup: null as HTMLElement | null };
  });
  const observe = () => identity.evaluate(old => {
    const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLElement;
      control?: object; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
    const owner = document.querySelector<HTMLElement>('[data-width-case]')!;
    owner.querySelector('[data-width-command]')!
      .dispatchEvent(new CustomEvent('widthrefs', { detail: refs }));
    const key = owner.dataset.widthFamily === 'calendar' ? owner.dataset.widthActive ?? 'year'
      : owner.dataset.widthFamily === 'color-picker'
        ? refs.root?.closest('.ant-color-picker-format-select') ? 'format' : 'outer' : 'root';
    const field = old.fields.get(key) ?? { root: refs.root, anchor: refs.anchor,
      editor: refs.editor, parent: refs.editor?.parentNode ?? null };
    old.fields.set(key, field);
    const popup = [...document.querySelectorAll<HTMLElement>('.ant-select-dropdown')].find(node => {
      const css = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return !node.hidden && css.display !== 'none' && css.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    }) ?? null;
    const sameOpenPopup = !old.popup || !popup || old.popup === popup;
    old.popup = popup;
    return { owner: old.owner === owner, control: old.control === refs.control,
      publicRoot: old.publicRoot === refs.publicRoot, publicEditor: old.publicEditor === refs.publicEditor,
      root: field.root === refs.root, anchor: field.anchor === refs.anchor, editor: field.editor === refs.editor,
      parent: field.parent === (refs.editor?.parentNode ?? null), sameOpenPopup };
  });
  try {
    const checkBindings = async () => {
      const actual = await observe();
      bindings.push(actual);
      expect(actual).toEqual({ owner: true, control: true, publicRoot: true, publicEditor: true,
        root: true, anchor: true, editor: true, parent: true, sameOpenPopup: true });
    };
    await checkBindings();
    verify(states[0], source.initial, sample, `${sample.id}/initial`);
    for (const [index, step] of source.steps.entries()) {
      const action = step.action as PopupWidthAction;
      const previous = states.at(-1)!;
      await actPopupWidth(page, action);
      const actual = await settle(page);
      states.push(actual);
      await checkBindings();
      verify(actual, step, sample, `${sample.id}/${index + 1}/${JSON.stringify(action)}`);
      if (action.type === 'width' || action.type === 'anchor') {
        // Native selected-input display/caret is an existing contract, retained raw instead of normalized to React.
        expect(actual.view.editor).toEqual(previous.view.editor);
        if (sample.family === 'color-picker' || sample.family === 'pagination') {
          expect(actual.view.anchor).toEqual(previous.view.anchor);
          expect(actual.view.popup).toEqual(previous.view.popup);
        }
      }
    }
    return states;
  } finally {
    await identity.dispose();
  }
}

test('nested popup width keeps the complete independent Source evidence', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    './fixtures/ant-design-popup-width-nested-reference.json', import.meta.url
  ))).digest('hex')).toBe(frozen);
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings.map(entry => ({ id: entry.current.id, action: entry.current.action,
    message: entry.message }))).toEqual(popupWidthNestedSamples.filter(sample => sample.family === 'pagination')
    .map(sample => ({ id: sample.id, action: 'mount',
      message: 'Warning: You provided a `current` prop to a Pagination component without an `onChange` handler. This will render a read-only component.' })));
  expect(reference.cases.map(entry => entry.id)).toEqual(popupWidthNestedSamples.map(sample => sample.id));
  expect(reference.cases.reduce((sum, entry) => sum + entry.steps.length, 0)).toBe(48);
  for (const entry of reference.cases) {
    expect(entry.steps.map(step => step.action))
      .toEqual(popupWidthActions(popupWidthNestedSamples.find(sample => sample.id === entry.id)!));
  }
  for (const ids of [['pagination-default-local-false', 'pagination-default-over-global-number'],
    ['color-picker-global-true', 'color-picker-global-false'], ['cascader-global-true', 'cascader-global-false']]) {
    const [left, right] = ids.map(id => reference.cases.find(entry => entry.id === id)!);
    expect([left.initial, ...left.steps].map(state => withoutReceipts(state.view)))
      .toEqual([right.initial, ...right.steps].map(state => withoutReceipts(state.view)));
  }
});

for (const family of families) {
  test(`nested ${family} preserves Source width and container ownership`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
      else if (message.type() === 'warning') warnings.push(message.text());
    });
    const captures: { id: string; states: Projection[]; bindings: unknown[] }[] = [];
    try {
      for (const sample of popupWidthNestedSamples.filter(sample => sample.family === family)) {
        await capture(
          page,
          sample,
          reference.cases.find(entry => entry.id === sample.id)!,
          captures
        );
      }
      const pair = family === 'pagination'
        ? ['pagination-default-local-false', 'pagination-default-over-global-number']
        : family === 'color-picker' ? ['color-picker-global-true', 'color-picker-global-false']
          : family === 'cascader' ? ['cascader-global-true', 'cascader-global-false'] : null;
      if (pair) {
        const [left, right] = pair.map(id => captures.find(entry => entry.id === id)!);
        expect(left.states.map(state => withoutReceipts(state.view)))
          .toEqual(right.states.map(state => withoutReceipts(state.view)));
      }
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await testInfo.attach(`popup-width-nested-${family}-actual`, {
        body: JSON.stringify({ scope: 'Source width declarations, numeric widths, stretch relations, compact format popup and container priority. Calendar/Pagination natural layout and Native selected-input values remain independent raw evidence; no full layout parity claim.',
          captures, errors, warnings }, null, 2), contentType: 'application/json'
      });
    }
  });
}
