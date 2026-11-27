# Progress

Progress displays the supplied `percent`. The owner runs the
operation and passes progress updates.

```svelte
<script lang="ts">
  import { Progress } from '@woodger/antd';

  let percent = $state(42.5);
</script>

<Progress {percent} aria-label="Подготовка отчёта" />
<Progress type="circle" {percent} size={120} aria-label="Проверка файлов" />
```

`type` defaults to `line` and also supports `circle` and `dashboard`.
`percent` defaults to 0. Finite values are clamped to 0–100 without
rounding. `undefined`, `NaN`, and positive or negative infinity use 0.
Display, width or arc, and `aria-valuenow` use the same normalized
value. The owner passes `percent` as a prop. It is not bindable.
Progress has no operation timers or callbacks.

`status` supports `normal`, `success`, `exception`, and `active`. When
omitted, 100 gives `success` and other values give `normal`. Explicit
`normal`, `exception`, and `success` apply at any percent. `active`
adds a decorative animation for line with no value change. Circle
and dashboard stay static. Without `format`, `success` and
`exception` show a decorative icon in place of the label. Status
colors follow theme tokens.

`showInfo` defaults to `true`. `format` receives normalized `percent`
and can return a string, number, or passive Snippet. When `success`
is supplied or `format.length > 1`, the normalized success percent
is the second argument, defaulting to 0. Existing callbacks with
`format.length <= 1` and no `success` still receive one argument.
The callback is evaluated once, and a string or number is used for
`aria-valuetext`. A Snippet keeps the numeric percent as its accessible
value, which can be overridden with `aria-valuetext`. HTML in strings
is escaped. `showInfo=false` hides the label and retains accessible
values. A long external text label is truncated with an ellipsis.
The full text remains in `title` and `aria-valuetext`. This preserves
the native contract. At `size=24`, the label is limited to 12px, while
React allows it to extend outside the body. Line status icons use
upstream SVG dimensions without text truncation.

`size` defaults to `medium`. For line, `medium` and `small` set the
height to 8px and 6px. A number sets both width and height in pixels.
A pair `[width, height]` or object `{ width?, height? }` sets line
dimensions independently. Width accepts pixels or a CSS string and
defaults to 100%. Height is a positive finite number. Invalid numeric
sizes use defaults. For example, `size={{ height: 4 }}` keeps 100%
width. Available container width constrains the indicator on narrow
screens.

For circle and dashboard, `size` accepts `medium` at 120px,
`small` at 60px, or a positive finite diameter in pixels. A compatible
pair uses its first size, and invalid diameters use 120px. The SVG
maintains its proportions and fits the container. At diameters of
20px or less, the label appears in a Tooltip. Accessible values
remain available without an added Tab stop. The tooltip label is
created on first open and kept after closing. The tooltip container
inherits from ConfigProvider, defaulting to the body or the containing
native modal. The label retains Tooltip's text color and an accessible
name from its content.

Circle `strokeWidth` is a percentage of the viewBox. The default
is at least 6% and 3px at the supplied diameter. Invalid values use
the default. Excessive values are capped at 99.9% to keep the radius
positive. Zero percent draws no colored arc. When constrained, the
circle container stays square and keeps the label centered.
Explicit `styles.body.width` retains the original height.
`styles.body.height` sets it directly. CSS geometry follows
`@rc-component/progress` 1.0.3. Round caps adjust segment length,
and updates less than 100ms apart disable transitions. Numeric dash
attributes retain the previous geometry for consumers that measure
it. CSS declarations define the visible arc. Minimum thickness is
calculated in the upstream operation order.

`strokeColor` and `railColor` accept CSS colors that override fill
and background, including for `success` and `exception`. For line,
`strokeColor` also accepts `{ from, to, direction? }` or a record of
percentage stops. Keys are sorted by the upstream `parseFloat` rule.
Direction defaults to `to right` in LTR and `to left` in RTL. A
regular line uses the first color in a `strokeColor` array. Steps
apply colors by index. Line steps ignore gradient objects as
upstream. `strokeLinecap` supports `round`, `butt`, and `square`.
`butt` and `square` remove rounding for line and set SVG
`stroke-linecap` for circle. Circle gradients use percentage stops,
an SVG mask, and a conic or linear background. Key order is kept,
and caps become `butt`. The upstream circle renderer keeps
`from` and `to` distinct from percentage stops.

Themes and compact mode use existing tokens. RTL starts line fill
at the right and reverses the active animation. Circle keeps
clockwise fill. Reduced motion disables the active animation and
value and color transitions.

The root has `role=progressbar`, `aria-valuemin=0`, and
`aria-valuemax=100`. Its default accessible name comes from
`locale.progress.label`. Set `aria-label` or `aria-labelledby` for
a specific operation. `aria-describedby` links an explanation.
Without `format`, `aria-valuetext` contains the percent and localized
success or exception. Explicit `aria-valuetext` takes precedence.
`locale.progress` accepts `label`, `successText`, and `exceptionText`,
including partial overrides. Missing fields use `ruRU`. Icons,
label, and SVG are decorative.

Progress adds no live region, Tab stop, or keyboard handlers. It
leaves focus in place and lets the containing Modal or Drawer handle
Escape. `ConfigProvider.disabled` leaves feedback visible. `id`,
`class`, and `style` apply to the root. SSR renders values and SVG
geometry immediately without timers or DOM measurement. Instances
hold independent state.

Line supports `success={{ percent, strokeColor? }}` as a separate
track over the main one. A supplied `success.percent` determines the
automatic status in place of the total percent, including when it
is 0. Track lengths are independently clamped. As upstream, the
success track can extend beyond the main one. `size` sets line height.

`steps` sets the number of separate line elements. `Math.round`
determines the active count. `rounding` receives
`steps*percent/100`. `size` sets the dimensions of each segment.
Width defaults to 14px (2px for `small`) and height to 8px. A
`steps` object uses `count`. In this case `gap` leaves spacing
unchanged. `percentPosition` selects `start`, `center`, or `end`
and `inner` or `outer`. The inner label is always text, including
for `success` and `exception`. The upstream FastColor brightness
of the first supplied color determines label contrast.

`ConfigProvider.progress` supplies `class`, `style`, and object or
function `classNames` and `styles` for `root`, `body`, `rail`, `track`,
and `indicator`. `undefined` inherits the record. An explicit object
replaces it. Callbacks receive defaults for `type`, `percent`, `size`,
`showInfo`, and `percentPosition`. Root styles apply in order: provider
`styles.root`, provider `style`, local `styles.root`, and local
`style`. Individual slot styles follow calculated sizes and colors.
`prefixCls` changes the BEM classes. `undefined` and the empty string
inherit `ConfigProvider.prefixCls` (`ant-progress` by default).
`bind:nativeElement` returns the current root after mount and clears
on unmount. The theme includes six upstream component tokens,
aliases and algorithm, and CSS variable prefix, key, and hash.
Variables precede semantic and user styles.

Dashboard uses `gapDegree=75`, circle 0. `gapPlacement` accepts
`top`, `bottom`, `start`, and `end`. Start and end follow RTL.
Supply placement for a circle with positive `gapDegree`. The
upstream renderer leaves rotation unset without it. Circle success
draws a separate segment before the remaining `percent-success`,
preserving the upstream layering order.

Circle steps use `Math.round` independently of `rounding`. A `steps`
object sets `count` and `gap`, with a default gap of 2 viewBox units.
There is no separate continuous rail. Success is subtracted from
percent before calculating active steps. Upstream 6.6.8 behavior
is preserved: without `railColor`, inactive steps inherit the main
stroke, and gradient steps refer to a missing gradient definition.
Upstream comparisons include these cases.

The line and steps reference comes from the official UMD in standards
mode for 65 scenarios. [Line and steps reference](../../../tests/browser/fixtures/ant-design-progress-line-reference.json)

For the narrow `size=24` case, clipping was recorded separately
from a fresh build of the previous library commit.
[Native clipping reference](../../../tests/browser/fixtures/progress-native-clipping-reference.json)

Circle and dashboard have 69 UMD scenarios and a transition trace.
Native finite bounds, long label clipping, and numeric SVG attributes
are preserved. Tooltip uses the existing Svelte wrapper. The shared
ConfigProvider prefix is supported, and React development warnings
remain pending. [Circle and dashboard reference](../../../tests/browser/fixtures/ant-design-progress-circle-reference.json)

The package includes the upstream license.
[@rc-component/progress license](../../../src/lib/vendor/LICENSE.rc-progress)
