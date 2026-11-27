import type {
  QuarterOwner, QuarterAction, QuarterSample, QuarterAuthoredDateName
} from './date-picker-quarter-cases.mjs';

export type QuarterSourceVariant = 'first' | 'repeat';
export type QuarterSourceCaptureKind = 'csr' | 'ssr';
export type QuarterSourceSerializer = 'renderToString' | 'renderToStaticMarkup';
export interface QuarterSourceRawPart {
  file: string; bytes: number; sha256: string;
  gzipFile: string; gzipBytes: number; gzipSHA256: string;
}
export interface QuarterSourceReference { rawJSONPart: QuarterSourceRawPart; }
export interface QuarterSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: { valid: boolean; epoch: number; iso: string; utcOffset: number;
    fields: [number, number, number, number, number, number, number]; locale: string; };
  sameAsAuthored: Record<QuarterAuthoredDateName, boolean>;
}
export interface QuarterSourceDatePath {
  path: Array<number | string>; value: QuarterSourceDate;
}
export interface QuarterSourceInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: QuarterSourceDatePath[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null; };
}
export interface QuarterSourceProducer extends QuarterSourceInvocation {
  boundary: 'first' | 'last'; returned: boolean;
}
export interface QuarterSourceProducerLedger {
  cursor: number; next: number; rows: QuarterSourceProducer[];
}
export interface QuarterSourceProducerChunk extends QuarterSourceProducerLedger {
  phase: string; boundaries: Record<string, number>; observationEnd: number;
}
export interface QuarterSourceProducerReference extends QuarterSourceReference {
  phase: string; cursor: number; next: number;
}
export interface QuarterSourceOwner {
  id: QuarterOwner; actionIndex: number; alive: boolean; picker: 'quarter';
  open: boolean; needConfirm?: boolean; limited: boolean; disabledBoundary: 'first' | 'last';
  localized: boolean;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown;
  modelDates: QuarterSourceDatePath[]; producerCount: number;
  authoredDates: Record<QuarterAuthoredDateName, QuarterSourceDate>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: QuarterSourceInvocation[]; ownerActions: unknown[]; lifecycle: Array<{ phase: string; }>;
}
export interface QuarterSourceSurface {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; html: string; text: string | null;
  box: { x: number; y: number; top: number; right: number; bottom: number;
    left: number; width: number; height: number; };
  css: Record<string, string>; scrollTop: number; scrollLeft: number;
  [key: string]: unknown;
}
export interface QuarterSourceInput extends QuarterSourceSurface {
  value: string; defaultValue: string; focused: boolean; sameAsInitial: boolean;
  selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
}
export interface QuarterSourceCell {
  mode: string; panelIdentity: number; inRange: boolean; surface: QuarterSourceSurface;
  title: string | null; selected: boolean; rangeStart: boolean; rangeEnd: boolean; disabled: boolean;
}
export interface QuarterSourcePopup {
  surface: QuarterSourceSurface; visible: boolean; geometryState: string;
  ancestors: QuarterSourceSurface[]; panels: QuarterSourceSurface[];
  headers: QuarterSourceSurface[]; headerButtons: Array<QuarterSourceSurface & { disabled: boolean; }>;
  footers: QuarterSourceSurface[];
  footerControls: Array<QuarterSourceSurface & { disabled: boolean | null; }>;
  dateCells: QuarterSourceCell[]; columns: unknown[];
}
export interface QuarterSourcePoint {
  owner: QuarterSourceOwner;
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null;
  }; };
  ownerDOM: QuarterSourceSurface | null; root: QuarterSourceSurface | null;
  sameOwnerAsInitial: boolean; sameRootAsInitial: boolean;
  inputs: QuarterSourceInput[]; focus: unknown; popups: QuarterSourcePopup[]; events: unknown[];
  retained: Array<{ identity: number; connected: boolean; [key: string]: unknown; }>;
  environment: { viewport: { width: number; height: number; }; scrollX: number; scrollY: number;
    devicePixelRatio: number; timezone: string; locale: string; dateNow: number; };
  resources: { timing: unknown[]; timers: null; frames: null; observers: null; note: string; };
}
export interface QuarterSourceStep {
  index: number; action: QuarterAction; before: QuarterSourcePoint;
  afterCall: QuarterSourcePoint; actual: QuarterSourcePoint;
  actionEvidence: { targetBefore: unknown; afterFocusPointer?: QuarterSourcePoint;
    [key: string]: unknown; };
}
export interface QuarterSourceClosed { actionIndex: number; after1000: QuarterSourcePoint; }
export interface QuarterSourceCase {
  id: QuarterOwner; sample: QuarterSample; initial: QuarterSourceReference;
  steps: QuarterSourceReference[]; closed: QuarterSourceReference[];
  producerParts: QuarterSourceProducerReference[]; producerFinalCount: number;
  beforeUnmount: QuarterSourceReference; cleanup: QuarterSourceReference; late: QuarterSourceReference;
  failure: null; interruptedAction: null; observationErrors: unknown[];
  network: {
    requests: unknown[];
    responses: Array<{ url: string; status: number; }>;
    failures: unknown[];
  };
}
interface QuarterSourceCaptureHeader {
  status: string; variant: QuarterSourceVariant;
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string;
  };
  terminalInputVerification: { unchanged: boolean; sha256: string; }; diagnostics: unknown[];
}
export interface QuarterSourceCSRManifest extends QuarterSourceCaptureHeader {
  browserVersion: string; counts: Record<string, number>; actualCounts: Record<string, number>;
  cases: QuarterSourceCase[]; errors: unknown[]; fatal: null;
}
export interface QuarterSourceSSRReference extends QuarterSourceReference {
  id: QuarterOwner; method: QuarterSourceSerializer;
}
export interface QuarterSourceSSRManifest extends QuarterSourceCaptureHeader {
  counts: { owners: number; serializations: number; }; cases: QuarterSourceSSRReference[]; failures: number;
}
export interface QuarterSourceSSR {
  rawHtml: string; htmlSha256: string;
  state: { owner: QuarterSourceOwner; producers: QuarterSourceProducerLedger; };
  environment: { timezone: string; }; refs: Record<string, boolean>;
  resources: Record<string, number>; fatal: null; initialClosedOnly: boolean; domFree: boolean;
  [key: string]: unknown;
}
export function readQuarterSourceEvidence(name: string): Uint8Array;
export function readQuarterSourceManifest(
  kind?: 'csr',
  variant?: QuarterSourceVariant
): QuarterSourceCSRManifest;
export function readQuarterSourceManifest(
  kind: 'ssr',
  variant?: QuarterSourceVariant
): QuarterSourceSSRManifest;
export function readQuarterSourceManifest(
  kind: QuarterSourceCaptureKind,
  variant?: QuarterSourceVariant
): QuarterSourceCSRManifest | QuarterSourceSSRManifest;
export function readQuarterSourceCase(
  id: QuarterOwner,
  variant?: QuarterSourceVariant
): QuarterSourceCase;
export function readQuarterSourcePart<Value = unknown>(
  reference: QuarterSourceReference | QuarterSourceRawPart
): Value;
export function readQuarterSourceInitial(
  id: QuarterOwner,
  variant?: QuarterSourceVariant
): QuarterSourcePoint;
export function readQuarterSourceStep(
  id: QuarterOwner,
  index: number,
  variant?: QuarterSourceVariant
): QuarterSourceStep;
export function readQuarterSourceClosed(
  id: QuarterOwner,
  index: number,
  variant?: QuarterSourceVariant
): QuarterSourceClosed;
export function readQuarterSourceCleanup(
  id: QuarterOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: QuarterSourceVariant
): QuarterSourcePoint;
export function readQuarterSourceProducerChunks(
  id: QuarterOwner,
  variant?: QuarterSourceVariant
): QuarterSourceProducerReference[];
export function readQuarterSourceProducerChunk(
  id: QuarterOwner,
  index: number,
  variant?: QuarterSourceVariant
): QuarterSourceProducerChunk;
export function readQuarterSourceSSR(
  id: QuarterOwner,
  method: QuarterSourceSerializer,
  variant?: QuarterSourceVariant
): QuarterSourceSSR;
export function verifyQuarterSourceManifest(
  value: unknown,
  kind?: QuarterSourceCaptureKind,
  variant?: QuarterSourceVariant
): void;
export function verifyQuarterSourcePoint(value: unknown): void;
export function verifyQuarterSourceProducerChunk(
  value: unknown,
  envelope?: Pick<QuarterSourceProducerReference, 'phase' | 'cursor' | 'next'>
): void;
export function verifyQuarterSourcePartBinding(
  reference: QuarterSourceReference | QuarterSourceRawPart,
  kind: QuarterSourceCaptureKind,
  variant?: QuarterSourceVariant,
  expectedFile?: string
): unknown;
export function verifyQuarterSourceStoredBytes(
  reference: QuarterSourceReference | QuarterSourceRawPart,
  stored: Uint8Array
): Uint8Array;
export function verifyQuarterSourceStoredParts(): {
  sourceOnly: true; captures: 4; originalParts: 456; wholeBlobs: number;
};
