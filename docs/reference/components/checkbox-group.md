# CheckboxGroup

CheckboxGroup collects several checkboxes into one array field.
`CheckboxGroupProps<Value>` and `CheckboxGroupOption<Value>` support string,
number, and boolean. Options accepts primitives or objects of the form
`{ value, label, disabled?, id?, title?, className?, style?, required?, onChange? }`.
A primitive uses String for its label. Label accepts a string, number, or snippet,
and style is a CSS string. Nullish entries and values are skipped.

```svelte
<script lang="ts">
  import { Checkbox, CheckboxGroup } from '@woodger/antd';

  const options = [
    { value: 'read', label: 'Просмотр' },
    { value: 'edit', label: 'Редактирование' },
    { value: 'archive', label: 'Архив', disabled: true }
  ];
  let permissions = $state<string[]>(['read']);
</script>

<CheckboxGroup {options} bind:value={permissions} name="permissions" aria-label="Права доступа" />
```

With options, each user toggle updates bind:value and calls onValueChange(values)
with a new array in options order. The callback gets its own array. Duplicate
options render once and keep the first label and disabled state. Numeric 0 and
string "0" are distinct, as are false and "false".

External value and options updates leave the owner's array and callback alone.
Temporarily missing options are hidden and show their saved selection when
returned. The next user toggle emits only current options, without duplicates,
in current order.

The group inherits disabled from Form, FormItem, and ConfigProvider. Explicit
`disabled={false}` overrides it. Group disabled blocks every option, and option
disabled blocks its own checkbox. An already selected disabled option stays
in the array.

Standalone defaultValue accepts a readonly array and is copied once. With
bind:value, initialize the value in the owner. Native form reset restores
defaultValue or an empty array and updates the binding without callbacks. The
array updates in the task after the reset event so a canceled reset preserves
selection. External forms through the form attribute are supported. Form uses
the model's resetFields.

The group uses native checkboxes. Tab moves focus, and Space or the label toggles
the option. With name or FormItem.name, selected enabled options appear in
FormData under one name. Read them with `new FormData(form).getAll('permissions')`.
The result is strings in options order, excluding disabled, missing, and unselected
options. For example, selected numeric 0 and boolean false submit as `['0', 'false']`.

In Form, use `value={form.values.permissions}` and
`onValueChange={(value) => form.setFieldValue('permissions', value)}`.
Required, min, and max apply to the whole array. Required stays off individual
inputs, so users can select a subset. FormItem passes name, description, and
errors. The group uses a fieldset named through the FormItem label,
aria-label, or aria-labelledby. A validation error or label activation focuses
the first available option. An empty group can receive focus without an extra
Tab stop.

Nonempty normalized options take priority over children. Empty options leave the
snippet, including Checkbox inside Row, Col, or other containers.

```svelte
<script lang="ts">
  import { Checkbox, CheckboxGroup } from '@woodger/antd';

  let permissions = $state<string[]>(['read']);
</script>

<CheckboxGroup bind:value={permissions} name="permissions" aria-label="Права доступа">
  <Checkbox value="read">Просмотр</Checkbox>
  <Checkbox value="edit">Редактирование</Checkbox>
</CheckboxGroup>
```

Children register their current values and unregister on removal or value
change. As upstream does, internal state keeps selection order and temporarily
missing values. Bind:value reflects that raw state, and callbacks receive only
registered values. A returning child therefore shows its saved selection.
OnChange(values) runs before onValueChange. Callback arrays are independent
of state. Options retain the sorting and normalization above. A getter and
setter function binding lets the owner decline a change, restoring native checked
from typed values without conflating 0 and '0'.

SkipGroup keeps Checkbox standalone with its own checked, name, and callbacks.
An outer native fieldset's disabled still applies. Nested groups have isolated
contexts. Table row selection uses skipGroup as upstream does. Group.nativeElement
is a bindable fieldset, and rootClassName, prefixCls, and explicit role apply
to it. PrefixCls reaches generated options. Child Checkbox can set its own prefixCls.

Checkbox and CheckboxGroup load local and shared prefix CSS. A nonempty local
prefix takes priority, and empty or undefined inherits ConfigProvider. Row uses
the shared namespace independently of local Checkbox. Canonical token markers
and Wave target stay in place. A prefix change preserves group and input DOM,
refs, checked and mixed state, selected array, focus, selection, and FormData.
With a shared local class, upstream can retain the first provider's Row selector.
Nested Inner then gets flex-grow:0, and a fresh Inner with the same props and
theme gets 1. Both measurements are preserved. The native implementation scopes
CSS by local class and shared namespace.

Native fieldset, form, reset, and required behavior, enforced group disabled,
primitive values, option deduplication, bind:indeterminate, and defaults are
preserved. React uses different state and ref conventions, child disabled
overrides, and controlled indeterminate. Upstream Checkbox aliases and separate
theme algorithms apply to Checkbox and CheckboxGroup. Native-only themes
retain their appearance. Local and shared prefix CSS and Wave are supported.
React diagnostics and statics remain outside the port. The UMD comparison uses
`?fixture=checkbox-prefix`. [Prefix browser tests](../../../tests/browser/checkbox/checkbox-prefix.spec.ts) ·
[Checkbox types](../../../src/lib/checkbox/checkbox.types.ts) · [Group types](../../../src/lib/checkbox/checkbox-group.types.ts) · [Browser](../../../tests/browser/checkbox/checkbox-features.spec.ts) ·
[Package SSR](../../../tests/package/checkbox/checkbox-features.ssr.test.ts) · [Engine](../../../src/lib/checkbox/checkbox-group.engine.test.ts)
