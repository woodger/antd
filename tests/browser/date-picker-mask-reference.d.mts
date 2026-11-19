import type {
  MaskOwner, MaskFamily, MaskKind, MaskFormatProfile, MaskAction, MaskSubstepCommand,
  MaskSample, MaskAuthoredDateName
} from './date-picker-mask-cases.mjs';

export type MaskSourceVariant = 'first' | 'repeat';
export type MaskSourceCaptureKind = 'csr' | 'ssr';
export type MaskSourceSerializer = 'renderToString' | 'renderToStaticMarkup';
export interface MaskSourceRawPart {
  file: string; bytes: number; sha256: string;
  gzipFile: string; gzipBytes: number; gzipSHA256: string;
}
export interface MaskSourceReference { rawJSONPart: MaskSourceRawPart; }
export interface MaskSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: { valid: boolean; epoch: number | null; iso: string | null; utcOffset: number | null;
    fields: [number | null, number | null, number | null, number | null, number | null, number | null, number | null];
    locale: string; };
  sameAsAuthored: Record<MaskAuthoredDateName, boolean>;
}
export interface MaskSourceDatePath { path: Array<string | number>; value: MaskSourceDate; }
export interface MaskSourceInvocation {
  index: number; actionIndex: number; substepIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: MaskSourceDatePath[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null; };
}
export interface MaskSourceProducer extends MaskSourceInvocation {
  returned: unknown; rawReturned: unknown; returnedIdentity: number | null;
}
export interface MaskSourceProducerLedger { cursor: number; next: number; rows: MaskSourceProducer[]; }
export interface MaskSourceProducerChunk extends MaskSourceProducerLedger {
  phase: string; boundaryScope: 'local-substep-or-lifecycle-window'
    | 'aggregate-macro-window-covering-earlier-child-parts';
  boundaries: Record<string, number>; observationEnd: number;
}
export interface MaskSourceProducerReference extends MaskSourceReference { phase: string; cursor: number; next: number; }
export interface MaskSourceFormatValue { type: 'string' | 'object'; identity: number | null; encoded: unknown; raw: unknown; }
export interface MaskSourceOwner {
  id: MaskOwner; family: MaskFamily; kind: MaskKind; picker: 'date' | 'time';
  actionIndex: number; substepIndex: number; alive: boolean; open: boolean; formatProfile: MaskFormatProfile;
  formatValue: MaskSourceFormatValue; model: unknown; rawModel: unknown; modelDates: MaskSourceDatePath[];
  producerCount: number; authoredDates: Record<MaskAuthoredDateName, MaskSourceDate>;
  authoredProps: unknown; rawAuthoredProps: unknown; callbacks: MaskSourceInvocation[];
  ownerActions: Array<{ actionIndex: number; substepIndex: number; value: string; type: string;
    isTrusted: boolean; nativeIsTrusted: boolean; targetTag: string; currentTargetTag: string; }>;
  lifecycle: Array<{ phase: string; }>;
}
export interface MaskSourceSurface {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; html: string; text: string | null;
  box: { x: number; y: number; top: number; right: number; bottom: number; left: number;
    width: number; height: number; };
  css: Record<string, string>; scrollTop: number; scrollLeft: number;
  children: Array<{ identity: number; nodeType: number; name: string; data: string | null; }>;
  [key: string]: unknown;
}
export interface MaskSourceInput extends MaskSourceSurface {
  value: string; defaultValue: string; selectionStart: number | null; selectionEnd: number | null;
  selectionDirection: string | null; focused: boolean; sameAsInitial: boolean;
}
export interface MaskSourceFocus { identity: number; tag: string; connected: boolean; attributes: Array<[string, string]>; }
export interface MaskSourceInputAtCapture {
  identity: number; value: string; defaultValue: string;
  selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
  focused: boolean; attributes: Array<[string, string]>;
}
export interface MaskSourceEvent {
  actionIndex: number; substepIndex: number; producerCursorAtCapture: number; callbackCountAtCapture: number;
  type: string; isTrusted: boolean; timeStamp: number;
  phase: 'document-capture-before-target-handler'; eventPhase: number; bubbles: boolean;
  cancelable: boolean; defaultPreventedAtCapture: boolean;
  key: string | null; code: string | null; repeat: boolean | null; isComposing: boolean | null;
  altKey: boolean | null; ctrlKey: boolean | null; metaKey: boolean | null; shiftKey: boolean | null;
  inputType: string | null; data: string | null; button: number | null; buttons: number | null;
  clientX: number | null; clientY: number | null;
  targetIdentity: number | null; targetTag: string | null;
  currentTargetIdentity: number | null; relatedTargetIdentity: number | null;
  inputAtCapture: MaskSourceInputAtCapture | null;
}
export interface MaskSourceCell {
  mode: string; panelIdentity: number; rowIdentity: number; weekNumber: boolean; inRange: boolean;
  surface: MaskSourceSurface; title: string | null; selected: boolean;
  rangeStart: boolean; rangeEnd: boolean; disabled: boolean;
}
export interface MaskSourceRowCell { surface: MaskSourceSurface; title: string | null; weekNumber: boolean; disabled: boolean; }
export interface MaskSourceRow {
  surface: MaskSourceSurface; selected: boolean; hover: boolean;
  rangeStart: boolean; rangeEnd: boolean; rangeHover: boolean; cells: MaskSourceRowCell[];
}
export interface MaskSourceTable {
  surface: MaskSourceSurface;
  headers: Array<{ surface: MaskSourceSurface;
    cells: Array<{ surface: MaskSourceSurface; contents: MaskSourceSurface[]; }>; }>;
  rows: MaskSourceRow[];
}
export interface MaskSourceTimeRow { surface: MaskSourceSurface; value: string; selected: boolean; disabled: boolean; }
export interface MaskSourceTimeColumn { type: string; surface: MaskSourceSurface; rows: MaskSourceTimeRow[]; }
export interface MaskSourcePopup {
  surface: MaskSourceSurface; visible: boolean; geometryState: string; ancestors: MaskSourceSurface[];
  panels: MaskSourceSurface[]; headers: MaskSourceSurface[];
  headerButtons: Array<MaskSourceSurface & { disabled: boolean; }>;
  footers: MaskSourceSurface[]; footerControls: Array<MaskSourceSurface & { disabled: boolean | null; }>;
  tables: MaskSourceTable[]; dateCells: MaskSourceCell[]; columns: MaskSourceTimeColumn[];
}
export interface MaskSourcePoint {
  owner: MaskSourceOwner;
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null; }; };
  ownerDOM: MaskSourceSurface | null; root: MaskSourceSurface | null;
  sameOwnerAsInitial: boolean; sameRootAsInitial: boolean;
  inputs: MaskSourceInput[]; focus: MaskSourceFocus | null; popups: MaskSourcePopup[]; events: MaskSourceEvent[];
  retained: Array<{ identity: number; tag: string; connected: boolean; parentIdentity: number | null;
    attributes: Array<[string, string]>; }>;
  environment: { viewport: { width: number; height: number; }; scrollX: number; scrollY: number;
    devicePixelRatio: number; timezone: string; locale: string; dateNow: number; };
  resources: { timing: unknown[]; timers: null; frames: null; observers: null; note: string; };
}
export interface MaskSourceSubstep {
  index: number; substepIndex: number; command: MaskSubstepCommand; evidence: Record<string, unknown>;
  before: MaskSourcePoint; afterCall: MaskSourcePoint; actual: MaskSourcePoint;
}
export interface MaskSourceSubstepReference extends MaskSourceReference {
  actionIndex: number; substepIndex: number; command: MaskSubstepCommand;
}
export interface MaskSourceStep {
  scope: 'macro'; index: number; action: MaskAction; before: MaskSourcePoint;
  substeps: MaskSourceReference[]; afterCall: MaskSourcePoint;
  afterCallSource: { substep: MaskSourceReference; field: 'afterCall'; }; actual: MaskSourcePoint;
}
export interface MaskSourceClosed { actionIndex: number; after1000: MaskSourcePoint; }
export interface MaskSourceCase {
  id: MaskOwner; sample: MaskSample; initial: MaskSourceReference; steps: MaskSourceReference[];
  substeps: MaskSourceSubstepReference[]; closed: MaskSourceReference[];
  producerParts: MaskSourceProducerReference[]; producerFinalCount: number;
  beforeUnmount: MaskSourceReference; cleanup: MaskSourceReference; late: MaskSourceReference;
  failure: null; interruptedAction: null; interruptedSubstep: null; observationErrors: unknown[];
  network: {
    requests: unknown[];
    responses: Array<{ url: string; status: number; }>;
    failures: unknown[];
  };
}
interface MaskSourceCaptureHeader {
  status: string; variant: MaskSourceVariant;
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string;
  };
  terminalInputVerification: { unchanged: boolean; sha256: string; }; diagnostics: unknown[];
}
export interface MaskSourceCSRManifest extends MaskSourceCaptureHeader {
  browserVersion: string; counts: Record<string, number>; storage: Record<string, number>;
  actualCounts: Record<string, number>; cases: MaskSourceCase[]; errors: unknown[]; fatal: null;
}
export interface MaskSourceSSRReference extends MaskSourceReference {
  id: MaskOwner; formatProfile: MaskFormatProfile; method: MaskSourceSerializer;
}
export interface MaskSourceSSRManifest extends MaskSourceCaptureHeader {
  counts: { owners: number; serializations: number; }; cases: MaskSourceSSRReference[]; failures: number;
}
export interface MaskSourceSSR {
  formatProfile: MaskFormatProfile; method: MaskSourceSerializer; rawHtml: string; htmlSha256: string;
  state: { owner: MaskSourceOwner; producers: MaskSourceProducerLedger; };
  environment: { timezone: string; dateNow: number; dayjsLocale: string; };
  refs: Record<string, boolean>; resources: Record<string, number>; fatal: null;
  initialClosedOnly: boolean; domFree: boolean;
  messageChannelEnvironment: { availableDuringUMDLoad: boolean; forbiddenDuringRender: boolean; };
}
export function readMaskSourceEvidence(name: string): Uint8Array;
export function readMaskSourceManifest(
  kind?: 'csr',
  variant?: MaskSourceVariant
): MaskSourceCSRManifest;
export function readMaskSourceManifest(
  kind: 'ssr',
  variant?: MaskSourceVariant
): MaskSourceSSRManifest;
export function readMaskSourceManifest(
  kind: MaskSourceCaptureKind,
  variant?: MaskSourceVariant
): MaskSourceCSRManifest | MaskSourceSSRManifest;
export function readMaskSourceCase(id: MaskOwner, variant?: MaskSourceVariant): MaskSourceCase;
export function readMaskSourcePart<Value = unknown>(reference: MaskSourceReference | MaskSourceRawPart): Value;
export function readMaskSourceInitial(id: MaskOwner, variant?: MaskSourceVariant): MaskSourcePoint;
export function readMaskSourceStep(
  id: MaskOwner,
  index: number,
  variant?: MaskSourceVariant
): MaskSourceStep;
export function readMaskSourceSubstep(
  id: MaskOwner,
  index: number,
  substepIndex: number,
  variant?: MaskSourceVariant
): MaskSourceSubstep;
export function readMaskSourceClosed(
  id: MaskOwner,
  index: number,
  variant?: MaskSourceVariant
): MaskSourceClosed;
export function readMaskSourceCleanup(
  id: MaskOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: MaskSourceVariant
): MaskSourcePoint;
export function readMaskSourceProducerChunks(
  id: MaskOwner,
  variant?: MaskSourceVariant
): MaskSourceProducerReference[];
export function readMaskSourceProducerChunk(
  id: MaskOwner,
  index: number,
  variant?: MaskSourceVariant
): MaskSourceProducerChunk;
export function readMaskSourceSSR(
  id: MaskOwner,
  formatProfile: MaskFormatProfile,
  method: MaskSourceSerializer,
  variant?: MaskSourceVariant
): MaskSourceSSR;
export function verifyMaskSourceManifest(
  value: unknown,
  kind?: MaskSourceCaptureKind,
  variant?: MaskSourceVariant
): void;
export function verifyMaskSourcePoint(value: unknown): void;
export function verifyMaskSourceRows(value: unknown): void;
export function verifyMaskSourceStep(
  value: unknown,
  id: MaskOwner,
  index: number,
  variant?: MaskSourceVariant
): void;
export function verifyMaskSourceSubstep(
  value: unknown,
  id: MaskOwner,
  index: number,
  substepIndex: number
): void;
export function verifyMaskSourceProducerChunk(
  value: unknown,
  envelope?: Pick<MaskSourceProducerReference, 'phase' | 'cursor' | 'next'>
): void;
export function verifyMaskSourceSSR(
  value: unknown,
  id: MaskOwner,
  formatProfile: MaskFormatProfile,
  method: MaskSourceSerializer
): void;
export function verifyMaskSourcePartBinding(
  reference: MaskSourceReference | MaskSourceRawPart,
  kind: MaskSourceCaptureKind,
  variant?: MaskSourceVariant,
  expectedFile?: string
): unknown;
export function verifyMaskSourceStoredBytes(
  reference: MaskSourceReference | MaskSourceRawPart,
  stored: Uint8Array
): Uint8Array;
export function verifyMaskSourceStoredParts(): {
  sourceOnly: true;
  captures: 4;
  originalParts: 1618;
  wholeBlobs: number;
};
