# Space

Space adds a div.ant-space-item around each entry. Flex renders children
without wrappers. Pass items for multiple entries, as a readonly array of
strings, numbers, snippets, or { key, children }. Key preserves DOM and state
on reorder. A children snippet without items represents one group. Its
contents stay opaque. An empty items array takes precedence and omits the root.
A nonempty array of empty values keeps an empty root as upstream does.

Booleans, null, undefined, and empty strings omit item wrappers. Zero renders.
React.Children normalizes booleans to null before rc-component/util.toArray.
An empty snippet retains a wrapper hidden by CSS :empty and counts for separator
placement, as a React child returning null does. Separator provides a span
between renderable entries, excluding the last. A falsy separator, including
0, omits that span. A separator snippet can contain meaningful content, so it
receives no automatic aria-hidden.

Orientation takes priority over explicit vertical and defaults to horizontal.
Align accepts start, end, center, and baseline. Horizontal defaults to center,
and vertical without align uses natural stretch. Size resolves from local size,
ConfigProvider.space.size, then small, independently of componentSize. Use
small, medium, large, a number, or [horizontal, vertical]. Zero omits inline
gap. NaN is ignored. Wrap adds flex-wrap:wrap. Gap and wrap styles precede
styles.root and style, so inline styles also override numeric gap. Presets
use shared padding tokens, including compact 4/8/16px.

The root is a div with native attributes, class, rootClassName, style, and
bind:nativeElement. ClassNames and styles accept root, item, and separator
through an object or ({ props }) callback with resolved size, orientation,
and align. Space inherits typography, theme, and RTL. The `?fixture=space`
unit, SSR, and Chromium checks cover gaps, empty values, keyed DOM and focus,
and production hydration. The space recipe extracts 16 rules without Compact,
Addon, reset, and keyframes.

ConfigProvider.space sets size, class, style, and object or function classNames
and styles for root, item, and separator. An explicit nested record replaces
the parent in full. Undefined inherits, and {} clears. Semantic callbacks
receive resolved size, orientation, and align and may return undefined.
Style order is gap and wrap, provider styles.root, provider style, local
styles.root, then local style. Compact and Addon have separate settings.

```svelte
<script lang="ts">
  import { ConfigProvider, Space } from '@woodger/antd';
</script>

<ConfigProvider space={{ size: ['small', 'large'], styles: { item: 'color:#531dab' } }}
  theme={{ components: { Space: { paddingXS: 12 } } }}>
  <Space items={['First', 'Second']} separator="|" />
</ConfigProvider>
```

Theme.components.Space accepts alias overrides and a separate algorithm.
Upstream 6.6.8 has no component tokens of its own. Preset gaps read paddingXS,
padding, and paddingLG. Numeric gaps retain inline precedence and no typography
reset is added. Named cssVar settings, zero and undefined, and independent
provider scopes are supported. Theme and config updates preserve keyed DOM,
drafts, selection, and focus.

PrefixCls changes root, orientation, align, gap, item, and separator classes.
Empty and undefined inherit ConfigProvider.prefixCls, giving ant-space by
default. The local prefix takes priority. Semantic callbacks receive the
original local prefix. Badge selectors use the provider's shared prefix
independently of local Space. Prefix changes preserve keyed DOM, refs, drafts,
selection, focus, and style precedence.

## SpaceCompact and SpaceAddon

SpaceCompact corresponds to Space.Compact. It uses the same items and children
snippet API and one div without item wrappers. Each item supplies its own context
for first and last flags and size. Pass items for several controls. A single
children snippet is one position, like a React component returning several
nodes. Null, undefined, and booleans are removed. Empty string and 0 are
retained, as in rc-component/util.toArray without keepEmpty.

Size accepts small, medium, and large. It defaults to explicit componentSize.
Control size takes priority, then Compact size, then ConfigProvider.componentSize.
Block sets width=100% and display=flex. Otherwise, it uses inline-flex.
Orientation and vertical follow Space. Native attributes, class, rootClassName,
style, and bind:nativeElement apply to the root. Button, Input, InputNumber,
and Select support Compact. Horizontal joins use logical corners and overlap
by lineWidth. Vertical joins support Button, as upstream does. Select keeps its
outer container and the inner border inherits the radii. Keyed DOM and focus
are preserved on reorder.

Nested Compact inherits edge flags from its outer group position. Its own size
resolves from props and ConfigProvider independently of the parent's Compact size,
matching Compact.tsx 6.6.8. Context stays on popup triggers and resets inside
Modal and Drawer and Tooltip, Popover, and Dropdown contents. Shared
ConfigProvider and Form contexts are preserved.

SpaceAddon corresponds to Space.Addon with a div and children snippet. Variant
accepts outlined, filled, borderless, and underlined, defaulting to outlined.
Status=error or warning changes border, background, and text. Disabled sets
appearance only, without inheriting componentDisabled or disabling children.
Size comes only from Compact context. Outside Compact, componentSize leaves
Addon alone. Native attributes, class, style, and bind:nativeElement are supported.

SpaceCompact and SpaceAddon have their own prefixCls using the same inheritance
rules, with defaults ant-space-compact and ant-space-addon. Local Compact prefix
leaves nested Addon and controls intact. Addon variant and status variables use
the shared prefix with dots removed and are independent of local class and
theme.cssVar.prefix. Canonical markers and existing Compact adapters remain.
Other control prefixes are covered in their own families.

In 6.6.8, a shared local Space class is cached with the first global prefix.
A nested Badge rule can look for the parent class and retain display:inline-block
in place of block. The native implementation scopes CSS by local and shared
prefix. The checks use `?fixture=space-prefix`. [Raw measurements](../../../tests/browser/fixtures/ant-design-space-prefix-reference.json) ·
[Fresh page measurements](../../../tests/browser/fixtures/ant-design-space-prefix-isolated.json) · [Browser](../../../tests/browser/space/space-prefix.spec.ts) · [SSR](../../../tests/package/space/space-prefix.ssr.test.ts)

The `?fixture=space-compact` checks cover size, borders and RTL, nesting, focus,
popup isolation, variants, status, disabled, and hydration. The space-compact,
space-addon, and input-number-compact recipes extract 4, 29, and 8 rules without
keyframes. InputSearch uses inner Compact with separate Input and button items.
The registry tracks Compact support in other families. Space-prefix,
space-compact-prefix, and space-addon-prefix reproduce 16, 4, and 29 rules as CSS
modules with SHA-256 verification. Runtime substitutes namespaces and selectors.
