import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popup-overflow-smoke-reference.json' with { type: 'json' };
import nestedLayoutReference from './fixtures/ant-design-popup-overflow-nested-layout-reference.json' with { type: 'json' };
import {
  popupOverflowActions, popupOverflowSmokeSamples,
  type PopupOverflowSmokeFamily, type PopupOverflowSmokeSample
} from './fixtures/popup-overflow-cases';
import {
  popupOverflowNestedLayoutSamples, type PopupOverflowNestedLayoutSample
} from './fixtures/popup-overflow-nested-layout-cases';
import { actPopupOverflow, drainPopupOverflow, preparePopupOverflow } from './popup-overflow-driver';
import { readPopupOverflow } from './popup-overflow-metrics';

type Projection = ReturnType<typeof readPopupOverflow>;
type View = Projection['view'];
const families: readonly PopupOverflowSmokeFamily[] = [
  'pagination', 'calendar', 'color-picker', 'tooltip', 'date-picker', 'mentions', 'cascader-panel'
];
const frozen = 'd5784b43af39a461a7b451da851c19a5b6fe5ea633967b90e0d39a6608e95be9';
const nestedLayoutFrozen = 'b2c531079f5da259e5906aa323077ec924ffbf5261e42bfe4216d2ac721e8fc4';
const nativeSamples = popupOverflowSmokeSamples.map(sample =>
  popupOverflowNestedLayoutSamples.find(counterpart => counterpart.id === sample.id) ?? sample);

function behavior(view: View) {
  return { family: view.family, model: view.model, query: view.query, events: view.events,
    anchor: view.anchor, editor: view.editor, viewport: view.viewport, document: view.document,
    scroller: view.scroller, leaks: view.leaks };
}

function outcomes(view: View) {
  return { open: Boolean(view.popup), placement: view.popup?.placement ?? [] };
}

async function settle(page: Page) {
  let previous = '';
  let equal = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainPopupOverflow(page);
    const projection = await page.evaluate(readPopupOverflow);
    const key = JSON.stringify(projection);
    equal = key === previous ? equal + 1 : 0;
    if (equal >= 3) {
      return projection;
    }
    previous = key;
  }
  throw Error('Native popupOverflow smoke projection did not settle');
}

function sourceCase(sample: PopupOverflowSmokeSample | PopupOverflowNestedLayoutSample) {
  const original = reference.cases.find(entry => entry.id === sample.id)!;
  const entry = 'publicStyle' in sample
    ? nestedLayoutReference.cases.find(entry => entry.id === sample.id)! : original;
  expect(original, sample.id).toBeTruthy();
  expect(entry, sample.id).toBeTruthy();
  expect(entry.steps.map(step => step.action)).toEqual(original.steps.map(step => step.action));
  expect(entry.steps.map(step => step.action)).toEqual(popupOverflowActions(sample));
  return entry;
}

function assertPair(
  viewport: readonly Projection[],
  scroll: readonly Projection[],
  reader: boolean,
  label: string
) {
  expect(scroll.length, label).toBe(viewport.length);
  for (const [index, left] of viewport.entries()) {
    const right = scroll[index];
    expect(left.raw.root, `${label}/${index}/viewport consumer exists`).not.toBeNull();
    expect(right.raw.root, `${label}/${index}/scroll consumer exists`).not.toBeNull();
    expect(left.view.anchor, `${label}/${index}/viewport anchor exists`).not.toBeNull();
    expect(right.view.anchor, `${label}/${index}/scroll anchor exists`).not.toBeNull();
    expect(behavior(right.view), `${label}/${index}/same anchor and public behavior`).toEqual(behavior(left.view));
    if (!reader) expect(right.view.popup, `${label}/${index}/nonreader popup inertness`).toEqual(left.view.popup);
    expect(right.raw.outerColorPopup, `${label}/${index}/containing overlay remains inert`).toEqual(left.raw.outerColorPopup);
  }
  if (reader) expect(viewport.some((entry, index) =>
    JSON.stringify(entry.view.popup) !== JSON.stringify(scroll[index].view.popup)),
  `${label}/nested Select reacts to global region`).toBe(true);
}

test('popupOverflow smoke retains the independent Source pair evidence', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    './fixtures/ant-design-popup-overflow-smoke-reference.json', import.meta.url
  ))).digest('hex')).toBe(frozen);
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toHaveLength(2);
  expect(reference.cases.map(entry => entry.id)).toEqual(popupOverflowSmokeSamples.map(sample => sample.id));
  expect(reference.cases.reduce((count, entry) => count + entry.steps.length, 0)).toBe(40);
  for (const family of families) {
    const [viewport, scroll] = popupOverflowSmokeSamples.filter(sample => sample.family === family);
    const left = sourceCase(viewport);
    const right = sourceCase(scroll);
    assertPair(
      [left.initial, ...left.steps],
      [right.initial, ...right.steps],
      viewport.reader,
      `Source/${family}`
    );
  }
  expect(createHash('sha256').update(readFileSync(new URL(
    './fixtures/ant-design-popup-overflow-nested-layout-reference.json', import.meta.url
  ))).digest('hex')).toBe(nestedLayoutFrozen);
  expect(nestedLayoutReference.reference.errors).toEqual([]);
  expect(nestedLayoutReference.reference.warnings).toEqual(reference.reference.warnings);
  expect(nestedLayoutReference.reference.viewport).toEqual(reference.reference.viewport);
  expect(nestedLayoutReference.cases.map(entry => entry.id))
    .toEqual(popupOverflowNestedLayoutSamples.map(sample => sample.id));
  expect(nestedLayoutReference.cases.reduce((count, entry) => count + entry.steps.length, 0)).toBe(6);
  for (const entry of nestedLayoutReference.cases) {
    expect(entry.counterpart.kind).toBe('public-pagination-intrinsic-layout');
    expect(entry.counterpart.original).toBe('tests/browser/fixtures/ant-design-popup-overflow-smoke-reference.json');
    expect(entry.counterpart.originalSha256).toBe(frozen);
    expect(entry.counterpart.publicProps).toEqual({ style: { width: 'max-content' } });
  }
  const [viewport, scroll] = popupOverflowNestedLayoutSamples.map(sample => {
    expect(sample.publicStyle).toBe('width:max-content');
    return sourceCase(sample);
  });
  assertPair([viewport.initial, ...viewport.steps], [scroll.initial, ...scroll.steps], true,
    'Source/Pagination public intrinsic-width counterpart');
});

for (const family of families) {
  test(`popupOverflow preserves ${family} propagation and inertness`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
      else if (message.type() === 'warning') warnings.push(message.text());
    });
    const captures: {
      id: string;
      sourceReference: string;
      publicStyle: string | null;
      states: Projection[]
    }[] = [];
    try {
      for (const sample of nativeSamples.filter(sample => sample.family === family)) {
        const source = sourceCase(sample);
        const sourceStates = [source.initial, ...source.steps];
        await page.setViewportSize(reference.reference.viewport);
        await page.goto('/?fixture=popup-overflow-smoke');
        await page.getByRole('combobox', { name: 'Popup overflow smoke sample', exact: true }).selectOption(sample.id);
        await expect(page.locator('[data-overflow-case]')).toHaveAttribute(
          'data-overflow-case',
          sample.id
        );
        await expect(page.locator('[data-overflow-case]')).toHaveAttribute(
          'data-overflow-bound',
          'true'
        );
        await preparePopupOverflow(page, sample);
        const states = [await settle(page)];
        const capture = { id: sample.id,
          sourceReference: 'publicStyle' in sample ? 'nested-layout' : 'smoke',
          publicStyle: 'publicStyle' in sample && typeof sample.publicStyle === 'string'
            ? sample.publicStyle : null, states };
        captures.push(capture);
        const identity = await page.evaluateHandle(() => {
          const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLElement } = {};
          document.querySelector('[data-overflow-command]')!
            .dispatchEvent(new CustomEvent('overflowrefs', { detail: refs }));
          return { root: refs.root, anchor: refs.anchor, editor: refs.editor,
            parent: refs.editor?.parentNode ?? null };
        });
        // Записывает состояния после действий и освобождает ссылки на исходные узлы.
        async function readStatesAndVerifyBindings() {
          try {
            for (const action of popupOverflowActions(sample)) {
              await actPopupOverflow(page, action);
              states.push(await settle(page));
              expect(await identity.evaluate(old => {
                const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLElement } = {};
                document.querySelector('[data-overflow-command]')!
                  .dispatchEvent(new CustomEvent('overflowrefs', { detail: refs }));
                return { root: old.root === refs.root, anchor: old.anchor === refs.anchor,
                  editor: old.editor === refs.editor, parent: old.parent === (refs.editor?.parentNode ?? null) };
              }), `${sample.id}/stable DOM bindings`).toEqual({
                root: true,
                anchor: true,
                editor: true,
                parent: true
              });
            }
          } finally {
            await identity.dispose();
          }
        }

        await readStatesAndVerifyBindings();
        for (const [index, state] of states.entries()) {
          expect(state.view.context, `${sample.id}/${index}/provider receipt`).toEqual(sourceStates[index].view.context);
          expect(state.view.leaks, sample.id).toEqual([]);
          expect(Boolean(state.view.popup), `${sample.id}/${index}/public popup outcome`)
            .toBe(Boolean(sourceStates[index].view.popup));
          if (sample.reader) expect(
            outcomes(state.view),
            `${sample.id}/${index}/Source placement outcome`
          )
            .toEqual(outcomes(sourceStates[index].view));
        }
      }
      const [viewport, scroll] = captures;
      const sample = popupOverflowSmokeSamples.find(sample => sample.family === family)!;
      assertPair(viewport.states, scroll.states, sample.reader, `Native/${family}`);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await testInfo.attach(`popup-overflow-smoke-${family}-actual`, {
        body: JSON.stringify({ scope: 'Source-backed propagation/inertness; Pagination uses its whole independent public-style counterpart; no full nested layout parity claim',
          captures, errors, warnings }, null, 2), contentType: 'application/json'
      });
    }
  });
}
