// Combines theme inheritance settings and computes tokens from algorithms. Component tokens get
// their own algorithm or use a common result.
import defaultSeed from './theme-seed';
import { defaultAlgorithm, darkAlgorithm, compactAlgorithm } from './theme-algorithms.engine';
import { createDerivativeTheme } from './theme-cache';
import { DerivativeTheme } from './theme-derivative';
import { formatAliasToken } from './theme-alias.engine';
import { hashTokenString, tokenToKey } from './theme-hash.engine';
import { serializeThemeVariables, themeVariableScopes, transformThemeToken }
  from './theme-css-variables.engine';
import type { AliasToken, MappingAlgorithm, SeedToken } from './theme-token.types';
import type { ComponentsConfig, GlobalToken } from './theme-component-token.types';
import type { CSSVariableToken, DesignTokenState } from './theme-context.types';
import type { ResolvedThemeConfig, ThemeConfig } from '../types';

export const defaultThemeConfig: ResolvedThemeConfig = {
  mode: 'light', primary: 'blue', compact: false, hashed: true
};
// Rule 2: Receives one algorithm. An empty chain is impossible here.
const defaultTheme = createDerivativeTheme(defaultAlgorithm)!;
const sourceConfigKeys = ['token', 'algorithm', 'components', 'inherit', 'hashed', 'cssVar', 'zeroRuntime'];

// Identifies an extended theme by the presence of keys, including explicit undefined.
export function hasSourceTheme(config?: ThemeConfig): boolean {
  return !!config && sourceConfigKeys.some(key => key in config);
}

/** Source useTheme merge: component records merge according to one level, cssVar.key local. */
export function mergeThemeConfig(
  local: ThemeConfig | undefined,
  parent: ResolvedThemeConfig,
  id: string,
  prefixCls?: string
): ResolvedThemeConfig {
  if (!local) {
    return parent;
  }

  const base = local.inherit === false ? {
    ...defaultThemeConfig,
    hashed: parent.hashed ?? defaultThemeConfig.hashed,
    cssVar: parent.cssVar,
    zeroRuntime: parent.zeroRuntime
  } : parent;
  const components: ComponentsConfig = { ...base.components };
  for (const name of Object.keys(local.components ?? {}) as (keyof ComponentsConfig)[]) {
    Object.assign(components, { [name]: { ...components[name], ...local.components![name] } });
  }

  return {
    ...base,
    ...local,
    token: { ...base.token, ...local.token },
    components,
    cssVar: {
      ...(prefixCls === undefined ? {} : { prefix: prefixCls }),
      ...base.cssVar,
      ...local.cssVar,
      key: local.cssVar?.key || `css-var-${id.replace(/:/g, '')}`
    }
  };
}

type ParsedComponent = Record<string, unknown> & { theme?: DerivativeTheme; };

// Applies a general algorithm and calculates independent tokens of the components on top of the result.
function computeToken(
  seed: SeedToken,
  override: Partial<AliasToken>,
  components: Record<string, ParsedComponent>,
  theme: DerivativeTheme
): GlobalToken {
  const derivative = theme.getDerivativeToken(seed);
  const merged: GlobalToken = formatAliasToken({ ...derivative, override });

  for (const [name, value] of Object.entries(components)) {
    const { theme: componentTheme, ...tokens } = value;
    const result = componentTheme ? computeToken(
      { ...merged, ...tokens }, tokens as Partial<AliasToken>, {}, componentTheme
    ) : tokens;
    Object.assign(merged, { [name]: result });
  }

  return merged;
}

// Choosing a chain of algorithms. An empty explicit array uses the default theme.
function resolveDerivativeTheme(config: ResolvedThemeConfig): DerivativeTheme {
  let algorithm = config.algorithm;
  if (!algorithm) {
    const native: MappingAlgorithm[] = [];
    if (config.mode === 'dark') native.push(darkAlgorithm);
    if (config.compact) native.push(compactAlgorithm);
    algorithm = native.length ? native : defaultAlgorithm;
  }

  if (typeof algorithm !== 'function' && !algorithm.length) {
    return defaultTheme;
  }

  // Rule 2: After validation, passes one algorithm or a nonempty chain.
  return createDerivativeTheme(algorithm)!;
}

// Separates the algorithm from component tokens. The value of true inherits a common Theme.
function parseComponentTokens(
  config: ResolvedThemeConfig,
  theme: DerivativeTheme
): Record<string, ParsedComponent> {
  const components: Record<string, ParsedComponent> = {};
  for (const [name, component] of Object.entries(config.components ?? {})) {
    const parsed: ParsedComponent = { ...component };
    if ('algorithm' in parsed) {
      if (parsed.algorithm === true) {
        parsed.theme = theme;
      }
      else if (Array.isArray(parsed.algorithm) || typeof parsed.algorithm === 'function') {
        parsed.theme = createDerivativeTheme(
          parsed.algorithm as MappingAlgorithm | readonly MappingAlgorithm[]
        );
      }
      delete parsed.algorithm;
    }
    components[name] = parsed;
  }
  return components;
}

/** Runtime [] uses defaultTheme; component algorithm=true inherits a shared Theme. */
export function createDesignTokenState(
  config: ResolvedThemeConfig,
  prefixCls = 'ant'
): DesignTokenState {
  const theme = resolveDerivativeTheme(config);
  const components = parseComponentTokens(config, theme);

  const nativePrimary = {
    blue: defaultSeed.colorPrimary,
    purple: defaultSeed.purple,
    green: defaultSeed.green
  };
  const seed = {
    ...defaultSeed,
    colorPrimary: nativePrimary[config.primary] ?? defaultSeed.colorPrimary,
    ...config.token
  };
  const merged = computeToken(seed, seed, components, theme);

  const actualToken = { ...merged };
  const prefix = config.cssVar?.prefix ?? prefixCls;
  const key = config.cssVar?.key ?? 'css-var-root';
  const salt = `6.6.8-${config.hashed || ''}`;
  const mergedSalt = `${salt}_${prefix}`;
  const hash = hashTokenString(mergedSalt);
  // _tokenKey does not participate in its own hash.
  const token = Object.assign(actualToken, { _tokenKey: tokenToKey(actualToken, mergedSalt) });
  const transformed = transformThemeToken(merged, prefix);
  const cssVar = { ...transformed.token, _hashId: hash } as CSSVariableToken;
  const scope = themeVariableScopes(transformed.variables, prefix, key);

  return {
    theme,
    token,
    hashId: config.hashed
      ? `${process.env.NODE_ENV !== 'production' ? 'css-dev-only-do-not-override' : 'css'}-${hash}`
      : '',
    cssVar,
    prefix,
    key,
    style: `${serializeThemeVariables(transformed.variables, prefix)};${scope.snapshots}`,
    scopeCSS: scope.css
  };
}
