# Select

Without `mode`, Select uses single selection and a scalar value.
In `mode="multiple"`, the value and callback use arrays. Choices come
from `options`, and selected items display remove buttons.
`SelectProps<Value>` describes the existing single API, and
`SelectProps<Value, 'multiple'>` describes multiple selection. The
component infers value and callback types from `options` and
`mode`. `SelectProps<Value, 'tags'>` accepts an array of
`Value | string`. Free text creates strings and original numeric
keys are preserved.

## Option data and fieldNames

`SelectProps<Value, Mode, OptionType>` adds the source record type
as the third parameter and preserves the order of `Value` and
`Mode`. `AutoCompleteProps<OptionType>` types the raw data and
keeps the control's string value. For conditional flat and grouped
arrays, specify a common record type. If TypeScript cannot infer
a mixed value type from binding, use `Select<string | number>`.

`fieldNames` sets `value`, `label`, `options`, and `groupLabel`.
Empty names use standard fields. `groupLabel` defaults to the
resolved `label`. Grouping has one level. A nested group within
children acts as a terminal option, as upstream.

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';
  interface Entry {
    key?: string;
    uid?: string;
    text?: string;
    heading?: string;
    nodes?: readonly Entry[];
  }
  const MappedSelect = Select<string, undefined, Entry>;
  const options: readonly Entry[] = [{ key: 'teams', heading: 'Teams', nodes: [
    { uid: 'development', text: 'Development' }
  ] }];
  let value = $state<string>();
</script>

<MappedSelect {options} bind:value
  fieldNames={{ value: 'uid', label: 'text', options: 'nodes', groupLabel: 'heading' }} />
```

Value and label come from mapped fields. Row keys independently
use literal `key`, then literal `value`, then
`rc-index-key-${index}`. Bigint, 0, and the empty key are kept.
Absolute index includes headings and follows current filter and sort.
Group metadata is separate from raw records. Option `title`,
`className`, CSS object `style`, and allowed DOM, data, and ARIA
attributes pass to the native button. Mapped fields stay out
of the DOM. The physical group heading uses only `className`,
`title`, and content. Native CSS strings and the `class` alias
are retained.

`onChange` runs when the sequence of values changes. `onSelect`
runs on every selection, including repeated single selection.
`onDeselect` runs on removal in multiple and tags modes.
`onClear` precedes `onChange` and fires no `onDeselect`. The
second argument preserves raw fields as a shallow copy of a
selected record, or an array of copies in multiple mode. For
duplicate values the last record in the current data map wins.
Nested objects retain their identity. A free tag without a
source record passes an empty object. `onChange`, `onSelect`,
and `onDeselect` types account for this in tags mode. Checking
a required option field, for example `option.sku !== undefined`,
lets TypeScript narrow to the full option type. `bind:value`
and `onValueChange` are preserved. A removed selected option
stays cached until deselection. Without `labelInValue`, the selected
value is a string or number, or an array of those values.

Select caches the label and original data before passing a
new value to the owner. The option keeps its label and
`onDeselect` data even if the owner accepts selection and
removes the option in one update. Reconciling with the
accepted `value` evicts rejected entries. In repeated React
6.6.8 measurements, the combined update lost the label or
option data depending on mode. [React measurements](../../../tests/browser/fixtures/ant-design-select-immediate-cache-reference.json)

The original scenarios, SSR, attributes, and diagnostics
are recorded independently of the implementation. The large
main reference is stored in gzip. The loader uses standard
Node.js zlib and checks the original byte SHA-256.
[40 upstream scenarios](../../../tests/browser/fixtures/ant-design-select-data-reference.json.gz) · [40 SSR renders](../../../tests/browser/fixtures/ant-design-select-data-ssr-reference.json.gz)
· [Attributes](../../../tests/browser/fixtures/ant-design-select-data-attributes-reference.json.gz) · [Diagnostics](../../../tests/browser/fixtures/ant-design-select-data-diagnostic-reference.json.gz)

Native label and NFKD search and disabled caching use separate
public upstream owners for comparison. The original ledgers
are unfiltered. [Search](../../../tests/browser/fixtures/ant-design-select-data-label-native-reference.json.gz) · [Cache](../../../tests/browser/fixtures/ant-design-select-data-cache-native-reference.json)

Virtual upstream Select loses the mapped `aria-selected`.
Svelte uses the mapped state. Multiple token lookup uses
mapped value. With the same input, upstream reads literal
`value` and loses selection. [Paired observation](../../../tests/browser/fixtures/ant-design-select-data-aria-reference.json.gz)

[Browser tests](../../../tests/browser/select/select-data.spec.ts) · [Attributes](../../../tests/browser/select/select-data-attributes.spec.ts) ·
[Diagnostic boundaries](../../../tests/browser/select/select-data-diagnostics.spec.ts) · [SSR](../../../tests/package/select/select-data.ssr.test.ts) ·
[Strict hydration](../../../tests/browser/select/select-data-hydration.spec.ts)

## Selected labels and labelInValue

`labelInValue={true}` changes `value`, `defaultValue`, and the
first callback argument to `{ value, label }`. Multiple and
tags use an array of those objects. Top-level `null` clears
selection without using `defaultValue`. The input label
can be a string, number, boolean, content array, or Svelte
Snippet. Explicit `label` takes precedence. A missing or
undefined label uses `optionLabelProp` or the mapped option label.

`SelectProps<Value, Mode, OptionType, LabelInValue>` preserves
the first three parameters. The fourth defaults to `false`,
and `boolean` gives a primitive or labeled union. With explicit
`Select<number>`, the other parameters use defaults. For a
labeled specialization, supply all four, for example
`Select<number, undefined, Entry, true>`. Without explicit
specialization, the component infers the labeled type from props.

`labelRender(info)` is a callback receiving `label`, `value`,
`key`, `disabled`, and `title` and returning content, including
a Snippet. `key` equals the raw value. A result of `null` or
`undefined` falls back to raw value. `false` or an empty
string leaves the visible label empty. Keep the callback
pure because it also runs during SSR.

```svelte
<script lang="ts">
  import { Select, type SelectLabelValue } from '@woodger/antd';
  const options = [{ value: 0, label: 'Zero', alternate: 'Number zero' }];
  let value = $state<SelectLabelValue<number> | undefined>();
</script>

{#snippet selectedLabel()}<strong>Number zero</strong>{/snippet}
<Select {options} labelInValue bind:value optionLabelProp="alternate"
  labelRender={() => selectedLabel} name="number" />
```

`onChange` receives labels from the current transformation.
`onSelect` and `onDeselect` get the source option's mapped label,
independent of `optionLabelProp` and `labelRender`. Removing a
tag via its button or Backspace passes the remaining rendered
labels through `onChange`, as upstream. Uncontrolled selection
retains the label after interaction. A controlled owner
with a raw value rereads options. Single `className`, `style`,
and `title` come from the first match in current filtered and
sorted results. The callback option comes from the last value
match. Rich labels are retained in `tagRender` and
`maxTagPlaceholder`. `maxTagTextLength` truncates only strings
and numbers. FormData still contains raw values.

The references retain independent upstream observations.
[48 upstream scenarios and 278 actions](../../../tests/browser/fixtures/ant-design-select-value-reference.json.gz) ·
[Atomic mode transitions](../../../tests/browser/fixtures/ant-design-select-value-live-reference.json.gz) · [SSR](../../../tests/browser/fixtures/ant-design-select-value-ssr-reference.json.gz) ·
[Public owner disabled cache](../../../tests/browser/fixtures/ant-design-select-value-cache-native-reference.json)

Svelte retains closed input scalar text and caret, the
owner's query, the distinction between 0 and `"0"`, and the
removed option's disabled cache. Searchable required checks
raw selection regardless of rich or empty visible labels.
Rich content remains DOM or Snippet content outside input
text. Upstream can leave the physical selected marker on
numeric 0 after reopening with string `"0"`. The observation
is retained. Svelte follows the raw value. AutoComplete
does not receive `labelInValue` or `optionLabelProp`.
[Browser tests](../../../tests/browser/select/select-value.spec.ts) · [Hydration](../../../tests/browser/select/select-value-hydration.spec.ts) ·
[SSR and types](../../../tests/package/select/select-value.ssr.test.ts) · [Label behavior](../../../tests/browser/select/select-value-opacity.spec.ts)

## Styling and state

`variant` supports `outlined`, `filled`, `borderless`, and
`underlined` in single, multiple, and tags modes. The default
is `outlined`. Explicit variant overrides Form and provider
settings. Style changes retain DOM, search text, selection,
focus, and selected form values. Browser tests compare
classes and computed styles with the official 6.6.8 UMD.
Shared variant and Select settings apply after local props.
[Browser tests](../../../tests/browser/select/select-variants.spec.ts) · [Provider and Form variants](../control-variants.md)

A nonempty `prefixCls` sets local classes for control, tags,
and popup. Empty or undefined values inherit
`ConfigProvider.prefixCls`. CSS scopes separate the owner's
prefix and shared internal variable namespace while retaining
canonical theme variables. The native wrapper, option buttons,
FormData and reset, and generated IDs are preserved. Changing
the prefix keeps the list open and retains query, selection,
focus, and keyed options, including with a local popup
container and responsive tags. The comparisons cover single,
multiple, tags, sizes, variants, status, aliases, and open
options in normal, nested, and reset scopes. The additional
native compact styling preserves outer container geometry.
[26 UMD configurations](../../../tests/browser/fixtures/ant-design-select-prefix-reference.json) · [Browser tests](../../../tests/browser/select/select-prefix.spec.ts) ·
[SSR tests](../../../tests/package/select/select-prefix.ssr.test.ts)

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';

  const options = [
    { value: 0, label: 'Engineering' },
    { value: 1, label: 'Design' },
    { value: 2, label: 'Archive', disabled: true }
  ];
  let teams = $state<number[]>([0]);
</script>

<label for="teams">Teams</label>
<Select id="teams" mode="multiple" {options} bind:value={teams} name="teams" allowClear />
```

With upstream ConfigProvider theme settings, Select applies
its own tokens and aliases to selector and dropdown.
These set tag and option metrics, padding, colors, focus
border and outline, arrow, and clear. Component algorithms,
custom CSS prefix, zero, and explicit `undefined` are supported.
Theme changes preserve field and list DOM, input, selection,
focus, and FormData. Native-only themes retain existing
styles. `style` applies to the outer wrapper.
[Theme reference](../theme-context.md#select-tokens)

`getPopupContainer` receives the inner `.ant-select` root.
The local getter overrides `ConfigProvider.getPopupContainer`,
and `undefined` inherits the provider. The list defaults to a
fixed native popover with field width, position updates,
outside and Escape dismissal, and focus retention. Without a
getter it keeps the existing DOM parent. `placement` accepts
`bottomLeft`, `bottomRight`, `topLeft`, and `topRight`. The
default is `bottomLeft` or `bottomRight` in RTL. The getter
is skipped during SSR and before first opening. ShadowRoot
requires its own styles. Replacing the getter with the same
container preserves list DOM, search, and selection. Closing
Select removes its list. AutoComplete retains its mounted
popup until unmount. `?fixture=select-container` compares 32
official Ant Design 6.6.8 UMD scenarios for both components.
[Container tests](../../../tests/browser/select/select-container.spec.ts)

`popupMatchSelectWidth` controls list width. `true` uses the
field width, `false` sizes to content with field width as its
minimum, and a number sets pixels with the same minimum.
Omission and `undefined` inherit
`ConfigProvider.popupMatchSelectWidth`, defaulting to `true`.
Width changes preserve field, selection, focus, and selected
form values. An invalid numeric CSS width keeps the last
accepted value as in React, including after prop changes
to a closed visited popup and reopening it. Hidden measuring
DOM in AutoComplete and TreeSelect creates no such history
before the first open.

`listHeight` limits the inner list viewport and defaults to
256px. Actual padding and border are outside that height.
`listHeight=0` removes the limit. `virtual` defaults on and
inherits `ConfigProvider.virtual`. An own prop overrides the
provider. Explicit `undefined` selects the default even with
provider `false`, as upstream. `popupMatchSelectWidth=false`
disables virtualization, while numeric 0 leaves it on.
`listItemHeight` estimates unmeasured rows and defaults to
`token.controlHeight`, usually 32px. Actual heights of mounted
rows, including AutoComplete groups, are measured individually.
A zero estimate disables the window and retains the original
accessible listbox.

`showScrollBar` accepts `true`, `false`, or `'optional'`.
Optional shows the bar during scroll and calls to `scrollTo`
and hides it after three seconds. `onPopupScroll` receives
the inner holder's native scroll event, with its `div` as
`currentTarget` and `this`. With `virtual=true`, the accessible
listbox includes neighbors of the active option and the
visible window contains measured rows. `virtual=false`
puts every option in the listbox.

`bind:this` exposes `SelectRef` or `AutoCompleteRef` with
`focus(FocusOptions)`, `blur()`, and `scrollTo(config)`.
`bind:nativeElement` points to `div.ant-select` and
`bind:inputElement` to the editor. A number passed to
`scrollTo` is an index. An object accepts `index` or `key`,
`align` (`'top'`, `'bottom'`, or `'auto'`), and `offset` as a
number or function of measured `getSize`. `{top,left}` sets
the scroll position. `null` and `undefined` show the bar
without changing position. Before first open, scrolling
is skipped. Closed index and key requests are ignored.
A closed `{top,left}` position applies to the viewport after
opening. This keeps DOM and the virtual window consistent
where rc-select 1.10.1 can reopen with different offsets.

`onActive(value|null)` reports the active option.
`defaultActiveFirstOption` defaults to `true` in Select and
`false` in AutoComplete. Multiple activations in one
microtask keep only the last callback. After unmount it is
skipped. Existing native values, forms, controlled search on
close, and synchronous blur are preserved.

Search defaults off for single and on for multiple.
`showSearch` overrides those defaults. Tags always allows
search, including with `showSearch={false}`. Clicking an
option in multiple mode adds or removes it, clears search,
and preserves the open list and field focus. Display
deduplicates selected values in first-occurrence order and
keeps their types. Numeric `0` and string `"0"` are distinct.
The owner's array is left intact.

The remove button or Backspace with empty search removes an
enabled selection. Backspace uses the last available selection.
Disabled options cannot be selected or removed individually,
even if already selected. `allowClear` shows a clear button for
all values. A user change sends a new callback array. Mutating
it leaves the binding intact. External value and option updates
skip `onValueChange`. A temporarily missing selected option
retains its last known label and disabled state in single
and multiple. Its reappearance takes the current values.
An option never present uses `String(value)`. The cache holds
only current selections and clears entries on deselection.

For a standalone control, `defaultValue` accepts a readonly
array copied once. With binding, set the initial value in
the owner and omit `defaultValue`. Pass `[]` to clear.
In multiple mode, native form reset restores `defaultValue`
or an empty array, updates the binding, and closes without
callbacks. The `form` attribute associates an external form.
A canceled reset leaves Select intact. Form's model resets
via `resetFields`. Single mode retains its owner-managed reset.

With `name` or `FormItem.name`, each selection contributes a
FormData field of the same name. For example,
`new FormData(form).getAll('teams')` returns strings such as
`['0', '1']`. Empty selection gives `[]`, and disabled omits the
values. Search text is excluded. Native `required` in multiple
mode checks for selected values, including 0, and leaves
search text optional. `locale.removeText` labels removal and
`locale.selectRequiredText` sets the native required message.

In Form, pass `value={form.values.teams}` and
`onValueChange={(value) => form.setFieldValue('teams', value)}`.
Type the array explicitly, for example
`createForm<{ teams: number[] }>({ initialValues: { teams: [] } })`.
`required` rejects an empty array, and `min` and `max` bound the
number of elements.

## List visibility

`defaultOpen` sets only initial visibility. `open` controls it.
`onOpenChange` reports a request that the owner can accept or
reject. Use `bind:open` for two-way Svelte state. External `open`
changes and initial opening leave `onOpenChange` and field focus
untouched.

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';
  let open = $state(false);
  const options = [{ value: 'a', label: 'Alpha' }];
</script>

<Select {options} bind:open />
<!-- The owner can accept only permitted requests. -->
<Select {options} {open} onOpenChange={next => { open = next; }} />
```

`open` takes precedence over `defaultOpen`. Removing controlled
`open` returns to closed uncontrolled state as with upstream
`useControlledState`. Changing `defaultOpen` after mount does
not reopen the list. Disabled hides the popup. Uncontrolled
state closes and stays closed on re-enable. Explicit
`open=true` preserves the owner's request and shows the popup
when enabled again. These transitions produce no callbacks.
External closing in single mode clears local search. The
owner updates controlled search. Input DOM, selections, and
focus remain. External opening accounts for the selected
single value when choosing the active option. ArrowUp on
user opening keeps the existing native behavior of moving
to the last enabled option.

With empty results, `notFoundContent=null`, `false`, or the empty
string hides the popup and retains raw `open` and input. The
popup returns when options appear. Numeric 0 is visible.
Upstream Select hides it due to a falsy check.
`notFoundContent` accepts shared `RenderEmptyContent`,
including booleans and readonly arrays. The form still resets
multiple and tags without callbacks and closes `bind:open`.
Explicit controlled `open` remains with the owner.

SSR always emits `aria-expanded=false` without a popup or
calls to `optionRender` or the getter. Current state applies
on mount. React defers closing through MessageChannel.
Svelte retains immediate native closing.
[25 client and React SSR scenarios](../../../tests/browser/fixtures/ant-design-select-open-reference.json) ·
[Browser tests](../../../tests/browser/select/select-open.spec.ts) · [SSR and public types](../../../tests/package/select/select-open.ssr.test.ts)

## Option content

`optionRender` supplies a passive Snippet inside the existing
native option button. It receives `(option, { index })` with
key, value, raw label, the current result record in `data`,
and `groupOption=true` for group children or `false` for flat
items. Group headings skip the renderer. Keys follow the
shared data rules. Extra data fields and mapped labels are
`unknown`, so narrow complex values in TypeScript.

```svelte
<script lang="ts">
  import { Select, type SelectFlattenOption } from '@woodger/antd';
  const options = [{ value: 'happy', label: 'Happy', emoji: '😄' }];
</script>

{#snippet optionRender(option: SelectFlattenOption<string>, info: { index: number })}
  <span aria-hidden="true">{option.data.emoji}</span> {option.label} ({info.index + 1})
{/snippet}
<Select {options} {optionRender} />
```

The index follows the current order after filtering and
sorting. Regular `data` retains the original option reference.
Filter and sort can create upstream shallow group copies.
Keys and extra fields are retained. `maxCount` affects
button availability and leaves raw `disabled` in `data` intact.
Synthetic tags and selected values outside options receive
the corresponding temporary object. Selected labels, token
matching, callbacks, and FormData use the existing data
independently of the Snippet. An empty renderer leaves a
selectable option without content. Native option buttons
cannot contain nested interactive controls.

Changing or removing the renderer in an open list preserves
the input, query, selection, and focus. Closed SSR does
not call `optionRender`. Native value keys and option
styling are retained. Groups, `fieldNames`, and raw option
attributes use the shared data pipeline. Semantic slots are
described below. [16 upstream cases](../../../tests/browser/fixtures/ant-design-select-option-render-reference.json) ·
[Browser tests](../../../tests/browser/select/select-option-render.spec.ts) · [SSR and types](../../../tests/package/select/select-option-render.ssr.test.ts)

## Popup and semantic styling

An embedded popup inherits its owner's layer.
[Owner layer](../theme-context.md#layering-nested-panels)

`popupRender` is a pure function receiving the original menu
Snippet. It can return that Snippet, a scalar or array, or a
Snippet receiving the original menu as an argument.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select } from '@woodger/antd';
  const options = [{ value: 'reader', label: 'Reader' }];
</script>

{#snippet popup(originMenu: Snippet)}
  <section>
    <header>Roles</header>
    {@render originMenu()}
    <footer>Additional information</footer>
  </section>
{/snippet}

<Select {options} prefix="Role" popupRender={() => popup}
  classNames={({ props }) => ({ root: props.disabled ? 'blocked' : 'available' })}
  styles={{ input: { color: 'navy' }, popup: { root: { maxHeight: 320 } } }} />
```

The function runs even when closed, including during SSR.
A returned Snippet creates DOM after first opening and
retains state on close. Changing or clearing the renderer
on a closed, previously visited popup updates its content on
the next open. Snippets retain normal Svelte reactivity.
`null`, `undefined`, `false`, and the empty string leave a
custom popup empty. Without the original menu, arrows and
Enter do not select options and Escape leaves the popup
open. Blur and outside dismissal retain their normal
behavior. Custom popup clears FormItem status and feedback
and Compact while preserving Form disabled state, variant,
errors, and warnings.

Select's default panel unmounts on close until first use of
a custom popup. After that it is retained even when switching
back to the default menu. AutoComplete retains a visited
default popup.

`classNames` and `styles` take an object or pure function
`({ props }) => map`. Metadata keeps supplied props with
resolved variant, status, disabled state, and size. Functions
also run during SSR. Select metadata treats omitted `value`
or `open` the same as explicit `undefined`.

Select slots are `root`, `prefix`, `suffix`, `input`,
`placeholder`, `content`, `item`, `itemContent`, `itemRemove`,
`clear`, and `popup.root`, `popup.list`, and `popup.listItem`.
`classNames.popup` also accepts a string. `prefix` is a scalar,
array, or Snippet. A falsy scalar, including 0, leaves out the
affix.

CSS objects accept camelCase properties, numbers, and custom
properties. An own `undefined` clears a previously set property.
Changed properties update individually so shorthand and
longhand order and previous declarations follow React
behavior. In Select, object `style` and semantic root style
the control itself, while existing string `style` and
`class` apply to the outer native container. AutoComplete
has one root. `rootClassName` applies to control and popup.

In multiple and tags with semantic styling, input width
is recalculated on search text changes. Changing only
`fontSize` does not measure. As in Ant Design, measurement
clears inline `styles.input.width`. Resupplying the same
width leaves it cleared until that property's value changes.
SSR renders the supplied width without measuring.

`ConfigProvider.select` supplies shared `class`, `style`,
`classNames`, `styles`, `variant`, `showSearch`, icons, and
boolean or object `allowClear`. Local values take precedence.
An explicit nested select record replaces the parent.
AutoComplete uses the same settings and retains its
`allowClear=false` default.

## Icons and clearing

Select and AutoComplete support `suffix`, `suffixIcon`,
`loadingIcon`, `showSearch.searchIcon`, `menuItemSelectedIcon`,
and `allowClear={boolean | { clearIcon, label }}`. In multiple
and tags, Select also accepts `removeIcon`. Icons except
`suffix` inherit from `ConfigProvider.select`, with local
props taking precedence. A nested select record replaces
its parent in full.

`suffixIcon` changes the default icon. Without a local
value, loading uses `loadingIcon`, open search uses
`searchIcon`, and the remaining cases use provider
`suffixIcon` or the arrow. Local `suffixIcon={null}` hides
the icon and retains its wrapper for Form feedback when
present. `suffix` replaces all content including feedback.
Its `null` or `undefined` returns to default resolution.

`suffix`, `menuItemSelectedIcon`, and `removeIcon` accept a
scalar, array, or pure function returning a scalar, array,
or Snippet. For these three props, put a static Snippet in
an array or return it from the producer. A function is
treated as a producer. Other icon props take Snippets
directly.

```svelte
<script lang="ts">
  import { Select, type SelectSuffixInfo } from '@woodger/antd';
  let value = $state('a');
  const options = [{ value: 'a', label: 'Alpha' }];
</script>
{#snippet arrow()}<span aria-hidden="true">⌄</span>{/snippet}
<Select {options} bind:value suffix={(info: SelectSuffixInfo) => info.loading ? '…' : arrow}
  allowClear={{ clearIcon: '×', label: 'Clear selection' }} aria-label="Value" />
```

A suffix producer receives one new object with its own
`{ searchValue, open, focused, showSearch, loading }` fields.
Missing `loading` remains `undefined`. The function also
runs on closed controls and during SSR, so keep it pure.
In AutoComplete, `searchValue` is the main `value` without
temporary backfill. Omitted `suffixIcon` hides the default
icon, including provider defaults. Own
`suffixIcon={undefined}` enables default selection. A custom
suffix and Form feedback work independently.

A `menuItemSelectedIcon` producer gets
`{ value, disabled, isSelected }` for each leaf option.
`value` honors `fieldNames`, and `disabled` reflects row
state and `maxCount`. AutoComplete passes `isSelected=false`.
A static truthy icon is shown only on a selected option.
A producer returning `undefined` uses the upstream fallback.
A `removeIcon` producer receives a single `undefined` argument
only for a regular closable tag's remove button. Custom
`tagRender` and the summary tag do not call it. Default
SVGs, wrapper classes, and mouse handling follow Ant Design
6.6.8.

An `allowClear` object replaces the button's content and
accessible name. Falsy `clearIcon` uses `×`. `label=''` preserves
the empty string. `null` and `undefined` use `Clear`.
Boolean `true` retains the native localized name, as does the
existing AutoComplete `clearIcon` Snippet without a label.
Clearing multiple or tags at `maxCount` clears selection
and leaves the old search and `onSearch` untouched. The
owner updates controlled search. Existing single Select
with locally managed search retains the query when clearing
a selection without an extra `onSearch('')`. After close, that
hidden query does not keep the clear button visible.

`onInputKeyDown` receives the input event after upstream
default prevention for arrow keys. Its `preventDefault`
leaves navigation intact, and `stopPropagation` stops it
in an open list. Native Select `onkeydown` can still cancel
handling. Custom icons retain mousedown and click and editor
focus on selection. This is also checked with standard
declarative Svelte handlers.

The browser comparison covers 15 React owners and 195 actions,
and SSR covers 142 states. Additional checks cover closed
tags submission, `maxCount`, and keyboard hooks. Full original
records are stored losslessly in gzip. The manifest lists
hashes and independent runs, including an additional
pure-menu run. Native editor, ref, buttons, localized names,
and immediate closing are preserved. A separate manifest
describes public React comparisons for plain empty content
and parent-driven closing, alongside the original corpus.
[Browser comparison](../../../tests/browser/select/select-icons.spec.ts) · [SSR](../../../tests/package/select/select-icons.ssr.test.ts) ·
[Additional checks](../../../tests/browser/select/select-icons-edges.spec.ts) · [Manifest](../../../tests/browser/fixtures/ant-design-select-icons-source-manifest.json) ·
[Public React comparisons](../../../tests/browser/fixtures/ant-design-select-icons-boundary-source-manifest.json)

## Replacing the root and input

Select and AutoComplete accept `components={{ root, input }}`.
`input` replaces the editor inside the default field. `root`
replaces the entire field, omitting the default input, content,
prefix, suffix, and clear and skipping `components.input`. Pure
`suffix` and semantic `classNames` and `styles` still run, including
in SSR. Typing in a custom root does not by itself change search
or the selected value.

A slot accepts a tag string, Snippet with `{ attributes, register }`,
`{ render, props }`, or `{ element, props, ref }` for a native
element. Attributes use Svelte DOM names such as `class`, `oninput`,
`onkeydown`, `onfocusin`, and `onfocusout`, with CSS string style.
`SelectComponents`, `SelectRootContext`, and `SelectInputContext`
are exported. DOM type parameters follow the existing parameters.
[Type declarations](../../../src/lib/select/select-components.types.ts)

```svelte
<script lang="ts">
  import { Select, type SelectInputContext } from '@woodger/antd';
  const options = [{ value: 'a', label: 'Alpha' }];
</script>
{#snippet editor({ attributes, register }: SelectInputContext<HTMLTextAreaElement>)}
  {@const { value, ...rest } = attributes}
  <textarea {...rest} {value} rows="3" {@attach register}></textarea>
{/snippet}
<Select {options} components={{ input: editor }} aria-label="Value" />
```

Apply the supplied attributes and register the actual DOM through
an attachment. `register` returns cleanup. Attachments do not run
in SSR. Composite registration accepts
`{ nativeElement, inputElement?, focus?, blur? }`.
`nativeElement` and `inputElement` remain public bindable props
and methods are available through `bind:this`. On a composite
without `focus` or `blur`, the corresponding method does nothing,
with no DOM fallback on `nativeElement`. An element descriptor's
`ref` callback gets DOM on attachment and `null` on cleanup.
It skips React composeRef's repeated detach and attach for retained
DOM.

Generated root attributes override custom `props`, and internal
callbacks run before custom ones. The root receives no generated
ID, class, style, value, disabled state, or placeholder. The
renderer supplies the replacement's attributes. For an input,
custom `props` override generated attributes, including value,
class, and style, and custom callbacks run first.
`SelectInputOwnProps` allows `style: SelectStyle` as a CSS object,
string, or `null`. `context.attributes.style` remains a CSS string
and the root's own style retains its DOM type. AutoComplete's
existing `children(control)` takes precedence over the input slot
and keeps its register action.

The reference contains 13 independently repeated owners, 138
actions, and 51 SSR states for single Select and combobox.
The separate SSR-to-hydration comparison adds six owners and 34
actions covering pre-hydration drafts and caret, `defaultValue`,
textarea and composite refs, DOM identity on hydration and
replacement, events, and cleanup. The original manifest stores
both SSR serializations and a byte-identical independent repeat.
[Reference and manifest](../../../tests/browser/fixtures/ant-design-select-components-source-manifest.json) · [SSR-to-hydration comparison](../../../tests/browser/select/select-components-hydration.spec.ts)
· [Original manifest](../../../tests/browser/fixtures/ant-design-select-components-hydration-source-manifest.json)

On input-to-root replacement, the disappearing default root's
blur stays uncalled. Full removal of a focused AutoComplete
retains the synchronous native blur while connected, before DOM
removal and `onDestroy`. Upstream does not call blur. The late
upstream `onOpenChange(false)` after removal is recorded raw.
Svelte cancels pending close and prevents late callbacks.

The separate multiple and tags reference has six owners, 72
actions, and 29 SSR states with input and textarea and function
and element slots. Svelte keeps distinct values and keys for
`1` and `'1'`. After a React key collision, canonical upstream tags
leaves a stale `Number one` row in the popup. A paired upstream run
with explicit `option.key` was captured separately, also with six
owners, 72 actions, and 29 SSR states. Its first and repeated
runs match byte for byte. That comparison is used only for popup
DOM after the exact collision check. Root, editor, layout, model,
events, and producer logs use the original upstream run. Both raw
versions are kept in full. All six upstream CSR diagnostics concern
disabled and numeric tags. [Original multiple and tags reference](../../../tests/browser/fixtures/ant-design-select-components-modes-source-manifest.json)
· [Paired run with explicit keys](../../../tests/browser/fixtures/ant-design-select-components-modes-keyed-source-manifest.json)

Width measurement depends on input value and `syncWidth`. Updating
only custom width applies CSS without measuring. CSSOM keeps
logical property history independently of width cleared by measurement.
The composite probe records a separate upstream CSR TypeError
reading `handle.style` and one successful SSR state. Two Svelte
cases measure the actual typed textarea behind a composite handle
without a style or scrollWidth shim. The AutoComplete custom-style
reference contains two owners, 20 actions, and 16 SSR states. With
`syncWidth=false`, custom width survives typing, disabling, and
clearing. Without an input slot, the existing native editor and
tag path applies. [Composite probe](../../../tests/browser/fixtures/ant-design-select-components-modes-composite-reference.json.gz) ·
[Two native safety cases](../../../tests/browser/select/select-components-modes-composite-safe.spec.ts) · [AutoComplete custom styles](../../../tests/browser/fixtures/ant-design-select-components-ac-style-source-manifest.json)

The CSS object initialization reference contains two intrinsic
editors, eight client paths, 96 actions, and two initial SSR states
with both React serializations. It covers CSR, ordinary hydration,
different server and client CSS objects, and pre-hydration DOM
style changes. CSR applies properties in source order. Hydration
preserves the actual CSSOM and initial style text until the first
style update. Client props separately establish history for later
setter updates. During CSR, intrinsic INPUT and TEXTAREA use
Svelte dynamic elements. At hydration, public Svelte
`createRawSnippet` takes the original editor directly from the
current SSR subtree and preserves DOM, focus, and selection. The
Svelte compiler still generates input and textarea SSR markup.
Existing root branches, CSS string `context.attributes.style`, and
the CSS-string API are preserved. The public ref sees initial
styles and textarea `defaultValue` before width measurement.
[CSS object initialization reference](../../../tests/browser/fixtures/ant-design-select-components-own-style-init-source-manifest.json)

CSR and hydration repeats differ only in computed custom
property order, which CSSOM leaves unspecified. All names,
values, and priorities are checked, and order stays strict for
ordinary computed properties, author inline declarations, and DOM
attributes. Both raw variants are kept. Existing native light
scheme, private token aliases, and the exclusion of deprecated seed
variables are accounted for separately. [CSSOM specification](https://drafts.csswg.org/cssom/#dom-window-getcomputedstyle)
· [Deprecated seed variable exclusion](../design-tokens.md)

Separate minified client and SSR builds of the public package
were checked on the same eight paths and 96 actions. Two SSR
states avoid DOM access. Observers, timers, frames, and ports
tracked by tests are released on removal and still clear after
1000ms. The build-mode check distinguishes fixed dev and prod
popup hash classes. Other classes and their order, CSSOM, and
geometry use the existing reference. [Build-mode check](../../../tests/package/select/select-components-own-style-popup-build-mode.test.ts)

The separate hydration ownership reference checks independent SSR
roots in one document and direct targets in open and closed
ShadowRoots without mandatory `idPrefix`. It has 12 scenarios,
16 hydrated roots, and 60 actions. The full upstream repeats match
byte for byte. Checks cover the original editor, first authored
ref, focus, value and defaultValue, selection, CSSOM, updates,
tag replacement, and independent root cleanup. React layout commit
and Svelte onMount, synthetic and native events, and the deprecated
getter for a free AutoComplete option have separate exact comparison
rules. Both raw snapshots are retained.
[Hydration ownership reference](../../../tests/browser/fixtures/ant-design-select-components-hydration-ownership-source-manifest.json)

Twenty native editor update regressions check own `undefined`
and `null`, value and defaultValue, checked and defaultChecked,
and textarea content. Initial hydration follows measured React
semantics. Later setters retain Svelte behavior, including distinct
CSR and hydration defaults. Overall family hydration coverage
remains partial. [20 native editor update regressions](../../../tests/browser/select/select-components-controlled-removal.spec.ts)

The separate upstream responsive reference includes two owners,
12 actions, and two initial SSR states. The first and repeated runs
are byte-identical. It covers direct input and a Fragment with a
live adornment. Fitting measures the entire suffix, preserving
upstream summary width cache, offset, and render cap. During SSR,
data tag wrappers are absent, the `+ 4 ...` summary is hidden, and
suffix has order 0. On initial open, the measured width of the
still-closed input is published first, then the list opens.
Native remove accessibility, inert behavior, and cleanup remain.
In CSR, the position of one generated INPUT style attribute is
treated as a Blink lazy CSSOM difference. SSR accounts separately
for Svelte hoisting a style attribute on responsive wrappers.
Two exact empty Text anchors in the CSR Snippets are checked
against compiler structure. Authored text, SSR, and hydration
are unaffected. Other attributes, declaration order and values,
CSSOM, boxes, and full raw snapshots remain strict.
[Upstream responsive reference](../../../tests/browser/fixtures/ant-design-select-components-responsive-source-manifest.json)

Custom editor scenarios compare with one React reference on
the repository's standard Chromium. For `input`, compare outer
bounds, padding, and horizontal overflow
(`scrollWidth - clientWidth`) to account for how the engine includes
padding differently in the two measurements. Computed flex
`align-items` values `flex-start` and `flow-start` represent the same
alignment. Author declarations and their order are compared
against upstream CSSOM. [Size and style tests](../../../tests/browser/select-components-layout-assertions.ts)

The custom `tagRender` and leading prefix reference adds two owners,
18 actions, 20 CSR states, and two SSR states with both React
serializations. It measures the entire Fragment tag. The leading
prefix is outside Overflow. Tests cover container, prefix, and
tag width changes, search, restoring the prefix, and actual tag
removal. The two upstream runs have matching DOM, CSSOM, and
geometry snapshots. Repeated and reordered equivalent render calls
and original raw graphs stay separate. `tagRender` arguments keep
seven own fields in upstream order. The summary has `value`, `index`,
and `onClose` with `undefined`.
[Custom tagRender and leading prefix reference](../../../tests/browser/fixtures/ant-design-select-components-responsive-tag-prefix-source-manifest.json)

With `components.input`, custom tag closing is deferred through
MessageChannel, so `onOpenChange(false)` follows removal. Both ports
close after invocation or cancellation. Unmount cancels the
pending callback. Three resource tests cover ordinary closing,
cancellation by Escape, and immediate unmount.
[Resource tests](../../../tests/browser/select/select-components-tag-close-safety.spec.ts)

A separate upstream comparison and three keyboard regressions
cover pending close cancellation on an already open menu.
ArrowDown cancels the task. ArrowUp and Ctrl+ArrowDown let it
finish. Both full upstream runs are retained. The measured
projection of key, open state, and event name matches. Render
call chronology is outside that comparison.
[Upstream comparison](../../../tests/browser/fixtures/ant-design-select-components-tag-close-key-counter-source-manifest.json) · [Three keyboard regressions](../../../tests/browser/select/select-components-tag-close-key.spec.ts)

Separate minified client and SSR builds of the public package
pass the same 18 actions, 20 CSR comparisons, and two SSR states
without DOM or resources. After both owners are removed and after
1000ms, no tracked observers, mutations, frames, timers, or open
ports remain. Callback and ref logs remain quiet. The broader
responsive matrix, disabled and stale custom callbacks, and
complex style and hydration combinations need further comparison.

The retained `onClose` reference adds two owners, 12 actions,
a callback captured separately after initial settling, and two
initial SSR states. CSR and SSR each match byte for byte between
first and repeated runs. With `components.input`, the callback
retains the display record, while removal reads current records.
A call is allowed with `closable=false`. A stale callback leaves the
model intact and sends `onDeselect` with the current option. A
separate cached-option comparison retains the previous payload
after removal from options. Ordinary native removal and its
disabled guards are preserved. The raw data retain complete
arguments, descriptors, alias identities, events, DOM, CSSOM, and
original diagnostics. [Upstream retained onClose reference](../../../tests/browser/fixtures/ant-design-select-components-tag-close-handles-source-manifest.json)

When `maxTagCount` is omitted, upstream creates an unused summary
ReactElement through `tagRender` but never mounts its body or DOM.
An unrendered Svelte Snippet does not simulate those calls. The
upstream-only summary records retain the seven fields and absence
of body and DOM. The negative checks reject missing fields,
modified aliases, and fabricated summary calls. Other callback
and renderer combinations remain partially covered.
[Browser tests](../../../tests/browser/select/select-components-tag-close-handles.spec.ts) · [SSR tests](../../../tests/package/select/select-components-tag-close-handles.ssr.test.ts) ·
[Negative checks](../../../tests/package/select/select-components-tag-close-handles-boundaries.test.ts)

Replacement DOM, events, complete attributes and producer logs,
refs, and cleanup are covered. The remaining Select and
AutoComplete callback, search, and motion features are tracked
in the registry. [Browser tests](../../../tests/browser/select/select-components.spec.ts) · [SSR tests](../../../tests/package/select/select-components.ssr.test.ts)

## Tags

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';
  let tags = $state<string[]>([]);
</script>

<Select mode="tags" options={[]} bind:value={tags} name="tags" allowClear />
```

Tags mode retains multiple-selection UI, native FormData, required
validation and reset, removal, disabled state, RTL, and the selected
option cache. Omitted options use an empty array. Free strings add
temporary options. Selected values outside current results remain in
the list with their cached label and disabled state. Numeric 0 and
string `"0"` remain distinct keys. By default, tags filters by an
uppercase substring of `value`, as upstream. Set
`showSearch.optionFilterProp="label"` to search labels. A string array
matches any of the named own fields. Single and multiple without
explicit fields retain label and NFKD search. A `filterOption` predicate
overrides field selection.

`showSearch.filterSort` sorts filtered results, including missing
selected options and synthetic tags. The comparator
`(optionA, optionB, { searchValue }) => number` gets original option
objects and current search text. The result follows `Array.sort`.
Equal items keep their order, and the owner's array stays intact.
Without a comparator, prior order is preserved. Callback, option,
and query updates affect the open list while preserving input DOM
and selected values. With controlled search, the comparator receives
the owner's accepted text. Group sorting follows upstream and
recurses through literal `options`. A renamed children field is
skipped by this recursion. [Official UMD 6.6.8 sort reference](../../../tests/browser/fixtures/ant-design-select-sort-reference.json)

Enter selects the active option, including a new one. With an
uncontrolled closed list, native behavior opens and selects the first
option on the same Enter. With controlled `open`, Enter when closed
first submits nonempty trimmed input, then calls `onInputKeyDown`
and requests opening, as in upstream input submission. Selecting an
already selected active option again deselects it.

Blur adds the trimmed string without a duplicate. Escape closes
the list and preserves input. Upstream preserves whitespace when
selecting a list option and trims it on blur, and this distinction
is retained. Whitespace-only implicit options are not created. The
raw reference records the upstream issue. A supplied option with
that value remains valid. Clear clears pending search and reports
`onSearch('')`, except when clearing at `maxCount`, and creates no tag.
The owner still controls search. React defers closing via MessageChannel.
A quick Escape and Enter can select the original option with spaces.
Enter after close completes trims input. Svelte retains immediate
closing and first-option selection in uncontrolled mode. Both React
observations are retained in the manifest and tags tests alongside
the earlier raw reference.

`showSearch.autoClearSearchValue=false` preserves search on selection
and Escape in multiple and tags modes. Multiple blur clears local
search without a callback. Tags blur finishes input. Other selection,
blur, and reset paths skip `onSearch`.

## Input separators

`tokenSeparators` works in multiple and tags modes. It accepts a
readonly array of separators or
`(input: string) => readonly string[]`. A detected delimiter
commits all parts, including the last. Values extend selection
without duplicates and the popup closes. In tags, parts become
string values. In multiple, only existing options with a matching
label or explicit `showSearch.optionFilterProp` are accepted. Numeric
keys are not coerced to strings. Whitespace in nonempty parts is kept.

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';

  let tags = $state<string[]>([]);
</script>

<Select mode="tags" options={[]} bind:value={tags} tokenSeparators={[',', ';', '\n']} />
```

The function gets the full string, including restored pasted line
breaks. An empty result or a single unchanged string leaves regular
search in place. IME defers splitting to `compositionend`. After
splitting, local search clears independently of `autoClearSearchValue`.
The owner controls controlled search. `onValueChange` precedes
`onSearch('')`. The latter runs only if the previous search string
was nonempty. Split input skips intermediate `onSearch` with the
whole original string.

Native paste and composition handlers retain the input receiver and
`preventDefault`. Svelte corrects two recorded upstream cases:
multiple skips disabled options and tags skips implicit
whitespace-only values. Existing disabled selections are preserved,
and explicit whitespace options are valid. The upstream defects
remain in raw data. [Raw upstream observations](../../../tests/browser/fixtures/ant-design-select-token-separators-reference.json)

## Tag text length

`maxTagTextLength` limits only visible multiple and tags text and
appends the original `...` on truncation. Full labels and titles,
remove button names, and values are preserved. Single ignores the
limit. Length uses UTF-16 code units as in rc-select. Svelte keeps
valid surrogate pairs intact. A cut emoji half is removed while
retaining other slice behavior, including combining and ZWJ text.
Grapheme clusters can still be split.
The shared reference contains the upstream broken-pair outputs.
Changing length preserves input DOM and values without value
callbacks. [Shared Select and Cascader references](../../../tests/browser/fixtures/ant-design-select-tag-text-reference.json)

## Visible tag count

`maxTagCount` limits visible tags in multiple and tags modes to a
number or `responsive`. Other selections remain in FormData, reset,
cache, and Backspace. The summary tag defaults to `+ N ...` without
a remove button. `maxTagPlaceholder` replaces it with a string,
number, boolean, or Snippet receiving omitted `SelectOmittedTag`
records in source order. Records preserve typed value and key,
full label, and disabled state. `null` and `undefined` use the default.
`false` leaves an empty summary. Scalar content sets a title, and
a Snippet owns its content. Single ignores both settings.

```svelte
<script lang="ts">
  import { Select, type SelectOmittedTag } from '@woodger/antd';
  let tags = $state<string[]>([]);
</script>

{#snippet omittedTags(omitted: SelectOmittedTag<string>[])}
  <span>Hidden: {omitted.map(tag => tag.label).join(', ')}</span>
{/snippet}
<Select mode="tags" options={[]} bind:value={tags} maxTagCount={2}
  maxTagPlaceholder={omittedTags} />
```

Numeric limits follow upstream `Array.slice`, including fractional
and negative counts. `NaN` retains all tags where upstream hides
them. A native remove button being hidden moves focus to the input
unless the owner selected another control. The reference retains
upstream NaN and responsive observations. [References](../../../tests/browser/fixtures/ant-design-select-tag-count-reference.json)

`maxTagCount="responsive"` measures available width, tags, summary,
and current input through the ResizeObserver and frame mechanism
shared with Cascader. Hidden tags remain measurable out of flow
with `aria-hidden` and `inert`. Before browser measurement, SSR shows
all selections. Width, text, and search changes preserve values and
input DOM. Resources are released on leaving responsive mode or
unmounting. Measurement uses only the content's own elements.
Controls inside `maxTagPlaceholder` do not replace the search field
in width calculation. The full list is checked first. A long custom
summary leaves tags visible when they all fit. The raw reference
records the upstream exception and separate available and used
widths. [Raw geometry](../../../tests/browser/fixtures/ant-design-select-responsive-tags-reference.json)

## Custom tag rendering

`tagRender` is a Svelte Snippet with `SelectTagInfo`. A regular tag
receives typed value, index, option disabled state, `closable`, and
`onClose(event?)`. `label` is a Snippet with the truncated text.
The summary receives `isMaxTag=true`, `disabled=false`,
`closable=false`, and own `value`, `index`, and `onClose` fields set to
`undefined`. Its label uses `maxTagPlaceholder`. Single ignores
the renderer. Selected values and form fields remain.

```svelte
<script lang="ts">
  import { Select, Tag, type SelectTagInfo } from '@woodger/antd';
  let values = $state<string[]>(['a']);
</script>

{#snippet customTag(info: SelectTagInfo<string>)}
  <Tag closable={info.closable} disabled={info.disabled} onClose={info.onClose}
    onmousedown={event => {
      event.preventDefault();
      event.stopPropagation();
    }}>{@render info.label()}</Tag>
{/snippet}
<Select mode="tags" bind:value={values} tagRender={customTag} />
```

Mousedown on a custom wrapper toggles the popup without forcing
input focus. A child control can stop it, as shown. `onClose`
removes an enabled value and retains current focus. Native remove
buttons still return focus to the input. The renderer owns styles,
title, and accessible controls. Numeric and responsive overflow
and renderer changes after mount preserve search and input DOM.

The raw reference records an upstream disabled click sending
`onOpenChange(true)` with a closed popup. Svelte skips that request
when disabled. The existing single label remains in the input,
where React uses a separate span. [Raw metadata and events](../../../tests/browser/fixtures/ant-design-select-tag-render-reference.json)

## Selection limit

`maxCount` caps selected values in multiple and tags modes.
Single ignores it. At the limit, new options are disabled, and
selected enabled options can be deselected. Remove and clear
still work. Search input at the limit leaves the query and
`onSearch` untouched. Supplied values and defaults are retained,
including values above a reduced limit. Limit changes update
the list without replacing input or resetting focus or selected
form fields.

With `tokenSeparators`, the raw parts are capped by remaining
slots before lookup, disabled checks, and deduplication, as
upstream. A duplicate or unknown option can leave a slot
unused. Zero or negative `maxCount` prevents new values. `NaN`
and `undefined` set no limit, and infinity is unlimited.

The raw measurements record bypassing `maxCount` via controlled
search on Enter or blur. Svelte blocks those over-limit tags.
The owner still updates the query. [Raw measurements](../../../tests/browser/fixtures/ant-design-select-max-count-reference.json)

## Remote search

Select accepts `loading`, `notFoundContent`, and `onPopupScroll`.
Configure search with the Ant Design 6.6.8 API
`showSearch={{ searchValue, onSearch, filterOption }}`. Deprecated
top-level props with those names are removed. Boolean `showSearch`
enables built-in search. `filterOption=false` disables local
filtering, and `true` retains label search. A
`(search, option)` callback supplies custom filtering for a
nonempty query. In the same `showSearch` object, set
`optionFilterProp` for explicit upstream fields and
`autoClearSearchValue` for selection behavior.

`searchValue` controls the query, and `onSearch` receives user
input. The owner can reject an update by keeping `searchValue`
unchanged. External text changes skip `onSearch`. Without
`searchValue`, text is local. Selection, closing, and reset clear
local search by default without `onSearch`, subject to the tags
and `autoClearSearchValue` rules above. The owner clears controlled
search when needed. Search text is excluded from FormData and
leaves selected values intact. `onSearch` has no built-in debounce.

Loading shows a spinner and `aria-busy` while existing options
remain available. Empty results default to localized loading or
empty text. `notFoundContent` replaces it with shared
`RenderEmptyContent`. `null`, `false`, and the empty string hide
the empty popup, while 0 stays visible. Without local
`notFoundContent`, Select uses
`ConfigProvider.renderEmpty('Select')`. A falsy result uses the
simple small Empty. Without that callback, the existing localized
text is used. [Shared empty-state rules](../render-empty.md)

Upstream has no separate error prop. Use `status="error"` and
`notFoundContent`, with an external alert and retry button when
needed. Focus within custom empty-content controls keeps the popup
open. Moving outside closes it. Input blur remains native. For
a button inside the popup, prevent pointerdown default if field
focus must stay in place. Provide the same action outside the
popup for sequential keyboard navigation. `onPopupScroll` receives
a native scroll event with the listbox as `currentTarget`. The
consumer chooses when to fetch the next page and merge options.

For an employee directory, send the query to your API. This
example expects `/api/members?q=…` to return an array of
`{ value: string, label: string }`. On new input or component
removal, Svelte cancels the previous request through
`getAbortSignal()`.

```svelte
<script lang="ts">
  import { getAbortSignal } from 'svelte';
  import { Select } from '@woodger/antd';

  let query = $state('');
  let options = $state<{ value: string; label: string }[]>([]);
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    const text = query.trim();
    const signal = getAbortSignal();

    options = [];
    error = '';
    loading = Boolean(text);

    if (text) {
      void search(text, signal);
    }
  });

  async function search(text: string, signal: AbortSignal) {
    try {
      const response = await fetch(`/api/members?q=${encodeURIComponent(text)}`, { signal });

      if (!response.ok) {
        throw new Error(`Search failed (HTTP ${response.status})`);
      }

      const matches = await response.json();

      if (!signal.aborted) {
        options = matches;
      }
    }
    catch (cause) {
      if (!signal.aborted) {
        error = cause instanceof Error ? cause.message : 'Could not load the list';
      }
    }
    finally {
      if (!signal.aborted) {
        loading = false;
      }
    }
  }
</script>

<Select
  {options}
  {loading}
  showSearch={{ searchValue: query, onSearch: text => { query = text; }, filterOption: false }}
  status={error ? 'error' : undefined}
  aria-label="Find an employee"
/>
{#if error}
  <p role="alert">{error}</p>
{/if}
```
