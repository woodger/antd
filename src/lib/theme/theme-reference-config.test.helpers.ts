// Restores the runtime values stored in the JSON theme references shared by the unit tests.
import { theme } from './theme.engine';
import type { ThemeConfig } from '../types';

type AlgorithmName = 'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm';
type ComponentReference = Record<string, unknown> & { algorithm?: boolean | AlgorithmName[]; };

export type ThemeReferenceConfig = Omit<ThemeConfig, 'algorithm' | 'components'> & {
  algorithm?: AlgorithmName[];
  components?: Record<string, ComponentReference>;
};

export type ThemeTokenReferenceConfig = Omit<ThemeReferenceConfig, 'token'> & {
  token?: Record<string, unknown>;
};

/** Restores explicit undefined overrides without removing their keys. */
function restoreTokens(tokens: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(tokens).map(([name, value]) => {
    const recordedUndefined = value && typeof value === 'object'
      && '$type' in value && value.$type === 'undefined';
    return [name, recordedUndefined ? undefined : value] as const;
  });

  return Object.fromEntries(entries);
}

/** Resolves a component's token overrides and keeps the recorded algorithm order. */
function restoreComponentTokens(component: ComponentReference): Record<string, unknown> {
  const tokens = restoreTokens(component);
  const { algorithm } = component;
  if (Array.isArray(algorithm)) {
    tokens.algorithm = algorithm.map(name => theme[name]);
  }

  return tokens;
}

/** Resolves algorithm names and component overrides in a theme reference. */
export function resolveThemeReference(input: ThemeReferenceConfig): ThemeConfig {
  const { algorithm, components, ...settings } = input;
  const resolvedComponents = components && Object.fromEntries(
    Object.entries(components).map(([name, component]) => [name, restoreComponentTokens(component)])
  );

  return {
    ...settings,
    ...(algorithm ? { algorithm: algorithm.map(name => theme[name]) } : {}),
    ...(resolvedComponents ? { components: resolvedComponents } : {})
  };
}

/** Also restores the explicit undefined overrides recorded in the root token layer. */
export function resolveThemeTokenReference(input: ThemeTokenReferenceConfig): ThemeConfig {
  const { token, ...settings } = input;
  const restored = token ? { token: restoreTokens(token) } : {};

  return resolveThemeReference({ ...settings, ...restored });
}
