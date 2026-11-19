import type {
  WeekOwner, WeekAction, WeekSample, WeekAuthoredDateName
} from './date-picker-week-cases.mjs';

export type WeekSourceVariant = 'first' | 'repeat';
export type WeekSourceCaptureKind = 'csr' | 'ssr';
export type WeekSourceSerializer = 'renderToString' | 'renderToStaticMarkup';
export type WeekSourceLocale = 'us' | 'gb';
export interface WeekSourceRawPart {
  file: string; bytes: number; sha256: string;
  gzipFile: string; gzipBytes: number; gzipSHA256: string;
}
export interface WeekSourceReference { rawJSONPart: WeekSourceRawPart; }
export interface WeekSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: { valid: boolean; epoch: number; iso: string; utcOffset: number;
    fields: [number, number, number, number, number, number, number]; locale: string; };
  sameAsAuthored: Record<WeekAuthoredDateName, boolean>;
}
export interface WeekSourceDatePath {
  path: Array<number | string>; value: WeekSourceDate;
}
export interface WeekSourceInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: WeekSourceDatePath[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null; };
}
export interface WeekSourceProducer extends WeekSourceInvocation {
  returned: boolean;
}
export interface WeekSourceProducerLedger {
  cursor: number; next: number; rows: WeekSourceProducer[];
}
export interface WeekSourceProducerChunk extends WeekSourceProducerLedger {
  phase: string; boundaries: Record<string, number>; observationEnd: number;
}
export interface WeekSourceProducerReference extends WeekSourceReference {
  phase: string; cursor: number; next: number;
}
export interface WeekSourceOwner {
  id: WeekOwner; actionIndex: number; alive: boolean; picker: 'week';
  open: boolean; needConfirm?: boolean; limited: boolean; localeName: WeekSourceLocale;
  localized: boolean; weekNumbers?: boolean;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown;
  modelDates: WeekSourceDatePath[]; producerCount: number;
  authoredDates: Record<WeekAuthoredDateName, WeekSourceDate>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: WeekSourceInvocation[]; ownerActions: unknown[]; lifecycle: Array<{ phase: string; }>;
}
export interface WeekSourceSurface {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; html: string; text: string | null;
  box: { x: number; y: number; top: number; right: number; bottom: number;
    left: number; width: number; height: number; };
  css: Record<string, string>; scrollTop: number; scrollLeft: number;
  [key: string]: unknown;
}
export interface WeekSourceInput extends WeekSourceSurface {
  value: string; defaultValue: string; focused: boolean; sameAsInitial: boolean;
  selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
}
export interface WeekSourceCell {
  mode: string; panelIdentity: number; inRange: boolean; surface: WeekSourceSurface;
  rowIdentity: number; weekNumber: boolean;
  title: string | null; selected: boolean; rangeStart: boolean; rangeEnd: boolean; disabled: boolean;
}
export interface WeekSourceRowCell {
  surface: WeekSourceSurface; title: string | null; weekNumber: boolean; disabled: boolean;
}
export interface WeekSourceRow {
  surface: WeekSourceSurface; selected: boolean; hover: boolean;
  rangeStart: boolean; rangeEnd: boolean; rangeHover: boolean; cells: WeekSourceRowCell[];
}
export interface WeekSourceTable {
  surface: WeekSourceSurface;
  headers: Array<{ surface: WeekSourceSurface;
    cells: Array<{ surface: WeekSourceSurface; contents: WeekSourceSurface[] }> }>;
  rows: WeekSourceRow[];
}
export interface WeekSourcePopup {
  surface: WeekSourceSurface; visible: boolean; geometryState: string;
  ancestors: WeekSourceSurface[]; panels: WeekSourceSurface[];
  headers: WeekSourceSurface[]; headerButtons: Array<WeekSourceSurface & { disabled: boolean; }>;
  footers: WeekSourceSurface[];
  footerControls: Array<WeekSourceSurface & { disabled: boolean | null; }>;
  tables: WeekSourceTable[]; dateCells: WeekSourceCell[]; columns: unknown[];
}
export interface WeekSourcePoint {
  owner: WeekSourceOwner;
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null;
  }; };
  ownerDOM: WeekSourceSurface | null; root: WeekSourceSurface | null;
  sameOwnerAsInitial: boolean; sameRootAsInitial: boolean;
  inputs: WeekSourceInput[]; focus: unknown; popups: WeekSourcePopup[]; events: unknown[];
  retained: Array<{ identity: number; connected: boolean; [key: string]: unknown; }>;
  environment: { viewport: { width: number; height: number; }; scrollX: number; scrollY: number;
    devicePixelRatio: number; timezone: string; locale: string; dateNow: number; };
  resources: { timing: unknown[]; timers: null; frames: null; observers: null; note: string; };
}
export interface WeekSourceStep {
  index: number; action: WeekAction; before: WeekSourcePoint;
  afterCall: WeekSourcePoint; actual: WeekSourcePoint;
  actionEvidence: { targetBefore: unknown; afterFocusPointer?: WeekSourcePoint;
    [key: string]: unknown; };
}
export interface WeekSourceClosed { actionIndex: number; after1000: WeekSourcePoint; }
export interface WeekSourceCase {
  id: WeekOwner; sample: WeekSample; initial: WeekSourceReference;
  steps: WeekSourceReference[]; closed: WeekSourceReference[];
  producerParts: WeekSourceProducerReference[]; producerFinalCount: number;
  beforeUnmount: WeekSourceReference; cleanup: WeekSourceReference; late: WeekSourceReference;
  failure: null; interruptedAction: null; observationErrors: unknown[];
  network: {
    requests: unknown[];
    responses: Array<{ url: string; status: number; }>;
    failures: unknown[];
  };
}
interface WeekSourceCaptureHeader {
  status: string; variant: WeekSourceVariant;
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string;
  };
  terminalInputVerification: { unchanged: boolean; sha256: string; }; diagnostics: unknown[];
}
export interface WeekSourceCSRManifest extends WeekSourceCaptureHeader {
  browserVersion: string; counts: Record<string, number>; actualCounts: Record<string, number>;
  cases: WeekSourceCase[]; errors: unknown[]; fatal: null;
}
export interface WeekSourceSSRReference extends WeekSourceReference {
  id: WeekOwner; locale: WeekSourceLocale; method: WeekSourceSerializer;
}
export interface WeekSourceSSRManifest extends WeekSourceCaptureHeader {
  counts: { owners: number; serializations: number; }; cases: WeekSourceSSRReference[]; failures: number;
}
export interface WeekSourceSSR {
  initialLocale: WeekSourceLocale; method: WeekSourceSerializer;
  rawHtml: string; htmlSha256: string;
  state: { owner: WeekSourceOwner; producers: WeekSourceProducerLedger; };
  environment: { timezone: string; }; refs: Record<string, boolean>;
  resources: Record<string, number>; fatal: null; initialClosedOnly: boolean; domFree: boolean;
  [key: string]: unknown;
}
export function readWeekSourceEvidence(name: string): Uint8Array;
export function readWeekSourceManifest(
  kind?: 'csr',
  variant?: WeekSourceVariant
): WeekSourceCSRManifest;
export function readWeekSourceManifest(
  kind: 'ssr',
  variant?: WeekSourceVariant
): WeekSourceSSRManifest;
export function readWeekSourceManifest(
  kind: WeekSourceCaptureKind,
  variant?: WeekSourceVariant
): WeekSourceCSRManifest | WeekSourceSSRManifest;
export function readWeekSourceCase(id: WeekOwner, variant?: WeekSourceVariant): WeekSourceCase;
export function readWeekSourcePart<Value = unknown>(
  reference: WeekSourceReference | WeekSourceRawPart
): Value;
export function readWeekSourceInitial(id: WeekOwner, variant?: WeekSourceVariant): WeekSourcePoint;
export function readWeekSourceStep(
  id: WeekOwner,
  index: number,
  variant?: WeekSourceVariant
): WeekSourceStep;
export function readWeekSourceClosed(
  id: WeekOwner,
  index: number,
  variant?: WeekSourceVariant
): WeekSourceClosed;
export function readWeekSourceCleanup(
  id: WeekOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: WeekSourceVariant
): WeekSourcePoint;
export function readWeekSourceProducerChunks(
  id: WeekOwner,
  variant?: WeekSourceVariant
): WeekSourceProducerReference[];
export function readWeekSourceProducerChunk(
  id: WeekOwner,
  index: number,
  variant?: WeekSourceVariant
): WeekSourceProducerChunk;
export function readWeekSourceSSR(
  id: WeekOwner,
  locale: WeekSourceLocale,
  method: WeekSourceSerializer,
  variant?: WeekSourceVariant
): WeekSourceSSR;
export function verifyWeekSourceSSR(
  value: unknown,
  id: WeekOwner,
  locale: WeekSourceLocale,
  method: WeekSourceSerializer
): void;
export function verifyWeekSourceManifest(
  value: unknown,
  kind?: WeekSourceCaptureKind,
  variant?: WeekSourceVariant
): void;
export function verifyWeekSourcePoint(value: unknown): void;
export function verifyWeekSourceRows(value: unknown): void;
export function verifyWeekSourceProducerChunk(
  value: unknown,
  envelope?: Pick<WeekSourceProducerReference, 'phase' | 'cursor' | 'next'>
): void;
export function verifyWeekSourcePartBinding(
  reference: WeekSourceReference | WeekSourceRawPart,
  kind: WeekSourceCaptureKind,
  variant?: WeekSourceVariant,
  expectedFile?: string
): unknown;
export function verifyWeekSourceStoredBytes(
  reference: WeekSourceReference | WeekSourceRawPart,
  stored: Uint8Array
): Uint8Array;
export function verifyWeekSourceStoredParts(): {
  sourceOnly: true; captures: 4; originalParts: 620; wholeBlobs: number;
};
