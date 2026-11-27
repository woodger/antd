# ConfigProvider empty states

`ConfigProvider.renderEmpty` sets shared content for empty lists and tables.
The function receives the component name. Return a string for a plain message or
a Svelte snippet for markup. [RenderEmptyContent return types](../../src/lib/types.ts)

```svelte
<script lang="ts">
  import { ConfigProvider, Select } from '@woodger/antd';
</script>

{#snippet noData()}<p>No matching records.</p>{/snippet}

<ConfigProvider renderEmpty={() => noData}>
  <Select options={[]} aria-label="Member" />
</ConfigProvider>
```

## Consumers and precedence

| Consumer | Callback name | Local override | Callback result fallback |
| --- | --- | --- | --- |
| Select | Select | notFoundContent !== undefined | `||`, small Empty with simple image |
| TreeSelect | TreeSelect | notFoundContent !== undefined | `||`, small Empty with simple image |
| Cascader / CascaderPanel | Cascader | notFoundContent !== undefined | `||`, small Empty with simple image |
| Mentions | Mentions | notFoundContent !== undefined | `||`, small Empty with simple image |
| Transfer | Transfer | locale.notFoundContent after computing the default | `||`, small Empty with simple image |
| Table | Table | Existing empty snippet | `||`, Empty with simple image |
| Table filter | Table.filter | — | `??`, localized Empty with image height=24px |
| AutoComplete | — | notFoundContent | Uses the local result as in the upstream combobox |

In Select, TreeSelect, Cascader, and Mentions, local null, an empty string, and 0 take
precedence without calling the global callback. Table retains its native empty
snippet. The full `locale.emptyText` API is outside the current port.

For most consumers, a global callback result of null, undefined, false, 0, or an
empty string selects the upstream preset. True and an empty array are truthy and
render no content while bypassing the preset. For Table.filter, only null and
undefined select the fallback. False and an empty string leave an empty block,
and 0 renders as text. `DefaultRenderEmpty` returns null for Table.filter. The filter
sets the image height to 24px and the description to `Locale.table.filterEmptyText`.
The filter is also available when `filters=[]` is passed explicitly in the supported
native client or server column mode.

Transfer computes the shared renderer first and then applies `props.locale`, including
explicit `notFoundContent=undefined` or `notFoundContent=null`. A top-level array selects
content by list direction as upstream does. Nested arrays on the selected side
render recursively. Both sides share the result of one global callback.

A nested ConfigProvider inherits `renderEmpty` when it is undefined. A local function
replaces the parent function and uses the preset if it returns a falsy result.
`ConfigProvider.empty` applies to the resulting Empty. A local preset with
`image=simple` takes priority over the contextual image.

## Native contracts

Without a `renderEmpty` setting, the localized empty text, loading behavior, and
empty-state markup stay the same. When a configured callback returns a falsy value,
the upstream presets apply. Local `notFoundContent=0` still displays 0 in Select and
TreeSelect. The upstream popup is hidden for those cases. This is checked separately
against a fresh build of the native baseline. [Baseline 8847e8d](../../tests/browser/fixtures/render-empty-native-reference.json)

The content renders without an extra DOM wrapper. A stable returned snippet keeps
its DOM and state when the function that produces it changes. Select allows focus
in controls within the empty content. Moving focus outside closes the list. The
native input blur callback and closing the popup with Tab from the combobox retain
their behavior. To keep focus in the search field during an action, prevent the
default pointerdown behavior.

Keep the callback pure because it can run during SSR and when creating a hidden
popup. Svelte evaluates it when the empty branch consumes it. Transfer evaluates
it while calculating the locale. React render counts are outside the Svelte
contract. AutoComplete uses the local empty state. The shared ConfigProvider
`prefixCls`, full React DOM, and other unfinished consumer APIs remain outside
this porting stage.

## Checks and sources

- The shared renderer and its presets. [RenderEmpty](../../src/lib/empty/RenderEmpty.svelte) ·
  [DefaultRenderEmpty](../../src/lib/empty/DefaultRenderEmpty.svelte)
- The pinned UMD reference has 151 official scenarios and a Select interaction trace.
  The checks compare 149 scenarios directly and two against the native baseline.
  [Reference data](../../tests/browser/fixtures/ant-design-render-empty-reference.json)
- [Browser checks](../../tests/browser/empty/render-empty.spec.ts) ·
  [Public package SSR](../../tests/package/empty/render-empty.ssr.test.ts)
- [Upstream defaultRenderEmpty](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/config-provider/defaultRenderEmpty.tsx)
- Focus transitions come from BaseSelect in @rc-component/select 1.10.1. The pinned
  Ant Design wrappers, Transfer, and FilterDropdown define the remaining precedence rules.
