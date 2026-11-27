# Grid, Row, Col, and breakpoints

```svelte
<Row gutter={[16, 8]}>
  <Col xs={24} md={12}>Первая колонка</Col>
  <Col xs={24} md={12}>Вторая колонка</Col>
</Row>
```

Row and Col preserve native divs and Ant Design's 24-column CSS classes.
Span=0 hides a column. Order, offset, push, and pull set order and logical
offset. Responsive xs, sm, md, lg, xl, xxl, and xxxl take a number or ColSize
object. Span in an object and base span also accept strings. A string
breakpoint shorthand such as md="12" is ignored, as in upstream Col.
ColSize supports span, order, offset, push, pull, and flex, including zero
to reset responsive properties. Base order, offset, push, and pull values
of 0 add no class.

Row.gutter accepts a number in pixels, a CSS string, a responsive map of
numbers, or [horizontal, vertical]. The horizontal gap gives Row negative
margin-inline and Col half the gap as padding-inline. The vertical gap uses
row-gap. A nested Row creates an independent context. Wrap=false adds nowrap.
Col with flex also gets min-width:0. Numeric flex gives n n auto, auto gives
1 1 auto, and a value with px, em, rem, or % gives 0 0 size. Other strings pass
through as CSS shorthand. Row.style overrides computed margin and gap.
Col.style overrides padding and flex. Responsive flex variables follow style
as in upstream.

Align accepts top, middle, bottom, or stretch, and justify accepts start, end,
center, space-around, space-between, or space-evenly. Both support responsive
maps. Breakpoints are xs<576, sm≥576, md≥768, lg≥992, xl≥1200, xxl≥1600, and
xxxl≥1920. The Col xs class is the base CSS without a media query. Row selects
an xs map entry only when xs actually matches. The largest active breakpoint
with an entry wins.

SSR leaves responsive Row align and justify unresolved. Gutter for an unknown
width selects the largest supplied breakpoint, as in upstream useGutter.
After mount, media queries update Row. Col adapts in CSS without JavaScript
or hydration. Use the explicit Svelte model with
`const breakpoint = createBreakpoint();` and
`$effect(() => breakpoint.connect(window));` for the Grid.useBreakpoint
counterpart. Reactive breakpoint.screens is {} in SSR. A connection publishes
a map from seven MediaQueryList values. Cleanup removes listeners and ignores
late events. Breakpoint.connected reports an active connection. A new connect
ends the previous one. The optional second argument to connect(view, mediaQueries)
sets the complete map of seven queries. Omitting it uses the standard Grid
thresholds.

Both components support class, style, native attributes and events,
bind:nativeElement, and RTL with stable DOM order. The fixture is `?fixture=grid`.
The grid recipe extracts 1043 rules with upstream media scopes and no keyframes.
Unit, SSR, and Chromium checks cover gutters, nesting, widths, media boundaries,
zero resets, CSS units, RTL, and cleanup.

Theme.components.Grid applies aliases and algorithms to Row and Col, including
fontSize and fontFamily, nested providers, and custom cssVar prefix. Grid has
no defaults of its own. Component variables precede gutter, flex, and style,
with local style retaining precedence. Updates preserve Row and Col refs, slots,
editor values, focus, selection, and responsive layout. The `?fixture=grid-theme`
checks 14 UMD themes and 140 CSS states in the browser, declarations in unit
tests, and the server boundary in SSR. [Browser](../../../tests/browser/grid/grid-theme.spec.ts) · [Unit](../../../src/lib/theme/theme-grid-tokens-reference.test.ts) · [SSR](../../../tests/package/grid/grid-theme.ssr.test.ts)

Global theme.token.screen* sets Row's observer. Screen*Min sets Col media CSS.
The thresholds can differ. Between screenSMMin and screenSM, Col width changes
and Row still uses its earlier gutter, align, and justify. The implementation
preserves upstream threshold-order validation and unconditional xs column
styles. Custom media queries work during SSR without JavaScript and update
after mount. Nested, reset, and sibling providers are isolated, including
with the same cssVar.key and hashed=false. Standard mode and
createBreakpoint().connect(window) without explicit queries keep their existing
thresholds. The browser checks compare five configurations and 126 states
on fresh upstream pages. CSS loading orders are checked separately without
JavaScript. Upstream leaves Row and Col layout at the old global breakpoints
after mount even though its public tokens update. Svelte updates both while
preserving DOM and slot input state. [Browser](../../../tests/browser/grid/grid-breakpoints.spec.ts) · [CSS loading order](../../../tests/browser/grid/grid-breakpoints-ssr.spec.ts) ·
[Upstream observation](../../../tests/browser/fixtures/ant-design-grid-breakpoints-update-observation.json)

Row.prefixCls sets the root and wrap, align, justify, and RTL classes. Empty
and undefined inherit ConfigProvider.prefixCls, giving ant-row by default.
The local prefix takes precedence. The canonical Grid marker and gutter context
stay in place. Prefix changes preserve Row and child DOM, refs, draft, selection,
focus, and FormData. Grid-row-prefix extracts 16 Row rules without Col and media
scopes. The fixture is `?fixture=grid-row-prefix`. [UMD](../../../tests/browser/fixtures/ant-design-grid-row-prefix-reference.json) · [Browser](../../../tests/browser/grid/grid-row-prefix.spec.ts) · [SSR](../../../tests/package/grid/grid-row-prefix.ssr.test.ts)

Col.prefixCls connects a scoped template of 1027 rules for base and xs, all
responsive states, resets, and flex. Empty or undefined inherits ConfigProvider.
Local classes are independent of the shared namespace for private Col and Grid
variables. The canonical Grid token marker and gutter, flex, and style priority
stay in place. Prefix changes preserve Col and its ref and the nested input's
draft, selection, and focus. Custom media thresholds are isolated from canonical
styles, including local prefix=ant-col under another shared namespace.

FormItem preserves default layout with a shared prefix and custom labelCol
and wrapperCol prefixes. CSS uses stable span and breakpoint attributes with
the existing specificity. The control connects the shared grid display to the
native Form variable. Form prefix and media styles are connected separately.
In custom-media Col examples, the form keeps independent default thresholds.
Upstream caches the private flex of the first global namespace for the same
local Col class. Raw and fresh Inner measurements stay separate. Upstream keeps
old thresholds in the custom-media cases, and freshMedia uses a new public local
class. The native scope includes both prefixes and media. The Row reference
still compares the official Col with public prefixCls=ant-col. The fixture is
`?fixture=grid-col-prefix`. [UMD](../../../tests/browser/fixtures/ant-design-grid-col-prefix-reference.json) · [Browser](../../../tests/browser/grid/grid-col-prefix.spec.ts) · [SSR](../../../tests/package/grid/grid-col-prefix.ssr.test.ts)

In CSS variable mode, upstream writes components.Grid.screen*Min into variables
while Col media queries continue to use global thresholds. The declarations alone
do not establish a media layout change. [Observation](../../../tests/browser/fixtures/ant-design-grid-media-observation.json)
