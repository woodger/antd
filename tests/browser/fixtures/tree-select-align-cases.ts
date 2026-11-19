export type TreeSelectAlignCorner = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
export interface TreeSelectAlignInput {
  points?: readonly string[];
  offset?: readonly (number | `${number}%`)[];
  targetOffset?: readonly (number | `${number}%`)[];
  overflow?: {
    adjustX?: boolean | number;
    adjustY?: boolean | number;
    shiftX?: boolean | number;
    shiftY?: boolean | number;
  };
  dynamicInset?: boolean;
  htmlRegion?: 'visible' | 'scroll' | 'visibleFirst';
  autoArrow?: boolean;
  useCssRight?: boolean; useCssBottom?: boolean; useCssTransform?: boolean; ignoreShake?: boolean;
}
export type TreeSelectAlignMap = Readonly<Record<string, TreeSelectAlignInput>>;
export interface TreeSelectAlignSettings {
  provider?: 'ltr' | 'rtl'; placement?: TreeSelectAlignCorner;
  popupAlign?: TreeSelectAlignInput; builtinPlacements?: TreeSelectAlignMap;
  width?: number; popupWidth?: number;
}
export interface TreeSelectAlignSample extends TreeSelectAlignSettings {
  id: string; scene: string;
  slot?: 'root-button' | 'root-composite' | 'input-responsive';
  container?: 'host' | 'shadow';
  left?: number; top?: number;
  scrollAncestor?: boolean;
  multiple?: boolean;
  hostStyle?: {
    width?: number;
    height?: number;
    border?: number;
    padding?: number;
    scale?: number;
    overflow?: 'hidden' | 'clip' | 'auto';
  };
  surface?: { margin?: readonly [number, number]; translate?: readonly [number, number]; };
}
export type TreeSelectAlignAction =
  | { type: 'click' | 'outside' | 'focus' }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | {
    type: 'props';
    set?: TreeSelectAlignSettings;
    unset?: readonly (keyof TreeSelectAlignSettings)[]
  }
  | { type: 'viewport'; width: number; height: number }
  | { type: 'scroll'; top: number; left: number }
  | { type: 'host'; left?: number; top?: number; width?: number; height?: number }
  | { type: 'choose' | 'remove'; value: 'a' | 'b' };
const customMap: TreeSelectAlignMap = { bottomLeft: {
  points: ['tl', 'bl'], offset: [11, 17], overflow: { adjustX: true, adjustY: true }, dynamicInset: false
} };
const percentages: TreeSelectAlignInput = {
  offset: ['25%', '-10%'], targetOffset: ['50%', '25%'], overflow: {
    adjustX: false,
    adjustY: false
  }
};
export const treeSelectAlignSamples: readonly TreeSelectAlignSample[] = [
  { id: 'default-ltr', scene: 'defaults' },
  { id: 'default-rtl', scene: 'defaults', provider: 'rtl' },
  ...(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map(placement => ({
    id: `corner-${placement}`,
    scene: 'corners',
    placement
  })),
  { id: 'map-offset', scene: 'explicit-map', builtinPlacements: customMap },
  {
    id: 'map-shallow-overflow',
    scene: 'shallow-map',
    left: 1000,
    builtinPlacements: customMap,
    popupAlign: { offset: [5, 8], overflow: { adjustY: true } }
  },
  { id: 'map-empty', scene: 'empty-map', builtinPlacements: {} },
  {
    id: 'map-missing',
    scene: 'missing-map',
    builtinPlacements: { topLeft: { points: ['bl', 'tl'], offset: [0, -4] } }
  },
  { id: 'percent-target', scene: 'percentages', popupAlign: percentages },
  {
    id: 'points-inset-false',
    scene: 'points-flags',
    popupAlign: {
      ...percentages,
      points: ['tr-extra', 'br-extra'],
      dynamicInset: false,
      useCssRight: true,
      useCssBottom: true,
      useCssTransform: true,
      ignoreShake: true
    }
  },
  {
    id: 'cache-provided',
    scene: 'provided-cache',
    scrollAncestor: true,
    popupAlign: { offset: [9, 13] }
  },
  { id: 'cache-missing', scene: 'missing-cache', builtinPlacements: {} },
  { id: 'provider-placement-live', scene: 'provider-live' },
  { id: 'edge-flip-y', scene: 'viewport-flip', top: 740, popupAlign: {} },
  {
    id: 'edge-shift-y',
    scene: 'viewport-shift',
    top: 740,
    popupAlign: { overflow: { adjustY: false, shiftY: true } }
  },
  {
    id: 'region-scroll',
    scene: 'regions',
    top: 740,
    popupAlign: { htmlRegion: 'scroll', overflow: { adjustY: true } }
  },
  {
    id: 'region-visible-first',
    scene: 'regions',
    top: 740,
    popupAlign: { htmlRegion: 'visibleFirst', overflow: { adjustY: true } }
  },
  {
    id: 'overflow-adjust-zero',
    scene: 'numeric-overflow',
    top: 740,
    popupAlign: { overflow: { adjustY: 0 } }
  },
  {
    id: 'overflow-adjust-negative',
    scene: 'numeric-overflow',
    top: 740,
    popupAlign: { overflow: { adjustY: -1 } }
  },
  {
    id: 'root-button',
    scene: 'registered-root',
    slot: 'root-button',
    placement: 'bottomRight',
    popupAlign: { offset: [7, 11] }
  },
  {
    id: 'root-composite',
    scene: 'registered-root',
    slot: 'root-composite',
    popupAlign: { offset: [9, 13] }
  },
  {
    id: 'input-responsive',
    scene: 'responsive-input',
    slot: 'input-responsive',
    popupAlign: { offset: [7, 11] }
  },
  {
    id: 'container-top-right',
    scene: 'container-axes',
    container: 'host',
    placement: 'topRight',
    popupAlign: {}
  },
  {
    id: 'container-left-inset-false',
    scene: 'container-axes',
    container: 'host',
    popupAlign: { dynamicInset: false }
  },
  {
    id: 'shadow-runtime',
    scene: 'shadow-container',
    container: 'shadow',
    placement: 'bottomRight',
    popupAlign: { offset: [9, 13] }
  },
  {
    id: 'multiple-choice-live',
    scene: 'value-events',
    multiple: true,
    popupAlign: { offset: [7, 11] }
  },
  {
    id: 'host-border-margin-transform',
    scene: 'surface-frame',
    container: 'host',
    hostStyle: { border: 3, padding: 11 },
    surface: { margin: [5.5, 7], translate: [2, 3] },
    popupAlign: { overflow: { adjustX: false, adjustY: false } }
  },
  {
    id: 'host-scale-bottom-left',
    scene: 'surface-scale',
    container: 'host',
    hostStyle: { scale: 1.25 },
    placement: 'bottomLeft',
    popupAlign: { overflow: { adjustX: false, adjustY: false } }
  },
  {
    id: 'host-scale-top-right',
    scene: 'surface-scale',
    container: 'host',
    hostStyle: { scale: 1.25 },
    placement: 'topRight',
    popupAlign: { overflow: { adjustX: false, adjustY: false } }
  },
  {
    id: 'host-clip-border',
    scene: 'surface-clip',
    container: 'host',
    hostStyle: { height: 64, border: 4, padding: 12, overflow: 'hidden' },
    popupAlign: {}
  }
];
export function treeSelectAlignActions(sample: TreeSelectAlignSample): readonly TreeSelectAlignAction[] {
  const open: TreeSelectAlignAction = { type: 'click' }, outside: TreeSelectAlignAction = { type: 'outside' };
  if (sample.id === 'cache-provided') return [open, { type: 'fill', text: 'Draft' }, {
    type: 'caret',
    start: 1,
    end: 4
  },
    { type: 'props', set: { popupAlign: { offset: [21, 25] } } }, {
      type: 'viewport',
      width: 1240,
      height: 820
    },
    {
      type: 'props',
      set: {
        builtinPlacements: { bottomLeft: { points: ['tr', 'br'], offset: [3, 9], dynamicInset: false } },
        popupAlign: { offset: [15, 19] }
      }
    },
    { type: 'scroll', top: 24, left: 16 }, {
      type: 'props',
      set: { popupAlign: { offset: [17, 23] } }
    },
    { type: 'props', set: { width: 240 } }, outside];
  if (sample.id === 'cache-missing') return [open,
    { type: 'props', set: { popupAlign: { offset: [7, 9] } } },
    {
      type: 'props',
      set: { builtinPlacements: { topLeft: { points: ['bl', 'tl'], offset: [0, -4] } } }
    },
    { type: 'props', set: { popupAlign: { points: ['tr', 'br'], offset: [11, 15] } } },
    {
      type: 'props',
      set: { builtinPlacements: { bottomLeft: { points: ['tl', 'bl'], offset: [3, 5] } } }
    },
    { type: 'props', set: { popupAlign: { offset: [19, 23] } } }, {
      type: 'viewport',
      width: 1240,
      height: 820
    }, outside];
  if (sample.id === 'provider-placement-live') return [open,
    { type: 'props', set: { provider: 'rtl' } }, { type: 'props', set: { placement: 'topLeft' } },
    { type: 'props', set: { provider: 'ltr' } }, { type: 'props', unset: ['placement'] }, outside];
  if (sample.id === 'root-composite') return [open, { type: 'fill', text: 'Root draft' }, {
    type: 'caret',
    start: 1,
    end: 4
  },
    { type: 'props', set: { popupAlign: { offset: [17, 21] } } }, {
      type: 'viewport',
      width: 1240,
      height: 820
    }, outside];
  if (sample.slot === 'input-responsive') return [open, { type: 'fill', text: 'BetaWWW12345' }, {
    type: 'caret',
    start: 1,
    end: 4
  },
    { type: 'props', set: { popupAlign: { offset: [13, 19] } } }, {
      type: 'viewport',
      width: 1240,
      height: 820
    }, outside];
  if (sample.container === 'host') return [open, { type: 'host', left: 16, top: 20 },
    { type: 'host', width: 460, height: 180 }, { type: 'viewport', width: 1240, height: 820 }, outside];
  if (sample.container === 'shadow') return [open, { type: 'fill', text: 'Shadow draft' }, {
    type: 'caret',
    start: 2,
    end: 6
  },
    { type: 'props', set: { popupAlign: { offset: [15, 17] } } }, {
      type: 'viewport',
      width: 1240,
      height: 820
    }, outside];
  if (sample.multiple) return [open, { type: 'props', set: { popupAlign: { offset: [13, 17] } } },
    { type: 'choose', value: 'b' }, { type: 'remove', value: 'a' }, {
      type: 'viewport',
      width: 1240,
      height: 820
    }, outside];
  if (sample.scene === 'viewport-flip' || sample.scene === 'viewport-shift' || sample.scene === 'regions' || sample.scene === 'numeric-overflow')
    return [open, { type: 'viewport', width: 1240, height: 780 }, {
      type: 'viewport',
      width: 1200,
      height: 900
    }, outside];
  return [open, outside];
}
