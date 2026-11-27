export interface TreeSelectMotionSettings {
  animation?: string;
  transitionName?: string;
  prefix?: string;
  local?: string;
  motion?: boolean;
  selectMotion?: boolean;
  treeSelectMotion?: boolean;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface TreeSelectMotionSample extends TreeSelectMotionSettings {
  id: string;
  scene: string;
  css: 'source' | 'animation' | 'transition' | 'none';
  initialOpen?: boolean;
  defaultOpen?: boolean;
  warmMotionProvider?: boolean;
  reduced?: boolean;
  slot?: 'root-button' | 'root-composite' | 'input';
  multiple?: boolean;
  container?: 'host' | 'shadow';
}

export type TreeSelectMotionAction =
  | { type: 'click' | 'outside' | 'escape' | 'focus' }
  | { type: 'open'; value: boolean }
  | { type: 'label'; value: string }
  | { type: 'left'; value: number }
  | { type: 'props'; set?: TreeSelectMotionSettings; unset?: readonly (keyof TreeSelectMotionSettings)[] }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'draft'; text: string; start: number; end: number }
  | { type: 'end'; target: 'popup' | 'child'; event: 'animationend' | 'transitionend'; name?: string }
  | { type: 'frame'; count: number }
  | { type: 'clock'; time: number }
  | { type: 'viewport'; width: number; height: number }
  | { type: 'choose'; value: 'a' | 'b' };

export const treeSelectMotionSamples: readonly TreeSelectMotionSample[] = [
  { id: 'default-omitted', scene: 'lifecycle', css: 'source' },
  { id: 'transition-undefined', scene: 'simple', css: 'source', transitionName: undefined },
  { id: 'transition-empty', scene: 'simple', css: 'none', transitionName: '' },
  { id: 'animation-undefined', scene: 'simple', css: 'source', animation: undefined },
  { id: 'animation-empty', scene: 'simple', css: 'source', animation: '' },
  { id: 'animation-priority', scene: 'simple', css: 'animation', animation: 'audit-spin', transitionName: 'audit-custom' },
  { id: 'animation-over-empty', scene: 'simple', css: 'animation', animation: 'audit-spin', transitionName: '' },
  { id: 'animation-empty-fallback', scene: 'simple', css: 'animation', animation: '', transitionName: 'audit-custom' },
  { id: 'custom-animation', scene: 'lifecycle', css: 'animation', transitionName: 'audit-custom', container: 'host' },
  { id: 'custom-transition', scene: 'lifecycle', css: 'transition', transitionName: 'audit-transition', container: 'host' },
  { id: 'global-prefix-default', scene: 'simple', css: 'source', prefix: 'orbit' },
  { id: 'local-prefix-default', scene: 'simple', css: 'source', local: 'leaf-choice' },
  { id: 'global-local-animation', scene: 'simple', css: 'animation', prefix: 'orbit', local: 'leaf-choice', animation: 'audit-spin' },
  { id: 'context-false', scene: 'simple', css: 'animation', motion: false, transitionName: 'audit-custom' },
  { id: 'context-live', scene: 'context', css: 'animation', transitionName: 'audit-custom' },
  { id: 'context-prewrapped-live', scene: 'context', css: 'animation', warmMotionProvider: true, transitionName: 'audit-custom' },
  { id: 'reduced-custom', scene: 'simple', css: 'animation', reduced: true, transitionName: 'audit-custom' },
  { id: 'live-animation-name', scene: 'animation-name', css: 'animation', animation: 'audit-spin', transitionName: 'audit-custom' },
  { id: 'live-transition-name', scene: 'transition-name', css: 'animation', transitionName: 'audit-custom' },
  { id: 'live-empty-name', scene: 'empty-name', css: 'animation', transitionName: 'audit-custom' },
  { id: 'rapid-reopen-animation', scene: 'rapid', css: 'animation', transitionName: 'audit-custom' },
  { id: 'rapid-reopen-transition', scene: 'rapid', css: 'transition', transitionName: 'audit-transition' },
  { id: 'hidden-content-cache', scene: 'cache', css: 'animation', transitionName: 'audit-custom' },
  { id: 'outside-escape-choice', scene: 'interactions', css: 'animation', transitionName: 'audit-custom' },
  { id: 'default-open-appear', scene: 'initial', css: 'animation', defaultOpen: true, transitionName: 'audit-custom' },
  { id: 'controlled-initial-open', scene: 'initial', css: 'animation', initialOpen: true, transitionName: 'audit-custom' },
  { id: 'zero-css-name', scene: 'zero-css', css: 'none', transitionName: 'no-css-name' },
  { id: 'select-component-motion-false', scene: 'zero-css', css: 'source', selectMotion: false },
  { id: 'tree-select-component-motion-false', scene: 'zero-css', css: 'source', treeSelectMotion: false },
  { id: 'custom-root-composite', scene: 'editor', css: 'animation', slot: 'root-composite', transitionName: 'audit-custom' },
  { id: 'custom-input-transition', scene: 'editor', css: 'transition', slot: 'input', transitionName: 'audit-transition' },
  { id: 'shadow-animation', scene: 'editor', css: 'animation', container: 'shadow', transitionName: 'audit-custom' },
  { id: 'custom-root-button', scene: 'simple', css: 'animation', slot: 'root-button', transitionName: 'audit-custom' },
  { id: 'multiple-choice', scene: 'multiple', css: 'animation', multiple: true, transitionName: 'audit-custom' },
  { id: 'explicit-move-name', scene: 'lifecycle', css: 'source', transitionName: 'ant-move-up' },
  { id: 'top-placement-default', scene: 'lifecycle', css: 'source', placement: 'topRight' }
];

/** Consumer CSS is identical in Source and Native; default slide CSS remains the pinned vendor CSS. */
export const treeSelectMotionCss = `
@keyframes auditMotionIn {
  from { transform:scaleY(.75);`
  + `opacity:.4 }
  to { transform:scaleY(1);`
  + `opacity:1 }
}
@keyframes auditMotionOut {
  from { transform:scaleY(1);`
  + `opacity:1 }
  to { transform:scaleY(.75);`
  + `opacity:.4 }
}
.motion-audit-popup:is([class*="audit-custom-"],[class*="audit-replaced-"],[class*="-dropdown-audit-spin-"],[class*="-dropdown-audit-bounce-"]) {
  animation-duration:1000ms;`
  + `animation-fill-mode:both;`
  + `animation-timing-function:linear;
  animation-play-state:paused;`
  + `transform-origin:0 0;
}
.motion-audit-popup:is([class*="audit-custom-appear-active"],[class*="audit-custom-enter-active"],[class*="audit-replaced-appear-active"],[class*="audit-replaced-enter-active"],[class*="-dropdown-audit-spin-appear-active"],[class*="-dropdown-audit-spin-enter-active"],[class*="-dropdown-audit-bounce-appear-active"],[class*="-dropdown-audit-bounce-enter-active"]) {
  animation-name:auditMotionIn;`
  + `animation-play-state:running;
}
.motion-audit-popup:is([class*="audit-custom-leave-active"],[class*="audit-replaced-leave-active"],[class*="-dropdown-audit-spin-leave-active"],[class*="-dropdown-audit-bounce-leave-active"]) {
  animation-name:auditMotionOut;`
  + `animation-play-state:running;
}
.audit-transition-appear,.audit-transition-enter {
  transform:scaleY(.75);`
  + `transform-origin:0 0;
}
.audit-transition-appear-prepare,.audit-transition-enter-prepare {
  transform:scaleY(1);
}
.audit-transition-appear-active,.audit-transition-enter-active {
  transform:scaleY(1);`
  + `transition:transform 1000ms linear;`
  + `transform-origin:0 0;
}
.audit-transition-leave {
  transform:scaleY(1);`
  + `transform-origin:0 0;
}
.audit-transition-leave-active {
  transform:scaleY(.75);`
  + `transition:transform 1000ms linear;`
  + `transform-origin:0 0;
}
`;

export function treeSelectMotionActions(sample: TreeSelectMotionSample): readonly TreeSelectMotionAction[] {
  const frame = (count: number): TreeSelectMotionAction => ({ type: 'frame', count });
  const clock = (time: number): TreeSelectMotionAction => ({ type: 'clock',
    time: sample.css === 'source'
      ? sample.selectMotion === false || sample.treeSelectMotion === false ? 0 : time / 5 : time });
  const own: TreeSelectMotionAction = { type: 'end', target: 'popup', event: sample.css === 'transition' ? 'transitionend' : 'animationend', name: 'any-own-effect' };
  const child: TreeSelectMotionAction = { ...own, target: 'child' };
  const open: TreeSelectMotionAction[] = sample.defaultOpen || sample.initialOpen ? [] : [{ type: 'click' }];
  const appear: TreeSelectMotionAction[] = [...open, frame(1), frame(1), frame(2), frame(2), clock(0)];
  const close: TreeSelectMotionAction[] = [sample.defaultOpen ? { type: 'outside' } : { type: 'open', value: false }, frame(1), frame(3), clock(250), child, own, frame(4)];
  if (sample.scene === 'animation-name') return [...appear,
    { type: 'props', set: { animation: 'audit-bounce' } }, frame(2), clock(500), child, own, frame(4), ...close];
  if (sample.scene === 'transition-name') return [...appear,
    { type: 'props', set: { transitionName: 'audit-replaced' } }, frame(2), clock(500), child, own, frame(4), ...close];
  if (sample.scene === 'empty-name') return [...appear,
    { type: 'props', set: { transitionName: '' } }, { type: 'left', value: 316 },
    { type: 'viewport', width: 1240, height: 820 }, frame(4), child, own, frame(4), ...close];
  if (sample.scene === 'context') return [...appear,
    { type: 'draft', text: 'Kept motion draft', start: 1, end: 5 },
    { type: 'props', set: { motion: false } }, frame(4),
    { type: 'props', set: { motion: true } }, frame(4), own, frame(4), ...close];
  if (sample.scene === 'rapid') return [...appear, own, frame(4),
    { type: 'open', value: false }, frame(4), clock(250), { type: 'open', value: true },
    frame(1), frame(3), clock(500), child, own, frame(4), ...close];
  if (sample.scene === 'zero-css') return [...appear, frame(30), child, own, frame(4), ...close];
  if (sample.scene === 'cache') return [...appear,
    { type: 'draft', text: 'Kept motion draft', start: 1, end: 5 }, own, frame(4), ...close,
    { type: 'label', value: 'Panel label B' }, frame(4), { type: 'click' }, frame(6), clock(500), own, frame(4)];
  if (sample.scene === 'interactions') return [...appear, own, frame(4),
    { type: 'outside' }, frame(4), child, own, frame(4), { type: 'click' }, frame(6), own,
    { type: 'escape' }, frame(4), own, frame(4), { type: 'click' }, frame(6), own,
    { type: 'choose', value: 'b' }, frame(4), own, frame(4)];
  if (sample.scene === 'editor') return [...appear,
    { type: 'fill', text: 'Motion draft' }, { type: 'caret', start: 1, end: 5 }, clock(500),
    { type: 'props', set: { transitionName: sample.css === 'transition' ? 'audit-transition' : 'audit-replaced' } },
    frame(2), child, own, frame(4), ...close];
  if (sample.scene === 'multiple') return [...appear, own, frame(4),
    { type: 'choose', value: 'b' }, frame(4), ...close];
  if (sample.scene === 'lifecycle') return [...appear, clock(500), child, own, frame(4), ...close,
    { type: 'click' }, frame(1), frame(1), frame(2), frame(2), clock(500), own, frame(4), ...close];
  return [...appear, clock(500), child, own, frame(4), ...close];
}
