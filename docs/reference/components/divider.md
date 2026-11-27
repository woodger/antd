# Divider

```svelte
<Divider titlePlacement="start" variant="dashed">Раздел проекта</Divider>
<Divider orientation="vertical" />
```

Divider preserves the Ant Design 6.6.8 structure. The root is a div with
role=separator, two rails, and inner-text for a horizontal label. Children accepts
a string, number, or snippet. Zero renders as text. Null, false, and an empty
string give an unlabeled line. A passed snippet counts as a label even if it
renders empty content. Vertical Divider leaves the label unmounted. Aria-orientation
reports direction. Divider adds no tabindex and leaves focus alone.

Orientation=horizontal or vertical takes priority over the vertical boolean.
TitlePlacement positions the label. Start and end follow RTL, left and right
use physical sides, and the default is center. Use styles.content for label spacing.

Variant=solid, dashed, or dotted, the dashed alias, and plain follow the reference
classes. Size=small, medium, or large inherits an explicitly set componentSize
from ConfigProvider, including nested providers. Without an explicit size,
Divider keeps a 24px gap without a label and 16px with a label. Semantic callbacks
get undefined for size in that case. Without a label, large uses 24px, medium 16px,
and small 8px. With a label, large uses 16px as upstream does. Sizes apply
horizontally. Themes, compact mode, RTL, and componentDisabled leave Divider visible.

Class, style, and native attributes and events pass to the root. Bind:nativeElement
exposes the HTMLDivElement after mount. RootClassName adds a root class. ClassNames
and styles accept objects with root, rail, and content slots or a `({ props })`
callback with normalized orientation, titlePlacement, and size. Styles are CSS
strings like other Svelte component styles. Root style takes precedence over
styles.root. Without a label, styles.rail also applies to the root.

SSR and Chromium checks for `?fixture=divider` cover aliases, zero, snippets,
variants, sizes, semantic slots, placement geometry, themes, RTL, and narrow
viewports. `ConfigProvider.theme.components.Divider` supports textPaddingInline,
orientationMargin, verticalMarginInline, local alias tokens, and an algorithm.
OrientationMargin is a fraction of the rail width. The theme applies during SSR,
updates without replacing DOM, and precedes semantic and user styles. Zero values,
CSS units, explicit undefined, and a custom cssVar.prefix are preserved.
The theme fixture is `?fixture=divider-theme`. [SSR](../../../tests/package/divider/divider-theme.ssr.test.ts) ·
[Browser](../../../tests/browser/divider/divider-theme.spec.ts) · [UMD reference](../../../tests/browser/fixtures/ant-design-divider-theme-reference.json)

Local prefixCls changes BEM classes for the root, variants, and children. An empty
prefix inherits ConfigProvider.prefixCls, which defaults to ant-divider for Divider.
CSS variable names and the shared marker stay in place. The 27-rule stylesheet
is emitted during SSR and removed on unmount. Defaults are scoped to the owner,
including a prefix that matches the shared marker.

ConfigProvider.divider sets class and style and supports object or function
classNames and styles. Undefined inherits the parent record. An explicit object,
including {}, replaces it in full. Root style order is provider styles.root,
provider style, local styles.root, then local style. In an unlabeled Divider, merged
styles.rail comes before local style. Callbacks receive the same normalized props
and may return undefined. Prefix and configuration updates preserve nativeElement,
DOM, focus, and neighboring field state. An inline vertical Divider adds no spaces.
The shared ConfigProvider prefix is supported. React development warnings are
still outside the port. The fixture is `?fixture=divider-config`.
[SSR](../../../tests/package/divider/divider-config.ssr.test.ts) · [Browser](../../../tests/browser/divider/divider-config.spec.ts) · [UMD reference](../../../tests/browser/fixtures/ant-design-divider-config-reference.json)

Vendor/divider.css contains 27 rules from the pinned archive. The divider recipe
excludes the ColorPicker integration and can be regenerated with
`npm run cli -- css`. The divider-prefix recipe generates a CSS data module for
the local prefix from the same rules.
