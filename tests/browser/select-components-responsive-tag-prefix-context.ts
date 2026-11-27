import type { SelectSurfaceRecorder } from './select-surface-producers.mjs';
import type { SelectCustomTagPrefixSample } from './select-components-responsive-tag-prefix-cases.mjs';
export const customTagPrefixContext = Symbol('ordinary-custom-tag-prefix-context');
export interface CustomTagPrefixGeometry { tagWidth: number; closeWidth: number; restWidth: number; prefixWidth: number }
export interface CustomTagPrefixContext {
  readonly current: CustomTagPrefixGeometry;
  sample: SelectCustomTagPrefixSample; recorder: SelectSurfaceRecorder; bodyActivity: unknown[];
  event(...args: unknown[]): void;
  project(event: Event): { type: string; key: string | undefined; defaultPrevented: boolean; propagationStopped: boolean;
    target: string | undefined; currentTarget: string | undefined };
  handler<Value>(name: string, fn: Value): Value;
}
