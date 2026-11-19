import type {
  MonthYearOwner, MonthYearAction, MonthYearSample, MonthYearAuthoredDateName
} from './date-picker-month-year-cases.mjs';

export type MonthYearSourceVariant = 'first' | 'repeat';
export type MonthYearSourceCaptureKind = 'csr' | 'ssr';
export type MonthYearSourceSerializer = 'renderToString' | 'renderToStaticMarkup';
export interface MonthYearSourceRawPart {
  file: string; bytes: number; sha256: string;
  gzipFile: string; gzipBytes: number; gzipSHA256: string;
}
export interface MonthYearSourceReference { rawJSONPart: MonthYearSourceRawPart; }
export interface MonthYearSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: { valid: boolean; epoch: number; iso: string; utcOffset: number;
    fields: [number, number, number, number, number, number, number]; locale: string; };
  sameAsAuthored: Record<MonthYearAuthoredDateName, boolean>;
}
export interface MonthYearSourceDatePath {
  path: Array<number | string>; value: MonthYearSourceDate;
}
export interface MonthYearSourceInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: MonthYearSourceDatePath[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null; };
}
export interface MonthYearSourceProducer extends MonthYearSourceInvocation { returned: boolean; }
export interface MonthYearSourceProducerLedger {
  cursor: number; next: number; rows: MonthYearSourceProducer[];
}
export interface MonthYearSourceProducerChunk extends MonthYearSourceProducerLedger {
  phase: string; boundaries: Record<string, number>; observationEnd: number;
}
export interface MonthYearSourceProducerReference extends MonthYearSourceReference {
  phase: string; cursor: number; next: number;
}
export interface MonthYearSourceOwner {
  id: MonthYearOwner; actionIndex: number; alive: boolean; picker: 'month' | 'year';
  open: boolean; needConfirm?: boolean; limited: boolean; localized: boolean;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown;
  modelDates: MonthYearSourceDatePath[]; producerCount: number;
  authoredDates: Record<MonthYearAuthoredDateName, MonthYearSourceDate>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: MonthYearSourceInvocation[]; ownerActions: unknown[]; lifecycle: Array<{ phase: string; }>;
}
export interface MonthYearSourceSurface {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; html: string; text: string | null;
  box: { x: number; y: number; top: number; right: number; bottom: number;
    left: number; width: number; height: number; };
  css: Record<string, string>; scrollTop: number; scrollLeft: number;
  [key: string]: unknown;
}
export interface MonthYearSourceInput extends MonthYearSourceSurface {
  value: string; defaultValue: string; focused: boolean; sameAsInitial: boolean;
  selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
}
export interface MonthYearSourceCell {
  mode: string; panelIdentity: number; inRange: boolean; surface: MonthYearSourceSurface;
  title: string | null; selected: boolean; rangeStart: boolean; rangeEnd: boolean; disabled: boolean;
}
export interface MonthYearSourcePopup {
  surface: MonthYearSourceSurface; visible: boolean; geometryState: string;
  ancestors: MonthYearSourceSurface[]; panels: MonthYearSourceSurface[];
  headers: MonthYearSourceSurface[]; headerButtons: Array<MonthYearSourceSurface & { disabled: boolean; }>;
  footers: MonthYearSourceSurface[];
  footerControls: Array<MonthYearSourceSurface & { disabled: boolean | null; }>;
  dateCells: MonthYearSourceCell[]; columns: unknown[];
}
export interface MonthYearSourcePoint {
  owner: MonthYearSourceOwner;
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null;
  }; };
  ownerDOM: MonthYearSourceSurface | null; root: MonthYearSourceSurface | null;
  sameOwnerAsInitial: boolean; sameRootAsInitial: boolean;
  inputs: MonthYearSourceInput[]; focus: unknown; popups: MonthYearSourcePopup[]; events: unknown[];
  retained: Array<{ identity: number; connected: boolean; [key: string]: unknown; }>;
  environment: { viewport: { width: number; height: number; }; scrollX: number; scrollY: number;
    devicePixelRatio: number; timezone: string; locale: string; dateNow: number; };
  resources: { timing: unknown[]; timers: null; frames: null; observers: null; note: string; };
}
export interface MonthYearSourceStep {
  index: number; action: MonthYearAction; before: MonthYearSourcePoint;
  afterCall: MonthYearSourcePoint; actual: MonthYearSourcePoint;
  actionEvidence: { targetBefore: unknown; afterFocusPointer?: MonthYearSourcePoint;
    [key: string]: unknown; };
}
export interface MonthYearSourceClosed { actionIndex: number; after1000: MonthYearSourcePoint; }
export interface MonthYearSourceCase {
  id: MonthYearOwner; sample: MonthYearSample; initial: MonthYearSourceReference;
  steps: MonthYearSourceReference[]; closed: MonthYearSourceReference[];
  producerParts: MonthYearSourceProducerReference[]; producerFinalCount: number;
  beforeUnmount: MonthYearSourceReference; cleanup: MonthYearSourceReference; late: MonthYearSourceReference;
  failure: null; interruptedAction: null; observationErrors: unknown[];
  network: {
    requests: unknown[];
    responses: Array<{ url: string; status: number; }>;
    failures: unknown[];
  };
}
interface MonthYearSourceCaptureHeader {
  status: string; variant: MonthYearSourceVariant;
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string;
  };
  terminalInputVerification: { unchanged: boolean; sha256: string; }; diagnostics: unknown[];
}
export interface MonthYearSourceCSRManifest extends MonthYearSourceCaptureHeader {
  browserVersion: string; counts: Record<string, number>; actualCounts: Record<string, number>;
  cases: MonthYearSourceCase[]; errors: unknown[]; fatal: null;
}
export interface MonthYearSourceSSRReference extends MonthYearSourceReference {
  id: MonthYearOwner; method: MonthYearSourceSerializer;
}
export interface MonthYearSourceSSRManifest extends MonthYearSourceCaptureHeader {
  counts: { owners: number; serializations: number; }; cases: MonthYearSourceSSRReference[]; failures: number;
}
export interface MonthYearSourceSSR {
  rawHtml: string; htmlSha256: string;
  state: { owner: MonthYearSourceOwner; producers: MonthYearSourceProducerLedger; };
  environment: { timezone: string; }; refs: Record<string, boolean>;
  resources: Record<string, number>; fatal: null; initialClosedOnly: boolean; domFree: boolean;
  [key: string]: unknown;
}
export function readMonthYearSourceEvidence(name: string): Uint8Array;
export function readMonthYearSourceManifest(
  kind?: 'csr',
  variant?: MonthYearSourceVariant
): MonthYearSourceCSRManifest;
export function readMonthYearSourceManifest(
  kind: 'ssr',
  variant?: MonthYearSourceVariant
): MonthYearSourceSSRManifest;
export function readMonthYearSourceManifest(
  kind: MonthYearSourceCaptureKind,
  variant?: MonthYearSourceVariant
): MonthYearSourceCSRManifest | MonthYearSourceSSRManifest;
export function readMonthYearSourceCase(
  id: MonthYearOwner,
  variant?: MonthYearSourceVariant
): MonthYearSourceCase;
export function readMonthYearSourcePart<Value = unknown>(
  reference: MonthYearSourceReference | MonthYearSourceRawPart
): Value;
export function readMonthYearSourceInitial(
  id: MonthYearOwner,
  variant?: MonthYearSourceVariant
): MonthYearSourcePoint;
export function readMonthYearSourceStep(
  id: MonthYearOwner,
  index: number,
  variant?: MonthYearSourceVariant
): MonthYearSourceStep;
export function readMonthYearSourceClosed(
  id: MonthYearOwner,
  index: number,
  variant?: MonthYearSourceVariant
): MonthYearSourceClosed;
export function readMonthYearSourceCleanup(
  id: MonthYearOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: MonthYearSourceVariant
): MonthYearSourcePoint;
export function readMonthYearSourceProducerChunks(
  id: MonthYearOwner,
  variant?: MonthYearSourceVariant
): MonthYearSourceProducerReference[];
export function readMonthYearSourceProducerChunk(
  id: MonthYearOwner,
  index: number,
  variant?: MonthYearSourceVariant
): MonthYearSourceProducerChunk;
export function readMonthYearSourceSSR(
  id: MonthYearOwner,
  method: MonthYearSourceSerializer,
  variant?: MonthYearSourceVariant
): MonthYearSourceSSR;
export function verifyMonthYearSourceManifest(
  value: unknown,
  kind?: MonthYearSourceCaptureKind,
  variant?: MonthYearSourceVariant
): void;
export function verifyMonthYearSourcePoint(value: unknown): void;
export function verifyMonthYearSourceProducerChunk(
  value: unknown,
  envelope?: Pick<MonthYearSourceProducerReference, 'phase' | 'cursor' | 'next'>
): void;
export function verifyMonthYearSourcePartBinding(
  reference: MonthYearSourceReference | MonthYearSourceRawPart,
  kind: MonthYearSourceCaptureKind,
  variant?: MonthYearSourceVariant,
  expectedFile?: string
): unknown;
export function verifyMonthYearSourceStoredBytes(
  reference: MonthYearSourceReference | MonthYearSourceRawPart,
  stored: Uint8Array
): Uint8Array;
export function verifyMonthYearSourceStoredParts(): {
  sourceOnly: true; captures: 4; originalParts: 816; wholeBlobs: number;
};
