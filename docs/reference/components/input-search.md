# InputSearch (Input.Search)

InputSearch combines Input and a search button in SpaceCompact.
[Public source declarations](../../../src/lib/input/input-search.types.ts)

```svelte
<script lang="ts">
  import { InputSearch } from '@woodger/antd';
  let query = $state('');
</script>

<InputSearch bind:value={query} allowClear enterButton="Найти"
  onSearch={(value, event, info) => console.log(value, info?.source)}
  aria-label="Поиск" />
```

The button and Enter call onSearch with the current native value and source=input.
OnPressEnter runs before search. IME, isComposing, repeated Enter, and loading
prevent search. Clearing calls onValueChange(''), onSearch with source=clear,
onChange(click), and onClear in order, preserving Svelte and native Input events.
Loading blocks the button and Enter and leaves clearing available. Clicking the
button keeps focus in the Input when it was already there. Typing alone leaves
onSearch untouched.

Boolean enterButton shows a normal or primary icon button. A scalar provides text
for a primary button. SearchIcon is inherited from inputSearch configuration, with
a local prop taking precedence. Null and false hide the icon. A boolean enterButton
uses locale.searchText for its accessible name. Text buttons are named from their
content. Provide a custom button as a snippet with InputSearchButtonContext.

```svelte
<script lang="ts">
  import { Button, InputSearch, type InputSearchButtonContext } from '@woodger/antd';
</script>

{#snippet searchButton(context: InputSearchButtonContext)}
  <Button {...context.getButtonProps({ class: 'custom-search' })}>Найти</Button>
{/snippet}
<InputSearch enterButton={searchButton} aria-label="Поиск" />
```

The snippet replaces the entire button. GetButtonProps preserves the button's own
disabled and loading values, adds size and the search class, and calls the button's
callbacks before Search callbacks. GetNativeProps handles native buttons similarly,
keeps their class and type, and blocks them during loading. The user's onmousedown
receives the event before Search prevents the default. Search semantic button styles
apply to the standard button. A custom button keeps its own styles as in upstream.
You can use rich content inside your own Button.

ConfigProvider.inputSearch supports class, style, semantic slots, searchIcon, and
variant. A nested object replaces the parent in full. Shared Input configuration
still applies to the field. As upstream does, use input.variant as the field
fallback. The button keeps its regular Button variant without a Search variant
of its own. The semantic root applies to Compact. The button slot has root, icon,
and content, and a string in button is shorthand for button.root.

Class, style, hidden, and data-* go to the Compact root. Id, name, ARIA, and
constraints stay on Input. RootClassName applies to the inner Input. InputElement,
nativeElement, and bind:this methods expose the inner Input. String bind:value,
defaultValue, FormItem, RTL, Compact, themes, and SSR keep the Input contracts.
The `?fixture=input-search` fixture checks search, IME, callbacks, custom buttons,
semantic and configuration precedence, and geometry. The component token engine
and variant inheritance preserve the agreed value and ref conventions. A family-wide
audit is still pending.

PrefixCls sets Search root and button classes, and inputPrefixCls sets independent
Input classes. Empty and undefined values inherit ConfigProvider. Button and the
btn-height variable use the shared prefix independently of the local class and
cssVar.prefix. Canonical token markers and variables stay in place. The upstream
component tokens also apply to the Search root. Small button min-height accounts
for inputFontSizeSM and paddingBlockSM. Semantic styles and style keep precedence
over the computed theme.

Changing the prefix preserves DOM, refs, value, selection, focus, FormData, and search.
React Compact remounts Input after a shared prefix change because its key includes
the prefix. The native path keeps Input DOM stable. The reference stores raw
transitions separately from measurements after public ref focus. With enterButton=true,
upstream creates empty Button content and extra width. The native counterpart keeps
its icon-only button. The public counterpart uses the official Button without children.
The upstream shared-class cache loses the nested private variable namespace. The
reference measures freshNested separately with a fresh local class in the Inner
provider. The fixture is `?fixture=input-search-prefix`. [UMD reference](../../../tests/browser/fixtures/ant-design-input-search-prefix-reference.json) ·
[Browser](../../../tests/browser/input/input-search-prefix.spec.ts) · [SSR](../../../tests/package/input/input-search-prefix.ssr.test.ts)
