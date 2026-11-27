# Radio and RadioGroup

Radio uses native `input[type=radio]` and supports `bind:checked`,
`defaultChecked`, and `onCheckedChange(checked)`. As with Checkbox, content
comes from a Snippet. Options with the same nonempty name in the same
form and DOM root form a native group. Selecting one deselects its
neighbor and updates the neighbor's `bind:checked`. The native change
event and callback go only to the selected radio. External `checked`
updates synchronize neighbors without callbacks. Native `onchange` is
also available. Without `name`, standalone Radios are independent.

Use RadioGroup for a shared typed value. `RadioGroupProps<Value>` and
`RadioOption<Value>` accept strings, numbers, and booleans. `options`
contains primitives or
`{ value, label, disabled?, id?, title?, className?, style?, required?, onChange? }`.
`label` accepts a string, number, or Snippet. `style` remains a CSS
string as in the other Svelte components. Duplicate values render
once with the first option's label and disabled state.

```svelte
<script lang="ts">
  import { RadioGroup } from '@woodger/antd';

  const options = [
    { value: 0, label: 'Базовый' },
    { value: 1, label: 'Командный' },
    { value: 2, label: 'Архивный', disabled: true }
  ];
  let plan = $state<number | undefined>(0);
</script>

<RadioGroup {options} bind:value={plan} name="plan" aria-label="Тариф" orientation="vertical" />
```

User selection updates `bind:value` and calls `onValueChange(value)`
once, when the value changes. Numeric 0 and boolean `false` are valid
selected values and distinct from the strings `"0"` and `"false"`. To
clear externally, assign `undefined`. Prop changes leave the owner
value and callbacks untouched. If the selected option disappears,
the group has no checked input. Returning that option restores
selection.

Without `name` or `FormItem.name`, RadioGroup assigns a unique native
name so neighboring groups remain independent. The name is also
used in `FormData`. Set `name` explicitly for a stable field name.
Equal names in separate forms remain separate groups. Within one
form, use distinct names for independent groups.

Arrows update native selection and focus, skipping disabled options.
Space selects the focused option, and Tab leaves the group.
`orientation` defaults to `horizontal`. `vertical` places the options
in a column. The boolean alias `vertical` applies only when
`orientation` is omitted. The group inherits disabled state from
Form, FormItem, and ConfigProvider. Explicit `disabled=false`
overrides inheritance. Disabling the group disables all options.

`defaultChecked` for a standalone Radio and `defaultValue` for RadioGroup
are captured at creation. With bindings, set initial values in the
owner and omit defaults. Native reset restores initial values and
updates bindings in the next task after the event without callbacks.
A canceled reset keeps the current selection. The `form` attribute
associates controls with an external form. Form resets model values
through `resetFields`.

The selected enabled radio contributes a string to `FormData` under
its name. For example, `new FormData(form).get('plan')` returns
`'0'` or `'false'`, and returns `null` if no enabled option is selected.
`required` uses the native group rule, which requires one selected
input. For empty `options`, use Form rules because the group has
no native input.

In Form, pass `value={form.values.plan}` and
`onValueChange={(value) => form.setFieldValue('plan', value)}`.
A required rule checks the field value and accepts 0 and `false`.
For a standalone boolean Radio, use `checked` and `onCheckedChange`.
Use a custom validator if it must be `true`, as in the Checkbox
example.

RadioGroup gets its name, label, required state, and error description
from FormItem. A `fieldset` with `role=radiogroup` reports required and
invalid states. Individual Radios reference the error description.
Clicking the FormItem label or focusing a form error targets the
selected enabled option or the first enabled one. An empty group can
receive focus without an additional Tab stop.

RadioGroup also accepts `children` with nested Radio and RadioButton.
Nonempty `options` take precedence. An empty array leaves `children`
in place.

```svelte
<script lang="ts">
  import { RadioButton, RadioGroup } from '@woodger/antd';

  let mode = $state('month');
</script>

<RadioGroup bind:value={mode} name="mode" aria-label="Режим календаря" size="small">
  <RadioButton value="month">Месяц</RadioButton>
  <RadioButton value="year">Год</RadioButton>
</RadioGroup>
```

RadioButton corresponds to React's `Radio.Button` and adds a button
option context without a new DOM wrapper. The input stays a radio
with native keyboard behavior, name and FormData, required state,
and the existing Radio reset and binding contract. The group's
`optionType="button"` changes all child Radios. Explicit
`optionType="default"` overrides RadioButton's button context.
Without `optionType`, each child control keeps its own appearance.
`value` and `checked` bindings use the existing Svelte API.

`buttonStyle` selects `outline` (default) or `solid`. `size` inherits
`componentSize`. Local `small`, `medium`, and `large` take precedence.
`block` stretches the group and divides width among the options.
Vertical mode retains button joins and corner radii. Theme, primary
color, compact mode, and RTL use the library's current settings.
The native fieldset and existing group disabled precedence are
preserved.

`bind:nativeElement` on Radio and RadioButton returns the inner
RcCheckbox `span`. `bind:inputElement` returns the input for
`focus()` and `blur()`. Both clear on unmount. `bind:ref` returns
`{ input, nativeElement, focus(options?), blur() }`. Focus and blur
are also available via `bind:this`. On RadioGroup,
`bind:nativeElement` returns the fieldset. `autoFocus` focuses the
input on mount. Lowercase `autofocus` retains native behavior.
`tabIndex` is an alias for native `tabindex`. `rootClassName`, `class`,
and `style` apply to the label. [Type declarations](../../../src/lib/radio/radio.types.ts)

The `radio-button` recipe reproduces 70 upstream rules for buttons,
sizes, vertical and block layouts, and Badge. The existing
`vendor/radio.css` is retained. `?fixture=radio-button`, SSR and public
package tests, and browser tests include existing Radios. For Badge
in a vertical group, `width:auto` and a negative margin stretch the
wrapper and button to the group width and overlap neighboring
borders by 1px, including with the default prefix. The Badge count
inside the group receives the upstream `z-index:1`.

`classNames` and `styles` on Radio and RadioButton set `root`, `icon`,
and `label` using an object or a function of `{ props }`. The props
contain actual `checked`, `disabled`, `value`, and `name`.
`checked` includes local Svelte state. `ConfigProvider.radio` provides
shared `class`, `style`, and semantic slots, including for Radios
from `options` and a nested provider. Root styles apply as
`config.styles.root`, `config.style`, `styles.root`, and `style`.
Settings apply to each Radio as upstream, and the group keeps its
own class and style.

`prefixCls` sets the Radio base name without `-button`. A nonempty
local prefix takes precedence. Empty and undefined values inherit
ConfigProvider. Radio, RadioButton, and RadioGroup include CSS for
local or shared prefixes and the independent shared Badge namespace.
Group passes its prefix to options, while `children` choose theirs
individually. Canonical token markers and native layout are
preserved. Prefix changes preserve input and group DOM, selection,
refs, focus, text selection, and FormData.

Upstream `defaultChecked` selects a standalone input without the
wrapper checked class, so selected colors are absent on RadioButton.
Raw UMD measurements are retained separately from the comparison
with public `checked=true`. Svelte continues to reflect the actual
checked state. The ineffective upstream Badge selector with
`button-wrapper` is omitted from the new CSS template. Earlier
geometry is retained for separate analysis.

`onChange` receives
`{ target, nativeEvent, stopPropagation, preventDefault }`.
`target.value` preserves its original type. `nativeEvent` is a DOM
change event, distinct from React's MouseEvent. The option or Radio
callback runs before `Group.onChange`, which runs before
`onValueChange`. Native `onchange` remains on the input. Label and
input clicks are guarded against repeated bubbling to the outside.
`onClick`, `onFocus`, `onBlur`, `onKeyDown`, and `onKeyPress` act
on the input. `onMouseEnter` and `onMouseLeave` act on the label.
Group `onFocus` and `onBlur` receive bubbling `focusin` and `focusout`
from children. Use a function binding with a getter and setter to
let the owner reject a selection. Native checked state is restored
from typed values, including the distinction between 0 and `'0'`.

The existing native fieldset, defaults and reset, required and group
disabled rules, unique names, primitive types, and option deduplication
are preserved. These differ from React's arbitrary values, controlled
state, and child Radio disabled precedence. Upstream Radio tokens
and separate theme algorithms apply to Radio, RadioButton, and
RadioGroup. Native-only themes keep their styling. Local and shared
prefix CSS and Wave are included. React diagnostics and statics and
nested Form `NamePath` support remain pending. The additional
fixture is `?fixture=radio-features`. [Browser tests](../../../tests/browser/radio/radio-features.spec.ts) ·
[Package SSR tests](../../../tests/package/radio/radio-features.ssr.test.ts)

`?fixture=radio-prefix` compares prefixes with the official UMD.
[Browser test](../../../tests/browser/radio/radio-prefix.spec.ts)
