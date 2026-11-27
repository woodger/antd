# Checkbox

```svelte
<script lang="ts">
  import { Checkbox } from '@woodger/antd';

  let checked = $state(false);
  let indeterminate = $state(true);
</script>

<Checkbox bind:checked bind:indeterminate name="notifications" value="enabled">
  Receive notifications
</Checkbox>
```

`checked` supports a binding and the `onCheckedChange(checked)` callback.
Use `defaultChecked` for a standalone control. With a binding, set the initial
value in the owner. Native form reset restores `defaultChecked` and updates the
binding. Reset and external prop updates leave `onCheckedChange` untouched.
The native `onchange` event is available separately.

`indeterminate` sets the mixed state, supports binding, and clears on a user
toggle. It leaves `checked` and FormData intact. A checked checkbox submits
`name=value`, with `on` as the default value. FormData excludes unchecked or
disabled checkboxes.

In FormItem, pass `checked={form.values.accepted}` and
`onCheckedChange={(value) => form.setFieldValue('accepted', value)}`. Explicitly
type a model with a boolean, for example `createForm<{ accepted: boolean }>(...)`.
To require `true`, use
`validator: (value) => value === true ? undefined : 'Please confirm your consent.'`.
The built-in `required` rule checks whether a value is present and accepts
`false` as present. `form.resetFields()` restores the value from `initialValues`.

`onChange` receives `{ target, nativeEvent, stopPropagation, preventDefault }`
with typed target.checked and target.value. The lowercase onchange remains a
separate DOM event. The Checkbox callback runs before Group.onChange. A user
toggle still calls onCheckedChange and resets indeterminate. NativeEvent is
the DOM change event. The label and input use the upstream click bubble lock,
so one click bubbles out when the label is activated.

ConfigProvider.checkbox sets class, style, and semantic root, icon, and label
slots, including Group variants and nested providers. Local classNames and styles
accept objects or callbacks over resolved checked, indeterminate, and disabled
props. Root style order is config.styles.root, config.style, styles.root, and
style. Title applies to the inner span as in upstream. Class, rootClassName, and
style apply to the label. PrefixCls changes the classes. Consumers supply CSS
for arbitrary prefixes.

`bind:inputElement` and `bind:nativeElement` expose the input and inner span.
`bind:ref` exposes `{ input, nativeElement, focus(options?), blur() }`.
Refs clear on unmount. `bind:this` also exposes focus and blur. AutoFocus calls
native focus once on mount, and lowercase autofocus follows HTML behavior.
TabIndex aliases tabindex. OnFocus, onBlur, onKeyDown, and onKeyPress run on the
input. OnMouseEnter and onMouseLeave run on the label. Lowercase native handlers
remain available.
