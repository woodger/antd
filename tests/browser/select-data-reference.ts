import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { selectDataSamples, selectDataActions, type SelectDataAction } from './fixtures/select-data-cases';
import type { readSelectData } from './select-data-metrics';

export type SelectDataView = ReturnType<typeof readSelectData>['view'];
export type SelectDataSnapshot = ReturnType<typeof readSelectData> & { observed: Record<string, boolean> };
export interface SelectDataSourceCase {
  id: string;
  initial: SelectDataSnapshot;
  steps: Array<SelectDataSnapshot & { action: SelectDataAction }>;
  beforeUnmount: { focusKind: 'root' | 'editor' | null; rootFocused: boolean; editorFocused: boolean; activeTag: string | null };
  cleanup: { rootConnected: boolean; anchorConnected: boolean; editorConnected: boolean; popupConnected: boolean;
    callbacks: unknown[][]; offsets: unknown[] };
  publicPair?: { kind: string; onlyPropChange: string; unchangedOwnerValue: boolean; actions: SelectDataAction[] };
  counterpart?: { kind: string; primaryId: string; sameActionTrace: boolean;
    primaryActions?: SelectDataAction[]; onlyWhen?: string; publicProps: string[]; keyPolicy?: string;
    titlePolicy?: string; producerObservation?: string; matcher?: string; noLedgerFiltering?: boolean };
}
interface SourceReference {
  reference: { version: string; react: string; revision: string; archiveSha256: string; umdSha256: string;
    umdArchiveByteEqual: boolean; reactBuild: string; viewport: { width: number; height: number };
    errors: unknown[]; diagnostics: Array<{ current: { id: string; action: string }; message: string }> };
  cases: SelectDataSourceCase[];
}
export const selectDataSourceDiagnostic = {
  current: { id: 'auto-complete-keys-and-index', action: 'mount' },
  message: 'Warning: `value` of Option should not use number type when `mode` is `tags` or `combobox`.'
};
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(`Invalid frozen Select data reference: ${message}`);
}
function load(filename: string, sha256: string, ids: string[], diagnostics: unknown[]) {
  const stored = readFileSync(new URL(`./fixtures/${filename}`, import.meta.url));
  const bytes = filename.endsWith('.gz') ? gunzipSync(stored) : stored;
  guard(createHash('sha256').update(bytes).digest('hex') === sha256, `${filename} SHA256`);
  // Полный raw57MB читается без вывода TypeScript-типа огромного JSON literal.
  const reference = JSON.parse(bytes.toString('utf8')) as SourceReference;
  guard(reference.reference.version === '6.6.8' && reference.reference.react === '18.3.1', `${filename} versions`);
  guard(reference.reference.revision === '984592267de88fbf9cdaecc96a56629e721c709d', `${filename} revision`);
  guard(reference.reference.archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
    && reference.reference.umdSha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
    && reference.reference.umdArchiveByteEqual && reference.reference.reactBuild === 'production', `${filename} original UMD`);
  guard(isDeepStrictEqual(reference.reference.viewport, { width: 1200, height: 900 }), `${filename} viewport`);
  guard(isDeepStrictEqual(reference.reference.errors, []) && isDeepStrictEqual(reference.reference.diagnostics, diagnostics), `${filename} diagnostics`);
  guard(isDeepStrictEqual(reference.cases.map(entry => entry.id), ids), `${filename} ordered cases`);
  for (const entry of reference.cases) {
    guard(entry.beforeUnmount != null && entry.cleanup != null, `${entry.id} lifecycle`);
    for (const snapshot of [entry.initial, ...entry.steps]) {
      guard(snapshot.view != null && Array.isArray(snapshot.view.events) && snapshot.raw != null
        && Array.isArray(snapshot.raw.producerCalls?.filter) && Array.isArray(snapshot.raw.producerCalls?.sort)
        && Array.isArray(snapshot.raw.producerCalls?.render) && Array.isArray(snapshot.raw.eventArguments), `${entry.id} full raw receipts`);
      guard(snapshot.observed != null && Object.values(snapshot.observed).every(value => typeof value === 'boolean'), `${entry.id} original identities`);
    }
    guard(isDeepStrictEqual(entry.cleanup.callbacks, entry.steps.at(-1)!.view.events), `${entry.id} cleanup ledger`);
  }
  return reference;
}
export const selectDataReference = load('ant-design-select-data-reference.json.gz',
  '16297e548d98b8b239332f9de061b8938833a39e6f9c6fdf29b83f8dec2661cb',
  selectDataSamples.map(sample => sample.id), [selectDataSourceDiagnostic]);
export const selectDataAriaReference = load('ant-design-select-data-aria-reference.json',
  '2f11b06e680da750bcfe675020ddb331c2bcce02cdcda2bd65775e3204b322f8',
  ['select-duplicate-value-unique-key', 'auto-complete-duplicate-value-unique-key'], []);
export const selectDataCacheNativeReference = load('ant-design-select-data-cache-native-reference.json',
  'bb2db7a51a85fcd54281e664077ba568737c2cc3d59c6bfba92f81219a3db870',
  ['select-selected-cache'], []);
export const selectDataLabelNativeReference = load('ant-design-select-data-label-native-reference.json',
  '6302c9c9724aaad0126b18e7cf8049883f86a520154da3b882f0009f7561ec70',
  ['select-filter-child-match'], []);
const labelCounterpart = selectDataLabelNativeReference.cases[0];
const labelPrimary = selectDataReference.cases.find(entry => entry.id === labelCounterpart.id)!;
guard(labelCounterpart.counterpart?.kind === 'actual-public-source-native-label-filter'
  && labelCounterpart.counterpart.primaryId === labelPrimary.id
  && labelCounterpart.counterpart.matcher === 'label trim/NFKD lowercase'
  && labelCounterpart.counterpart.noLedgerFiltering === true
  && isDeepStrictEqual(labelCounterpart.counterpart.publicProps, ['showSearch.filterOption'])
  && isDeepStrictEqual(labelCounterpart.initial.view, labelPrimary.initial.view)
  && isDeepStrictEqual(labelCounterpart.steps.map(step => step.action), labelPrimary.steps.map(step => step.action)),
  'complete actual public Source Native label-filter counterpart');
const cacheCounterpart = selectDataCacheNativeReference.cases[0];
const cachePrimary = selectDataReference.cases.find(entry => entry.id === cacheCounterpart.id)!;
const baselineBytes = readFileSync(new URL('./fixtures/select-data-cache-native-baseline.json', import.meta.url));
guard(createHash('sha256').update(baselineBytes).digest('hex')
  === 'df17c7c639f66cf438161b7b098bc9c0d1724c7b9cc96294d063526b0737bff1',
  'historical Native removed-disabled baseline');
const baseline = JSON.parse(baselineBytes.toString('utf8')) as {
  baseCommit: string; result: { status: string; tests: number }; newDataEnginePresentInBaselineDist: boolean
};
guard(baseline.baseCommit === 'a231218acefa2d71452faeae427a21c4fde57db8'
  && baseline.result.status === 'passed' && baseline.result.tests === 1
  && baseline.newDataEnginePresentInBaselineDist === false, 'actual old Native contract');
guard(cacheCounterpart.counterpart?.kind === 'actual-public-source-removed-disabled-owner'
  && cacheCounterpart.counterpart.primaryId === cachePrimary.id
  && cacheCounterpart.counterpart.sameActionTrace
  && cacheCounterpart.counterpart.onlyWhen === 'dataset cache-removed and own cached raw a.disabled true'
  && isDeepStrictEqual(cacheCounterpart.counterpart.publicProps, ['tagRender', 'onInputKeyDown']),
  'bounded actual Source removed-disabled owner');
guard(isDeepStrictEqual(cacheCounterpart.steps.map(step => step.action), cachePrimary.steps.map(step => step.action))
  && isDeepStrictEqual(cacheCounterpart.counterpart.primaryActions, cachePrimary.steps.map(step => step.action)),
  'complete unchanged cache action trace');
guard(isDeepStrictEqual(cacheCounterpart.initial.view, cachePrimary.initial.view)
  && cacheCounterpart.steps.slice(0, 3).every((step, index) =>
    isDeepStrictEqual(step.view, cachePrimary.steps[index].view)), 'cache owner inactive before removal');
guard(cacheCounterpart.steps[3].view.selected[0]?.disabled === true
  && cacheCounterpart.steps[3].view.selected[0]?.remove === false
  && cacheCounterpart.steps[3].view.selected[0]?.title === 'Alpha'
  && isDeepStrictEqual(cacheCounterpart.steps[4].view.events, cacheCounterpart.steps[3].view.events)
  && isDeepStrictEqual(cacheCounterpart.steps[4].view.model, cacheCounterpart.steps[3].view.model),
  'actual cache owner disabled selection retained without callback filtering');

/** Согласованные Native contracts используют целые actual public Source counterparts. */
export function selectDataNativeCase(entry: SelectDataSourceCase) {
  return entry.id === cacheCounterpart.id ? cacheCounterpart
    : entry.id === labelCounterpart.id ? labelCounterpart : entry;
}
for (const entry of selectDataReference.cases) {
  const sample = selectDataSamples.find(sample => sample.id === entry.id)!;
  guard(isDeepStrictEqual(entry.steps.map(step => step.action), selectDataActions(sample)), `${entry.id} frozen actions`);
}
for (const entry of selectDataAriaReference.cases) {
  guard(entry.publicPair?.kind === 'actual-virtual-sr-versus-nonvirtual-aria'
    && entry.publicPair.unchangedOwnerValue, `${entry.id} actual paired owner`);
  const virtual = entry.steps[2].view;
  const physical = entry.steps[3].view;
  guard(isDeepStrictEqual(virtual.model, physical.model) && virtual.query === physical.query, `${entry.id} unchanged paired model/query`);
  for (const option of virtual.popup!.viewport.aria.flatMap(listbox => listbox.options)) {
    const counterpart = physical.popup!.viewport.aria.flatMap(listbox => listbox.options).find(row => row.id === option.id);
    guard(option.selected === 'false' && counterpart?.selected === 'true', `${entry.id} actual mapped selection contradiction`);
  }
}
