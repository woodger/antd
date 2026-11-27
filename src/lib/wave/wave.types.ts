import type { GlobalToken } from '../theme/theme-component-token.types';

export type WaveComponent = 'Tag' | 'Button' | 'Checkbox' | 'Radio' | 'Switch' | 'Steps';
export type WaveTriggerType = 'click' | 'pointerdown' | 'pointerup' | 'mousedown' | 'mouseup';
export type WaveColorSource = 'color' | 'backgroundColor' | 'borderColor' | null;

/** Source Wave; event data is a native event, token is the full current GlobalToken. */
export interface WaveEffectInfo {
  className: string;
  token: GlobalToken;
  component?: WaveComponent;
  event: MouseEvent;
  hashId: string;
  colorSource?: WaveColorSource;
}

/** Replaces the standard effect; the created resources are managed by callback. */
export type ShowWaveEffect = (element: HTMLElement, info: WaveEffectInfo) => void;

/** Settings replace the parent wave record entirely; control events are not suppressed. */
export interface WaveConfig {
  /** Disables only effect. The default is false. */
  disabled?: boolean;
  showEffect?: ShowWaveEffect;
  /** Capture Event; the events of a single framework are combined. The default click. */
  triggerType?: WaveTriggerType;
}
