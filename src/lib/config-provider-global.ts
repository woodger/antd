// Stores browser configuration for separate roots of imperative calls.
import type { Snippet } from 'svelte';
import type { ThemeConfig } from './types';

export interface GlobalConfigProps {
  prefixCls?: string;
  iconPrefixCls?: string;
  theme?: ThemeConfig;
  /** Wraps content in the separate root of a static call. */
  holderRender?: Snippet<[content: Snippet]>;
}

let config: Readonly<GlobalConfigProps> = {};

/** Applies changes to future renders without mutating server context. */
export function configureGlobal(options: GlobalConfigProps) {
  if (typeof document === 'undefined') {
    return;
  }

  config = {
    prefixCls: options.prefixCls ?? config.prefixCls,
    iconPrefixCls: options.iconPrefixCls ?? config.iconPrefixCls,
    theme: options.theme ?? config.theme,
    holderRender: 'holderRender' in options ? options.holderRender : config.holderRender
  };
}

/** Reads configuration when the deferred render occurs. */
export function readGlobalConfig() {
  return config;
}
