# Collapse

```svelte
<script lang="ts">
  import { Collapse, Input, type CollapseActiveKey } from '@woodger/antd';

  let activeKey = $state<CollapseActiveKey>(['contacts']);
</script>

{#snippet contacts()}<label>Name<Input defaultValue="Anna" /></label>{/snippet}
{#snippet preferences()}<p>Member preferences.</p>{/snippet}

<Collapse
  aria-label="Member questionnaire"
  bind:activeKey
  items={[
    { key: 'contacts', label: 'Contacts', children: contacts },
    { key: 'preferences', label: 'Settings', children: preferences }
  ]}
/>
```

`items` accepts a readonly array of `CollapseItem` with an optional
string or numeric `key`, `label`, `children`, and `extra` as a scalar,
nested readonly array, or Snippet, plus `collapsible`, `showArrow`,
`forceRender`, and `destroyOnHidden`. A missing key uses the index as a
string. Numeric keys are converted to strings. An empty key is valid.
The first occurrence of a duplicate key wins. The key keeps a panel
instance and its focus when reordered. Put interactive elements in
`extra` or `children`. The label must give the button an accessible name
and contain no other controls. `extra` sits beside the header, outside
the toggle button, so its actions leave the panel state intact. `id`,
`class`, and `style` apply to the root. Name the group with `aria-label`
or `aria-labelledby`.

`bind:activeKey` accepts a string, number, or readonly array of those
keys. User activation writes a new array to the binding, then calls
`onChange` with a separate array. Mutating the callback array leaves the
owner's value intact. `item.onItemClick` then receives the string key.
Keys are deduplicated in activation order. `defaultActiveKey` is read at
creation. Without an initial value, all panels are closed, including in
accordion mode. To use the binding, set the initial value in the owner
and omit `defaultActiveKey`. External changes, defaults, and toggling
`accordion` leave `onChange` uncalled.

Without `accordion`, multiple panels can open. In accordion mode, only
the first requested key is displayed. Activating it again closes it.
Unknown keys are retained without substituting another panel or
rewriting the owner's value. Turning accordion mode off reveals the
other requested panels again. Removing an item keeps its key in the
owner's value. Empty `items` displays `locale.emptyText`.

`collapsible` supports `header` for the entire header button, `icon` for
only the arrow with a pointer, and `disabled`. Enter and Space activate
the native button even in `icon` mode. The item value overrides the
common setting, including `header` over `disabled`. `showArrow=false`
hides the arrow. With `icon`, it falls back to `header` to keep an
accessible activation area. `disabled` prevents user toggles while
allowing the owner to show the panel. Collapse is independent of Form
and ConfigProvider disabled state. Its fields use their own context.

Each header includes a `type=button` button inside a heading.
`headingLevel` sets a level from 2 to 6, with 3 as default. Give a nested
Collapse the next level. `aria-expanded` and `aria-controls` link the
button to its content. In an accordion or a group of up to six items,
panels have named `role=region` landmarks. Larger groups without
accordion mode omit the extra landmarks. Tab follows the usual order
through accessible headers, extras, and fields. Arrow keys keep their
normal behavior. The enclosing Modal handles Escape. Hiding focused
content returns focus to its accessible header. If the header is
removed or disabled, focus moves to an open accessible header, then
falls back to the first accessible header or to the group. Changes
while focus is outside Collapse leave it outside.

Content first mounts when opened and by default retains local state
and DOM drafts while hidden. `destroyOnHidden=true` removes content upon
closing. Turning it off does not remount a panel that was already
destroyed. The item value overrides the common one, including
`false`. `forceRender=true` mounts content immediately and keeps it
even with `destroyOnHidden`. Removing a key destroys its panel and
preserves the surrounding state. Retained hidden panels stay in the
DOM with their timers and subscriptions running. Fields in visited or
force-rendered panels participate in `FormData` even when hidden. Fields
that have not mounted or have been destroyed are absent. The form owner
must open a hidden panel before focusing an error in it. Header buttons
do not submit the surrounding form.

`size` uses `small`, `medium`, `large`, and
`ConfigProvider.componentSize`. `bordered=false` removes the outer
border. `ghost` removes the background and dividers.
`expandIconPlacement` sets `start` or `end` relative to the header
button and RTL direction. `extra` remains a separate element after the
header. `expandIcon` is a Snippet receiving `isActive`, `header`,
`panelKey`, `prefixCls`, the original `showArrow`, `collapsible`, and
`accordion`, and merged item slots. Its `onItemClick` toggles an
available panel and calls the root and item callbacks. A custom arrow
does not rotate automatically.

`ConfigProvider.collapse` supplies `expandIcon`, `class`, `style`,
`classNames`, and `styles`. The local arrow takes precedence over the
context arrow. An explicit nested record replaces the parent record.
Semantic objects or functions support `root`, `header`, `title`,
`body`, and `icon`. The callback receives props with resolved `size`,
`bordered`, and `expandIconPlacement`. Root styles apply after
component variables in this order: context slots, context `style`,
local slots, local `style`. Item slots add classes and override
styles. The header slot applies to the native button and the body
slot to the inner content. `extra` remains outside the button.
Item `id`, `class`, `style`, and data and ARIA attributes apply to
the panel wrapper. `rootClassName` applies to the root.
`bind:nativeElement` and `bind:ref` receive the `HTMLDivElement` after
mount and clear on unmount. Configuration, theme, and prefix changes
preserve panels and fields.

`theme.components.Collapse` applies all ten tokens:
`headerPadding`, `headerPaddingSM`, `headerPaddingLG`, `headerBg`,
`contentPadding`, `contentPaddingSM`, `contentPaddingLG`, `contentBg`,
`borderlessContentPadding`, and `borderlessContentBg`. Aliases, the
component algorithm, `cssVar` prefix and key, dark mode, and compact mode
use the shared theme mechanism. A CSS template from the pinned bundle
supports the local `prefixCls` or the shared ConfigProvider prefix.
Tooling reproduces all 49 CSS rules. Content height changes immediately.
Only the arrow animates, subject to reduced motion.

An item supports `headerClass`, HTML attributes, native lowercase
events, and camelCase aliases including `Capture`. Comparisons with the
original cover click, capture, bubble, `stopPropagation`, `preventDefault`,
focus, blur, keyboard, and mouse traces. Events remain native DOM events
without React's SyntheticEvent or its input and change normalization.
Enter and Space keep the native button activation order, including the
ability to cancel the default. `item.ref` is a callback receiving the
node after mount and `null` when replaced or on unmount. A stable
callback is called only at those boundaries, including when the label
updates. It uses Svelte's post-DOM lifecycle without mutating React
`RefObject` instances.

The React height animation is pending. The native group, heading,
button, region, ARIA relationships, Space, full button hit area,
independent `extra`, focus recovery, and `icon` and `showArrow`
fallback are documented differences from React DOM. An empty custom
`expandIcon` Snippet keeps its wrapper. The shared
`ConfigProvider.prefixCls` is supported. React development diagnostics
remain pending.
