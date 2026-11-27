# BorderBeam

BorderBeam adds decorative layers to a target container without an extra wrapper.
The layers stay out of the accessibility tree. [Exact props and defaults](../../../src/lib/border-beam/border-beam.types.ts)

In Svelte, explicitly associate the container with the effect through target.
The caller keeps its existing ref. React composes a ref by cloning its child.

```svelte
<script lang="ts">
  import { BorderBeam, Card } from '@woodger/antd';

  let container = $state<HTMLDivElement>();
</script>

<BorderBeam target={container} count={3} duration={12} color="#36cfc9">
  <Card bind:nativeElement={container} title="Workspace overview">
    Состояние задач и последних запусков
  </Card>
</BorderBeam>
```

Use bind:this for a native element. The container needs position:relative or
another positioning context. BorderBeam leaves its style intact. A missing target,
SVG, and plain text receive no decoration and preserve the content. SSR emits no
effect nodes of its own. Changing target or unmounting removes the owned layers
while preserving controls and contents.

Count rounds down. A non-finite value or a number below 1 gives one beam.
Negative animation delays distribute multiple beams through the cycle. The first
keeps the delay from style. The others use the duration prop or the upstream
six seconds, even when style overrides duration through a CSS variable.

The gradient preserves stop order and maps input percentages 0–100 to a visible
0–70%, leaving a transparent tail. If the final stop is below or above 100%, its
color is added at the end of the visible area. An empty array restores the theme
gradient. Numeric size and lineWidth use pixels, and strings remain CSS lengths.

Without outset, measure the four insets from border-width once per target.
Later border updates on the same node leave the measurement in place. Radius
inherits through CSS and updates immediately, including different corners.
Provide explicit outset as a number in pixels or a string through
calc(-1 * outset). A negative number preserves the upstream `--2px` expression.

ConfigProvider.borderBeam sets class and style on the layers. A nested config
replaces the parent in full. Local style follows contextual style, followed by
variables from props. Light and dark themes and primary color use CSS variables.
Disabled, locale, and direction leave the decorative behavior intact.

BorderBeam accepts alias overrides and algorithms from theme.components.BorderBeam.
It has no component tokens of its own. Line width, primary gradient, and
typography update without recreating layers. An external target uses the effect
owner's theme, including CSS overrides from its ConfigProvider, independently
of the physical container's theme. Context and local styles and explicit props
take priority over the computed theme. Removing the upstream theme restores the
existing CSS inheritance from target.

The border-beam recipe preserves 10 rules and antBorderBeamMove and verifies the
archive SHA-256. Layers are visible with mask-composite and offset-path:rect support.
Otherwise, upstream CSS uses display:none. Reduced motion hides the pseudo-element
and disables animation. Use ordinary CSS for hover or pause. Keep the focus ring
and validation border independently of the effect.

Local prefixCls changes layer classes and selectors, including supports and media
rules. An empty value inherits ConfigProvider.prefixCls, giving ant-border-beam
by default. The shared prefix supplies the --prefix-border-beam-* namespace.
Dots are removed as in upstream genCssVar. The local prefix and theme.cssVar.prefix
are independent of it. The antBorderBeamMove name is preserved. Changing the prefix
preserves layers, container, draft, and focus. The scoped stylesheet is removed
with the effect or when the standard class and variable prefixes are restored.
The local prefix fixture is `?fixture=border-beam-prefix`.

The shared prefix fixture is `?fixture=beam-global`. The 6.6.8 CSS cache reuses
the parent namespace when the local class matches and shared prefixes differ.
A nested beam loses outset or parameters or reads a parent size. The raw data
preserves four cases. The same nested components on a fresh page use the correct
variables. Svelte scopes CSS to the class and namespace pair and compares against
those isolated upstream results. The upstream cache defect remains recorded
separately. Layers, target, border snapshot, draft, focus, selection, and
reduced motion are preserved. [14 upstream cases and three transitions](../../../tests/browser/fixtures/ant-design-beam-global-reference.json) ·
[Browser](../../../tests/browser/border-beam/beam-global.spec.ts) · [SSR](../../../tests/package/border-beam/beam-global.ssr.test.ts) · [Fresh page](../../../tests/browser/fixtures/ant-design-beam-global-isolated.json)
