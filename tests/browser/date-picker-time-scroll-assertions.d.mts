import type { ScrollAction, ScrollSample } from './date-picker-time-scroll-native-types';
export interface TimeScrollProof {
  root: number | null;
  input: number | null;
  points: number;
  previousVisible: Array<{ type: string; source: number; native: number; }> | null;
  boundaries: unknown[];
  transitions: unknown[];
}
export interface TimeScrollDisposal {
  beforeUnmount: unknown;
  cleanup: unknown;
  late: unknown;
  trace: string[];
}
export function createTimeScrollProof(): TimeScrollProof;
export function verifyTimeScrollPoint(
  actual: unknown,
  source: unknown,
  sample: ScrollSample,
  proof: TimeScrollProof,
  label: string
): void;
export function verifyTimeScrollActionEvidence(evidence: unknown, action: ScrollAction): void;
export function verifyTimeScrollRemovalInterval(
  beforeUnmount: unknown,
  cleanup: unknown,
  late: unknown,
  sourceBefore: unknown,
  sourceCleanup: unknown,
  sourceLate: unknown
): void;
export function verifyTimeScrollDisposal(
  disposal: TimeScrollDisposal,
  sourceBefore: unknown,
  sourceCleanup: unknown,
  sourceLate: unknown
): void;
