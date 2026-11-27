import type { DerivativeTheme } from './theme-derivative';
import type { AliasToken } from './theme-token.types';
import type { GlobalToken } from './theme-component-token.types';
import type { ResolvedThemeConfig } from '../types';

/** Source CSS-variable token: breakpoints are saved, other primitives are replaced var(...). */
export type CSSVariableToken = Partial<{
  [Key in keyof AliasToken]: string | AliasToken[Key];
}> & { _hashId: string; };

/**
 * Reactive result of theme.useToken(). Call during component initialization. Read fields in
 * $derived or markup to retain the link to ConfigProvider. cssVar holds Ant Design 6.6.8's
 * transformed token rather than { prefix, key }.
 */
export interface ThemeTokenResult {
  readonly theme: DerivativeTheme;
  readonly token: GlobalToken;
  readonly hashId: string;
  readonly cssVar: CSSVariableToken;
}

export interface DesignTokenState extends ThemeTokenResult {
  readonly token: GlobalToken & { _tokenKey: string; };
  readonly prefix: string;
  readonly key: string;
  readonly style: string;
  readonly scopeCSS: string;
}

export interface DesignTokenContext {
  /** DOM boundary owner for portal CSS overrides; at SSR missing. */
  readonly element?: HTMLElement;
  readonly config: ResolvedThemeConfig;
  readonly enabled: boolean;
  readonly state: DesignTokenState;
  readonly style: string | undefined;
}
