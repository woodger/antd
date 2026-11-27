# Rate

Rate selects a rating, with optional half steps.

```svelte
<script lang="ts">
  import { Rate } from '@woodger/antd';
  let value = $state(2.5);
</script>
<Rate aria-label="Оценка" {value} allowHalf
  tooltips={['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']}
  onChange={next => { value = next; }} />
```

The owner controls value through onChange. Without value, the component uses
internal state and defaultValue=0. Count defaults to 5 and accepts a nonnegative
integer, as in upstream new Array(count). Owner values and fractions stay as
supplied even when count changes. Native form reset keeps internal selection.
Rate adds no FormData field.

AllowHalf defaults to false. With allowHalf, the half depends on the position
relative to the original li, reversed in RTL. The exact midpoint selects the
full rating. Hover shows a temporary selection without onChange. OnHoverChange
also receives undefined on leave and before the click publishes its value.
AllowClear=true clears a repeated selection to 0 and suppresses hover at that
position until it moves or leaves. AllowClear=false publishes the same value
again. External prop updates leave callbacks untouched. Changing controlled value
to undefined clears the internal fallback, as in useControlledState. A new
press sets the value again.

ArrowLeft and ArrowRight change the value by 1 or 0.5, reversing direction in RTL.
Focus stays in place. Arithmetic follows upstream without clamping. For example,
an external 4.8 with count=5 and allowHalf=true increases to 5.3. OnKeyDown runs
after the change. A handled arrow calls preventDefault. Keyboard=false disables
arrows. Enter on a character still selects the full value and prevents a duplicate
native click. Focus and blur callbacks follow bubbling focus changes.

Character accepts a string, number, or Snippet<[RateCharacterInfo]>. The snippet
receives index and count, temporary displayed value, allowHalf, disabled, focused,
prefixCls, and onHover(event, index) and onClick(event, index) from upstream.
It renders in both star layers. CharacterRender is Snippet<[Snippet, RateCharacterInfo]>
with the original star snippet. It overrides automatic Tooltip composition like
the Ant wrapper's rest override. Tooltips accepts strings or supported local
TooltipProps without children. Tooltip uses the existing display:contents wrapper
and preserves star spacing.

A nonempty prefixCls sets local Rate classes. Empty and undefined inherit
ConfigProvider.prefixCls. States, star layers, and RateCharacterInfo.prefixCls
use the resolved prefix. Tooltip keeps its own shared namespace. Canonical
component token markers and variables keep their names. Scoped CSS applies
the same 21 rules with the native button adapter. Local or shared prefix changes
preserve rating, DOM, refs, focus, and adjacent draft, selection, and FormData.
The fixture is `?fixture=rate-prefix`. [Unmodified UMD reference](../../../tests/browser/fixtures/ant-design-rate-prefix-reference.json) ·
[Browser](../../../tests/browser/rate/rate-prefix.spec.ts) · [SSR](../../../tests/package/rate/rate-prefix.ssr.test.ts)

Size accepts small, medium, or large and inherits componentSize. Disabled
inherits the shared disabled context, including Form. Explicit false takes
precedence. ConfigProvider.rate accepts class and style. Local class and
rootClassName are added and local style follows contextual style. An explicit
nested rate record replaces the parent. Light and dark themes, compact, RTL,
and reduced motion update reactively. CSS variables --ant-rate-star-color,
--ant-rate-star-size, --ant-rate-star-size-sm, --ant-rate-star-size-lg,
--ant-rate-star-bg, --ant-rate-star-hover-scale, and --ant-rate-line-width-focus
can be overridden inline.

ConfigProvider.theme.components.Rate applies all six component tokens with a
string starHoverScale. LineWidthFocus follows the upstream rule based on
lineWidth and lineWidthFocus. Zero, undefined, global and component aliases and
algorithms, cssVar.prefix, nested, reset, and sibling providers, hover, focus,
and disabled are supported. Theme variables precede ConfigProvider.rate.style
and local style. Theme updates preserve rating, radio DOM, focus, refs, and
callbacks. The fixture is `?fixture=rate-theme`. [UMD](../../../tests/browser/fixtures/ant-design-rate-theme-reference.json) ·
[SSR](../../../tests/package/rate/rate-theme.ssr.test.ts) · [Browser](../../../tests/browser/rate/rate-theme.spec.ts)

Array and CSSObject starHoverScale values are outside the current port. Ant Design
6.6.8 omits the CSS variable for them, so its hover transform is none. The
registry records the observation. The native implementation keeps scale(1.1),
which user CSS variables and styles can override. The full CSSObject API,
including the upstream _multi_value_ and _skip_check_ markers, is a separate gap.

Bind:this provides focus() and blur(), which have no effect while disabled.
Bind:nativeElement exposes the ul. AutoFocus runs after mount. SSR leaves the DOM
and callbacks alone. Native buttons with type=button supply Space activation.
The root ul has radiogroup and visible focus. The upstream cumulative aria-checked,
aria-posinset and aria-setsize, and separate Tab stops are preserved. Decorative
copies of characters stay out of the accessibility tree. The button name is its
one-based number.

The rate recipe verifies the pinned npm archive SHA-256 and extracts all 21 rules,
adapting >div to >button and preserving declarations. Rate.svelte adds native
reset styles, focus, and reduced motion. StarFilled SVG comes from Ant Design
Icons SVG 4.6.0 with its MIT license. The `?fixture=rate` unit, SSR, and browser
scenarios cover values, callbacks, geometry, contexts, and cleanup. [Vendored CSS](../../../src/lib/vendor/rate.css)

The supported Tooltip API is the public Svelte Tooltip API. The rest of the
upstream Tooltip API remains outside Rate's porting coverage.
