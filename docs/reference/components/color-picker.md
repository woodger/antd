# ColorPicker

ColorPicker selects a color or gradient. [Props and snippets](../../../src/lib/color-picker/color-picker.types.ts) · [Color methods](../../../src/lib/color/color.ts)

```svelte
<script lang="ts">
  import { ColorPicker, type ColorPickerProps } from '@woodger/antd';
  let color = $state<ColorPickerProps['value']>('#1677ff');
</script>

<ColorPicker value={color} onChange={next => { color = next; }}
  mode={['single', 'gradient']} showText allowClear />
```

Value accepts a string, a Color object from a callback, null, or an array of
`{ color, percent }`. Color retains HSV and alpha precision, which reparsing
a string can lose. An empty initial value starts cleared. A cleared value is
distinct from a transparent color. Clearing keeps hue and saturation, and a
repeated clear leaves callbacks untouched. `onChange(color, css)` returns RGB
or linear-gradient CSS independently of format. The owner controls supplied
value, open, and format. Use onChangeComplete to update only after a drag.
The local preview before completion leaves the trigger text unchanged.
DefaultValue and defaultFormat are read at creation.

ColorPicker supports HEX sanitization, RGB and HSB inputs, Hue and Alpha,
and a two-dimensional palette. The native handler provides arrow keys for
saturation and brightness. Gradient mode supports interpolated points,
crossing, the active color, drag deletion, and the upstream Delete key behavior,
including deletion of the last points. Gradient → single → gradient restores
the cached gradient until the single color changes. DisabledAlpha preserves
the upstream condition that the current alpha is accounted for at the next
change.

Presets accept colors or gradients, keys, a label or snippet, and initial
defaultOpen. ShowText can be a snippet receiving Color. Children replaces the
trigger. PanelRender receives the original panel snippet and
`extra.components.Picker/Presets` for custom composition. ConfigProvider.colorPicker
sets class, style, semantic slots, and arrow. Local style takes precedence.
English and Russian, the locale.ColorPicker alias, inherited size, Compact,
themes, and RTL are supported. Inner color tracks are always LTR.

Trigger, clear, and presets are native buttons. The popup uses a native popover
with 12 placements, click and hover, arrow and pointAtCenter, and
getPopupContainer. The default portal goes in body or stays in the dialog
inside a native modal. Theme CSS variables use the mechanism shared with Tour.
Local getPopupContainer takes precedence over ConfigProvider.getPopupContainer.
Undefined uses the provider. The getter runs at the first opening or later.
Escape restores focus, and an outside interaction closes the popup.
DestroyOnHidden controls whether drafts are kept. Portal, listeners, and timers
are cleaned up. The panel isolates FormItem and Compact. As upstream does,
ColorPicker reports the value through callbacks without adding a hidden
FormData field.

Placement uses `visibleFirst` to account for the document's scrollable area.
As in React 6.6.8, a tall panel can extend past the viewport. Scroll the page to
reach the bottom palette group. The open panel extends the scrollable area even
on short pages and stays open when the trigger scrolls outside the viewport.
Tab scrolls to preset buttons so the focused color stays visible. The React
measurements cover short 1280×360 and 1280×720 viewports and a long-page control
case. [React measurements](../../../tests/browser/fixtures/ant-design-color-picker-short-page-source-reference.json)

`ConfigProvider.theme.components.ColorPicker` supports alias overrides, component
algorithms, dark and compact modes, cssVar prefix, and nested themes. ColorPicker
6.6.8 has no public component tokens of its own. The trigger and popup share the
theme. Popover, preset Collapse, and fields keep independent themes and upstream
CSS precedence. The preset bright state uses global colorBgElevated.

The palette inherits the owner layer and passes the computed context to trigger
and content. A local `z-index` in `styles.popup.root` sets the palette layer.
[Owner layer](../theme-context.md#layering-nested-panels)

Theme updates preserve popup DOM and position, color, unfinished HEX input,
caret, focus, and preset expansion. Local and semantic styles retain precedence.
Popup.root.color changes the outer popup, and the content keeps the upstream
colorText reset. The `?fixture=color-picker-theme` fixture covers checks and 15
UMD themes. [ColorPicker theme](../../../tests/browser/color-picker/color-picker-theme.spec.ts)

Local `prefixCls` changes the ColorPicker owner and overrides the shared
ConfigProvider prefix. Popover, Select, Input, InputNumber, Slider, Divider,
Segmented, and Collapse keep their own shared namespaces. CSS variables and
theme markers remain canonical. Prefix changes preserve an open popup, color,
unfinished HEX input, caret, focus, preset expansion, and custom trigger and
container. Restoring the default styles preserves those states too.
The fixture is `?fixture=color-picker-prefix`. [UMD comparison](../../../tests/browser/color-picker/color-picker-prefix.spec.ts)

With a shared local owner and theme and a changed shared prefix, the upstream
style hook cache keeps child control selectors from the first provider.
The native implementation resolves them independently. Raw nested measurements
stay separate from the public counterpart with a unique local prefixCls.
Each records its own DOM classes.

Full rc-trigger overflow and motion and React development and PurePanel APIs
remain outside the port. The Svelte API uses native DOM and snippets for nodes
and refs. The extracted CSS recipe reproduces 94 rules. FastColor and
rc-color-picker logic retain their MIT licenses. Formatting and parsing
follow rc-input-number 1.6.2. [CSS](../../../src/lib/vendor/color-picker.css) · [FastColor](../../../src/lib/vendor/LICENSE.fast-color) ·
[rc-color-picker](../../../src/lib/vendor/LICENSE.rc-color-picker) · [rc-input-number 1.6.2](../../../src/lib/vendor/LICENSE.rc-input-number)

The main fixture is `?fixture=color-picker`. [Engine](../../../src/lib/color-picker/color-picker.engine.test.ts) ·
[Package SSR](../../../tests/package/color-picker/color-picker.ssr.test.ts) · [Browser](../../../tests/browser/color-picker/color-picker.spec.ts)
