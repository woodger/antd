# Anchor

`Anchor` takes items with key, href, title, target, class, nested children,
replace, and targetOffset. Title accepts text, a number, or a snippet.
Horizontal mode omits nested items. Native anchors retain Tab and Enter
without additional keyboard handling.

```svelte
<Anchor affix={false} showInkInFixed items={[
  { key: 'intro', href: '#intro', title: 'Введение' },
  { key: 'api', href: '#api', title: 'API', targetOffset: 48 }
]} />
```

Affix is enabled by default. Affix accepts a boolean or extra Affix props
without offsetTop, target, and children. GetContainer supplies a window or
HTMLElement for scrolling and Affix. Container precedence is getContainer,
ConfigProvider.getTargetContainer, then window. Undefined in a nested provider
inherits the parent function. A local prop takes precedence. OffsetTop sets the
fixed offset. TargetOffset overrides the scroll offset, and a link's own
targetOffset wins, including 0. Bounds defaults to 5px. The active section is
the closest reached section to the boundary, based on coordinates. The raw
fragment after # keeps its encoding and spaces. The check uses Ant Design's
original regular expression.

`onClick(event, { title, href })` runs before scrolling. PreventDefault cancels
the URL change only. Selection and animation continue as upstream does.
Internal href uses history.pushState or replaceState without a :target effect.
HTTP(S) uses native navigation and location.replace with replace. Item.replace
overrides shared replace. GetCurrentAnchor(rawHref) maps the visual highlight.
OnChange receives raw href. Repeated scroll with the same mapped highlight
avoids a duplicate callback. Selecting a different raw link still reports
it when the highlight is unchanged.

Scrolling uses the upstream cubic easing over 450ms. Scroll tracking pauses
during animation. Re-selecting the same link leaves the animation in place,
and another link cancels it. Unmount removes the scroll listener and cancels
animation frames. SSR leaves getContainer and DOM access inactive, active
link unset, and content unfixed. Focus stays on the link.

ClassNames and styles accept an object or function of { props } for root, item,
itemTitle, and indicator. ConfigProvider.anchor provides shared class, style,
and semantic defaults. Undefined inherits the parent record. An explicit
object, including {}, replaces it. Semantic classes accumulate. After component
variables and computed max-height, root style order is context semantic,
context plain, local semantic, then local plain. The callback receives
current props with resolved direction and the existing native defaults.
Class, rootClassName, and bind:nativeElement apply to the wrapper.
ShowInkInFixed preserves the upstream ant-anchor-fixed class for false or
affix=false. Theme and RTL inherit. The horizontal indicator uses offsetLeft
and clientWidth and reveals the active link in scrollable ancestors as upstream does.

Semantic style and class updates keep links, focus, and callbacks and update
indicator geometry. Runtime owns top, height, left, and width. Changing
indicator color keeps those coordinates. [Upstream defect and raw measurements](../anchor-indicator-observation.md)

Default Anchor item padding is 4px vertically and 16px before text. The first
horizontal item keeps zero inline start padding. Nested vertical items use
paddingXXS / 2, usually 2px. Padding variables are in the root's CSS scope.
These defaults supply the link spacing without a user-specified gap.

With an upstream theme, Anchor uses components.Anchor. Defaults come from
paddingXXS and padding, followed by component overrides and a separate algorithm.
Upstream compact reduces inline padding to 8px, while native-only compact keeps
16px. Nested block padding still uses paddingXXS / 2 independently of
linkPaddingBlock. Aliases change fonts, colors, and borders. Zero, undefined,
and a custom CSS prefix are supported. Variables are available in SSR.
Semantic and plain styles retain precedence. Upstream links use
linkDecoration, linkHoverDecoration, and linkFocusDecoration, with no underline
by default. Theme changes preserve links, focus, scroll, and callbacks.

The link reveal uses framework-independent compute-scroll-into-view 3.0.2
(git 0c45c0afce9650b8cc96dd23ea8efdc90cbd32fe), matching the ^3.0.2 range of
scroll-into-view-if-needed 3.1.0 (git 8ac397fc9119014eae13069615b16ef4e45b3d9f).
Source lives in vendor with both MIT licenses. The algorithm file differs
only by removal of an unused catch binding. The wrapper covers Anchor's
if-needed and nearest options and scroll margins. The package uses vendored
code without additional npm dependencies. Delegate 3.0.2 cannot auto-reveal
through negative scrollLeft in RTL. Native manual scrolling, selection,
and indicator geometry remain available.

PrefixCls sets wrapper, content, link, and indicator classes. Empty or undefined
inherits ConfigProvider.prefixCls and defaults to ant-anchor. The local prefix
takes precedence. Items inherit the resolved Anchor prefix. Item.prefixCls
can override it, and an empty string on an item selects the shared provider
prefix. A separate item prefix needs its own CSS as in upstream. Semantic
callbacks receive the original local prefix. The canonical token marker stays
in place. Prefix changes preserve links, refs, indicator, focus, callbacks,
and history. Affix uses its shared prefix independently of local Anchor.

In 6.6.8, items keep the shared prefix with local Anchor.prefixCls. Links lose
padding and updateInk cannot find the active link. The native path inherits the
owner prefix and preserves explicit item overrides. The reference records
raw upstream and matchedItems with the same public prefixCls on every item,
using the unchanged official UMD. Full geometry uses matchedItems. The raw
observation remains available separately. [Reference](../../../tests/browser/fixtures/ant-design-anchor-prefix-reference.json)

The main fixture is `?fixture=anchor`. Unit, SSR, and Chromium tests cover offset
precedence, callbacks and history, animation and cleanup, nested items, RTL and
indicator, and production hydration. The anchor and anchor-prefix recipes
contain 22 rules. The latter keeps a module template for local classes.
[Official UMD token and geometry data](../../../src/lib/theme/theme-anchor-tokens-reference.test.ts) · [Browser comparison](../../../tests/browser/anchor/anchor-theme.spec.ts)
The prefix fixture is `?fixture=anchor-prefix`. [Browser](../../../tests/browser/anchor/anchor-prefix.spec.ts) · [SSR](../../../tests/package/anchor/anchor-prefix.ssr.test.ts)

Item links use linkDecoration, linkHoverDecoration, and linkFocusDecoration
without cssVar too. Defaults are none. User variables and inline styles.itemTitle
retain precedence.
