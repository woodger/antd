# Empty

```svelte
<script lang="ts">
  import { Button, Empty } from '@woodger/antd';

  let hasRecords = $state(false);
</script>

<Button onclick={() => { hasRecords = false; }}>Clear the list</Button>
{#if hasRecords}
  <p>The first member has been added.</p>
{:else}
  <Empty image="simple" description="No members yet.">
    <Button type="primary" onclick={() => { hasRecords = true; }}>Add a member</Button>
  </Empty>
{/if}
```

Empty shows a lack of data and offers an action through the children snippet.
The owner handles data, filtering, and the action outcome. Empty has no
requests or timers of its own.

Image accepts default, simple, a URL, a custom snippet, or a scalar. The default
is default. Empty.PRESENTED_IMAGE_DEFAULT and Empty.PRESENTED_IMAGE_SIMPLE
keep their aliases. Other strings are URLs rendered as img with draggable=false.
Alt comes from a string description, with empty as the fallback. False removes
the image and container. The built-in illustrations are Ant Design 6.6.8 SVGs.
In native mode, their colors use current CSS tokens. SVG patterns blend a
translucent fill with colorBgContainer and keep opaque fill where parts overlap.
IDs are unique per instance and stable between SSR and hydration. An explicit
upstream theme uses getAsSolidColor and global theme colors independently of
Empty component aliases. CSS variables stay unblended in advance. Decorative
SVGs receive the upstream title. The image container is aria-hidden and inert,
keeping its contents out of the accessibility tree, Tab order, and interaction.

Description accepts a scalar or snippet. Undefined uses Locale.empty.description.
The `ruRU` locale supplies `Нет данных` and `enUS` supplies `No data`. Missing
fields fall back to `ruRU`. False, null, and the empty string hide the description without
fallback. Zero renders as text and true keeps an empty description div, as in
upstream. Strings are escaped. Generic locale.emptyText for Select and other
components keeps its existing meaning and values.

Children accepts a scalar or snippet and renders in the footer with ordinary
controls and Tab navigation. Zero is visible. False, null, and the empty string
omit the footer, and true leaves an empty div. Changing image or description
preserves mounted actions. An explicit aria-label or aria-labelledby gives
the root a named group. Otherwise, it is an ordinary div. Id, class, style,
and aria-describedby apply to the root. The owner handles announcements and
focus after an operation. Empty does not add a live region, Tab stop, or
focus movement on display.

Removing a focused action inside a retained Empty moves focus to an available
control within it, then to a neighbor outside. Removing Empty uses saved
neighbors in the current dialog or document. It tries the next, then previous,
then the dialog itself. The check after tick preserves focus already chosen
by the owner, including focus outside. Unmount clears focusin tracking and
MutationObserver. SSR leaves the DOM alone. The containing Modal or Drawer
owns Escape.

The component inherits themes, compact, and RTL from ConfigProvider. Default
image height is 2.5 controlHeightLG and simple is controlHeightLG. Compact
changes 100/40px to 90/36px. Images stay within the container, long descriptions
wrap, and footer actions wrap to the next line. Empty uses no built-in animation
or timer for reduced motion. ConfigProvider.disabled leaves description and
illustration visible. The owner sets disabled on its controls.

Table uses simple Empty in the existing single cell of the empty row. Colspan
and native table semantics are preserved. Description comes from
Locale.table.emptyText, including overrides. The empty snippet takes priority.
Loading omits both empty states.

ConfigProvider.empty sets image, class, style, and object or function classNames
and styles. A nested record replaces the parent, while undefined inherits it.
A local image takes priority. Null and undefined fall back to context image and
then default. Semantic root, image, description, and footer receive raw props
before defaults. Root style order is context styles.root, context style,
local styles.root, then local style. Styles.image styles the illustration.
PrefixCls sets BEM classes and otherwise inherits ConfigProvider, giving
ant-empty by default. RootClassName applies to the root. Bind:nativeElement
and nativeElement on bind:ref expose the root div after mount and clear to
undefined on unmount. SSR leaves them unset.

Empty has no component tokens of its own. Theme.components.Empty supports shared
aliases and algorithms, variable prefix and key, hash, dark, and compact.
The 15 upstream CSS rules include small, available through class="ant-empty-small".
The 55 UMD cases cover classes, slot styles, images, and original colors under
an explicit upstream theme. Native image=false, inert and ARIA, responsive
guards, footer wrapping, earlier paint patterns, and focus restoration are
preserved. The shared ConfigProvider prefix is supported. React diagnostics
remain outside the port. [UMD scenarios](../../../tests/browser/fixtures/ant-design-empty-reference.json)

The RenderEmpty mechanism covers Select, TreeSelect, Cascader and Panel,
Mentions, Transfer, and Table and its filter. AutoComplete retains the upstream
combobox exception. Without a callback, existing native defaults apply. A custom
image snippet owns its resources and animations. [RenderEmpty](../render-empty.md)
