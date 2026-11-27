import defaultSeed from './theme-seed';
import { defaultAlgorithm, darkAlgorithm, compactAlgorithm } from './theme-algorithms.engine';
import { formatAliasToken } from './theme-alias.engine';
import type { AliasToken, MapToken } from './theme-token.types';
import type { ThemeConfig } from './types';

/**
 * Static AliasToken Ant Design 6.6.8. Each call returns a new object. Copies seed, performs
 * algorithms in order and then applies alias overrides. An empty array of algorithms throws
 * TypeError as fixed upstream.
 */
export function getDesignToken(config?: ThemeConfig): AliasToken {
  const algorithm = config?.algorithm;
  const algorithms = algorithm
    ? typeof algorithm === 'function' ? [algorithm] : algorithm
    : [defaultAlgorithm];
  const seed = { ...defaultSeed, ...config?.token };
  const override = config?.token;

  if (algorithms.length === 0) {
    // createTheme([]) in cssinjs 2.1.2 does not return the topic; save the original error.
    throw new TypeError('Cannot read properties of undefined (reading \'getDerivativeToken\')');
  }

  const mapToken = algorithms.reduce<MapToken | undefined>(
    (previous, derive) => derive(seed, previous),
    undefined
  );

  return formatAliasToken({ ...mapToken!, override });
}

/** Static part of theme API; context/useToken are located in theme-context.svelte.ts. */
export const theme = {
  defaultSeed,
  defaultAlgorithm,
  darkAlgorithm,
  compactAlgorithm,
  getDesignToken
};
