# Switch

Switch toggles a boolean through `bind:checked` and `onCheckedChange(checked)`.
Set defaultChecked for a standalone control. The component captures it on
creation. With a binding, initialize the value in the owner. External checked
changes leave the callback untouched.

```svelte
<script lang="ts">
  import { Switch } from '@woodger/antd';

  let notifications = $state(false);
</script>

<Switch id="notifications" bind:checked={notifications} name="notifications">
  {#snippet checkedChildren()}Вкл{/snippet}
  {#snippet unCheckedChildren()}Выкл{/snippet}
</Switch>
<label for="notifications">Уведомления</label>
```

Switch renders a button with type=button, role=switch, and aria-checked.
Space, Enter, clicking the control, and clicking its associated label each toggle
once without submitting a form. The native onclick is available. Calling
preventDefault in it cancels the toggle. Name the control with a label, FormItem,
aria-label, or aria-labelledby. The checkedChildren and unCheckedChildren
snippets are for short labels and decorative icons. They stay out of the
accessibility tree, so the control's name remains constant as its text changes.

Sizes are medium and small. By default, Switch inherits componentSize. Small
selects the small size, and medium or large from the provider uses the regular
size. An explicit size overrides inheritance. Disabled inherits Form, FormItem,
and ConfigProvider. Disabled=false overrides it. Loading shows an indicator,
sets aria-busy, and blocks interaction even with disabled=false. The current
checked state is kept while blocked. Styles support light and dark themes,
primary colors, RTL, and prefers-reduced-motion.

With name or FormItem.name, an enabled, checked Switch submits `name=on` in native
FormData, like Checkbox. `new FormData(form).get('notifications')` returns 'on'
or null. False, disabled, and loading exclude the field. The form model still
stores a boolean, including false. The form attribute associates it with an
external form. Native reset restores defaultChecked and updates the binding
in the next task after the event, without callbacks. A canceled reset preserves
the current state. Unmount cancels a pending reset.

For Form, pass `checked={form.values.notifications}` and
`onCheckedChange={(value) => form.setFieldValue('notifications', value)}`.
FormItem passes id, name, required, errors, and description to the button.
A form error focuses Switch, and blur marks the field touched. Form reset uses
the model's resetFields. The required rule treats false as a supplied value.
To require the switch to be on, set
`validator: (value) => value === true ? undefined : 'Turn on this setting.'`.
Form rules own validation.

The owner handles saving and errors. Switch reports the new state, and the
owner sets checked and loading.

Value and defaultValue alias checked and defaultChecked. Defined checked
takes priority over value. DefaultChecked, including false, overrides
defaultValue. Defaults are captured at creation. Value supports bind:value.
Initialize a boolean in the owner and choose one binding for the lifetime
of the control. To decline a user change under Svelte's checked and value
state conventions, use a getter and setter function binding.

OnChange(checked, event) and onClick(checked, event) receive a native MouseEvent
or KeyboardEvent with the button as currentTarget. A click runs the native
onclick first, which can cancel the toggle, followed by onCheckedChange,
onChange, and onClick. ArrowLeft sets false and ArrowRight sets true, including
in RTL. Repeating the arrow calls onChange even when the state matches, as in
rc-switch, and leaves onClick untouched. OnKeyDown and native onkeydown run
after arrow handling. External updates and reset leave these callbacks untouched.
OnFocus and onBlur extend lowercase handlers. Synthetic keydown uses keyCode
37 or 39, the native equivalent of the which value normalized by React for
rc-switch. Supply the code alongside the key.

CheckedChildren and unCheckedChildren accept a string, number, or snippet.
Zero is preserved. ConfigProvider.switch sets class, style, and semantic root,
content, and indicator slots. Nested providers inherit them. ClassNames and
styles accept objects or functions of props with resolved size and disabled.
Content applies to both internal labels, and indicator applies to the handle.
Root style order is config.styles.root, config.style, styles.root, then style.
PrefixCls changes classes and connects extracted CSS. RootClassName applies to
the button.

Bind:ref and bind:nativeElement expose the native button and clear on unmount.
Bind:this also exposes focus(options?) and blur(). AutoFocus calls focus on
mount. TabIndex aliases tabindex. Lowercase autofocus follows HTML behavior.
Native form and reset behavior, the hidden field, cancelable onclick, labels
hidden from the accessibility tree, and span handle keep the Svelte contract.
React uses a div handle and its own controlled state, event, and ref conventions.
Upstream Switch tokens and separate theme algorithms apply to both sizes.
Native-only themes keep their appearance. Local and shared prefix CSS and
Wave are connected. React diagnostics and statics remain outside the port.

Local and shared prefixCls cover the root, checked, loading, disabled, size,
RTL, handle, labels, and loading icon. Empty and undefined values inherit
ConfigProvider, and a nonempty local prefix takes priority. Canonical token
variables and the external anticon namespace stay in place. A prefix change
preserves DOM, refs, checked, focus, selection, and the native hidden field.
Compare with the UMD at `?fixture=switch-prefix`. [Browser](../../../tests/browser/switch/switch-prefix.spec.ts)
