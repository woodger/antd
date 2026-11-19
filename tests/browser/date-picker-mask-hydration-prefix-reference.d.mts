import type { MaskHydrationSourcePoint } from './date-picker-mask-hydration-reference.mjs';
export type MaskHydrationPrefixSourceOwner = 'range-date-mask' | 'range-time-mask';
export type MaskHydrationPrefixSourceVariant = 'first' | 'repeat';
export type MaskHydrationPrefixSourceFact = Omit<MaskHydrationSourcePoint, 'phase' | 'html' | 'source'> & {
  phase: string; source: Omit<NonNullable<MaskHydrationSourcePoint['source']>, 'producers'>;
};
export type MaskHydrationPrefixSourcePoint = Omit<MaskHydrationSourcePoint, 'phase'> & { phase: string; };
export interface MaskHydrationPrefixSourceProfile {
  id: MaskHydrationPrefixSourceOwner; formatProfile: 'string'; observations: MaskHydrationPrefixSourcePoint[];
  steps: Array<{ index: number; complete: boolean; before: MaskHydrationPrefixSourcePoint;
    afterCall: MaskHydrationPrefixSourcePoint; actual: MaskHydrationPrefixSourcePoint;
    nextUnexecutedSubstepBefore: null | {
      index: 3;
      substepIndex: 1;
      before: MaskHydrationPrefixSourcePoint;
    }; }>;
  substeps: Array<{ index: number; substepIndex: number; before: MaskHydrationPrefixSourcePoint;
    afterCall: MaskHydrationPrefixSourcePoint; actual: MaskHydrationPrefixSourcePoint; }>;
  [key: string]: unknown;
}
export function readMaskHydrationPrefixSourceManifest(): Record<string, unknown>;
export function readMaskHydrationPrefixSourceEvidence(name: string): Uint8Array;
/** Explicit projection: only /html and /source/producers are omitted; whole originals remain retained. */
export function readMaskHydrationPrefixSourceFact(id: MaskHydrationPrefixSourceOwner, label: string,
  variant?: MaskHydrationPrefixSourceVariant): MaskHydrationPrefixSourceFact;
export function readMaskHydrationPrefixSourcePoint(id: MaskHydrationPrefixSourceOwner, label: string,
  variant?: MaskHydrationPrefixSourceVariant): MaskHydrationPrefixSourcePoint;
/** Exact complete JSON bytes, with gzip/raw hashes checked; no whole-string JSON.parse. */
export function readMaskHydrationPrefixSourceRawProfile(id: MaskHydrationPrefixSourceOwner,
  variant?: MaskHydrationPrefixSourceVariant): Uint8Array;
export function verifyMaskHydrationPrefixSourceIntegrity(): { sourceOnly: true; profiles: number; labelsPerProfile: number;
  verifiedFacts: number; originalWholeParts: number; completeRetainedPhasePositions: number; distinctFullReads: number; cachedData: string; };
