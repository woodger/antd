import type { SelectSurfaceRecorder } from './select-surface-producers.mjs';
export const tagCloseHandlesContext = Symbol('ordinary-public-tag-close-handles');
export interface TagCloseHandlesContext { recorder: SelectSurfaceRecorder; bodyActivity: unknown[] }
