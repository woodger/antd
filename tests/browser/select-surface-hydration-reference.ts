import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { readReferenceBytes } from './reference-bytes';
import { selectSurfaceHydrationActions, selectSurfaceHydrationSamples } from './fixtures/select-surface-hydration-cases';
import type { SelectSurfaceStyleHistoryPoint, SelectSurfaceStyleHistorySourceCase,
  SelectSurfaceStyleHistorySSRCase } from './select-surface-style-history-native-reference';
import type { SelectSurfaceStyleHistoryDOM } from './select-surface-style-history-metrics.mjs';
import type { readSelectSurface } from './select-surface-metrics';

export interface SelectSurfaceHydrationIdentity {
  owner: boolean; root: boolean; editor: boolean; command: boolean;
  publicRootConnected: boolean; publicEditorConnected: boolean;
  parsedRootConnected: boolean; parsedEditorConnected: boolean;
}
export interface SelectSurfaceHydrationSourceCase extends SelectSurfaceStyleHistorySourceCase {
  control: 'select' | 'autocomplete';
  producers: boolean;
  server: { renderToString: Omit<SelectSurfaceStyleHistorySSRCase, 'id'>;
    renderToStaticMarkup: Omit<SelectSurfaceStyleHistorySSRCase, 'id'> };
  parsed: { dom: ReturnType<typeof readSelectSurface>; border: SelectSurfaceStyleHistoryDOM;
    rawHtml: string; htmlSha256: string };
  initial: SelectSurfaceStyleHistoryPoint & { identity: SelectSurfaceHydrationIdentity };
  steps: Array<SelectSurfaceStyleHistorySourceCase['steps'][number] & { identity: SelectSurfaceHydrationIdentity }>;
  recoverableErrors: unknown[];
}
interface SourceHeader {
  mode: string;
  version: string;
  react: string;
  revision: string;
  protocolSha256: string;
  inputPins: Record<string, string>;
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
  errors: unknown[];
  diagnostics: unknown[];
}
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(`Invalid original surface hydration evidence: ${message}`);
  }
}
const bytes = readReferenceBytes('ant-design-select-surface-style-history-hydration-reference.json.gz');
guard(
  bytes.length === 7553192 && hash(bytes) === '750ed241a637dbca3d5e20415b23641eba19ab251de22796c19c81a51470fda8',
  'complete original bytes'
);
export const selectSurfaceHydrationReference = JSON.parse(bytes.toString('utf8')) as {
  reference: SourceHeader; cases: SelectSurfaceHydrationSourceCase[];
};
const header = selectSurfaceHydrationReference.reference;
guard(header.mode === 'hydration' && header.version === '6.6.8' && header.react === '18.3.1'
  && header.revision === '984592267de88fbf9cdaecc96a56629e721c709d', 'actual original versions');
guard(
  header.protocolSha256 === '7495433ec5a7ef759f882c953d633260c129f90c864c431d9ef6c43a922d386e',
  'independent pre-Native protocol'
);
guard(header.archives[0].sha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  && header.archives[0].archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  && header.archives.every(archive => archive.byteEqual), 'pinned original archives');
guard(
  isDeepStrictEqual(header.errors, []) && isDeepStrictEqual(header.diagnostics, []),
  'all actual original diagnostics'
);
guard(hash(readFileSync(new URL('./select-surface-hydration-metrics.mjs', import.meta.url)))
  === '23a77b1bb8aad544b0f65ca4470c658588384488e5acbf6b6a8c54d78c95ecca', 'byte-identical parsed/hydrated observer');
for (const [path, sha256] of Object.entries(header.inputPins)) {
  if (!path.startsWith('.upstream/')) guard(
    hash(readFileSync(new URL(`../../${path}`, import.meta.url))) === sha256,
    path
  );
}
guard(isDeepStrictEqual(selectSurfaceHydrationReference.cases.map(entry => ({ id: entry.id, control: entry.control,
  producers: entry.producers })), selectSurfaceHydrationSamples), 'all four owners');
for (const entry of selectSurfaceHydrationReference.cases) {
  guard(
    isDeepStrictEqual(entry.steps.map(step => step.action), selectSurfaceHydrationActions),
    `${entry.id} complete seven-action trace`
  );
  guard(
    isDeepStrictEqual(entry.recoverableErrors, []),
    `${entry.id} genuine hydrateRoot recovery diagnostics`
  );
  guard(
    hash(Buffer.from(entry.parsed.rawHtml)) === entry.parsed.htmlSha256,
    `${entry.id} complete parsed markup`
  );
  guard(
    isDeepStrictEqual(
      entry.cleanup,
      { rootConnected: false, editorConnected: false, popupCount: 0 }
    ),
    `${entry.id} unmount`
  );
  guard(entry.rawEvents.length === entry.events.length, `${entry.id} complete raw callback ledger`);
  for (const server of Object.values(entry.server)) {
    guard(
      hash(Buffer.from(server.rawHtml)) === server.htmlSha256,
      `${entry.id} full original server serialization`
    );
    guard(
      isDeepStrictEqual(server.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 }),
      `${entry.id} DOM-free server resources`
    );
    guard(
      server.state.calls.length === (entry.producers ? 3 : 0),
      `${entry.id} actual original pure producer calls`
    );
    guard(
      isDeepStrictEqual(server.state.events, []) && isDeepStrictEqual(server.state.rawEvents, []),
      `${entry.id} no server gestures`
    );
  }
  for (const point of [entry.initial, ...entry.steps]) {
    guard(
      Object.values(point.identity).every(value => value === true),
      `${entry.id} real original SSR nodes survive`
    );
    guard(point.owner.callCount <= entry.producerCalls.length && point.owner.eventCount <= entry.events.length,
      `${entry.id} exact public observation prefixes`);
  }
}
