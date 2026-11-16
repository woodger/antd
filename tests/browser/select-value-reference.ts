import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { selectValueActions, selectValueSamples } from './fixtures/select-value-cases';
import type { readSelectValue } from './select-value-metrics';
import { selectValueLiveActions, selectValueLiveSamples, type SelectValueLiveAction } from './fixtures/select-value-live-cases';

export type SelectValueView = ReturnType<typeof readSelectValue>['view'];
export type SelectValueSnapshot = ReturnType<typeof readSelectValue> & {
  observed: Record<string, boolean>;
};
export interface SelectValueSourceCase {
  id: string;
  initial: SelectValueSnapshot;
  steps: Array<SelectValueSnapshot & { action: SelectValueLiveAction }>;
  beforeUnmount: {
    focusKind: 'root' | 'editor' | null;
    rootFocused: boolean;
    editorFocused: boolean;
    activeTag: string | null;
  };
  cleanup: {
    rootConnected: boolean;
    editorConnected: boolean;
    popupConnected: boolean;
    callbacks: unknown[][];
    offsets: unknown[];
  };
}

interface SourceReference {
  reference: {
    version: string;
    react: string;
    revision: string;
    archiveSha256: string;
    umdSha256: string;
    umdArchiveByteEqual: boolean;
    reactBuild: string;
    viewport: { width: number; height: number };
    errors: unknown[];
    diagnostics: Array<{ current: { id: string; action: string }; message: string }>;
  };
  cases: SelectValueSourceCase[];
}
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(`Invalid frozen selected-value Source: ${message}`);
}

const filename = 'ant-design-select-value-reference.json.gz';
const stored = readFileSync(new URL(`./fixtures/${filename}`, import.meta.url));
const bytes = gunzipSync(stored);
guard(createHash('sha256').update(stored).digest('hex')
  === '340d3d8d3f4b20943238bc25cfc19fdd054505561ed2528110514a50274b8347', 'compressed SHA256');
guard(createHash('sha256').update(bytes).digest('hex')
  === '76b81a64235d9863054a54bcc6a88253771d3377d16fdcf18e74f24e209e2702', 'original bytes SHA256');
export const selectValueReference = JSON.parse(bytes.toString('utf8')) as SourceReference;
const reference = selectValueReference.reference;
guard(reference.version === '6.6.8' && reference.react === '18.3.1', 'versions');
guard(reference.revision === '984592267de88fbf9cdaecc96a56629e721c709d', 'revision');
guard(reference.archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  && reference.umdSha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  && reference.umdArchiveByteEqual && reference.reactBuild === 'production', 'original archive renderer');
guard(isDeepStrictEqual(reference.viewport, { width: 1200, height: 900 }), 'viewport');
guard(isDeepStrictEqual(reference.errors, []), 'errors');
guard(reference.diagnostics.length === 18 && reference.diagnostics.every(entry =>
  entry.message === 'Warning: Please avoid setting option to disabled in tags mode since user can always type text as tag.'
  || entry.message === 'Warning: `label` of `value` is not same as `label` in Select options.'), 'original diagnostics');
guard(isDeepStrictEqual(selectValueReference.cases.map(entry => entry.id), selectValueSamples.map(sample => sample.id)), 'ordered cases');
for (const entry of selectValueReference.cases) {
  const sample = selectValueSamples.find(sample => sample.id === entry.id)!;
  guard(isDeepStrictEqual(entry.steps.map(step => step.action), selectValueActions(sample)), `${entry.id} complete action trace`);
  guard(isDeepStrictEqual(entry.cleanup.callbacks, entry.steps.at(-1)!.view.events), `${entry.id} cleanup ledger`);
  for (const snapshot of [entry.initial, ...entry.steps]) {
    guard(Array.isArray(snapshot.view.events) && Array.isArray(snapshot.view.producers)
      && Array.isArray(snapshot.raw.producerCalls) && Array.isArray(snapshot.raw.eventArguments), `${entry.id} raw ledgers`);
  }
}

function additional(filename: string, sha256: string) {
  const bytes = readFileSync(new URL(`./fixtures/${filename}`, import.meta.url));
  guard(createHash('sha256').update(bytes).digest('hex') === sha256, `${filename} SHA256`);
  const reference = JSON.parse(bytes.toString('utf8')) as SourceReference;
  guard(reference.reference.revision === selectValueReference.reference.revision
    && reference.reference.umdSha256 === selectValueReference.reference.umdSha256
    && reference.reference.archiveSha256 === selectValueReference.reference.archiveSha256
    && reference.reference.umdArchiveByteEqual && reference.reference.reactBuild === 'production', `${filename} original renderer`);
  guard(isDeepStrictEqual(reference.reference.viewport, selectValueReference.reference.viewport)
    && isDeepStrictEqual(reference.reference.errors, []) && isDeepStrictEqual(reference.reference.diagnostics, []), `${filename} diagnostics/viewport`);
  return reference;
}

export const selectValueLiveReference = additional('ant-design-select-value-live-reference.json',
  'ab2c4f600296233201ccc712ece548319cde73b548eb99532f4a86fdf4a3b99a');
guard(isDeepStrictEqual(selectValueLiveReference.cases.map(entry => entry.id), selectValueLiveSamples.map(sample => sample.id)), 'ordered live cases');
for (const [index, entry] of selectValueLiveReference.cases.entries()) {
  guard(isDeepStrictEqual(entry.steps.map(step => step.action), selectValueLiveActions(selectValueLiveSamples[index])), `${entry.id} whole live trace`);
}
const cached = additional('ant-design-select-value-cache-native-reference.json',
  'a07683c962316e2c574052a0859da78c4ed47798fe355c9008257e0ec255301e');
guard(cached.cases.length === 1 && cached.cases[0].id === 'select-value-cache-disabled', 'bounded disabled cache owner');
guard(isDeepStrictEqual(cached.cases[0].steps.map(step => step.action), selectValueActions(
  selectValueSamples.find(sample => sample.id === cached.cases[0].id)!)), 'bounded owner unchanged actions');
export function selectValueNativeCase(primary: SelectValueSourceCase) {
  return primary.id === cached.cases[0].id ? cached.cases[0] : primary;
}
