import type { ScrollAction, ScrollSample } from './date-picker-time-scroll-native-types';
export interface SourcePart {
  rawJSONPart: {
    file: string;
    bytes: number;
    sha256: string;
    gzipFile: string;
    gzipBytes: number;
    gzipSHA256: string;
  };
}
export interface SourceStep {
  action: ScrollAction;
  actionEvidence: unknown;
  afterCall: unknown;
  actual: unknown;
}
export interface SourceClosed {
  actionIndex: number;
  after1000: unknown;
}
export interface SourceScrollCase {
  id: string;
  sample: ScrollSample;
  initial: SourcePart;
  steps: SourcePart[];
  closed: SourcePart[];
  beforeUnmount: SourcePart;
  cleanup: SourcePart;
  late: SourcePart;
}
export function readTimeScrollSourceCapture(variant?: 'first' | 'repeat'): {
  cases: SourceScrollCase[];
  actualCounts: Record<string, number>;
};
export function readTimeScrollSourceCase(
  id: string,
  variant?: 'first' | 'repeat'
): SourceScrollCase;
export function readTimeScrollSourcePart<T = unknown>(part: SourcePart): T;
export function verifyAllTimeScrollSource(): { parts: number; blobs: number; sourceOnly: true; };
