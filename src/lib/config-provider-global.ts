// Хранит браузерные настройки отдельных корней императивных вызовов.
import type { Snippet } from 'svelte';
import type { ThemeConfig } from './types';

export interface GlobalConfigProps {
  prefixCls?: string;
  iconPrefixCls?: string;
  theme?: ThemeConfig;
  /** Оборачивает содержимое отдельного корня статического вызова. */
  holderRender?: Snippet<[content: Snippet]>;
}

let config: Readonly<GlobalConfigProps> = {};

/** Применяет изменения для будущих рендеров без мутации серверного контекста. */
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

/** Настройки читаются в момент отложенного рендера. */
export function readGlobalConfig() {
  return config;
}
