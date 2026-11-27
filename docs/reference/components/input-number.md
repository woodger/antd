# InputNumber

InputNumber edits a `number | null` through `bind:value` and
`onValueChange(value)`. Clearing returns `null`, and `0` remains a
number. `defaultValue` is captured when a standalone control is
created. With a binding, set an initial number or `null` in the
owner and omit `defaultValue`.

```svelte
<script lang="ts">
  import { InputNumber } from '@woodger/antd';

  let quantity = $state<number | null>(2);
</script>

<label for="quantity">Quantity</label>
<InputNumber id="quantity" name="quantity" bind:value={quantity} min={0} max={99} step={1} precision={0} />
```

The component stores the editable text separately from the number.
Intermediate `-`, `1.`, and trailing zeros stay in the field while
typing. A valid number within `min` and `max` updates the model
immediately. An empty string updates it to `null`. A nonnumeric or
out-of-range draft leaves the last accepted number intact. Signs,
decimal points, and exponents are supported. `decimalSeparator`
sets a different separator. Without it, the existing strict parser
rejects commas. IME input publishes the number after
`compositionend`.

Blur and Enter finish editing. A numeric draft is clamped to
`min` and `max` and rounded to `precision`. A nonnumeric draft
reverts to the last number. `precision` allows 0 to 100 decimal
places. Ties round away from zero, so `1.005` at `precision=2`
becomes `1.01`. Rounding stays within the bounds, and the display
is padded with zeros to `precision`. When no number at that
precision fits the range, the value stays intact. The value is a
JavaScript number, with the same limits on numerical precision.

`min` and `max` default to `Number.MIN_SAFE_INTEGER` and
`Number.MAX_SAFE_INTEGER`, and `step` defaults to 1. Positive
fractional steps avoid tails such as `0.30000000000000004` when
adding decimal steps. A nonpositive or nonnumeric step uses 1.
Nonnumeric bounds use defaults, and invalid `precision` is ignored.
When `min > max`, numeric changes are blocked and clearing remains
available. External `value` and bounds changes do not call callbacks
or clamp the number automatically. Styling indicates an out-of-range
value. `NaN` and `Infinity` appear as empty values without callbacks.

ArrowUp, ArrowDown, and the buttons change the number by `step`
while keeping focus in the field. Stepping beyond a bound is disabled.
`keyboard={false}` disables the arrow keys, and `controls={false}`
hides the buttons. The two settings are independent. Enter commits
input and retains native form submission. `onkeydown` runs before
key handling. Its `preventDefault` cancels handling. Shift multiplies
the step by ten. Holding a button repeats after 600ms at 200ms
intervals. By default, the wheel leaves the number unchanged.
`changeOnWheel` enables stepping only while the field is focused.
`changeOnBlur={false}` keeps the draft on blur. Enter still commits
it, including with `keyboard=false`. `oninput` and other native
events receive the DOM text. Use `onValueChange` for the number.

Sizes `small`, `medium`, and `large`, disabled state, and direction
inherit from ConfigProvider. Explicit props override inheritance.
Set readonly through native `readonly` or the `readOnly` alias.
Disabled and readonly states block numeric changes and hide
the buttons. `status` accepts `error` and `warning` and inherits
FormItem errors. Light and dark themes, primary colors, compact
mode, RTL, and `prefers-reduced-motion` are supported. Button labels
and the native validation message use `locale.inputNumber`. A nested
provider merges individual labels.

The input has `role=spinbutton`, `aria-valuenow`, `aria-valuemin`, and
`aria-valuemax`. Its accessible name comes from a label, FormItem,
`aria-label`, or `aria-labelledby`. Step buttons add no Tab stops.
Native `required` and validation of the numeric draft work in
ordinary HTML forms. In Form, model rules validate the value,
and FormItem supplies `id`, `name`, `required`, status, the error
description, and blur or touched handling. Pass
`value={form.values.quantity}` and
`onValueChange={(value) => form.setFieldValue('quantity', value)}`.
`required` treats `0` as set, and `min` and `max` compare numbers.

With `name` or `FormItem.name`, FormData contains one field with
the canonical number string, such as `'1.2'` for text `1.20`, or
`''` for `null`. Disabled excludes the field, and readonly preserves
it. The `form` attribute associates the input and hidden field with
an external form. Native reset restores the original `defaultValue`
or `null` and updates the binding in the next task without a
callback. A canceled reset keeps the value. Removing the control
cancels a pending task. Model reset in Form restores its
`initialValues` and resets the draft even when the number stays
the same.

`stringMode` ports arithmetic from `@rc-component/input-number`
1.6.2 and mini-decimal 1.0.1. The value and callbacks use
`string | null`, preserving fractional digits beyond safe integer
precision. Step and bounds can be strings. Without explicit bounds,
`stringMode` imposes no safe integer limits. Precision and padding
to step precision follow the upstream algorithm. Arbitrary precision
requires BigInt. The mini-decimal fallback uses standard Number with
its usual limits.

```svelte
<script lang="ts">
  import { InputNumber } from '@woodger/antd';
  let amount = $state<string | null>('1');
</script>

<InputNumber stringMode bind:value={amount} min="0" max="10" step="0.00000000000001" />
```

Optional `formatter` and `parser` separate text and model. The
parser can return a string for `stringMode`. The formatter receives
a number string and `{ userTyping, input }`. The caret is restored
after formatting without clearing selection when focused. `onChange`
receives the same value type as `onValueChange` and runs before it.
`onInput` receives the original text after the model update.
`onStep` reports the emitter (`handler`, `keyboard`, or `wheel`),
direction, and offset. `onPressEnter` runs after commit. Use a
function binding with a getter and setter to let the owner reject
updates.

Variants are `outlined`, `filled`, `borderless`, and `underlined`.
InputNumber supports `mode="spinner"`, `prefix`, `suffix`, and
custom control icons. Content accepts strings, numbers, and Snippets.
`rootClassName` and `nativeElement` apply to the control. Use
SpaceCompact or SpaceAddon for surrounding composition.
`ConfigProvider.inputNumber` supplies `variant`, `class`, `style`,
and semantic slots. Local styles take precedence.

`bind:inputElement` returns the input. `bind:nativeElement` returns
the control root. `bind:ref` returns a native input proxy with
`nativeElement`, `focus({ cursor, preventScroll })`, and `blur()`.
Focus and blur are also available via `bind:this`. Ant Design's
mouse callbacks apply to the root. Native lowercase handlers
retain input events. [Public types and JSDoc](../../../src/lib/input-number/input-number.types.ts)

Ordinary numeric mode retains the native strict parser, finite
`number | null`, safe-integer defaults, form validation, and draft
commit described above. Step precision leaves displayed zeros
unchanged. This differs from rc-input-number. `stringMode` uses the
upstream decimal algorithm. Upstream component tokens and runtime
algorithms are wired in. Native-only compact and focus styling
retain their contract. React diagnostics and the full style renderer
are still in progress. Internal PurePanel is outside the public
port. Native buttons and Svelte Snippets replace React spans and
nodes. The `input-number-features` CSS recipe extracts 64 rules
without overriding existing outlined or compact styles.
[Mini-decimal MIT license](../../../src/lib/vendor/LICENSE.rc-mini-decimal)

New scenarios use `?fixture=input-number-features`.
[Browser tests](../../../tests/browser/input-number/input-number-features.spec.ts) · [Package SSR tests](../../../tests/package/input-number/input-number-features.ssr.test.ts)

InputNumber supports local and shared `prefixCls` with CSS for both
modes, variants, sizes, affixes, actions, and Compact. A nonempty
local prefix takes precedence. Empty or undefined values inherit
ConfigProvider. Canonical token variables and marker are preserved.
Native geometry and reduced-motion adaptations use stable classes
and attributes. Prefix changes preserve root, input, ref, draft
text, selection, focus, callbacks, keyboard behavior, and canonical
FormData. Upstream measurements use `stringMode`. Upstream FormData
stores editable text, while the native hidden field retains the
canonical decimal value. The fixture is `?fixture=input-number-prefix`.
[Browser tests](../../../tests/browser/input-number/input-number-prefix.spec.ts) · [SSR tests](../../../tests/package/input-number/input-number-prefix.ssr.test.ts) ·
[UMD reference](../../../tests/browser/fixtures/ant-design-input-number-prefix-reference.json)

The `input-number-prefix` recipe produces 124 source CSS rules without
deprecated addons. In rc-input-number 1.6.2, the focus class differs
from the one expected by the arrow CSS. Raw focused measurements
and a comparison with a public `className` are stored separately.
The native implementation retains its existing mode-focused class
and visible arrows.
