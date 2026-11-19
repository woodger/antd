import type { MaskOwner, MaskFormatProfile } from './date-picker-mask-cases.mjs';
import type { MaskSourceOwner, MaskSourceProducerLedger, MaskSourceRawPart } from './date-picker-mask-reference.mjs';

export type MaskHydrationSourceVariant = 'first' | 'repeat';
export type MaskHydrationSourcePhase = 'parsed' | 'preHydrate' | 'afterHydrateCall' | 'mounted' | 'settled'
  | 'beforeUnmount' | 'afterUnmountCall' | 'cleanup' | 'late1000';
export interface MaskHydrationSourceInput {
  identity: string; id: string; type: string; value: string; defaultValue: string;
  valueAttribute: string | null; selectionStart: number | null; selectionEnd: number | null;
  selectionDirection: 'forward' | 'backward' | 'none' | null; focused: boolean; connected: boolean;
  attributes: Record<string, string>; outerHTML: string;
}
export interface MaskHydrationSourcePoint {
  phase: MaskHydrationSourcePhase;
  environment: { dateNow: number; performanceNow: number; timezone: string; documentReadyState: string; };
  nodes: { target: string; owner: string | null; root: string | null; active: string | null;
    activeTag: string | null; activeId: string | null;
    sameParsed: { target: boolean; owner: boolean; root: boolean; inputCount: boolean; inputs: boolean[]; };
    parsed: { target: string; owner: string | null; root: string | null; inputs: string[]; }; };
  inputs: MaskHydrationSourceInput[]; retainedParsedInputs: MaskHydrationSourceInput[];
  html: { owner: string | null; root: string | null; target: string; body: string; };
  source: { owner: MaskSourceOwner; producers: MaskSourceProducerLedger;
    refs: Record<string, unknown>; } | null;
  events: Array<Record<string, unknown>>; recoverableErrors: Array<Record<string, unknown>>;
}
export interface MaskHydrationSourceProfile {
  id: MaskOwner; formatProfile: MaskFormatProfile;
  sourceSSR: { variant: 'first'; method: 'renderToString'; rawJSONPart: MaskSourceRawPart; };
  originalSourceHTML: { value: string; sha256: string; originalEnvironment: Record<string, unknown>; };
  observations: MaskHydrationSourcePoint[];
  versions: { react: string; antd: string; hasHydrateRoot: boolean; dateNow: number; dayjsLocale: string; };
  failure: null; network: { requests: unknown[]; responses: unknown[]; failures: unknown[]; };
  contextCloseAwaited: boolean;
}
export interface MaskHydrationSourceMetadata {
  sourceOnly: true; NativeDataUsed: false; sourceProtocolSHA256: string; rootLease: string;
  phases: MaskHydrationSourcePhase[];
  profiles: Array<{ id: MaskOwner; formatProfile: MaskFormatProfile; variant: MaskHydrationSourceVariant;
    original: MaskSourceRawPart; fixture: string; originalHTMLSHA256: string; }>;
  documents: Record<string, { originalFile: string; bytes: number; sha256: string; fixture: string; }>;
  [key: string]: unknown;
}
export function readMaskHydrationSourceManifest(): MaskHydrationSourceMetadata;
export function readMaskHydrationSourceEvidence(name: string): Uint8Array;
export function readMaskHydrationSourceProfile(id: MaskOwner, formatProfile: MaskFormatProfile,
  variant?: MaskHydrationSourceVariant): MaskHydrationSourceProfile;
export function readMaskHydrationSourcePoint(id: MaskOwner, formatProfile: MaskFormatProfile,
  phase: MaskHydrationSourcePhase, variant?: MaskHydrationSourceVariant): MaskHydrationSourcePoint;
export function readMaskHydrationSourceCapture(variant?: MaskHydrationSourceVariant): Record<string, unknown>;
export function verifyMaskHydrationSourcePoint(value: unknown, phase?: MaskHydrationSourcePhase): void;
export function verifyMaskHydrationSourceIntegrity(): { sourceOnly: true; profiles: number; snapshots: number;
  originalWholeParts: number; wholeGzipBlobs: number; };
