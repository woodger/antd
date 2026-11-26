import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readReferenceBytes } from './reference-bytes';
import { selectVirtualSamples, selectVirtualActions, type SelectVirtualAction } from './fixtures/select-virtual-cases';
import type { readSelectVirtual } from './select-virtual-metrics';

export type SelectVirtualView = ReturnType<typeof readSelectVirtual>['view'];
type ObservedKey = 'sameRoot' | 'sameAnchor' | 'sameEditor' | 'sameEditorParent' | 'sameControl'
  | 'samePopup' | 'popupPresent' | 'rootIsPublicRef' | 'focusMethod' | 'blurMethod' | 'scrollToMethod'
  | 'sameFocus' | 'sameBlur' | 'sameScrollTo';
type Snapshot = ReturnType<typeof readSelectVirtual> & { observed: Record<ObservedKey, boolean> };
interface SourceCase {
  id: string;
  initial: Snapshot;
  steps: Array<Snapshot & { action: SelectVirtualAction }>;
  beforeUnmount: {
    focusKind: 'root' | 'editor' | null;
    rootFocused: boolean;
    editorFocused: boolean;
    activeTag: string | null
  };
  cleanup: { rootConnected: boolean; anchorConnected: boolean; editorConnected: boolean; popupConnected: boolean;
    callbacks: unknown[][]; offsets: unknown[] };
  counterpart?: { kind: string; primaryId: string; sameActionTrace?: boolean; policy?: string;
    primaryActions: SelectVirtualAction[]; ownerCalls?: unknown[];
    publicProps?: { notFoundContent: string }; nativeContractSha256?: string;
    sameFormalActionTrace?: boolean; sameOwnerFactory?: boolean; samePublicProps?: boolean; gestureExpansion?: unknown[];
    sameOptions?: boolean; publicPropPolicy?: { prop: string; ownKeyPresent: boolean; whileOwnerOpen: string;
      whileOwnerClosed: string; exactExpression: string } };
}
interface SourceReference {
  reference: { version: string; react: string; revision: string; archiveSha256: string;
    umdArchiveByteEqual: boolean; reactBuild: string; viewport: { width: number; height: number };
    errors: unknown[]; diagnostics: Array<{
      current: { id: string; action: string };
      message: string
    }> };
  cases: SourceCase[];
}

export const selectVirtualTagsDiagnostic = {
  current: { id: 'select-tags', action: 'mount' },
  message: 'Warning: Please avoid setting option to disabled in tags mode since user can always type text as tag.'
};
const observedKeys: ObservedKey[] = ['sameRoot', 'sameAnchor', 'sameEditor', 'sameEditorParent', 'sameControl',
  'samePopup', 'popupPresent', 'rootIsPublicRef', 'focusMethod', 'blurMethod', 'scrollToMethod',
  'sameFocus', 'sameBlur', 'sameScrollTo'];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(`Invalid frozen Select virtual reference: ${message}`);
  }
}
function load(
  filename: string,
  sha256: string,
  ids: readonly string[],
  diagnostics: SourceReference['reference']['diagnostics']
) {
  const bytes = readReferenceBytes(filename);
  assert(createHash('sha256').update(bytes).digest('hex') === sha256, `${filename} SHA256`);
  const data = JSON.parse(bytes.toString('utf8')) as SourceReference;
  assert(
    data.reference?.version === '6.6.8' && data.reference.react === '18.3.1',
    `${filename} upstream version`
  );
  assert(
    data.reference.revision === '984592267de88fbf9cdaecc96a56629e721c709d',
    `${filename} upstream revision`
  );
  assert(
    data.reference.archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa',
    `${filename} archive`
  );
  assert(
    data.reference.umdArchiveByteEqual === true && data.reference.reactBuild === 'production',
    `${filename} unmodified UMD`
  );
  assert(
    isDeepStrictEqual(data.reference.viewport, { width: 1200, height: 900 }),
    `${filename} viewport`
  );
  assert(
    isDeepStrictEqual(data.reference.errors, []) && isDeepStrictEqual(
      data.reference.diagnostics,
      diagnostics
    ),
    `${filename} diagnostics`
  );
  assert(isDeepStrictEqual(data.cases.map(entry => entry.id), ids), `${filename} ordered cases`);
  for (const entry of data.cases) {
    const sample = selectVirtualSamples.find(sample => sample.id === entry.id)!;
    assert(
      isDeepStrictEqual(entry.steps.map(step => step.action), selectVirtualActions(sample)),
      `${entry.id} original actions`
    );
    for (const snapshot of [entry.initial, ...entry.steps]) {
      assert(
        snapshot.view?.family === sample.family && snapshot.raw != null,
        `${entry.id} full projection`
      );
      assert(Array.isArray(snapshot.view.events) && Array.isArray(snapshot.view.offsets)
        && Array.isArray(snapshot.raw.renders) && Array.isArray(snapshot.raw.popups), `${entry.id} raw ledgers`);
      assert(isDeepStrictEqual(Object.keys(snapshot.observed).sort(), [...observedKeys].sort())
        && observedKeys.every(key => typeof snapshot.observed[key] === 'boolean'), `${entry.id} original observations`);
    }
    assert(
      isDeepStrictEqual(entry.cleanup.callbacks, entry.steps.at(-1)!.view.events),
      `${entry.id} Source disposal ledger`
    );
  }
  return data;
}

export const selectVirtualReference = load('ant-design-select-virtual-reference.json.gz',
  '52dfac8270e633900801776743a11be8869d8e9ef18bb43ff23526cb1b416392',
  selectVirtualSamples.map(sample => sample.id), [selectVirtualTagsDiagnostic]);
export const selectVirtualNativeReference = load('ant-design-select-virtual-native-reference.json.gz',
  '3bc8b88b919942a97d8339cc5607696126613aab7ef2eef702182265721faff9',
  ['select-ref-closed', 'auto-complete-ref-closed'], []);
export const selectVirtualEmptyNativeReference = load('ant-design-select-virtual-empty-native-reference.json',
  '0ce7ea77d0f138e6a8acbf72ea73a6bec42f5b814a2a7c538c0da191d871e98f',
  ['select-search-shrink', 'select-empty'], []);
export const selectVirtualHoverReference = load('ant-design-select-virtual-hover-reference.json',
  '8c4bfff041e1529bc8bfd44c1ed9202dc86d6a5340084a3fe226a00e2d69a513',
  ['select-selected-open', 'auto-complete-selected-open'], []);
export const selectVirtualQueryNativeReference = load('ant-design-select-virtual-query-native-reference.json.gz',
  'b19ec834c7bfc7f9f1c977f591144ee39787680d8ffeca748e2917d403f185bb', ['select-live-props'], []);

for (const entry of selectVirtualNativeReference.cases) {
  const primary = selectVirtualReference.cases.find(source => source.id === entry.id)!;
  assert(entry.counterpart?.kind === 'actual-public-source-visible-queued-position-owner'
    && entry.counterpart.primaryId === entry.id && entry.counterpart.sameActionTrace === true, `${entry.id} actual owner policy`);
  assert(
    isDeepStrictEqual(entry.counterpart.primaryActions, primary.steps.map(step => step.action)),
    `${entry.id} unchanged public inputs`
  );
  assert(isDeepStrictEqual(entry.counterpart.ownerCalls, [
    { phase: 'queue-while-closed', argument: { top: 500 } },
    { phase: 'apply-after-public-holder-visible', argument: { top: 500 } }
  ]), `${entry.id} actual public queue/apply calls`);
}
for (const entry of selectVirtualEmptyNativeReference.cases) {
  const primary = selectVirtualReference.cases.find(source => source.id === entry.id)!;
  assert(entry.counterpart?.kind === 'actual-public-source-text-empty-fallback'
    && entry.counterpart.primaryId === entry.id && entry.counterpart.sameActionTrace === true,
  `${entry.id} actual Source text fallback`);
  assert(isDeepStrictEqual(entry.counterpart.primaryActions, primary.steps.map(step => step.action))
    && isDeepStrictEqual(entry.counterpart.publicProps, { notFoundContent: 'No data' })
    && entry.counterpart.nativeContractSha256 === '02b59472a5cd28941319dbcc3b208781c3fc553c8654419f87a43d63a45da18a',
  `${entry.id} unchanged trace and proven Native text contract`);
}
for (const entry of selectVirtualHoverReference.cases) {
  const primary = selectVirtualReference.cases.find(source => source.id === entry.id)!;
  assert(entry.counterpart?.kind === 'actual-public-source-prepared-selected-hover'
    && entry.counterpart.primaryId === entry.id && entry.counterpart.sameFormalActionTrace === true
    && entry.counterpart.sameOwnerFactory === true && entry.counterpart.samePublicProps === true,
  `${entry.id} actual Source prepared pointer gesture`);
  assert(isDeepStrictEqual(entry.counterpart.primaryActions, primary.steps.map(step => step.action))
    && isDeepStrictEqual(entry.counterpart.gestureExpansion, [{ action: {
      type: 'hover',
      text: 'Option 062'
    },
      beforeOriginalAction: [{ command: 'Playwright Locator.scrollIntoViewIfNeeded',
        locator: '.ant-select-dropdown:visible:first .ant-select-item-option-content', exactText: 'Option 062' },
      {
        command: 'drainSelectVirtual',
        publicOperations: 'virtualstyles event; two requestAnimationFrame callbacks; two zero-delay tasks'
      }] }]),
  `${entry.id} explicit same-option public scroll/drain/hover expansion`);
}
for (const entry of selectVirtualQueryNativeReference.cases) {
  const primary = selectVirtualReference.cases.find(source => source.id === entry.id)!;
  assert(entry.counterpart?.kind === 'actual-public-source-controlled-query-owner'
    && entry.counterpart.primaryId === entry.id && entry.counterpart.sameActionTrace === true
    && entry.counterpart.sameOptions === true && isDeepStrictEqual(entry.counterpart.primaryActions,
      primary.steps.map(step => step.action)), `${entry.id} actual controlled query Source owner`);
  assert(isDeepStrictEqual(entry.counterpart.publicPropPolicy, {
    prop: 'showSearch.onSearch', ownKeyPresent: true,
    whileOwnerOpen: 'Original public callback records every actual invocation and sets controlled query.',
    whileOwnerClosed: 'undefined; owner keeps controlled showSearch.searchValue unchanged.',
    exactExpression: 'onSearch: open ? onSearch : undefined'
  }), `${entry.id} only explicit public callback owner policy`);
  assert(isDeepStrictEqual(entry.initial, primary.initial)
    && isDeepStrictEqual(entry.steps.slice(0, 14), primary.steps.slice(0, 14)), `${entry.id} unchanged preclose full observations`);
}

/** Whole actual Source owner entries; primary observations remain loaded and immutable. */
export const selectVirtualNativeCases = selectVirtualReference.cases.map(entry =>
  selectVirtualNativeReference.cases.find(counterpart => counterpart.id === entry.id)
    ?? selectVirtualEmptyNativeReference.cases.find(counterpart => counterpart.id === entry.id)
    ?? selectVirtualHoverReference.cases.find(counterpart => counterpart.id === entry.id)
    ?? selectVirtualQueryNativeReference.cases.find(counterpart => counterpart.id === entry.id) ?? entry);

interface BlurBaseline {
  reference: { baseCommit: string; errors: unknown[]; warnings: unknown[];
    sourceBlobs: Array<{ id: string; blob: string; sha256: string }>;
    modules: Array<{ id: string; diskSha256: string; deliveredSha256: string }> };
  cases: Array<{ id: string; before: unknown[][]; synchronous: {
    during: Array<{ connected: boolean; focused: boolean; ledger: unknown[][] }>; after: unknown[][] } }>;
}
const blurBytes = readFileSync(new URL(
  './fixtures/select-virtual-blur-native-baseline.json',
  import.meta.url
));
assert(createHash('sha256').update(blurBytes).digest('hex')
  === 'cad4507fabb6b212358679645e71d0459ae7eadc57055a558e5f20a6613ad873', 'historical connected blur baseline SHA256');
export const selectVirtualBlurNativeBaseline = JSON.parse(blurBytes.toString('utf8')) as BlurBaseline;
assert(selectVirtualBlurNativeBaseline.reference.baseCommit === '75b93bf1d473e73433c4ca920ddbd8b009af4e0f'
  && isDeepStrictEqual(selectVirtualBlurNativeBaseline.reference.errors, [])
  && isDeepStrictEqual(selectVirtualBlurNativeBaseline.reference.warnings, []), 'historical connected blur provenance');
const oldControls = ['8ce7449e134038576859a8f1fee4498349255176ac8b25eac715d4764a534288',
  'f7163a29490a6a0a62f0df1fdb4a9a4deafdba4e48ffa999d0902c85545e0b61'];
assert(isDeepStrictEqual(
  selectVirtualBlurNativeBaseline.reference.sourceBlobs.map(blob => blob.sha256),
  oldControls
),
  'historical delivered Select/AC blobs');
assert(isDeepStrictEqual(selectVirtualBlurNativeBaseline.cases.map(entry => entry.id),
  ['select-focus-ref', 'auto-complete-focus-ref']), 'historical connected blur cases');
for (const entry of selectVirtualBlurNativeBaseline.cases) {
  const after = [['focus'], ['open', true], ['open', false], ['blur']];
  assert(isDeepStrictEqual(entry.before, [['focus'], ['open', true]])
    && isDeepStrictEqual(entry.synchronous.after, after)
    && isDeepStrictEqual(
      entry.synchronous.during,
      [{ connected: true, focused: false, ledger: after }]
    ),
  `${entry.id} historical synchronous connected blur ledger`);
}

interface QueryBaseline {
  reference: BlurBaseline['reference'];
  cases: Array<{ id: string; trace: Array<{ action: { query?: string; open?: boolean }; query: string;
    events: unknown[][]; editor: { value: string; caret: number[]; focused: boolean }; open: boolean }> }>;
}
const queryBytes = readFileSync(new URL(
  './fixtures/select-virtual-query-native-baseline.json',
  import.meta.url
));
assert(createHash('sha256').update(queryBytes).digest('hex')
  === '1c91bc9788bb65152c14011977abfdf178d74cd6e387c5bd35958ee379bf0228', 'historical controlled query baseline SHA256');
export const selectVirtualQueryNativeBaseline = JSON.parse(queryBytes.toString('utf8')) as QueryBaseline;
assert(selectVirtualQueryNativeBaseline.reference.baseCommit === '75b93bf1d473e73433c4ca920ddbd8b009af4e0f'
  && isDeepStrictEqual(selectVirtualQueryNativeBaseline.reference.errors, [])
  && isDeepStrictEqual(selectVirtualQueryNativeBaseline.reference.warnings, [])
  && isDeepStrictEqual(selectVirtualQueryNativeBaseline.reference.sourceBlobs.map(blob => blob.sha256),
    [...oldControls, '2772a1922c74e4ded199681a1e5e074a7bcc0e6a87d75b86fcffdb786e48456e']), 'historical query provenance');
assert(isDeepStrictEqual(selectVirtualQueryNativeBaseline.cases.map(entry => entry.id),
  ['select-controlled-query-09', 'select-controlled-query-Kept query']), 'historical query cases');
for (const entry of selectVirtualQueryNativeBaseline.cases) {
  const initialQuery = entry.id.endsWith('-09') ? '09' : 'Kept query';
  const events = initialQuery === '09' ? [['focus'], ['open', true]] : [['open', true]];
  const frame = (action: { query?: string; open?: boolean }, query: string, open: boolean) => ({
    action, query, events, editor: {
      value: open ? query : '',
      caret: open ? [query.length, query.length] : [0, 0],
      focused: true
    }, open
  });
  assert(isDeepStrictEqual(entry.trace, [frame({ query: initialQuery }, initialQuery, true),
    frame({ open: false }, initialQuery, false), frame({ open: true }, initialQuery, true),
    frame({ open: false }, initialQuery, false), frame({ query: '09' }, '09', false),
    frame({ open: true }, '09', true)]), `${entry.id} complete historical query trace`);
}
const caretBytes = readFileSync(new URL(
  './fixtures/select-virtual-query-caret-native-baseline.json',
  import.meta.url
));
assert(createHash('sha256').update(caretBytes).digest('hex')
  === 'f5fd52af94151ea1feddecc37552ca62ee85830e307faa28c1854b228e13fdec', 'historical caret close/reopen baseline SHA256');
export const selectVirtualQueryCaretNativeBaseline = JSON.parse(caretBytes.toString('utf8')) as QueryBaseline;
assert(selectVirtualQueryCaretNativeBaseline.reference.baseCommit === '75b93bf1d473e73433c4ca920ddbd8b009af4e0f'
  && isDeepStrictEqual(selectVirtualQueryCaretNativeBaseline.reference.errors, [])
  && isDeepStrictEqual(selectVirtualQueryCaretNativeBaseline.reference.warnings, [])
  && isDeepStrictEqual(selectVirtualQueryCaretNativeBaseline.reference.sourceBlobs.map(blob => blob.sha256),
    [...oldControls, '2772a1922c74e4ded199681a1e5e074a7bcc0e6a87d75b86fcffdb786e48456e'])
  && isDeepStrictEqual(selectVirtualQueryCaretNativeBaseline.cases.map(entry => entry.id),
    ['select-controlled-query-Kept query']), 'historical caret provenance');
const caretProof = selectVirtualQueryCaretNativeBaseline.cases[0];
assert(caretProof.trace.length === 6
  && isDeepStrictEqual(
    caretProof.trace[0].editor,
    { value: 'Kept query', caret: [1, 5], focused: true }
  )
  && isDeepStrictEqual(caretProof.trace[1].editor, { value: '', caret: [0, 0], focused: true })
  && isDeepStrictEqual(
    caretProof.trace[2].editor,
    { value: 'Kept query', caret: [10, 10], focused: true }
  )
  && caretProof.trace.every(frame => isDeepStrictEqual(frame.events, [['focus'], ['open', true]])),
'historical selected range, cleared close and end-caret reopen with unchanged ledger');
