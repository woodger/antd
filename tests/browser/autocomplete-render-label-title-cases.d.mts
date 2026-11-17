export interface LabelTitleSample { id: string; custom: boolean; title?: string;
  ssrState?: { name: string; renderer: 'string' | 'zero' | 'null' | 'undefined'; open: boolean } }
export type LabelTitleAction = { type: 'renderer'; kind: 'string' | 'zero' | 'null' | 'undefined' } | { type: 'click' | 'outside' };
export const labelTitleSamples: LabelTitleSample[];
export const labelTitleActions: LabelTitleAction[];
export const labelTitleSSRStates: Array<NonNullable<LabelTitleSample['ssrState']>>;
export const labelTitleGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
