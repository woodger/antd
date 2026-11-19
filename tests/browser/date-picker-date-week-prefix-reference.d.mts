import type {
  DateWeekPrefixOwner, DateWeekPrefixAction, DateWeekPrefixSample, DateWeekPrefixAuthoredDateName
} from './date-picker-date-week-prefix-cases.mjs';

export type DateWeekPrefixSourceVariant = 'first' | 'repeat';
export type DateWeekPrefixSourceCaptureKind = 'csr' | 'ssr';
export type DateWeekPrefixSourceSerializer = 'renderToString' | 'renderToStaticMarkup';
export type DateWeekPrefixSourceLocale = 'us' | 'gb';
export type DateWeekPrefixSourceSSRLocale = 'us';
export interface DateWeekPrefixSourceRawPart {
  file: string; bytes: number; sha256: string;
  gzipFile: string; gzipBytes: number; gzipSHA256: string;
}
export interface DateWeekPrefixSourceReference { rawJSONPart: DateWeekPrefixSourceRawPart; }
export interface DateWeekPrefixSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: { valid: boolean; epoch: number; iso: string; utcOffset: number;
    fields: [number, number, number, number, number, number, number]; locale: string; };
  sameAsAuthored: Record<DateWeekPrefixAuthoredDateName, boolean>;
}
export interface DateWeekPrefixSourceDatePath {
  path: Array<number | string>; value: DateWeekPrefixSourceDate;
}
export interface DateWeekPrefixSourceInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: DateWeekPrefixSourceDatePath[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null; };
}
export interface DateWeekPrefixSourceProducer extends DateWeekPrefixSourceInvocation {
  returned: boolean;
}
export interface DateWeekPrefixSourceProducerLedger {
  cursor: number; next: number; rows: DateWeekPrefixSourceProducer[];
}
export interface DateWeekPrefixSourceProducerChunk extends DateWeekPrefixSourceProducerLedger {
  phase: string; boundaries: Record<string, number>; observationEnd: number;
}
export interface DateWeekPrefixSourceProducerReference extends DateWeekPrefixSourceReference {
  phase: string; cursor: number; next: number;
}
export interface DateWeekPrefixSourceOwner {
  id: DateWeekPrefixOwner; actionIndex: number; alive: boolean; picker: 'date';
  open: boolean; localeName: DateWeekPrefixSourceLocale; localized: boolean; weekNumbers: boolean;
  model: unknown; rawModel: unknown;
  modelDates: DateWeekPrefixSourceDatePath[]; producerCount: number;
  authoredDates: Record<DateWeekPrefixAuthoredDateName, DateWeekPrefixSourceDate>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: DateWeekPrefixSourceInvocation[]; ownerActions: unknown[]; lifecycle: Array<{ phase: string; }>;
}
export interface DateWeekPrefixSourceSurface {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; html: string; text: string | null;
  box: { x: number; y: number; top: number; right: number; bottom: number;
    left: number; width: number; height: number; };
  css: Record<string, string>; scrollTop: number; scrollLeft: number;
  [key: string]: unknown;
}
export interface DateWeekPrefixSourceInput extends DateWeekPrefixSourceSurface {
  value: string; defaultValue: string; focused: boolean; sameAsInitial: boolean;
  selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
}
export interface DateWeekPrefixSourceCell {
  mode: string; panelIdentity: number; inRange: boolean; surface: DateWeekPrefixSourceSurface;
  rowIdentity: number; weekNumber: boolean;
  title: string | null; selected: boolean; rangeStart: boolean; rangeEnd: boolean; disabled: boolean;
}
export interface DateWeekPrefixSourceRowCell {
  surface: DateWeekPrefixSourceSurface; title: string | null; weekNumber: boolean; disabled: boolean;
}
export interface DateWeekPrefixSourceRow {
  surface: DateWeekPrefixSourceSurface; selected: boolean; hover: boolean;
  rangeStart: boolean; rangeEnd: boolean; rangeHover: boolean; cells: DateWeekPrefixSourceRowCell[];
}
export interface DateWeekPrefixSourceTable {
  surface: DateWeekPrefixSourceSurface;
  headers: Array<{ surface: DateWeekPrefixSourceSurface;
    cells: Array<{ surface: DateWeekPrefixSourceSurface; contents: DateWeekPrefixSourceSurface[] }> }>;
  rows: DateWeekPrefixSourceRow[];
}
export interface DateWeekPrefixSourcePopup {
  surface: DateWeekPrefixSourceSurface; visible: boolean; geometryState: string;
  ancestors: DateWeekPrefixSourceSurface[]; panels: DateWeekPrefixSourceSurface[];
  headers: DateWeekPrefixSourceSurface[]; headerButtons: Array<DateWeekPrefixSourceSurface & { disabled: boolean; }>;
  footers: DateWeekPrefixSourceSurface[];
  footerControls: Array<DateWeekPrefixSourceSurface & { disabled: boolean | null; }>;
  tables: DateWeekPrefixSourceTable[]; dateCells: DateWeekPrefixSourceCell[]; columns: unknown[];
}
export interface DateWeekPrefixSourcePoint {
  owner: DateWeekPrefixSourceOwner;
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null;
  }; };
  ownerDOM: DateWeekPrefixSourceSurface | null; root: DateWeekPrefixSourceSurface | null;
  sameOwnerAsInitial: boolean; sameRootAsInitial: boolean;
  inputs: DateWeekPrefixSourceInput[]; focus: unknown; popups: DateWeekPrefixSourcePopup[]; events: unknown[];
  retained: Array<{ identity: number; connected: boolean; [key: string]: unknown; }>;
  environment: { viewport: { width: number; height: number; }; scrollX: number; scrollY: number;
    devicePixelRatio: number; timezone: string; locale: string; dateNow: number; };
  resources: { timing: unknown[]; timers: null; frames: null; observers: null; note: string; };
}
export interface DateWeekPrefixSourceStep {
  index: number; action: DateWeekPrefixAction; before: DateWeekPrefixSourcePoint;
  afterCall: DateWeekPrefixSourcePoint; actual: DateWeekPrefixSourcePoint;
  actionEvidence: { targetBefore: unknown; afterFocusPointer?: DateWeekPrefixSourcePoint;
    [key: string]: unknown; };
}
export interface DateWeekPrefixSourceClosed { actionIndex: number; after1000: DateWeekPrefixSourcePoint; }
export interface DateWeekPrefixSourceCase {
  id: DateWeekPrefixOwner; sample: DateWeekPrefixSample; initial: DateWeekPrefixSourceReference;
  steps: DateWeekPrefixSourceReference[]; closed: DateWeekPrefixSourceReference[];
  producerParts: DateWeekPrefixSourceProducerReference[]; producerFinalCount: number;
  beforeUnmount: DateWeekPrefixSourceReference; cleanup: DateWeekPrefixSourceReference; late: DateWeekPrefixSourceReference;
  failure: null; interruptedAction: null; observationErrors: unknown[];
  network: {
    requests: unknown[];
    responses: Array<{ url: string; status: number; }>;
    failures: unknown[];
  };
}
interface DateWeekPrefixSourceCaptureHeader {
  status: string; variant: DateWeekPrefixSourceVariant;
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string;
  };
  terminalInputVerification: { unchanged: boolean; sha256: string; }; diagnostics: unknown[];
}
export interface DateWeekPrefixSourceCSRManifest extends DateWeekPrefixSourceCaptureHeader {
  browserVersion: string; counts: Record<string, number>; actualCounts: Record<string, number>;
  cases: DateWeekPrefixSourceCase[]; errors: unknown[]; fatal: null;
}
export interface DateWeekPrefixSourceSSRReference extends DateWeekPrefixSourceReference {
  id: DateWeekPrefixOwner; locale: DateWeekPrefixSourceSSRLocale; method: DateWeekPrefixSourceSerializer;
}
export interface DateWeekPrefixSourceSSRManifest extends DateWeekPrefixSourceCaptureHeader {
  counts: { owners: number; serializations: number; }; cases: DateWeekPrefixSourceSSRReference[]; failures: number;
}
export interface DateWeekPrefixSourceSSR {
  initialLocale: DateWeekPrefixSourceSSRLocale; method: DateWeekPrefixSourceSerializer;
  rawHtml: string; htmlSha256: string;
  state: { owner: DateWeekPrefixSourceOwner; producers: DateWeekPrefixSourceProducerLedger; };
  environment: { timezone: string; }; refs: Record<string, boolean>;
  resources: Record<string, number>; fatal: null; initialClosedOnly: boolean; domFree: boolean;
  [key: string]: unknown;
}
export function readDateWeekPrefixSourceEvidence(name: string): Uint8Array;
export function readDateWeekPrefixSourceManifest(
  kind?: 'csr',
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceCSRManifest;
export function readDateWeekPrefixSourceManifest(
  kind: 'ssr',
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceSSRManifest;
export function readDateWeekPrefixSourceManifest(
  kind: DateWeekPrefixSourceCaptureKind,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceCSRManifest | DateWeekPrefixSourceSSRManifest;
export function readDateWeekPrefixSourceCase(
  id: DateWeekPrefixOwner,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceCase;
export function readDateWeekPrefixSourcePart<Value = unknown>(
  reference: DateWeekPrefixSourceReference | DateWeekPrefixSourceRawPart
): Value;
export function readDateWeekPrefixSourceInitial(
  id: DateWeekPrefixOwner,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourcePoint;
export function readDateWeekPrefixSourceStep(
  id: DateWeekPrefixOwner,
  index: number,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceStep;
export function readDateWeekPrefixSourceClosed(
  id: DateWeekPrefixOwner,
  index: number,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceClosed;
export function readDateWeekPrefixSourceCleanup(
  id: DateWeekPrefixOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourcePoint;
export function readDateWeekPrefixSourceProducerChunks(
  id: DateWeekPrefixOwner,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceProducerReference[];
export function readDateWeekPrefixSourceProducerChunk(
  id: DateWeekPrefixOwner,
  index: number,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceProducerChunk;
export function readDateWeekPrefixSourceSSR(
  id: DateWeekPrefixOwner,
  locale: DateWeekPrefixSourceSSRLocale,
  method: DateWeekPrefixSourceSerializer,
  variant?: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceSSR;
export function verifyDateWeekPrefixSourceSSR(
  value: unknown,
  id: DateWeekPrefixOwner,
  locale: DateWeekPrefixSourceSSRLocale,
  method: DateWeekPrefixSourceSerializer
): void;
export function verifyDateWeekPrefixSourceManifest(
  value: unknown,
  kind?: DateWeekPrefixSourceCaptureKind,
  variant?: DateWeekPrefixSourceVariant
): void;
export function verifyDateWeekPrefixSourcePoint(value: unknown): void;
export function verifyDateWeekPrefixSourceRows(value: unknown): void;
export function verifyDateWeekPrefixSourceProducerChunk(
  value: unknown,
  envelope?: Pick<DateWeekPrefixSourceProducerReference, 'phase' | 'cursor' | 'next'>
): void;
export function verifyDateWeekPrefixSourcePartBinding(
  reference: DateWeekPrefixSourceReference | DateWeekPrefixSourceRawPart,
  kind: DateWeekPrefixSourceCaptureKind,
  variant?: DateWeekPrefixSourceVariant,
  expectedFile?: string
): unknown;
export function verifyDateWeekPrefixSourceStoredBytes(
  reference: DateWeekPrefixSourceReference | DateWeekPrefixSourceRawPart,
  stored: Uint8Array
): Uint8Array;
export function verifyDateWeekPrefixSourceStoredParts(): {
  sourceOnly: true; captures: 4; originalParts: 132; wholeBlobs: number;
};
