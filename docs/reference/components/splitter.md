# Splitter

Splitter supports Ant Design panel sizing, drag, lazy updates, collapse, and
styling. [Props and callbacks](../../../src/lib/splitter/splitter.types.ts)

```svelte
<script lang="ts">
  import { Splitter } from '@woodger/antd';
</script>

{#snippet navigation()}<nav>Разделы</nav>{/snippet}
{#snippet content()}<article>Содержимое</article>{/snippet}

<Splitter
  style="height:320px"
  items={[
    { defaultSize: '30%', min: 120, collapsible: true, children: navigation },
    { min: '20%', children: content }
  ]}
/>
```

Use an items array with scalar or snippet children. Svelte children are opaque
before SSR, so the port has no separate SplitterPanel declaration. Panels retain
identity by position as in upstream. Key does not determine panel identity.
DefaultSize is read when creating Splitter. A size on any panel makes the entire
group controlled, and defaults on other panels are skipped. Accept proposed
sizes in controlled mode by writing them back to items[].size.

Numbers are pixels and percent strings are fractions of the container. The
remaining space is shared between panels. Container changes normalize sizes
with the upstream min and max rules. Fully specified sizes keep their ratios
subject to constraints. There is no separate error callback for incompatible
constraints. In a nonzero group, size 0 stays collapsed even with min > 0.
A group of all zeros divides evenly. Orientation takes priority over boolean
vertical and defaults to horizontal.

Mouse and single-touch gestures measure from the start. Normal drag calls
onResizeStart, onResize, and onResizeEnd. The end callback reports current
sizes, including the original geometry if the owner rejects the change.
Lazy drag shows a preview and proposes sizes through onResizeEnd on release.
It leaves onResize unused. Write controlled lazy sizes back in onResizeEnd.
RTL reverses horizontal delta. As in the pinned SplitBar, lazy drag clamps
physical distance to its ARIA bounds before applying the RTL sign. Asymmetric
bounds can therefore differ from normal drag. Vertical direction keeps the sign.

Neighboring panels configure collapsible with start, end, and
showCollapsibleIcon set to true, false, or auto. Collapse calls resize,
resizeEnd, then collapse, saves the old size, and checks current constraints
when restoring. Resizable=false blocks drag and leaves collapse and double
click available. Hidden contents stay mounted unless destroyOnHidden is set.
The panel option overrides the root option. Collapsible.motion turns on a
CSS transition, disabled during drag and for prefers-reduced-motion.

As in 6.6.8, destroyOnHidden=false collapses the panel by clipping its content.
Controls still participate in Tab and the accessibility tree. The panel has
no inert or aria-hidden state, and focus remains in place. With
destroyOnHidden=true, descendants are removed and remounted on expansion, so
uncontrolled values reset. Store values outside the panel to keep them.

The separator keeps role=separator, orientation, and numeric ARIA limits.
It stays out of focus and has no keyboard resize, as in upstream. Collapse
uses native buttons with type=button, Enter and Space, and the English
Toggle start/end panel labels. Content controls retain native semantics.
ComponentDisabled alone leaves Splitter enabled. Bind:nativeElement supplies
the Svelte ref. Unmount clears ResizeObserver and node and window listeners
and prevents late callbacks.

SSR renders panels and snippets without measurement and keeps supplied pixels
or percentages and auto for unspecified size. ResizeObserver computes pixels
after mount. A zero measurement preserves the previous size. Changing
orientation without a root size change leaves measurement alone, as in the
pinned upstream.

ConfigProvider.splitter sets class, style, and semantic root, panel, and
dragger. A nested config replaces the object. Root style follows semantic
styles. Computed flex-basis and flex-grow on a panel follow its style.
Dragger classes accept a string or default and active. Styles.dragger applies
only default as upstream does. Semantic callbacks receive resolved orientation
and vertical. Collapsible.icon sets collapse icons. An empty object keeps
defaults. Null or false icon values leave an empty custom wrapper.

The splitter and splitter-prefix recipes reproduce all 59 reference rules,
including reduced motion, with SHA-256 verification. Splitter-prefix supplies
a module template for a local prefix. Theme, primary, and RTL inherit.
The native theme keeps its local hover alias for the bar. The token theme
uses the configured aliases.

ConfigProvider.theme.components.Splitter applies splitBarSize, splitTriggerSize,
and splitBarDraggableSize, including 0. The regular splitBarDraggableSize is 20.
Global and component aliases and algorithms, cssVar.prefix, undefined, and
nested, reset, and sibling scopes are supported. Theme variables precede semantic
and user styles. Live updates preserve panel sizes, draft, selection, focus,
and the current lazy drag and preview. RTL metrics use explicit dir=rtl on the
host. A separate record captures upstream LTR inheritance without it.
The native provider direction is preserved. The theme fixture is
`?fixture=splitter-theme`. [UMD](../../../tests/browser/fixtures/ant-design-splitter-theme-reference.json) · [SSR](../../../tests/package/splitter/splitter-theme.ssr.test.ts) · [Browser](../../../tests/browser/splitter/splitter-theme.spec.ts)

PrefixCls sets root, panel, bar, collapse, preview, and mask classes. Empty and
undefined inherit ConfigProvider.prefixCls, giving ant-splitter by default.
The local prefix takes precedence and semantic callbacks receive its original
value. The internal preview-offset variable uses the shared prefix with dots
removed independently of local class and theme.cssVar.prefix. The canonical
token marker is preserved. Prefix changes preserve panels, refs, drafts, focus,
selection, and active lazy drag.

The 6.6.8 CSS cache binds a shared local class to its first namespace. A nested
Splitter with preview-offset=30px can get transform:none. A fresh document
at the same nested namespace gives a 30px offset. Native CSS scopes by local
class and shared namespace. The fixture is `?fixture=splitter-prefix`.
[Raw data](../../../tests/browser/fixtures/ant-design-splitter-prefix-reference.json) · [Fresh page](../../../tests/browser/fixtures/ant-design-splitter-prefix-isolated.json) · [Browser](../../../tests/browser/splitter/splitter-prefix.spec.ts) · [SSR](../../../tests/package/splitter/splitter-prefix.ssr.test.ts)

The main fixture is `?fixture=splitter`. Engine, DOM lifecycle, SSR, package,
and browser tests cover sizing, constraints, callbacks, controlled and lazy
behavior, collapse, native controls, touch, RTL, themes, semantic styles,
and cleanup.
