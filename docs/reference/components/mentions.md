# Mentions

Mentions suggests mentions as the user types. Its embedded list inherits
the owner's layer. [Owner layer](../theme-context.md#layering-nested-panels)

```svelte
<script lang="ts">
  import { Mentions, getMentions } from '@woodger/antd';
  let value = $state('');
</script>
<Mentions {value} options={[{ value: 'alice', label: 'Alice' }]}
  onChange={next => { value = next; }} allowClear
  autoSize={{ minRows: 2, maxRows: 5 }} aria-label="Комментарий" />
<p>{getMentions(value).map(item => item.value).join(', ')}</p>
```

`value` and `defaultValue` are the full textarea string. `prefix` defaults
to `'@'` and accepts a string or an array. `split` defaults to one space.
Search uses the last prefix before `selectionStart`. Ties follow the
`prefix` array order. The default `validateSearch` checks only the literal
`split` without special handling for line breaks. The default
`filterOption` uses a case-insensitive search of `option.value`. `false`
disables filtering. A custom function receives the original option.

`value` is optional. Search and insertion treat a missing value or
`undefined` as the empty string. `onSelect` preserves the distinction
between a missing field, explicit `undefined`, and the empty string.
`label` accepts text, a number, a Snippet, an array, and empty values.
An omitted or `null` label leaves the visible text blank. The native
list takes its accessible name from `value` when supplied.

CSS `prefixCls` is independent of the text trigger `prefix`. A nonempty
local value takes precedence. Empty and undefined values inherit
ConfigProvider. Editor, mirror, variants and status, clear, and
popup and menu use the resolved prefix. Private `cmp-mentions` variables
and the Form feedback selector use the shared namespace. Canonical
component tokens and markers keep their names. Local and shared prefix
changes preserve IDs, root, textarea, and popup DOM, query, focus,
selection, and FormData. Native clear, ARIA, IME, search, and selection
rules are preserved. The fixture is `?fixture=mentions-prefix`.
[UMD reference](../../../tests/browser/fixtures/ant-design-mentions-prefix-reference.json) · [Browser tests](../../../tests/browser/mentions/mentions-prefix.spec.ts) · [SSR tests](../../../tests/package/mentions/mentions-prefix.ssr.test.ts)

The existing plain `locale.emptyText` without `renderEmpty` is
preserved. The reference records the raw upstream small Empty
separately from `nativeEmpty`, a measurement with public
`notFoundContent` and the same localized text. Raw results are retained.

Search runs on keyup, as in rc-mentions. Changing `value` programmatically
does not start it. `onSearch(text,prefix)` lets the owner update
`options` or `loading`. Mentions itself performs no network requests.
Loading shows a disabled spinner in place of results and blocks
Enter by default. `silent` controls Enter blocking while the list is
open. With `silent={false}`, Enter closes a list of unavailable options.
`notFoundContent` replaces the localized empty state.

Selection inserts prefix, value, and split at the caret, adds split
before the token when needed, removes a matching suffix without
regard to case, and keeps the remaining text. `onChange(nextText)`
runs before `onSelect(option,prefix)`. Focus and selection are restored
after the DOM update. Native selection offsets use UTF-16. The callback
gets original option data without React's key suffix. The separate
`getMentions(value,{prefix,split})` export corresponds to
`Mentions.getMentions`. It extracts nonempty tokens at the start of
each split segment without adding markup.

The item key comes from `key` or `value` and is compared as a string.
Click selects the first filtered item with that key. If it is disabled,
the list stays open and inserts nothing. The built-in list keeps focus
in the textarea. Enter in the textarea selects the active item by
index. Duplicate keys retain separate DOM nodes. Highlighting applies
to all matching keys, while `aria-activedescendant` points to one item.
[React measurements](../../../tests/browser/fixtures/ant-design-mentions-option-reference.json) · [Browser tests](../../../tests/browser/mentions/mentions-option.spec.ts)

Up and Down cycle through enabled options, Enter selects, and Escape
closes. When suggestions are closed, Enter calls `onPressEnter`, then
`onKeyDown`, then native `onkeydown`. This order applies in a readonly
field and when the key is canceled in capture. Handlers receive the
same `KeyboardEvent` with current `defaultPrevented`. Search uses the
text and caret at `keyup` before calling `onKeyUp` and `onkeyup`.

If Enter is canceled by a handler or pressed during IME composition,
Svelte keeps the list open without selecting. Ant Design 6.6.8 selects
an option in these cases. With suggestions closed during composition,
the normal key handler runs.
[React measurements](../../../tests/browser/fixtures/ant-design-mentions-keyboard-reference.json) · [Keyboard tests](../../../tests/browser/mentions/mentions-keyboard.spec.ts)

`onFocus` and `onBlur` account for focus moving into the popup. Pending
blur is cleared on unmount. `readonly` and `disabled` retain native
field behavior.

The popup aligns after the prefix and follows textarea wrapping and
scrolling. Top and bottom placement, RTL, and viewport adjustment
are supported, with the upstream 4px gap. `direction` selects the
prefix anchor edge and takes precedence over provider direction for
placement. Native `dir` sets text direction. The native popover keeps
textarea focus. The textarea, listbox, option, and
`aria-activedescendant` replace React's DropdownMenu based on rc-menu.
The mirror is hidden from the accessibility tree. Shared popup logic
retains the existing default gap for other components. AutoComplete
uses the upstream 4px, as in SelectTrigger.

`transitionName` uses custom CSS for `appear-prepare`, `appear-start`,
and `appear-active` on each opening. An omitted or empty name uses
normal opening. `theme.token.motion=false` retains only position
preparation. Named appear ends on a CSS animation or transition event.
The consumer defines `prefers-reduced-motion` rules for this CSS.
Closing removes the named panel immediately and cancels pending
frames. After appear ends, a changed name applies on the next open.
[Browser comparison](../../../tests/browser/mentions/mentions-lifecycle.spec.ts)

Local `getPopupContainer` selects an `HTMLElement` or `ShadowRoot`.
As in Ant Design, Mentions is independent of
`ConfigProvider.getPopupContainer`. The getter type requires no
parameters. On open, a parameterless function receives `undefined`
first, then the prefix `span` inside `ant-mentions-measure`. A function
with a parameter waits for that DOM ref, as in rc-trigger. Without a
getter, native placement applies. SSR does not call it. The consumer
provides ShadowRoot styles.

`popupRender` receives the built-in `menu` Snippet and
`{ prefixCls, options, opened }`. `options` contains the filtered
options with their original keys. During loading it contains one
disabled spinner option. The existing one-argument Snippet calling
`menu()` remains supported.

Calling `menu({ options, prefixCls, opened })` overrides the built-in
list's parameters. `prefixCls` sets the list and item class prefixes.
`opened` becomes `true` after positioning and completion of appear.
`opened: false` disables active-item autoscroll while leaving the menu
visible. A click selects from the rendered options, including during
loading. Textarea keyboard interaction uses the original options and
retains `silent` handling for Enter. An empty list shows
`notFoundContent`.

Each call to `menu()` gets its own DOM IDs. `aria-controls` lists
mounted menus. `aria-activedescendant` points to the active item
in the first connected list containing it. The editor updates these
references when a list is removed. If moved into a separate
`ShadowRoot`, physical DOM boundaries still limit ID reference
resolution.

Tab uses the textarea as the entry point to the list. If focus is
already on an item, Enter and Space activate the native button.
Escape closes the list and restores editor focus with the previous
selection. Clicking outside focuses the clicked target. In React
6.6.8 measurements, Enter on a focused item inserted a newline after
selection, Space did nothing, and Escape left the menu open.
[React measurements](../../../tests/browser/fixtures/ant-design-mentions-menu-focus-reference.json) · [Multiple menus and focus](../../../tests/browser/mentions/mentions-menu-focus.spec.ts)

Custom content retains theme and locale. FormItem status and feedback
and SpaceCompact contexts are isolated as in the upstream
ContextIsolator. Focus inside the built-in list keeps suggestions
open. Moving into an outside field closes them on blur. Closing and
changing the DOM container recreate `popupRender`. Replacing a getter
with one returning the same container preserves DOM, state, text,
focus, and textarea selection.

```svelte
<script lang="ts">
  import { Mentions, type MentionsPopupMenu, type MentionsPopupRenderInfo } from '@woodger/antd';
</script>
{#snippet popup(menu: MentionsPopupMenu, info: MentionsPopupRenderInfo)}
  <strong>Участники</strong>
  {@render menu({ options: info.options.filter(option => !option.disabled) })}
{/snippet}
<Mentions options={[{ value: 'alice', label: 'Alice' }]} popupRender={popup}
  getPopupContainer={() => document.body} aria-label="Комментарий" />
```

[React measurements](../../../tests/browser/fixtures/ant-design-mentions-menu-reference.json) · [Browser tests](../../../tests/browser/mentions/mentions-menu.spec.ts) ·
[SSR and type tests](../../../tests/package/mentions/mentions-popup.ssr.test.ts)

`autoSize` accepts a boolean or `{ minRows, maxRows }` and measures
content with the textarea's font, padding, and box sizing. Unmount
removes the shadow node, ResizeObserver, frames, and listeners.
`onResize` receives `{ width, height }`. `rows` defaults to 1.

`count.max` sets a soft limit, and `maxLength` limits native input.
`maxLength` takes precedence over `maxlength`. When `count.max` is
omitted, the counter uses the native limit. `count.max: 0` disables the
soft limit. The counter measures UTF-16 length by default.
`count.strategy` replaces the count, and `count.show` accepts a flag or
formatter. The formatter receives `{ value, count, maxLength }` and
can return a Svelte Snippet with the same arguments.

`count.exceedFormatter` transforms user input beyond `count.max`.
IME keeps intermediate text until `compositionend`. After truncation,
selection positions are restored in the resulting value. Mention
insertion and clearing operate on the full string.
`onCompositionStart` and `onCompositionEnd` receive native events as
`oncompositionstart` and `oncompositionend` do. Without `count`,
composition completion retains the normal `onChange` order of input
events.

With `count.show`, the editor and counter sit inside
`rc-textarea-affix-wrapper`. Toggling the counter replaces the textarea
and preserves its value. Replacement closes suggestions and removes
the previous caret anchor. In Ant Design 6.6.8, the list stays open
after textarea replacement. React's wrapper with `allowClear` loses
provider direction. To compare counter width in RTL, the React fixture
also sets `dir="rtl"` on the outer container.

Hydration preserves the textarea and its focus. If the text matches
the initial value, selection endpoints and direction are preserved.
If it differs at hydration start, React and Svelte restore the
initial value. The first input after hydration uses the resulting
selection. The snapshot applies once to the original DOM node. It
is available in the document and open ShadowRoots along the focus
chain. Detached trees and ShadowRoots outside that chain are outside
this port. [React hydration measurements](../../../tests/browser/fixtures/ant-design-mentions-hydration-reference.json) ·
[Selection tests](../../../tests/browser/mentions/mentions-hydration.spec.ts)

[React measurements](../../../tests/browser/fixtures/ant-design-mentions-count-reference.json) · [Browser and hydration tests](../../../tests/browser/mentions/mentions-count.spec.ts)
· [SSR and type tests](../../../tests/package/mentions/mentions.ssr.test.ts)

`allowClear` accepts a boolean or `{ clearIcon, disabled }`. Clearing
calls change with `''` and then `onClear`. Size, status, variant, native
`name`, `required`, `maxlength`, FormItem, validation, reset, Form and
ConfigProvider disabled state, locale, themes, compact density, and RTL
are supported. Focus, blur, and `bind:nativeElement` are the current ref
API. Get the field with `nativeElement.querySelector('textarea')`.
The deprecated textarea ref is removed. `autoFocus` uses native
autofocus, and explicit `autofocus` takes precedence. The `mentions`
recipe extracts 102 CSS rules. The fixture is `?fixture=mentions`.
SSR does not measure the DOM or schedule timers. The container and
`popupRender` fixture uses 24 official UMD references at
`?fixture=mentions-popup`. [Popup reference](../../../tests/browser/mentions/mentions-popup.spec.ts)

`ConfigProvider.theme.components.Mentions` applies shared Input tokens,
list metrics, aliases, and algorithms to the textarea and popup.
It prepares 22 upstream CSS defaults, including internal
`lineWidthFocus` and `itemPaddingVertical`. The public token list
remains in the upstream types. Input and Select themes are independent
of Mentions. Local `style` takes precedence. Updates preserve the open
popup, draft, focus, caret, and active option. The native button reset
preserves upstream hover and active colors. With zero
`inputFontSize`, suggestions remain anchored at the zero-sized prefix,
as upstream. The theme fixture uses 16 official UMD themes at
`?fixture=mentions-theme`. SSR preserves native form text without a
measuring popup or timers. [Theme reference](../../../tests/browser/mentions/mentions-theme.spec.ts) ·
[SSR tests](../../../tests/package/mentions/mentions-theme.ssr.test.ts)

`classNames` and `styles` accept a map of `root`, `textarea`, `popup`,
and `suffix` slots or a function of `{ props }` with resolved
`disabled` and `status`. Provider and instance classes accumulate.
Root style order is `ConfigProvider.mentions.styles.root`, then
`ConfigProvider.mentions.style`, then instance `styles.root` and
`style`. `rootClassName` styles the root and the list. The `popup` slot
keeps its styles in custom containers, including `z-index:0`.
The `textarea` slot updates caret and autoSize measurement.

`ConfigProvider.mentions` supplies `class`, `style`, `classNames`,
`styles`, `variant`, and `allowClear`. A nested object replaces its
parent in full. Local `allowClear={false}` disables clear, and a
local icon takes precedence over the provider icon.

In Ant Design 6.6.8 with RcMentions 1.12.0, a suffix wrapper loses
root styles, and the suffix receives classes without the supplied
`styles.suffix`. Svelte applies declarations to both slots.
The extended menu API remains pending.
[Measurements and tests](../../../tests/browser/mentions/mentions-semantics.spec.ts)
