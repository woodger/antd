import type { SpinConfig, SpinIndicator, SpinProps } from './spin.types';

let defaultIndicator: SpinIndicator | null | undefined;

/** As an upstream setter: the call itself does not update already mounted instances. */
export function setDefaultSpinIndicator(indicator: SpinIndicator | null | undefined) {
  defaultIndicator = indicator;
}

export function resolveSpinIndicator(props: SpinProps, config: SpinConfig | undefined) {
  return props.indicator ?? config?.indicator ?? defaultIndicator;
}
