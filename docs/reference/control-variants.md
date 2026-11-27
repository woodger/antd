# Control variants

`ConfigProvider.variant` sets the shared form control appearance to outlined,
filled, borderless, or underlined. `Form.variant` sets the appearance within the
nearest Form. The component types define the exact API. [ConfigProvider](../../src/lib/config-provider/ConfigProvider.svelte) ·
[FormProps](../../src/lib/form/form.types.ts)

```svelte
<script lang="ts">
  import { ConfigProvider, createForm, Form, Input, Select } from '@woodger/antd';

  const form = createForm({ initialValues: {} });
  const options = [{ value: 'editor', label: 'Editor' }];
</script>

<ConfigProvider variant="filled" input={{ variant: 'underlined' }}>
  <Input />
  <Form {form} variant="borderless">
    <Input />
    <Select {options} variant="outlined" />
  </Form>
</ConfigProvider>
```

The first Input is underlined, the second is borderless, and the Select is outlined.
Without a setting, the variant is outlined. Settings take effect in this order,
from highest to lowest priority.

1. Local variant.
2. Variant from the nearest Form.
3. Variant from the component configuration.
4. Fallback component configuration for Password, Search, and OTP, `input.variant`.
5. Shared `ConfigProvider.variant`.
6. Outlined.

In Search, the `input.variant` fallback applies only to the field. The button reads
its own `inputSearch.variant`, the Form variant, or the global variant. In the absence
of those settings, it keeps the standard Button appearance.

The shared mechanism covers Input, TextArea, InputPassword, InputSearch, InputOTP,
InputNumber, Mentions, single and multiple Select, AutoComplete, TreeSelect, Cascader,
DatePicker, TimePicker, RangePicker, TimeRangePicker, Card, and Pagination.
AutoComplete reads the Select configuration. TimePicker reads `timePicker.variant`,
and TimeRangePicker reads `rangePicker.variant`. Pagination uses the Input variant
for its field. Its size changer keeps a separate Select configuration.

Card has local outlined and borderless variants. As upstream does, Card keeps its
border for inherited filled and underlined settings. These settings share the same
Card appearance. Button, Tag, and SpaceAddon use their own rules for variants.

ColorPicker sets its internal format selector to borderless, matching upstream
ColorInput. This local rule takes effect in any Form or ConfigProvider. The other
ColorPicker fields read the normal Input and InputNumber settings.

A nested ConfigProvider inherits missing component configuration. An explicit
object, including an empty one, replaces the corresponding parent object in full.
A global variant on the nested provider leaves an inherited component variant in
effect. `theme.inherit=false` resets the theme and keeps the variant settings.

A nested Form with `variant=undefined` resets the outer Form variant and restores
component and global configuration priority. `component={false}` retains the Form
context without a native wrapper, so it can be used inside an existing form.
By default, Form renders the same native form with submit, reset, and validation.

Appearance updates after mount preserve control DOM, entered text, focus,
selection, selected values, and FormData. Change callbacks run for their normal
triggers independently of the variant update. Native events, bindings, semantic
styles, and theme tokens keep their contracts.

`Select` and `AutoComplete` share provider settings. [Select appearance and state](components/select.md#styling-and-state)
TreeSelect also supports `classNames`, `styles`, and `switcherIcon`. [TreeSelect](components/tree-select.md)
Card and Meta also support class, style, and semantic configuration. [Card](components/card.md)
`MentionsComponentConfig` belongs to the provider, and the existing `MentionsConfig`
configures `getMentions`. Form's `component` accepts `form` or `false`. Arbitrary wrapper
tags are outside the supported API.

The reference is the unchanged Ant Design 6.6.8 UMD bundle from the pinned npm archive.
The reference matrix records raw computed colors, borders, and classes for all consumers.
Priority is covered by unit tests, the public SSR package by package tests, and appearance,
updates, and isolation by browser tests. [Reference matrix](../../tests/browser/fixtures/ant-design-config-variants-reference.json) ·
[Unit tests](../../src/lib/config-provider/variant.engine.test.ts) ·
[Package tests](../../tests/package/config-provider/config-variants.ssr.test.ts) ·
[Browser tests](../../tests/browser/config-provider/config-variants.spec.ts)
