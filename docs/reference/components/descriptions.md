# Descriptions

Pass label and value pairs through `items` using `label` and `children`.
For example, a project card with `column={1}` puts each property on its own row.

```svelte
<script lang="ts">
  import { Descriptions } from '@woodger/antd';

  const items = [
    { key: 'owner', label: 'Владелец', children: 'Анна' },
    { key: 'status', label: 'Статус', children: 'В работе' }
  ];
</script>

<Descriptions title="Проект" column={1} {items} />
```

Label, children, title, and extra accept a string, number, or snippet. Zero is
displayed, and empty values omit the corresponding wrapper. The structure is a
div root, then view, table, tbody, tr, and native th or td. Bind:nativeElement
exposes the div, and native attributes pass to the root.

Column is a number or a responsive xs–xxxl map. The default map is xs=1, sm=2,
md/lg/xl/xxl=3, and xxxl=4. A custom map resolves from the largest active
breakpoint to the smallest and falls back to the default map. SSR uses
screens={} and column=3. Media subscriptions start on mount and clear on unmount.
Span accepts a number, responsive map, or filled. Overflow is limited to
the remaining row, and the last cell of a partial row takes unused columns.
Filled finishes the current row and occupies its remainder. Items stay intact.
As upstream does, responsive row repacking can remount a cell that moves to
another row. Store state for such controls in an external model.

Layout defaults to horizontal. Vertical uses separate label and content rows.
Bordered defaults to false and colon to true. In horizontal bordered mode,
the label gets th/span=1 and content gets td/span=2*span-1. Vertical mode keeps
the span on both rows. Colon controls the label pseudo-element without a
border. Without explicit size or componentSize, size is large. Medium and small
reduce padding. ComponentDisabled leaves read-only fields intact.

ClassNames and styles accept root, header, title, extra, label, and content
through an object or ({ props }) callback with resolved column, items, and size.
Items have class, style, and classNames and styles for label and content.
Root semantic style precedes item semantic style. In bordered mode those
styles apply to th and td and take priority over item.style. Without a border,
they apply to inner spans. Root style follows styles.root. Nested tables keep
their own bordered and size settings and remain isolated from outer row styles.
Themes and RTL inherit from ConfigProvider.

A nonempty local `prefixCls` sets the root, header, title, extra, view, row,
and all cell classes. Empty inherits `ConfigProvider.prefixCls`. Semantic
callbacks receive the original local prefix. The theme variable namespace
is independent. Changing the prefix preserves DOM, refs, drafts, selection,
focus, and FormData.

Two rules for Descriptions inside a Table expanded row use the shared Table
prefix and local Descriptions prefix. The owner namespace isolates adjacent
scopes. Default copies in descriptions.css and vendor/antd.css are scoped to
the standard owner with zero specificity to preserve a custom namespace.
Upstream looks only for the shared Descriptions class and misses a local prefix.
Raw UMD measurements are preserved. The native implementation keeps expanded-row
styling with a local prefix. In that case expectedNative changes only view
display and table flex to the values measured in regular Table context.
Full Table prefix coverage is tracked separately. The fixture is
`?fixture=descriptions-prefix`. [Prefix reference](../../../tests/browser/fixtures/ant-design-descriptions-prefix-reference.json) · [Browser](../../../tests/browser/descriptions/descriptions-prefix.spec.ts) · [SSR](../../../tests/package/descriptions/descriptions-prefix.ssr.test.ts)

ConfigProvider.descriptions sets class, style, and object or function classNames
and styles for the same slots. Context and local classes merge. Root style
order is context semantic, context style, local semantic, then local style.
Cell semantic styles precede item semantic styles. A nested record, including
{}, replaces its parent. Undefined inherits it. Column and size changes preserve
the editor, focus, selection, and FormData of the first cell. The
`?fixture=descriptions-config` browser comparison preserves raw UMD classes,
tags, colspan, and computed styles. The class check compares membership and count.
[Browser comparison](../../../tests/browser/descriptions/descriptions-config.spec.ts)

Callbacks keep native defaults for omitted bordered=false, layout=horizontal,
and colon=true. Raw upstream mergedProps omits them. Both resolve column,
items, and size. [Reference observation](../../../tests/browser/fixtures/ant-design-descriptions-config-reference.json)

ConfigProvider.theme.components.Descriptions applies all ten component tokens,
including title, extra, label, and content colors, label background, and
header, cell, and colon spacing. Values are derived from global aliases,
with global and component algorithms, cssVar.prefix, nested providers, and
live updates supported. Theme variables precede semantic and user styles.
As in 6.6.8, bordered uses labelBg and global colorTextSecondary, and its size
and border styles can set their own spacing over itemPaddingBottom and
itemPaddingEnd. The fixture is `?fixture=descriptions-theme`. [Official CSS tokens](../../../tests/reference/ant-design-descriptions-tokens-reference.json) ·
[Variants and responsive spans](../../../tests/browser/fixtures/ant-design-descriptions-theme-reference.json) · [SSR](../../../tests/package/descriptions/descriptions-theme.ssr.test.ts) · [Browser](../../../tests/browser/descriptions/descriptions-theme.spec.ts)

Unit, SSR, and Chromium checks for `?fixture=descriptions` cover layout, media,
style precedence, and nesting. The descriptions recipe extracts 40 rules
without keyframes, including two Table expanded-row integrations. Responsive
column and span use global `theme.token.screen*`, including separate screenSMMin
and screenSM and the gap between them. A nested provider inherits values.
Inherit:false restores defaults. Threshold order is validated during SSR.
In the browser, token changes replace queries without remounting. Existing
styling without an upstream theme keeps standard thresholds. The raw data
records the upstream stale observer after token changes and a separate fresh
public mount. Native updates match the freshly mounted upstream layout.
Browser checks cover column, span, editor, refs, focus, selection, FormData,
and subscription cleanup. SSR checks cover fallback and validation.
[Upstream measurements](../../../tests/browser/fixtures/ant-design-descriptions-breakpoints-reference.json) · [Browser](../../../tests/browser/descriptions/descriptions-breakpoints.spec.ts) · [SSR](../../../tests/package/descriptions/descriptions-breakpoints.ssr.test.ts)
