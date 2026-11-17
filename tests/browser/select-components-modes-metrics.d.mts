import type { SelectIconNode, SelectIconsDOM } from './select-icons-metrics.mjs';
export interface SelectComponentsModesNode extends SelectIconNode {
  metrics: Record<'offsetWidth' | 'clientWidth' | 'scrollWidth' | 'offsetHeight' | 'clientHeight' | 'scrollHeight' | 'scrollTop' | 'scrollLeft', number | null>;
}
export interface SelectComponentsModesDOM extends Omit<SelectIconsDOM, 'current' | 'original' | 'nodes' | 'svg' | 'publicRefs'> {
  current: Record<keyof SelectIconsDOM['current'], SelectComponentsModesNode | null>;
  original: Partial<Record<keyof SelectIconsDOM['current'], SelectComponentsModesNode>>;
  nodes: SelectComponentsModesNode[];
  svg: SelectComponentsModesNode[];
  layout: SelectComponentsModesNode[];
  publicRefs: { rootMatches: boolean; authoredRoot: SelectComponentsModesNode | null; authoredInput: SelectComponentsModesNode | null; methods: Record<string, string> | null };
  formData: Array<[string, string]> | null;
}
export function readSelectIcons(): SelectComponentsModesDOM;
