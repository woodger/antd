export type EmptyDatetimeSourceVariant = 'first' | 'repeat';
export type EmptyDatetimeSourceOwner = 'single' | 'range';
export type EmptyDatetimeSourceAction = { type: 'input-open' | 'input-escape' | 'template-button' }
  | { type: 'date-hover' | 'date-click'; value: string }
  | { type: 'hour-hover' | 'hour-click'; value: number };
export interface EmptyDatetimeSourceSample {
  id: EmptyDatetimeSourceOwner; defaultPickerValue: string; defaultOpenValue: string; format: string;
  clock: { format: string; hourStep: number; minuteStep: number; secondStep: number;
    millisecondStep: number; showHour: boolean; showMinute: boolean; showSecond: boolean;
    showMillisecond: boolean; use12Hours: boolean; hideDisabledOptions: boolean };
  actions: EmptyDatetimeSourceAction[];
}
export interface EmptyDatetimeSourcePart {
  rawJSONPart: { file: string; bytes: number; sha256: string; gzipFile: string;
    gzipBytes: number; gzipSHA256: string };
}
export interface EmptyDatetimeSourceDate {
  identity: number; encoded: unknown; raw: unknown;
  temporal: {
    valid: boolean;
    epoch: number;
    iso: string;
    utcOffset: number;
    fields: number[];
    locale: string
  };
  sameAsAuthored: { panel: boolean; template: boolean };
}
export interface EmptyDatetimeSourceCallback {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown;
  dates: Array<{ path: number[]; value: EmptyDatetimeSourceDate }>;
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
}
export interface EmptyDatetimeSourcePoint {
  owner: { owner: EmptyDatetimeSourceOwner; actionIndex: number; alive: boolean; open: boolean;
    hasTemplate: boolean; authoredModel: unknown; rawAuthoredModel: unknown;
    authoredDates: Record<'panel' | 'template', EmptyDatetimeSourceDate>;
    authoredProps: unknown; rawAuthoredProps: unknown; callbacks: EmptyDatetimeSourceCallback[];
    ownerActions: unknown[]; lifecycle: Array<{ phase: string }> };
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown; nativeElementIdentity: number | null } };
  inputs: Array<{ identity: number; value: string; defaultValue: string; focused: boolean;
    selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
    [key: string]: unknown }>;
  root: unknown; ownerDOM: unknown; focus: unknown; popups: unknown[]; events: unknown[];
  retained: Array<{ identity: number; connected: boolean; [key: string]: unknown }>;
  environment: unknown; resources: {
    timing: unknown[];
    timers: null;
    frames: null;
    observers: null;
    note: string
  };
  [key: string]: unknown;
}
export interface EmptyDatetimeSourceCase {
  id: EmptyDatetimeSourceOwner; sample: EmptyDatetimeSourceSample; initial: EmptyDatetimeSourcePart;
  steps: EmptyDatetimeSourcePart[]; closed: EmptyDatetimeSourcePart[];
  beforeUnmount: EmptyDatetimeSourcePart; cleanup: EmptyDatetimeSourcePart; late: EmptyDatetimeSourcePart;
  failure: null; observationErrors: unknown[]; interruptedAction: null;
  network: { requests: unknown[]; responses: unknown[]; failures: unknown[] };
}
export interface EmptyDatetimeSourceManifest {
  status: string; variant: EmptyDatetimeSourceVariant; cases: EmptyDatetimeSourceCase[];
  sourceProtocol: {
    file: string;
    sha256: string;
    reviewedProposalSHA256: string;
    rootLease: string
  };
  browserVersion: string; counts: Record<string, number>; actualCounts: Record<string, number>;
  errors: unknown[]; diagnostics: unknown[]; fatal: null;
  terminalInputVerification: { unchanged: boolean; sha256: string };
}
export interface EmptyDatetimeSourceStep {
  index: number; action: EmptyDatetimeSourceAction; before: EmptyDatetimeSourcePoint;
  afterCall: EmptyDatetimeSourcePoint; actual: EmptyDatetimeSourcePoint;
  actionEvidence: unknown; phaseTwoPrerequisite: unknown;
}
export function readEmptyDatetimeSourceManifest(variant?: EmptyDatetimeSourceVariant): EmptyDatetimeSourceManifest;
export function readEmptyDatetimeSourceCase(
  id: EmptyDatetimeSourceOwner,
  variant?: EmptyDatetimeSourceVariant
): EmptyDatetimeSourceCase;
export function readEmptyDatetimeSourcePart<Value = unknown>(reference: EmptyDatetimeSourcePart): Value;
export function readEmptyDatetimeSourceInitial(
  id: EmptyDatetimeSourceOwner,
  variant?: EmptyDatetimeSourceVariant
): EmptyDatetimeSourcePoint;
export function readEmptyDatetimeSourceStep(
  id: EmptyDatetimeSourceOwner,
  index: number,
  variant?: EmptyDatetimeSourceVariant
): EmptyDatetimeSourceStep;
export function readEmptyDatetimeSourceClosed(
  id: EmptyDatetimeSourceOwner,
  index: number,
  variant?: EmptyDatetimeSourceVariant
): {
  actionIndex: number;
  after1000: EmptyDatetimeSourcePoint
};
export function readEmptyDatetimeSourceCleanup(
  id: EmptyDatetimeSourceOwner,
  phase?: 'beforeUnmount' | 'cleanup' | 'late',
  variant?: EmptyDatetimeSourceVariant
): EmptyDatetimeSourcePoint;
export function readEmptyDatetimeSourceEvidence(name: string): Uint8Array;
export function verifyEmptyDatetimeSourceManifest(
  value: unknown,
  variant?: EmptyDatetimeSourceVariant
): void;
export function verifyEmptyDatetimeSourcePoint(value: unknown): void;
export function verifyEmptyDatetimeSourcePartBinding(
  reference: EmptyDatetimeSourcePart,
  variant?: EmptyDatetimeSourceVariant,
  expectedFile?: string
): unknown;
export function verifyEmptyDatetimeSourceStoredBytes(
  reference: EmptyDatetimeSourcePart,
  stored: Uint8Array
): Uint8Array;
export function verifyEmptyDatetimeSourceStoredParts(): {
  sourceOnly: true;
  captures: number;
  originalParts: number;
  partBlobs: number;
  allBlobs: number
};
