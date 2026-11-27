# Card

Put card content inside `Card`. Use the `extra` snippet for a link or other
action beside the title.

```svelte
<script lang="ts">
  import { Card } from '@woodger/antd';
</script>

<Card title="Team">
  {#snippet extra()}
    <a href="/team">All members</a>
  {/snippet}

  <p>Anna is responsible for the project.</p>
</Card>
```

Title, extra, cover, actions, and Meta.avatar, title, and description accept
text, numbers, booleans, or snippets. Zero and true count as present, and
booleans render no text. Card and Grid children are snippets. All three
components support native attributes, class, style, and bind:nativeElement.
Card also accepts rootClassName. Roots stay divs. Actions use ul, li, and span
with equal shares of the width. Use native buttons and links for interactive
action content. Hoverable changes styling and leaves the container's role
and keyboard behavior alone.

An empty Card omits its body. Loading replaces children with an active Skeleton
with four lines and no title. Header, cover, and actions stay in place.
The replaced content loses its state, as in upstream. Focus from inside the
body is parked on body with tabindex=-1 and aria-busy. Unmount restores focus
to a nearby control. This is the Svelte accessibility adaptation.

Variant accepts outlined and borderless. Hoverable defaults to false.
Type=inner changes header and body. Small inherits an explicitly set
ConfigProvider.componentSize. Medium and large use regular geometry.
Small body and header padding defaults to 12px. Other sizes and colors
use theme and compact tokens. Card classNames and styles accept root, header,
body, extra, title, actions, and cover. Meta accepts root, section, avatar,
title, and description. Both use an object or a ({ props }) callback.
Root style overrides styles.root. Styles.header and styles.body style their
slots. Meta root follows the same precedence.

A nonempty `Card.prefixCls` sets the root, states, header, body, cover, and
actions. An empty value inherits `ConfigProvider.prefixCls`. Grid and Meta
use the base Card prefix. Undefined inherits the nearest owner, a nonempty
value sets its own prefix, and an explicit empty string selects the shared
provider. Callback props retain the original local prefix. Typography and
Tabs use the shared namespace independently of local Card. Component theme
variables and canonical markers stay in place. Prefix changes preserve
Card, Grid, and Meta DOM and refs, active tab, draft, selection, focus, and
FormData. Grid detection uses a stable marker with the existing canonical fallback.

Upstream Card omits its local prefix when mounting Meta and Grid. Raw
measurements and matching measurements with their public prefixCls stay
separate. Native children inherit the owner prefix. With a shared local class
between Suite and Inner, the upstream CSS cache can also retain selectors
only for Suite Typography and Tabs. The reference preserves raw and matched
snapshots. FreshNested measures a fresh upstream Inner with the same theme,
and expectedNative uses it for the nested scope. The native implementation
isolates class and namespace. The fixture is `?fixture=card-prefix`.
[Official prefix measurements](../../../tests/browser/fixtures/ant-design-card-prefix-reference.json) · [Browser](../../../tests/browser/card/card-prefix.spec.ts) · [SSR](../../../tests/package/card/card-prefix.ssr.test.ts)

ConfigProvider.card sets variant, class, style, and the same classNames and
styles slots. ConfigProvider.cardMeta configures Meta separately. Context
and local classes merge. Root style order is context semantic, context style,
local semantic, then local style. Theme variables come first. An explicit
nested record, including {}, replaces the corresponding parent in full.
Undefined inherits. Updates preserve editors, focus, selection, FormData,
selected tab, and callbacks. The `?fixture=card-config` checks use the
unchanged 6.6.8 UMD. [Checks](../../../tests/browser/card/card-config.spec.ts)

Card semantic callbacks keep the native defaults loading=false, hoverable=false,
and tabProps={} when the props are omitted. Raw upstream mergedProps leaves
them undefined. Both resolve size and variant. The reference records this
separately from CSS cases with explicit flags. [Reference](../../../tests/browser/fixtures/ant-design-card-config-reference.json)

ConfigProvider.theme.components.Card applies all 13 upstream component tokens,
including bodyPadding, bodyPaddingSM, headerHeight, headerHeightSM, headerBg,
and actionsBg. Defaults are computed from aliases and the component algorithm.
Nested providers, inherit=false, dark and compact, and live changes are isolated.
Theme variables come before semantic and user styles. Grid and Meta inherit
the Card scope. Grid padding uses paddingLG as upstream does. [Theme context](../theme-context.md)

CardGrid defaults to hoverable=true and width=33.33%. Style can override width.
Card detects direct Grid children in body. SSR uses CSS :has to preserve
geometry until mount. A direct-child MutationObserver then updates
ant-card-contain-grid. Cleanup removes the observer and ignores pending callbacks.
Use containGrid=true for the exact SSR class and initial loading with Grid.
False disables detection. This adapts opaque snippets to the Grid structure.
The flag persists while an already visible Grid is loading. Meta outside
Card omits standalone styles, as upstream does.

TabList supplies Tabs headers, and Card children still render the body.
Selection supports bind:activeTabKey and onTabChange. DefaultActiveTabKey,
including the empty string, takes precedence over tabProps.defaultActiveKey.
Label supplies the heading, including explicit null or undefined. Card size sets
large or small tabs, and tabProps.size overrides it. Card owns items, class,
onChange, and tabBarExtraContent. Other supported tabProps pass through.
The top-level activeTabKey takes precedence over tabProps.activeKey.
TabBarExtraContent accepts a right slot or { left, right }. Keyboard behavior
and fallback keys follow the agreed Svelte Tabs. The rest of the React Tabs
API remains in the broader porting scope.

The `?fixture=card` unit, SSR, and Chromium checks cover styles, slots, Grid,
loading, focus, and tabs. The card recipe extracts 59 rules without keyframes.
Component themes are compared with UMD 6.6.8 separately in
`tests/browser/card/card-theme.spec.ts` at `?fixture=card-theme`.
