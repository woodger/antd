# AutoComplete

AutoComplete accepts free text and offers suggestions from a list.

```svelte
<script lang="ts">
  import { AutoComplete } from '@woodger/antd';
  let value = $state('');
  let search = $state('');
  let options = $derived(search ? [{ value: `${search}@example.com` }] : []);
</script>
<AutoComplete {value} {options} allowClear backfill
  onChange={next => { value = next ?? ''; }}
  showSearch={{ onSearch: next => { search = next; } }} aria-label="Email" />
```

Value and defaultValue are arbitrary strings and need no match in options.
A selection displays option.value. Label accepts a string, number, or snippet
and appears only in the list. Options also accepts { label, options } groups.
Disabled entries are skipped. OnChange(value, option) runs on input or selection
changes. OnSelect(value, option) runs on every selection. OnSearch(text) runs
on search input and is skipped on selection. A free value passes an empty
object as the second onChange argument. Clearing the value list passes undefined.
The Svelte API omits the React option.props wrapper.

FilterOption defaults to false, matching rc-select combobox runtime. True
matches value case-insensitively and preserves whitespace and Unicode forms.
A matching group keeps all its children. Other groups filter their children.
A predicate gets a shallow copy of the raw option or group. The showSearch
object sets filterOption and onSearch. The old top-level props are removed.
Use classNames.popup.root for the popup class. PopupClassName has been removed.
A nested panel inherits the owner layer. PopupRender, prefix, semantic classNames
and styles, and shared ConfigProvider.select follow Select except for the
suffix, item, itemContent, and itemRemove slots, which are absent in AutoComplete.
Consumers own data loading, debounce, and stale-response protection.
[Owner layer](../theme-context.md#layering-nested-panels) · [Select reference](select.md#popup-and-semantic-styling)

Open and defaultOpen control popup visibility. Without options or nonempty
notFoundContent, it stays hidden even with open=true. SSR leaves it closed
until mount like rc-select useOpen. OnOpenChange reports requested changes,
including a request declined by controlled open=false. PopupMatchSelectWidth
accepts a boolean or number. Omitted and undefined values inherit
ConfigProvider.popupMatchSelectWidth. ListHeight limits the viewport and
defaults to 256. Popup padding and border are added outside it. OnPopupScroll
passes the inner holder's native scroll event. CurrentTarget and this point to
that div. The surface uses a native popover with input focus preservation,
outside and Escape dismissal, and cleanup. Virtual, listItemHeight,
showScrollBar, scrollTo, and onActive follow Select. DefaultActiveFirstOption
defaults to false. [Select list behavior](select.md#select)

GetPopupContainer receives the Select root, including with a custom input
or textarea. A local function overrides ConfigProvider.getPopupContainer.
Undefined inherits it. The getter runs in the browser after opening.
Moving the popup preserves Select tokens, search, focus, and FormData.
ShadowRoot needs its own styles. Replacing a function with one that returns
the same container preserves the field and list.

Arrow keys skip unavailable options. Enter or Tab selects the active option,
and IME Enter skips selection. Backfill temporarily changes display text
until confirmation. Rc-select runtime defaults defaultActiveFirstOption to
false, although the Ant Design table says true. A nonempty query can still
activate the first prefix match. Home and End remain native input keys.
AllowClear accepts a boolean or { clearIcon, label }. For nonempty text,
rc-select calls onClear, change(undefined), change(''), and search('') in that
order. The port keeps that order. A controlled handler commonly normalizes
undefined to an empty string. OnInputKeyDown, onFocus, onBlur, focus, and
blur are available.

Provide an editor through a children(control) snippet.

```svelte
<AutoComplete options={[{ value: 'example' }]} aria-label="Подсказки">
  {#snippet children(control)}
    <textarea {...control.attributes} use:control.register rows="3"></textarea>
  {/snippet}
</AutoComplete>
```

Attributes and register connect value, ARIA, events, and the native ref.
The editor keeps its own class, style, and rows. InputElement and nativeElement
are bindable. Native name, required, disabled, and readonly, FormItem,
status, reset, size, variants, Compact, themes, and RTL are supported.
Set native constraints on the custom editor itself. The main fixture is
`?fixture=auto-complete`.

The upstream theme uses components.Select and a shared Select token scope for
option and group sizes, padding, colors, clear, and focus. A custom Input keeps
its components.Input and dimensions. The wrapper leaves its height independent
of Select controlHeight. Tokens are available in SSR. Theme changes preserve
the native editor, option content, selection, focus, FormData, and open popup
position. Native-only themes retain their appearance.

PrefixCls follows the Select namespace as in upstream AutoComplete. A nonempty
local value overrides ConfigProvider.prefixCls, and empty inherits it. Control,
content, clear, groups, options, and popup get corresponding classes and CSS.
Nested Input and TextArea keep their shared namespace. Internal Select variables
are separate from canonical theme tokens. Prefix changes preserve the editor,
popup and options, generated IDs, refs, query, text selection, focus, FormData,
and callbacks. The 28 UMD configurations cover normal, nested, and reset
scopes, custom Input and TextArea, and filled and disabled Input.
[UMD configurations](../../../tests/browser/fixtures/ant-design-auto-complete-prefix-reference.json) · [Browser](../../../tests/browser/auto-complete/auto-complete-prefix.spec.ts) · [SSR](../../../tests/package/auto-complete/auto-complete-prefix.ssr.test.ts)

FieldNames and generic AutoCompleteProps<OptionType> use the shared data layer.
Free text stays a string. Raw OptionType needs no literal value or label and
gets no added canonical fields. OptionRender is a snippet receiving a flattened
option and { index }, as in Select. Index is absolute, including group
headings and entries outside the virtual window. The renderer changes option
content while preserving raw option, selected label, title, and filtering.
After the list has been opened, a closed list applies a new renderer to cached
options. Its next opening takes current options. SSR leaves optionRender
inactive. [Shared option data](select.md#option-data-and-fieldnames)

LabelRender is a pure function with Select metadata. Null and undefined fall
back to raw value. It also works in SSR. The standard editor keeps a string
value and transparent display DOM. A custom input suppresses that DOM while
the producer still runs. Title uses the current raw option's literal title or
label, then the display item. An outer title takes precedence. A passed
tagRender stays in semantic metadata and the combobox leaves it unused.

Suffix, suffixIcon, loadingIcon, showSearch.searchIcon, menuItemSelectedIcon,
and allowClear follow the shared icon rules. Components.root and
components.input follow the shared replacement API. Children(control) takes
precedence over components.input. Components.root replaces the whole field
and bypasses both editor renderers. Upstream motion and generic numeric
and object values remain outside the port. [Icon settings](select.md#icons-and-clearing) ·
[Field replacement API](select.md#replacing-the-root-and-input)

With components.input, the editor wrapper keeps at least one text line of
height after typing and for a nonempty initial value. Set styles.content.minHeight
for a different minimum. In React 6.6.8, an absolute editor without that setting
collapsed to 0px. The reference records both the failure and
styles.content.minHeight = '1lh'. [React measurements](../../../tests/browser/fixtures/ant-design-auto-complete-editor-height-reference.json)
