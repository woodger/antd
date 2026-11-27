# Static design token calculation

`theme.getDesignToken(config)` computes the final colors, sizes, and spacing for a
theme. You can call it on the server. Inside a component, call `theme.useToken()`
to read values from the nearest `ConfigProvider`. [Reading tokens in a component](theme-context.md#read-tokens-in-a-component)

```ts
import { theme, type DesignTokenConfig } from '@woodger/antd';

const config: DesignTokenConfig = {
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  token: { colorPrimary: '#1677ff', borderRadius: 8 }
};

const token = theme.getDesignToken(config);
// token.colorPrimary === '#1668dc'
// token.fontSize === 12
// token.controlHeight === 28
```

## Seed, map, and alias tokens

`defaultSeed` contains the initial Ant Design values. `defaultAlgorithm(seed)`
returns a MapToken with palettes, sizes, fonts, radii, and motion durations.
`darkAlgorithm(seed, previousMap?)` and `compactAlgorithm(seed, previousMap?)`
continue the chain. Without previousMap, they first use defaultAlgorithm.

`getDesignToken(config?)` copies defaultSeed and config.token, runs the algorithms
in order, and returns a new AliasToken. The standard result contains 536 fields
and uses current palette keys such as `blue1`. Computation preserves upstream rounding,
formulas, and shadow strings. Explicit zeros and negative numbers are retained.

Algorithms receive seed overrides. The other overrides apply before computing
aliases and again at the end. For example, fontSizeLG and lineHeightLG influence
fontHeightLG, while an explicit controlItemBgActive retains its value.
`motion: false` sets calculated durations to zero and `focusOutline: false` sets
lineWidthFocus to zero. An explicit final alias override can replace those values,
as in the reference.

## Custom algorithms

MappingAlgorithm receives the same seed object at each step, together with the
MapToken from the previous step or undefined at the first step. The functions run
synchronously and propagate their exceptions to the caller. The chain uses reduce
like upstream cssinjs, so adding a callback to the array during calculation leaves
it for a later pass.

```ts
import { theme, type MappingAlgorithm } from '@woodger/antd';

const largeControls: MappingAlgorithm = (seed, map) => ({
  ...(map ?? theme.defaultAlgorithm(seed)),
  controlHeight: 40
});

const token = theme.getDesignToken({
  algorithm: [theme.darkAlgorithm, largeControls]
});
```

The overrides input is left intact. Its reference is captured before invoking
the algorithms, as in upstream getComputedToken. An empty array of algorithms
throws a TypeError, matching the pinned cssinjs 2.1.2.

## Current scope

Static calculation leaves component styles intact and skips component overrides.
Theme context covers runtime token, algorithm, and components settings, inheritance,
useToken, and global CSS variables. Application of all component tokens to CSS and
Wave is still in progress. DesignTokenConfig describes static token and algorithm
settings. getDesignToken also accepts a full ThemeConfig and ignores runtime
fields. [Theme context](theme-context.md) · [ThemeConfig](../../src/lib/types.ts)

The seed, map, and alias source modules are independent of the Svelte runtime.
The AliasToken textDecoration fields use CSS strings.

## Reference and checks

The port follows Ant Design 6.6.8 getDesignToken, algorithms, and alias formatter.
It also draws on @ant-design/colors 8.0.1, @ant-design/cssinjs 2.1.2, and
@ant-design/fast-color 3.0.1, with no runtime dependency on those packages.
[Upstream getDesignToken](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/theme/getDesignToken.ts)

The reference data comes from the official `package/dist/antd.min.js` after
SHA-256 verification of the npm archive. It records current map and alias
fields for 24 configurations, including algorithm chains, a custom seed, all
preset colors, transparency, sizes, motion and focus, overrides, and errors.
The encoding preserves undefined, NaN, infinities, and negative zero as raw
results. Tests also check key order. The saved reference runs offline without
the upstream checkout. [Reference data](../../tests/reference/ant-design-theme-reference.json)

- [Unit tests and boundary cases](../../src/lib/theme/theme.engine.test.ts)
- [Comparison with the official UMD](../../src/lib/theme/theme-reference.test.ts)
- [Public package SSR](../../tests/package/theme/theme-tokens.ssr.test.ts)
- Consumer in the browser at `?fixture=theme-tokens`. [Browser tests](../../tests/browser/theme/theme-tokens.spec.ts)

Licenses for [Ant Design](../../src/lib/vendor/LICENSE.ant-design),
[colors](../../src/lib/vendor/LICENSE.ant-design-colors),
[cssinjs](../../src/lib/vendor/LICENSE.cssinjs), and
[FastColor](../../src/lib/vendor/LICENSE.fast-color).

The deprecated pink seed, controlTmpOutline, and palette keys such as blue-1
have been removed. The pink preset color and current pink1 through pink10 keys
remain available. The CSS variable --ant-blue-1 still maps to the current blue1.
