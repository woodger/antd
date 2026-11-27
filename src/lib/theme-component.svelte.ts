import { useDesignTokenContext } from './theme-context.svelte';
import {
  compactComponentThemeStyle,
  componentThemeStyle,
  inheritedComponentThemeStyle,
  type StyledComponent
} from './theme-component-style.engine';

/** SSR and reactive root style before semantic/user styles; compact native only gets metrics. */
export function useComponentTheme(component: StyledComponent) {
  const context = useDesignTokenContext();
  const explicitKeys = $derived(component === 'Notification'
    ? (['colorSuccessBg', 'colorErrorBg', 'colorInfoBg', 'colorWarningBg'] as const)
      .filter(key => context.config.components?.Notification?.[key] !== undefined)
    : []);
  const style = $derived(context.enabled
    ? componentThemeStyle(component, context.state.token, context.state.prefix, explicitKeys)
    : context.config.compact ? compactComponentThemeStyle(component, context.state.token) : undefined);
  const inheritedStyle = $derived(context.enabled
    ? inheritedComponentThemeStyle(component, context.state.token) : undefined);

  return {
    get style() { return style; },
    get inheritedStyle() { return inheritedStyle; },
    get className() {
      return context.enabled ? [context.state.key, context.state.hashId].filter(Boolean).join(' ')
        : undefined;
    }
  };
}
