import { getContext, setContext, untrack } from 'svelte';
import {
  createDesignTokenState,
  defaultThemeConfig,
  hasSourceTheme,
  mergeThemeConfig
} from './theme-config.engine';
import type { DesignTokenContext, ThemeTokenResult } from './theme-context.types';
import type { ThemeConfig } from '../types';

const designTokenKey = Symbol('ant-design-tokens');
let defaultState: ReturnType<typeof createDesignTokenState> | undefined;
const defaultContext: DesignTokenContext = {
  config: defaultThemeConfig,
  enabled: false,
  get state() {
    return defaultState ??= createDesignTokenState(defaultThemeConfig);
  },
  style: undefined
};

export function useDesignTokenContext(): DesignTokenContext {
  return getContext<DesignTokenContext | undefined>(designTokenKey) ?? defaultContext;
}

/** Captures component stylesheet registration for the lifetime of the mounted instance. */
export function useRuntimeStyles(): boolean {
  const context = useDesignTokenContext();

  return untrack(() => !context.config.zeroRuntime);
}

/** Local theme creates scope, missing theme preserves parent token/state. */
export function provideDesignTokens(
  getTheme: () => ThemeConfig | undefined,
  id: string,
  getElement?: () => HTMLElement | undefined,
  getPrefixCls?: () => string
) {
  const parent = useDesignTokenContext();
  const enabled = $derived(hasSourceTheme(getTheme()) || parent.enabled);
  const config = $derived(mergeThemeConfig(getTheme(), parent.config, id,
    enabled ? getPrefixCls?.() : undefined));
  const state = $derived(getTheme()
    ? createDesignTokenState(config, enabled ? getPrefixCls?.() : undefined) : parent.state);
  const context: DesignTokenContext = {
    get element() { return getElement?.() ?? parent.element; },
    get config() { return config; },
    get enabled() { return enabled; },
    get state() { return state; },
    get style() { return enabled ? state.style : undefined; }
  };
  setContext(designTokenKey, context);

  return context;
}

/** Caused by initialization; getter-fields are read reactively without repeated getContext. */
export function useToken(): ThemeTokenResult {
  const context = useDesignTokenContext();

  return {
    get theme() { return context.state.theme; },
    get token() { return context.state.token; },
    get hashId() { return context.state.hashId; },
    get cssVar() { return context.state.cssVar; }
  };
}
