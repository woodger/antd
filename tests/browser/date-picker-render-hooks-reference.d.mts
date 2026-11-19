export type SourceVariant = 'first' | 'repeat';
export type SourceCaptureKind = 'csr' | 'ssr';
export interface SourcePart {
  file: string;
  bytes: number;
  sha256: string;
  gzipFile: string;
  gzipBytes: number;
  gzipSHA256: string;
}
export interface SourceReference { rawJSONPart: SourcePart; }
export interface SourceAction {
  type: string;
  value?: string | number | boolean;
  index?: number;
  selector?: string;
  [key: string]: unknown;
}
export interface SourceCSRCase {
  id: string;
  sample: { id: string; kind: 'single' | 'range'; datetime: boolean; actions: SourceAction[]; };
  initial: SourceReference;
  steps: SourceReference[];
  closed: SourceReference[];
  hookParts: SourceReference[];
  beforeUnmount: SourceReference;
  cleanup: SourceReference;
  late: SourceReference;
  failure: unknown;
  observationErrors: unknown[];
}
export interface SourceCSRManifest {
  cases: SourceCSRCase[];
  actualCounts: { owners: number; actions: number; logicalPoints: number;
    closedAfter1000: number; hookInvocations: number; keyboardEvents: number; };
  errors: unknown[];
  diagnostics: unknown[];
  terminalInputVerification: { unchanged: boolean; sha256: string; };
}
export interface SourceSSRManifest {
  cases: Array<{ id: string; method: string; rawJSONPart: SourcePart; }>;
  counts: { owners: number; serializations: number; };
  diagnostics: unknown[];
  failures: number;
  terminalInputVerification: { unchanged: boolean; sha256: string; };
}
export interface SourceTemporal {
  isDayjs: boolean;
  valid: boolean;
  epoch: number;
  iso: string | null;
  utcOffset: number;
  fields: [number, number, number, number, number, number, number];
}
export interface SourceCurrent {
  kind: 'dayjs' | 'number' | 'string';
  identity?: number;
  temporal?: SourceTemporal;
  sameAsAuthored?: boolean[];
  value?: number | string;
}
export interface SourceCellFact {
  sequence: number;
  materializedMarker: boolean;
  current: SourceCurrent;
  ownKeys: string[];
  own: unknown[];
  type: 'date' | 'month' | 'year' | 'decade' | 'time';
  subTypeOwn: boolean;
  subType: string | { $: 'undefined'; };
  rangeOwn: boolean;
  range: 'start' | 'end' | { $: 'undefined'; };
  prefixCls: string;
  localeIdentity: number;
  today: { identity: number; temporal: SourceTemporal; };
  origin: { identity: number; ownKeys: unknown[]; type: unknown; props: Record<string, unknown>; };
  returnedIsOrigin: boolean;
  returnedChildIsOrigin: boolean;
}
export interface SourceDerivedFacts {
  actualHookRows: number;
  hookKinds: { cell: number; panel: number; footer: number; };
  cells: SourceCellFact[];
  materializedCellSequences: number[];
  locales: Array<{ identity: number; ownKeys: string[]; plain: Record<string, unknown>; }>;
  todayGroups: Array<{ identity: number; temporal: SourceTemporal;
    types: string[]; subTypes: string[]; callSequences: number[]; }>;
  panelCalls: Array<{ sequence: number; strategy: string; actualArgumentCount: number;
    originOwnKeys: unknown[]; originElement: unknown; returnedIsOrigin: boolean; returnedChildrenContainOrigin: boolean; }>;
  footerCalls: Array<{ sequence: number; strategy: string; actualArgumentCount: number;
    encodedArguments: unknown; returnIsReactElement: boolean; returnRoot: unknown; }>;
  owner: {
    open: boolean;
    cell: string;
    panel: string;
    footer: string;
    revision: number;
    confirm: boolean;
  };
  inputValues: string[];
  focusedField: number;
  focus: unknown;
  renderedRangeValues: string[];
  todayTitles: string[];
  layout: {
    panels: number[];
    footer: Array<{ identity: number; parentIdentity: number; parentClass: string;
      insidePanel: boolean; text: string; }>;
    extraFooter: Array<{ identity: number; parentIdentity: number; parentIsFooter: boolean;
      text: string; childNodes: unknown[]; }>;
    footerControls: Array<{
      tag: string;
      text: string;
      attributes: string[][];
      parentIdentity: number;
    }>;
    panelLayouts: Array<{ identity: number; parentIdentity: number; }>;
    panelContainers: Array<{ identity: number; parentIdentity: number; }>;
  };
}
export interface SourceFacts extends SourceDerivedFacts {
  id: string;
  phase: string;
  variant: SourceVariant;
  actionIndex: number;
  action: SourceAction;
  pointPart: SourceReference;
  hooksPart: SourceReference;
}
export function readRenderHooksSourceManifest(kind: 'csr', variant?: SourceVariant): SourceCSRManifest;
export function readRenderHooksSourceManifest(kind: 'ssr', variant?: SourceVariant): SourceSSRManifest;
export function readRenderHooksSourceManifest(
  kind: SourceCaptureKind, variant?: SourceVariant
): SourceCSRManifest | SourceSSRManifest;
export function readRenderHooksSourceCase(id: string, variant?: SourceVariant): SourceCSRCase;
export function readRenderHooksSourcePart<T = unknown>(reference: SourceReference | SourcePart): T;
export function deriveRenderHooksSourceFacts(point: unknown, tape: unknown): SourceDerivedFacts;
export function readRenderHooksSourceFacts(id: string, phase?: string, variant?: SourceVariant): SourceFacts;
export function verifyRenderHooksSourceStoredParts(): {
  sourceOnly: true; captures: number; originalParts: number; blobs: number;
};
export interface SourcePlainFacts {
  actionIndex: number;
  action: SourceAction;
  pointPart: SourceReference;
  hooksPart: SourceReference;
  cells: Array<Pick<SourceCellFact, 'sequence' | 'current' | 'ownKeys' | 'type'
    | 'subTypeOwn' | 'subType' | 'rangeOwn' | 'range' | 'prefixCls' | 'localeIdentity' | 'today'>>;
  locales: SourceDerivedFacts['locales'];
  todayGroups: SourceDerivedFacts['todayGroups'];
  todayTitles: string[];
}
export function projectRenderHooksSourceFacts(value: SourceFacts): SourcePlainFacts;
