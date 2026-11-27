import type { MapToken, MappingAlgorithm, SeedToken } from './theme-token.types';

let nextThemeId = 0;

/** Original cssinjs theme object. The algorithm array retains its reference. */
export class DerivativeTheme {
  private derivatives: readonly MappingAlgorithm[];
  readonly id: number;

  constructor(derivatives: MappingAlgorithm | readonly MappingAlgorithm[]) {
    this.derivatives = typeof derivatives === 'function' ? [derivatives] : derivatives;
    this.id = nextThemeId++;
  }

  getDerivativeToken(token: SeedToken): MapToken {
    return this.derivatives.reduce<MapToken | undefined>(
      (result, derivative) => derivative(token, result),
      undefined
    )!;
  }
}
