# Slider

By default, Slider selects one number through `bind:value` and
`onValueChange(value)`. `defaultValue` is captured when a standalone
control is created and defaults to 0. With a binding, set the
initial number in the owner and omit `defaultValue`. Single mode
always uses a number. The following describes the existing
native API. Range mode is described below.

```svelte
<script lang="ts">
  import { Slider } from '@woodger/antd';

  let volume = $state(40);
</script>

<label for="volume">Громкость</label>
<Slider id="volume" name="volume" bind:value={volume} min={0} max={100} step={5} />
```

Slider uses a native `input[type=range]`. Clicking the track and
dragging with a mouse or touch change the number immediately.
Moving the pointer outside the bounds clamps the value.
`onChangeComplete(value)` runs once on pointer release or
after a key sequence if the number changed. Holding a key can
call `onValueChange` multiple times, with one
`onChangeComplete` at release. An action at an already reached
bound fires no callbacks. Native input and change events
without pointer or keyboard interaction are also supported.
Use `onValueChange` for the numeric model. Native events remain
available through HTML props.

`onChange(next)` receives the number before `bind:value` updates.
`onValueChange` runs afterward. This alias preserves the native
completion and cancellation rules. Deprecated `onBeforeChange`
is excluded. Full lifecycle alignment with range remains
pending.

Defaults are `min=0`, `max=100`, and `step=1`. The number is
clamped to the bounds and rounded to the nearest step from
`min`, with ties rounded to the larger value. Fractional steps
avoid accumulated tails such as `0.30000000000000004`.
Set `step` to divide `max - min`. Otherwise, the last
reachable step is below `max`, as with native range. Invalid
step uses 1 and nonnumeric bounds use defaults. `max < min`
collapses to `min`. Equal bounds give a fixed value without
changes or callbacks.

Single mode also supports `marks`, `dots`, `step={null}`,
`included`, and `track`. With marks or `step=null`, it uses the
same rc-slider alignment as range and selects the nearest
mark, step, min, or max in the original tie-breaking order.
`step=null` allows only marks and endpoints, even without
marks. `dots` adds visual divisions without restricting the value.
`included=false` hides the track and active marks and dots.
`track=false` hides only the track. A mark label accepts text,
a number, a Snippet, or `{ label, style }` with a CSS string.
Marks use native buttons for Tab, Enter, and Space, and are
excluded when disabled. Mark changes normalize display and
FormData without writing to the owner or calling callbacks.
Marks and dots use the same native preset styling as range.
A regular numeric Slider without divisions keeps its styling.

External value and bounds changes leave callbacks and owner
state untouched. Display and FormData use the normalized
number. `NaN` and `Infinity` display as `min`. User changes send
a valid number to the owner.

Arrows step the number once, Home and End select the first and
last reachable steps, and PageUp and PageDown step twice.
`keyboard={false}` disables these keys and preserves mouse
and touch. Native `onkeydown` runs first. Its `preventDefault`
cancels handling. Calling `preventDefault` in `onpointerdown`
prevents the drag. A label, FormItem, `aria-label`, or
`aria-labelledby` names the input. `aria-valuetext` can describe
units. Focus stays on the input, and its visible thumb
displays a keyboard focus ring.

`orientation` accepts `horizontal` or `vertical`. Set a height for
a vertical Slider, for example `style="height: 160px"`. `min`
is at the bottom by default. `reverse` changes direction.
In a horizontal RTL Slider, minimum is on the right, and
`reverse` flips it back. RTL leaves vertical direction intact.
Arrow keys follow the layout: Right moves the thumb right
and Up moves it up. In horizontal mode, Up increases the
number. It supports light and dark themes, primary colors,
compact mode, and `prefers-reduced-motion`.

`disabled` inherits from Form, FormItem, and ConfigProvider.
`disabled=false` overrides inheritance. Disabled removes the
input from Tab and FormData. An owner, bounds, or direction
change, disabling, loss of capture, blur, or control removal
cancels the active interaction with no late
`onChangeComplete`. A new interaction is independent of the
canceled one. Listeners and pending resets are cleaned up on
removal.

Single mode accepts upstream `ariaLabelForHandle`,
`ariaLabelledByForHandle`, `ariaValueTextFormatterForHandle`,
`ariaRequired`, `tabIndex`, and `autoFocus`, including the first
entry of handle prop arrays. A `disabled` array uses only the
first displayed handle. `autoFocus` is captured at mount.
`ref.focus()` and `ref.blur()` target the native input.
`tabIndex=[]` removes the control from Tab while preserving
programmatic focus on the native input. In rc-slider, a
`div` without `tabindex` lacks that focus behavior.

In Form, pass `value={form.values.volume}` and
`onValueChange={(value) => form.setFieldValue('volume', value)}`.
FormItem supplies ID, name, label, error, description, and
blur and touched handling. Form rules validate the number.
`required` accepts 0, and `min` and `max` compare numbers. A
native range always has a value. Form focuses the input on
error. Model reset restores `initialValues` and cancels any
unfinished interaction, including when resetting to the same
number.

Native FormData contains a single string number, including
`'0'`. The `form` attribute associates the control with an
external form. Any reset of that form cancels the active
interaction. Unless canceled via `preventDefault`, the binding
receives the original `defaultValue` normalized to the current
bounds and step in the next task without callbacks. A canceled
reset retains the current number.

Tooltip displays the number on hover, focus, and drag by
default, following the visible thumb.
`tooltip={{ formatter: (value) => value + '%' }}` sets the format.
`tooltip={false}`, `tooltip={{ open: false }}`, `formatter=null`,
or a `null` formatter result hides the tooltip and description.
`open: true` keeps it visible on an enabled Slider.
Placement and arrow, including `{ pointAtCenter: true }`, and
boolean or object `autoAdjustOverflow` are also supported.
This applies to single mode, the active range tooltip, and all
pinned thumb tooltips. Default placement is `top`, or `right` for
vertical Slider and `left` for vertical RTL. Escape hides the
tooltip while preserving focus and value. The next interaction
can reopen it. Disabled hides the tooltip. Text supplements
the input's `aria-describedby` and preserves FormItem help or
error. Tooltip display does not call numeric callbacks.

`tooltip.destroyOnHidden` works in all three Slider tooltip
modes. Precedence and lazy SSR follow standalone Tooltip.
Content is retained by default. Inside Tooltip.UniqueProvider,
thumbs share the group's panel. `tooltip.unique=false` keeps
separate thumb tooltips. [Tooltip.UniqueProvider](tooltip.md#shared-tooltip-for-multiple-triggers)

`ConfigProvider.theme.components.Slider` applies all 18 upstream
tokens to both modes and orientations. For example,
`railSize: 6` sets a horizontal rail height or vertical rail
width of 6px. Aliases, component algorithms, zero, explicit
`undefined`, and CSS variable prefix are supported. Theme
updates preserve values, DOM, focus, and callbacks. Local
root and semantic styles retain precedence. Focus on the
native input styles the visible handle with upstream tokens.
Native-only themes and input hit areas retain their behavior.
The fixture is `?fixture=slider-theme`. [Slider tokens](../theme-context.md#slider-tokens)
· [SSR tests](../../../tests/package/slider/slider-theme.ssr.test.ts) · [Browser tests](../../../tests/browser/slider/slider-theme.spec.ts)

## Slider range

`range` enables the upstream multiple-handle API from Ant Design
6.6.8 and `@rc-component/slider` 1.1.1. The existing single-value
bindings, normalization, callbacks, native events, and reset
are preserved. [Single-value types](../../../src/lib/slider/slider.types.ts) ·
[Range types](../../../src/lib/slider/slider-range.types.ts)

```svelte
<script lang="ts">
  import { Slider, type SliderRef } from '@woodger/antd';

  let interval = $state([20, 80]);
  let slider = $state<SliderRef>();
</script>

<Slider range bind:value={interval} bind:ref={slider} name="interval"
  ariaLabelForHandle={['Начало', 'Конец']} />
```

Values are sorted into a new copy. The external array is
left intact. Without `value` and `defaultValue`, two handles
start at `min`. `null` and `[]` leave the range empty. Clicking
the track restores two coincident handles. `SliderProps`
describes single callbacks by default. `SliderProps<true>` and
`SliderRangeProps` describe the array. In a direct SSR call,
TypeScript can specify the component as `Slider<true>`.

Range uses rc-slider's alignment by step, marks, and bounds.
`step=null` leaves only marks and endpoints, including `max`.
`dots` adds divisions. Step and marks determine how a handle
position is chosen. Marks accept text, numbers, Snippets,
or label and style. Interactive labels are native buttons
with keyboard access that do not submit the form. `included`
and `track` control the tracks, and the extreme values set
the start and end of the highlight.

`allowCross` defaults to `true`. `pushable` sets a minimum gap
and pushes neighboring handles. `true` uses the step. `disabled`
accepts a boolean or array. Disabled handles stay as fixed
anchors. Any visible disabled handle disables `editable`
and `draggableTrack`. Extra entries in the disabled array are
ignored. `range.draggableTrack` moves the group while keeping
spacing and clamping to the bounds.

`range.editable` adds handles on track clicks and honors
`minCount` and `maxCount`. Delete or Backspace removes the
selected handle. Dragging it more than 130px across the
track marks it for removal. Editable takes precedence over
`draggableTrack`. With `step=null`, whole-track dragging is
disabled. Crossing preserves the dragged handle's identity.
After drag completion and keyboard crossing, focus follows
the new index.

`onChange` receives the sorted array before `bind:value` updates,
and `onValueChange` runs after it. Range calls
`onChangeComplete` on navigation key release and pointer
release even without a value change. Delete emits change
without a separate completion. Clicking a mark completes
immediately. `keyboard=false` blocks movement while retaining
the upstream keyup callback. Native input and change events
are available separately. For range pointer and keyboard
actions, they are dispatched after the DOM updates and have
`isTrusted=false`. Use component callbacks for the number
array.

Each enabled native input submits its own value under the
shared `name`. `FormData.getAll(name)` returns the range.
ID and label association apply to the first input. `form`
supports an external form owner. Native reset restores initial
`defaultValue` with current bounds and removes added handles.
Without `defaultValue`, reset returns to two handles at `min`.
A canceled reset retains values. Form and FormItem supply
name, ID, disabled state, description, error, and blur and
touched handling.

`ref.focus()` and `ref.blur()` work in both modes.
`bind:nativeElement` and `ref.nativeElement` give the outer
`div`. Unmount clears pointer and touch listeners, capture,
reset timers, and the ref. SSR does not measure DOM, focus
controls, or start callbacks or timers. Light, dark, compact
modes, and the three existing primary colors are set by
ConfigProvider. Direction, reverse, and orientation retain
the upstream physical directions.

`ConfigProvider.slider` sets `class`, `style`, and semantic slots
for both modes. Classes combine. Styles apply in order with
local layers taking precedence. Slots are `root`, `tracks`,
`track`, `rail`, and `handle`. Root styles apply as provider
`styles.root`, provider `style`, local `styles.root`, and local
`style`. Callbacks see input props and resolved `disabled`.
Check `props.range` before accessing the numeric or array
value. An explicit nested record replaces the parent settings,
and `undefined` inherits them. Root style follows theme variables
and retains priority on theme updates.

The current `SliderTooltipConfig` retains 12 placements, a text
formatter, native popover, and input description. The container
resolves from `tooltip.getPopupContainer`, then
`ConfigProvider.getPopupContainer`. Slider has no root
`getPopupContainer`. Full `SliderTooltipProps` and the upstream
focus opening rules are partially ported. The full single-mode
lifecycle and callback API remains pending. The native numeric,
form, and event contracts described above are preserved.

Local `prefixCls` changes BEM classes for both modes, tracks,
marks and dots, and handles. The empty string and `undefined`
inherit `ConfigProvider.prefixCls` (`ant-slider` by default).
A custom prefix uses a stylesheet from 54 upstream rules,
emitted during SSR. Defaults are scoped to the owner and leave
nearby Sliders unaffected. CSS variables keep the Slider
namespace, and `theme.cssVar.prefix` configures them independently
of BEM classes. Prefix changes preserve DOM, refs, values, focus,
and callbacks.

All tooltips get the original `classNames.root`
`${prefix}-tooltip` with the resolved prefix, including active
and pinned range tooltips. Custom `tooltip.prefixCls` is
independent. With the default Tooltip prefix, the original
container min-width reset applies. Native disabled behavior
hides tooltips even at `open=true`, while upstream retains the
forced-open tooltip. RTL comparisons account for the inherited
DOM `dir` set by Svelte ConfigProvider.

The prefix fixture is `?fixture=slider-prefix`.
[SSR tests](../../../tests/package/slider/slider-prefix.ssr.test.ts) · [Browser tests](../../../tests/browser/slider/slider-prefix.spec.ts) ·
[UMD reference](../../../tests/browser/fixtures/ant-design-slider-prefix-reference.json)

The single-mode API fixture is `?fixture=slider-scalar`. Tests
also cover semantic configuration, ARIA, native focus, form and
reset, and the absence of callbacks on mark updates.
[SSR tests](../../../tests/package/slider/slider-scalar.ssr.test.ts) · [Browser tests](../../../tests/browser/slider/slider-scalar.spec.ts) ·
[Official UMD reference](../../../tests/browser/fixtures/ant-design-slider-scalar-reference.json)
