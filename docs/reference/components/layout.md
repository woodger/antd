# Layout

`Layout` groups sections of a page. If the sidebar is visible from the start, set
`hasSider` on the enclosing Layout so the columns are in place during SSR.

```svelte
<script lang="ts">
  import { Layout, LayoutContent, LayoutHeader, LayoutSider } from '@woodger/antd';
</script>

<Layout>
  <LayoutHeader>Кабинет проекта</LayoutHeader>
  <Layout hasSider>
    <LayoutSider theme="light"><a href="#team">Команда</a></LayoutSider>
    <LayoutContent><h1 id="team">Участники проекта</h1></LayoutContent>
  </Layout>
</Layout>
```

`Layout`, `LayoutHeader`, `LayoutContent`, `LayoutFooter`, and `LayoutSider`
correspond to Layout and its Header, Content, Footer, and Sider sections. They
keep the `div`, `header`, `main`, `footer`, and `aside` elements without
extra wrappers. Children are a Snippet. Native props, `class`,
`rootClassName`, `style`, and `bind:nativeElement` apply to the root.

`Layout.hasSider` explicitly indicates that a sidebar is present. `false`
disables automatic detection. On the client, Sider registers with the nearest
Layout, and nested layouts are independent. Svelte cannot inspect a Snippet
before SSR the way React inspects children. The automatic SSR row therefore
uses CSS `:has(> .ant-layout-sider)`, and `ant-layout-has-sider` appears after
mount. Pass `hasSider=true` to include the class on the server. This preserves
geometry before hydration without evaluating children in advance. Explicit
`false` disables the CSS fallback.

Sider defaults to `width=200`, `collapsedWidth=80`, `defaultCollapsed=false`,
`collapsible=false`, and `theme=dark`. Numbers and numeric strings receive a
`px` unit. Other CSS strings are preserved. Calculated `flex`, `max-width`,
`min-width`, and `width` override `style` as upstream. Semantic `styles.root`
precedes `style`, and `styles.body` applies to the children. `classNames` and
`styles` accept a `root`/`body` object or a callback receiving `{ props }`.

`collapsed` supports binding. `onCollapse(next, source)` is called on a click
or responsive change with `source` set to `clickTrigger` or `responsive`.
The children's DOM and drafts persist. `trigger` accepts a passive string,
number, or Snippet inside the native button. `null` hides the button. Use
`null` and an external control that updates `bind:collapsed` for a custom
interactive trigger. `reverseArrow` reverses the arrow and changes the side
of the zero-width trigger. `collapsedWidth=0` creates a special toggle. At
an actual width of zero, the children become `inert`, and focus moves from
them to the trigger or a nearby accessible control. This is a Svelte
accessibility adaptation. React Sider leaves hidden focus targets active.

`breakpoint` subscribes to one `MediaQueryList`, reports the initial and
updated state through `onBreakpoint`, and calls `onCollapse` when needed.
The listener is cleaned up when the breakpoint changes or the component
unmounts, and late events are ignored. The thresholds come from
`Sider.tsx`: `xs=479.98`, `sm=575.98`, `md=767.98`, `lg=991.98`,
`xl=1199.98`, `xxl=1599.98`, and `xxxl=1839.98px`. The last value uses
the source code, where it differs from the upstream documentation table
(1920). SSR and the initial hydration render leave media queries unevaluated.
Manually expanding below the threshold persists until the next media change.
`componentDisabled` leaves the navigation trigger enabled.

The `light` and `dark` sidebar themes are independent of the overall theme.
`light` inherits the container and text tokens of the active mode, while
`dark` retains `#001529`. Compact mode uses smaller control tokens. The trigger
supports Enter, Space, `aria-expanded`, `aria-controls`, and the expand and
collapse labels in `locale.layout`, with `expandLabel` and `collapseLabel`
overrides. Reduced motion disables transitions. The fixture is
`?fixture=layout`. Unit, SSR, and Chromium tests cover structure, SSR without
JavaScript, callbacks, sizing, breakpoint cleanup, focus, locale, and themes.
The `layout` recipe extracts 35 rules, including Menu integrations.

`ConfigProvider.theme.components.Layout` supports 16 current tokens. Aliases,
a separate algorithm, and the `cssVar` prefix and key apply to Layout and
Sider. Sections inside Layout inherit its variables, including CSS overrides
in `style`. Semantic `styles.root` precede `style`, and Sider's calculated
width comes last. Theme changes preserve collapse state, DOM, refs, focus,
and drafts. Standalone Header, Content, and Footer receive their own variables
in Svelte. The pinned upstream leaves standalone sections without Layout
variables. The registry records this observation and the behavior chosen for
Svelte.

`ConfigProvider.layout` provides shared `class` and `style` for Layout
containers. Configuration and local classes accumulate. Local styles
override shared styles, and both follow theme variables. `undefined` inherits
the parent record. An explicit object, including `{}`, replaces it in full.
Header, Content, Footer, and Sider do not receive this record directly.
Configuration updates preserve the DOM, drafts, selection, focus, and
collapse state. Standalone sections retain native variables and RTL. The raw
reference records the original differences, and comparisons account for them
explicitly. The reference also records that React clears unchanged padding
when a local `paddingTop` is removed on update. The native style string
preserves that padding.

`Layout.prefixCls` and `LayoutSider.prefixCls` are independent. An empty
string uses the nearest ConfigProvider prefix (`ant` by default). State,
children, and trigger classes follow their owners' prefixes. The
`--ant-layout-*` namespace and shared `ant-layout-css-var` marker are
preserved. The `layout-prefix` recipe extracts 35 rules, and the runtime
chooses the group for Layout or Sider. Native SSR detection of a direct
Sider uses internal attributes. Changing the prefix preserves DOM, IDs,
`aria-controls`, collapse state, drafts, selection, and focus. Focus restoration
uses the actual DOM body and respects the owner's explicit choice.

`LayoutHeader`, `LayoutContent`, and `LayoutFooter` accept their own literal
`prefixCls`, which supplies the full section class without an appended
suffix. An empty string falls back to the class from ConfigProvider. The
container prefix leaves the section prefixes independent. The shared
`ConfigProvider.prefixCls` applies to Layout and all sections. A literal local
prefix takes precedence. The remaining CSS, SSR, and focus rules also apply.

Original prefix collisions involving Layout, Sider, variable classes, and
the retained CSS cache are recorded in the [raw reference](../../../tests/browser/fixtures/ant-design-layout-prefix-reference.json).
Native markers protect the measured roles and neighboring scopes. Expected
corrections are limited to the background, position, and flex direction for
known alias cases. Each variant is measured in a fresh document. Transitions
are measured separately in one document.

Upstream sections have a [prefix defect](../../../tests/browser/fixtures/ant-design-layout-section-prefix-observation.json) that applies container
styling to Header, Content, and Footer. The observation is retained for
separate analysis. Svelte preserves each section's styling, including with
an explicit default or shared prefix. The raw custom prefix is compared with
an ordinary section in a separate upstream document. The reference text
container gets its font, color, and line height from `getDesignToken` for
comparison with the native provider's text context. [Paired measurements](../../../tests/browser/fixtures/ant-design-layout-section-prefix-reference.json)

Standalone fallback variables and `border-box` are available before
hydration, including in legacy dark and compact modes. Inside Layout, the
sections inherit the parent style without declaring new variables. Local
`style` takes precedence. Updating the prefix preserves controls and their
draft values and selection.
