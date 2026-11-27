# Anchor indicator after a style change

> Type: Reference. This Ant Design 6.6.8 observation records upstream behavior
> for independent analysis.

The reference uses commit 984592267de88fbf9cdaecc96a56629e721c709d and the unchanged
`package/dist/antd.min.js` from the pinned npm archive. The raw observation
records the SHA-256 and actual measurements. React and ReactDOM are at 18.3.1.
`theme.cssVar` is enabled and motion is disabled. [Raw observation](../../tests/browser/fixtures/ant-design-anchor-config-layout-observation.json)

The vertical Anchor has two items, `affix=false`, and `showInkInFixed=true`.
The items array and the getCurrentAnchor function that returns the second href
stay the same. Only ConfigProvider.anchor.styles.itemTitle changes, moving
paddingTop and paddingBottom from 4px to 20px.

| Measurement | Padding 4px | Padding 20px |
| --- | --- | --- |
| Active link clientHeight | 30px | 62px |
| Active link offsetTop | 42px | 74px |
| Computed indicator height | 30px | 30px |
| Computed indicator top | 57px | 57px |

Anchor's own algorithm gives an updated height of 62px and top of 105px.
The upstream effect that calls updateInk depends on direction, getCurrentAnchor,
registered hrefs, and activeLink. A styles or classNames change leaves the
effect idle, so the indicator stays out of sync. The raw reference preserves the
original result.

Svelte recomputes top and height or left and width after a change to semantic
styles and classes. It also preserves the coordinates when the indicator's
CSS string changes. Svelte replaces the whole style attribute, including the
previously assigned imperative coordinates. As in upstream updateInk, the
runtime owns these four coordinates. The color and other styles remain
user-controlled. Link and indicator DOM, focus, href and history, and callbacks
keep their behavior.

The standard reference matrix contains independent initial states for new Anchor
instances and compares their geometry exactly with upstream. Browser tests
separately check provider and local style updates for vertical and horizontal
Anchor. The recorded upstream behavior stays separate from the corrected updates.
This fix covers semantic prop changes. Size changes from external CSS with
unchanged semantic props and window resize remain outside its scope, and it
adds no ResizeObserver. [Reference matrix](../../tests/browser/fixtures/ant-design-anchor-config-reference.json) ·
[Browser tests](../../tests/browser/anchor/anchor-config.spec.ts)
