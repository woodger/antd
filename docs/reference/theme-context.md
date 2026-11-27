# Theme tokens in ConfigProvider

A token is a named theme value, such as an accent color, border radius, or spacing.
`ConfigProvider` passes those values to all components inside it.

[Theme configuration](#usage) · [Component index](#component-index) · [CSS and SSR](#css-and-ssr)

## Usage

### Change the shared theme

Pass the shared color through `theme.token.colorPrimary`. The Save button gets
a green background. Other components under this provider also use green where
they need the primary color.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider theme={{ token: { colorPrimary: '#0f766e' } }}>
  <Button type="primary">Save</Button>
</ConfigProvider>
```

Use `mode` and `compact` for dark and compact themes. The `algorithm` setting lets
you choose algorithms and their order, for example
`[theme.darkAlgorithm, theme.compactAlgorithm]`. `token.colorPrimary` takes
precedence over `primary`. [Themes and localization](themes.md)

### Configure one component

Use the capitalized component name in `theme.components`. In this example,
`Button.paddingInline` increases the horizontal padding of the regular-sized
button to 24 pixels. The adjacent field keeps its own padding.

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input } from '@woodger/antd';
</script>

<ConfigProvider theme={{ components: { Button: { paddingInline: 24 } } }}>
  <Input aria-label="Project name" />
  <Button>Save</Button>
</ConfigProvider>
```

You can also override a global token for one component family. For example,
`Input: { colorPrimary: '#0f766e', algorithm: true }` recalculates derived
input colors using the current theme algorithm. Without `algorithm: true`,
the component receives only the supplied overrides. Pass a function or an
array of functions to define a custom calculation. [Component token types](../../src/lib/theme/theme-component-token.types.ts)

### Override the theme within a page

A nested provider merges tokens by name. Both buttons in the example have a
10-pixel radius. The outer button is green, and the inner button is purple.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider theme={{ token: { colorPrimary: '#0f766e', borderRadius: 10 } }}>
  <Button type="primary">Save</Button>

  <ConfigProvider theme={{ token: { colorPrimary: '#722ed1' } }}>
    <Button type="primary">Publish</Button>
  </ConfigProvider>
</ConfigProvider>
```

The same rule applies inside each component entry in `theme.components`.
For example, if the parent sets `Button.paddingInline` and the child sets only
`Button.fontWeight`, the inner button gets both. An explicit `undefined` overrides
the parent's value for that field.

`theme={{ inherit: false }}` starts the calculation from the default theme.
It resets inherited tokens, algorithms, component settings, `mode`,
`primary`, and `compact`. The provider still inherits `hashed`,
`cssVar.prefix`, and `zeroRuntime`. For a local theme, it creates its own
`cssVar.key` unless you pass a nonempty key.

### Read tokens in a component

Call `theme.useToken()` during child component initialization. In this example,
selecting a color changes the theme, and the child immediately displays the
new primary color.

**App.svelte**

```svelte
<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';
  import ThemePreview from './ThemePreview.svelte';

  let primary = $state('#0f766e');
</script>

<label>
  Accent color
  <input type="color" bind:value={primary} />
</label>

<ConfigProvider theme={{ token: { colorPrimary: primary } }}>
  <ThemePreview />
</ConfigProvider>
```

**ThemePreview.svelte**

```svelte
<script lang="ts">
  import { theme } from '@woodger/antd';

  const current = theme.useToken();
</script>

<p style:color={current.token.colorPrimary}>
  Primary color: {current.token.colorPrimary}
</p>
```

Read `current.token` in markup or in `$derived`. Destructuring it as
`const { token } = current` during initialization captures the first theme.

| Result field | Contents |
| --- | --- |
| `token` | Computed values from the nearest provider, including component overrides. |
| `cssVar` | Tokens as used in CSS. For example, `current.cssVar.colorPrimary` contains a `var(…)` reference. Numeric responsive grid breakpoints retain their values. |
| `hashId` | Theme CSS class. `hashed: false` returns an empty string. |
| `theme` | Algorithm object with `id` and `getDerivativeToken()`. |

Outside the component tree, use the static calculation for a configuration.
ConfigProvider uses the standard algorithm for `algorithm: []`. The static
calculation throws a `TypeError` for an empty array. [`theme.getDesignToken()`](design-tokens.md)

## Component index

| Task | Components |
| --- | --- |
| Actions and input | [Button](#button), [Input, TextArea, InputPassword, InputSearch, InputOTP](#input-and-textarea), [InputNumber](#inputnumber), [Checkbox, Radio, Switch, and their groups](#checkbox-radio-and-switch), [Slider](#slider-tokens) |
| Selection and search | [Select](#select-tokens), [AutoComplete](#autocomplete), [TreeSelect](#treeselect), [Cascader and CascaderPanel](#cascader-and-cascaderpanel), [Mentions](#mentions-theme), [ColorPicker](#colorpicker-theme) |
| Dates and files | [DatePicker, RangePicker, TimePicker, TimeRangePicker](#date-and-time), [Upload](#upload-theme) |
| Layout | [Flex](#flex-settings), [Space, SpaceCompact, and SpaceAddon](#space-theme-and-settings), [Row and Col](#grid-theme), [Layout and LayoutSider](#layout-tokens), [Divider](#divider-tokens), [Masonry](#masonry-theme), [Affix](#affix-theme) |
| Navigation | [Anchor](#anchor-tokens), [Breadcrumb](#breadcrumb-tokens), [Menu](#menu-tokens), [Tabs](#tabs-tokens), [Pagination](#pagination-tokens), [Steps and Timeline](#steps-and-timeline-tokens) |
| Data display | [Avatar, AvatarGroup, and Badge](#avatar-and-badge), [Card](#card-tokens), [Collapse](#collapse-tokens), [Image and ImagePreviewGroup](#image-tokens), [Table](#table-theme), [Watermark](#watermark-theme), [BorderBeam](#borderbeam-theme) |
| Feedback | [Alert](#alert-tokens), [Empty](#empty-state), [Result](#result-tokens), [Spin](#spin-tokens), [Progress](#progress-tokens-and-settings), [Skeleton](#skeleton-tokens), [Message](#message-theme), [Notification](#notification-theme) |
| Overlays | [Dropdown, Tooltip, Popover, and Popconfirm](#popup-tokens), [Modal](#modal-theme), [Drawer](#drawer-theme), [Tour](#tour-theme) |

### Button

`components.Button` controls button styling. Set horizontal padding with
`paddingInline`, `paddingInlineSM`, and `paddingInlineLG` for the corresponding
sizes. `defaultBg`, `defaultColor`, and `defaultBorderColor` apply to the default
button appearance. The primary button background comes from `colorPrimary`.
[Button reference](components/button.md)

### Input and TextArea

`Input`, `TextArea`, password and search fields, and one-time code cells use
`components.Input`. Set padding with `paddingBlock` and `paddingInline`, and
focus styles with `activeBorderColor` and `activeShadow`. The search button
receives `Button` settings.

### InputNumber

`components.InputNumber.controlWidth` sets the field width. With
`handleVisible: true`, the resting width of the arrow control area depends on
`controlHeightSM`. `handleWidth` sets the width on hover or focus. It leaves the
resting width unchanged.

### Checkbox, Radio, and Switch

`Checkbox` and `CheckboxGroup` take colors and sizes from the shared tokens.
Override them in `components.Checkbox`. Use `radioSize` and `dotSize` in
`components.Radio` for the circle and dot sizes, or set button-variant colors for
`RadioButton`. `components.Switch` controls track, thumb, and padding sizes for
regular and small switches.

### Date and time

`DatePicker`, `RangePicker`, `TimePicker`, and `TimeRangePicker` share
`components.DatePicker` for the field and popup panel. The panel's confirm button
receives small-button tokens from `components.Button`. [Popup placement and container](popup-settings.md)

### Select tokens

Use `components.Select` to set option height and padding, selection and focus
colors, tag sizes, and `zIndexPopup`. The theme applies to the field and the open
list. In the compact theme, a small single Select is 22 pixels high and a small
multiple Select is 21 pixels high. Multiple-selection tags in the `outlined`
variant have a transparent border, including when `multipleItemBorderColor` is set.

### AutoComplete

`AutoComplete` takes field, clear-button, and list styles from `components.Select`.
Pass a custom `Input` to give its inner field tokens from `components.Input`.
A nested `textarea` retains its height from `rows` and its own styles.

### TreeSelect

`TreeSelect` applies `components.Select` first and then `components.TreeSelect`.
Nodes in the list use `titleHeight`, `switcherSize`, and `indentSize` from
`TreeSelect`. `components.Tree` applies to a standalone tree.

### Cascader and CascaderPanel

The `Cascader` field applies `components.Select` and then `components.Cascader`
for column width and height, padding, and selected-row styling. The standalone
`CascaderPanel` receives only `Cascader` settings. The panel styles its own checkboxes.

### Mentions theme

`components.Mentions` controls field padding, list height (`dropdownHeight`),
minimum option width (`controlItemWidth`), and `zIndexPopup`. The theme updates
the field and open list and preserves typed text and caret position.

### ColorPicker theme

`components.ColorPicker` accepts global tokens and an algorithm for the trigger
and panel. The panel also uses `Popover` styles. Nested `InputNumber`, `Select`,
and `Slider` keep their own settings. The global `colorBgElevated` determines
the contrast of light swatches.

### Upload theme

In the regular file list, `components.Upload.actionsColor` sets the action
color and defaults to `colorIcon`. In card mode, actions on top of the image
remain white. `pictureCardSize` sets card size. Nested `Button`, `Progress`,
and `Tooltip` use their own tokens.

### Flex settings

`Flex` uses `paddingXS`, `padding`, and `paddingLG` for named gaps. Set overrides
in `components.Flex` to change gaps only in Flex containers. Set a pixel
`gap` directly on the component. `ConfigProvider.flex` supplies shared
`vertical`, `class`, and `style` settings.

### Space theme and settings

`Space` reads named gaps from the same padding tokens through `components.Space`.
Set the default group gap in `ConfigProvider.space.size`. `SpaceCompact` places
fields against one another and uses its own layout rules. `SpaceAddon` uses
the separate `components.Addon` entry.

### Grid theme

Set the font for `Row` and `Col` in `components.Grid`. Set grid breakpoints in the
global `theme.token`. Responsive `gutter`, `align`, and `justify` on `Row` use
`screenSM`, `screenMD`, and the other breakpoints. `Col` uses `screenSMMin`,
`screenMDMin`, and the remaining minimums. A theme change updates the row spacing
and column widths. [Responsive grid](components/grid.md)

### Layout tokens

`components.Layout` sets values such as `headerBg`, `headerHeight`, `bodyBg`,
and `triggerBg`. Inside `Layout`, its header, content, and footer inherit its CSS
variables, including those set through `style`. Outside `Layout`, sections have
their own variables. `LayoutSider` computes variables on its root.

### Divider tokens

`verticalMarginInline` sets the horizontal margin of a vertical divider.
`orientationMargin` sets the label offset as a fraction of the line length.
Use `styles.content` for spacing on the label itself.

### Masonry theme

`components.Masonry` can override shared typography and transition tokens. If a
font change alters card heights, set `fresh` to observe their size and update
the layout. The global `theme.token.motion: false` disables card entry and exit
animations.

### Affix theme

`components.Affix.zIndexPopup` sets stacking for the fixed element. It defaults
to `zIndexBase + 10`. Affix applies the tokens to the inner element while it is
fixed. Set the offset on the component with `offsetTop` or `offsetBottom`.

### Anchor tokens

`linkPaddingBlock` and `linkPaddingInlineStart` set link padding. The first item
in a horizontal menu keeps a zero inline start offset. Nested links compute
their block padding separately from `paddingXXS`. Use global tokens in
`components.Anchor` to change link colors and styles.

### Breadcrumb tokens

`components.Breadcrumb` sets regular and last item colors (`itemColor`,
`lastItemColor`), link colors (`linkColor`, `linkHoverColor`), and separator
color and spacing (`separatorColor`, `separatorMargin`). In an item with a menu,
the link text gets `linkColor` and the arrow inherits the item color. Style the
menu through `Dropdown` and `Menu`.

### Menu tokens

`components.Menu` sets item and group sizes, padding, the active line, and
light and dark palettes. A nested list inherits its menu's variables. A popup
submenu has its own variables, including `borderRadiusLG` and `paddingXS` for
spacing between the menu and its header.

### Tabs tokens

Use `cardHeight`, `cardHeightSM`, `cardHeightLG`, and the corresponding padding
tokens for card tabs. Use `horizontalItemGutter` to set spacing between regular
tabs. `inkBarColor` sets the active line color. The hidden tabs list uses the
current `Tabs` variables, including when rendered in an external container.
[Tabs reference](components/tabs.md)

### Pagination tokens

`components.Pagination` styles page buttons and the quick jump field. Override
input tokens in `Pagination` for the quick jump field. The page size selector
uses `Select` tokens. The global `theme.token.wireframe` enables bordered
pagination styling.

### Steps and Timeline tokens

`components.Steps` sets icon and dot sizes, including for the small size.
`components.Timeline` has its own `tailColor`, `tailWidth`, `dotBg`, `dotSize`, and
`itemPaddingBottom`. Dot color and size fall back to `Steps` when unspecified.
Set the title font size with `Timeline.fontSize` and the icon font size with
`Steps.iconFontSize`.

### Avatar and Badge

`components.Avatar` sets avatar, text, and icon sizes. The group uses the same
entry. `groupOverlapping` sets avatar overlap, and `groupBorderColor` sets the
border color. The “+N” button uses these settings too.

`components.Badge` sets count, dot, and status indicator dimensions, font, and
padding. The indicator shadow color comes from `colorBorderBg`.

### Card tokens

`components.Card` sets header height and background, content padding, and
action styles. Use `bodyPaddingSM` and `headerPaddingSM` for a small card. Both
default to 12 pixels. `CardGrid` and `CardMeta` inherit the card theme.
`CardGrid` cell padding comes from `paddingLG`.

### Collapse tokens

`headerBg` and `contentBg` set backgrounds for the header and expanded panel.
`headerPadding` and `contentPadding` have size-specific values for small and
large panels. Set `borderlessContentBg` and `borderlessContentPadding` for a
borderless panel. [Collapse reference](components/collapse.md)

### Image tokens

`components.Image` sets preview button sizes and colors and `zIndexPopup`.
The image and the `ImagePreviewGroup` preview dialog use these settings.
`styles.root` applies to the thumbnail. `preview.zIndex` takes precedence for
the preview dialog's layer. [Image reference](components/image.md)

### Table theme

Use `components.Table` to set cell padding and backgrounds, sort, hover, and
selection colors, and styles for expanded rows and filter menus. For example,
`cellPaddingBlockMD` sets vertical padding for medium cells, and `footerBg` and
`footerColor` style the footer. Theme updates preserve the priority of CSS
variables in `styles.root`. Nested `Button` and `Checkbox` use their own tokens.
[Table reference](components/table.md)

### Watermark theme

`Watermark` reads the global `colorFill`, `fontSizeLG`, and `zIndexPopupBase`
when drawing a watermark on Canvas. Set `font` and `zIndex` on the component to
override them for one watermark. Global token changes update the image.
Canvas text color is calculated independently of `components.Watermark` and CSS
variables.

### BorderBeam theme

`components.BorderBeam` accepts shared tokens for line width, gradient colors,
and font. Explicit border settings take priority. When rendered to an external
`target`, the decorative layer keeps the theme of the provider that created
`BorderBeam`.

### Alert tokens

| `components.Alert` token | Effect |
| --- | --- |
| `borderRadius` | Alert radius, defaulting to `borderRadiusLG`. |
| `defaultPadding` | Padding for a short alert. |
| `withDescriptionPadding` | Padding for an alert with a description. |
| `withDescriptionIconSize` | Icon size for an alert with a description. |

Override status colors through shared tokens in the same entry. Style
individual slots with `styles`. [Alert reference](components/alert.md)

### Empty state

`components.Empty` can override shared text and size tokens. The standard
image height is `controlHeightLG × 2.5`, the simple image uses `controlHeightLG`,
and the small image uses `controlHeightLG × 0.875`. Colors in the built-in
SVGs come from global tokens. Set `image` for a custom illustration.

### Result tokens

`components.Result.titleFontSize` sets the title font size, `subtitleFontSize`
sets the subtitle font size, `iconFontSize` sets the icon size, and
`extraMargin` sets spacing for the actions. The built-in illustrations for
403, 404, and 500 have their own colors. [Result reference](components/result.md)

### Spin tokens

`components.Spin.dotSize`, `dotSizeSM`, and `dotSizeLG` set the indicator size
for regular, small, and large `size`. Set `ConfigProvider.spin.indicator` for a
custom indicator. Content height is independent of the `contentHeight` token
alone. [Spin reference](components/spin.md)

### Progress tokens and settings

`defaultColor` defaults to `colorInfo`, `remainingColor` to `colorFillSecondary`,
and `circleTextColor` to `colorText`. Use `lineBorderRadius` for line progress
and `circleTextFontSize` and `circleIconFontSize` for the circle label and icon.
Use `ConfigProvider.progress.styles` to style individual indicator slots.

### Skeleton tokens

The main placeholder and individual parts use `components.Skeleton`.
`gradientFromColor` and `gradientToColor` set gradient colors, `titleHeight` and
`paragraphLiHeight` set line heights, and `paragraphMarginTop` sets the gap
above the paragraph. `blockRadius` sets the block radius.

### Message theme

`components.Message.contentBg` sets the message background and `contentPadding`
sets its padding. The background defaults to `colorBgElevated`. `zIndexPopup`
defaults to `zIndexPopupBase + 1010`. A theme change updates visible messages and
preserves the queue and close deadlines.

### Notification theme

`components.Notification.width` sets the card width and defaults to 384 pixels.
Use `colorSuccessBg`, `colorErrorBg`, `colorInfoBg`, and `colorWarningBg` for
status backgrounds. Each falls back to `colorBgElevated`. A theme change
preserves open notifications and their actions.

### Slider tokens

`components.Slider.railSize` sets rail thickness. `handleSize` and
`handleSizeHover` set thumb size at rest and on hover. `railBg`, `trackBg`, and
`handleColor` set the rail, filled track, and thumb colors. The popup value uses
the `Tooltip` theme. [Slider reference](components/slider.md)

### Popup tokens

| Popup | Where to style it |
| --- | --- |
| `Dropdown` | `components.Dropdown` sets padding, the arrow, and `zIndexPopup`. The menu takes its font from `components.Menu`. Dropdown styles set row height. |
| `Tooltip` | `components.Tooltip` sets `maxWidth`, the arrow, and `zIndexPopup`. |
| `Popover` | `components.Popover` applies on top of the Tooltip theme, including `titleMinWidth` and content padding. |
| `Popconfirm` | Settings apply in the order Tooltip, Popover, Popconfirm. Use `components.Popconfirm.zIndexPopup` for the confirmation layer. |

The gap between the element and the tooltip uses the global `marginXXS` and
`sizePopupArrow`. When the arrow is enabled, half its size is added.
[Choosing a popup container](popup-settings.md#container)

### Modal theme

`components.Modal` sets header and content backgrounds, title color and size,
and footer styling. The theme follows the dialog when it moves to another
container. Dialog buttons and fields use `components.Button` and
`components.Input`. A theme change preserves the open dialog, focus, and
entered data.

### Drawer theme

`components.Drawer.footerPaddingBlock` and `footerPaddingInline` set the footer
padding. `zIndexPopup` sets the panel layer. The panel keeps its CSS variables
when moved through `getContainer`. Nested buttons and fields keep their own tokens.

### Tour theme

`components.Tour` sets the close button size, navigation and indicator colors,
and arrow styles. A root Tour without an explicit layer uses 1001. A nested
Tour gets its layer from context and can override it with `zIndex`. Footer
buttons use the `Button` theme.

## Layering nested panels

Modal, Drawer, Tooltip, Popover, Popconfirm, Tour, and ColorPicker pass a numeric
layer to descendants, including when their DOM moves to a portal. A root surface
without an explicit layer uses the component's CSS token. A root Tour uses 1001.
In both cases, descendants receive the base `zIndexPopupBase + 100`.

These nested surfaces and FloatButton, FloatButtonGroup, and FloatButtonBackTop
add 100 to the parent layer. An explicit zero on the parent uses
`zIndexPopupBase + 100`. Dropdown and Menu popup submenus add 50, including when
the base is zero. Dropdown passes a nonzero layer to descendants. An explicit
integer `z-index` comes from the panel's resulting styles, including the inline
CSS cascade.

Select, AutoComplete, TreeSelect, Cascader, Mentions, DatePicker, RangePicker,
TimePicker, and TimeRangePicker panels also add 50 to the owner layer. An explicit
`z-index` in the available `styles.popup.root` slot takes priority, including 0.
In Select and AutoComplete style objects, `zIndex: undefined` retains the context
layer. `zIndex: null` restores the theme CSS token. A root panel without an explicit
layer uses the theme CSS token. Custom panel content continues to read the
owner's context. For example, a Tooltip in a Select within a Modal adds 100 to
the Modal layer. [Field reference](../../tests/browser/fixtures/ant-design-input-z-index-context-reference.json) · [Chromium](../../tests/browser/input/input-z-index-context.spec.ts) · [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

The Table filter panel follows Dropdown rules. The built-in panel uses the
Dropdown CSS token at the root and adds 50 to an inherited layer. A single
image or group preview adds 1 to the owner layer. Descendants of FloatButton,
FloatButtonGroup, and the image preview read the owner's context. Explicit
FloatButton CSS takes priority. A numeric `preview.zIndex` sets the preview layer,
including 0. [Additional surface reference](../../tests/browser/fixtures/ant-design-auxiliary-z-index-context-reference.json) · [Chromium](../../tests/browser/popup/auxiliary-z-index-context.spec.ts) · [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

A numeric `zIndex` on a dialog sets both its layer and the base for descendants.
Contextual Modal confirmations start at `zIndexPopupBase + 1000` and also accept
`zIndex` in `handle.update`. The browser orders native `dialog` and `popover`
elements in the top layer when they open.

In the Ant Design 6.6.8 measurement, Drawer with `zIndex={0}` gets a CSS layer of
1000 and passes a base of zero to descendants. Svelte applies 0 to the Drawer
surface as well. [Reference](../../tests/browser/fixtures/ant-design-z-index-context-reference.json) · [Chromium](../../tests/browser/popup/z-index-context.spec.ts) · [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

## CSS and SSR

`ConfigProvider.prefixCls` sets the CSS class prefix, including for `Flex`,
`Progress`, `Spin`, and `Divider`. For example, the `suite` prefix gives a Flex
container the class `suite-flex`. A component's local `prefixCls` sets its own
class. [Shared ConfigProvider prefix](config-provider.md)

`theme.cssVar.prefix` sets the CSS variable name prefix. For example,
`cssVar: { prefix: 'brand' }` produces `--brand-color-primary`. When the variable
prefix is omitted, the provider inherits it or uses the shared class prefix.
A provider's own `style` can override the CSS variable. The configuration value
remains available in `theme.useToken().token`.

The provider emits theme variables during server rendering. If you build HTML
manually with `render` from `svelte/server`, include `result.head` in the page
`<head>` and `result.body` in its body. The browser gets the theme styles before
hydration.

## Reference and checks

Compare inheritance and `theme.useToken()` results with the Ant Design source
and library tests.

- Ant Design source. [useTheme](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/config-provider/hooks/useTheme.ts) · [ConfigProvider](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/config-provider/index.tsx) · [useToken](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/theme/useToken.ts)
- Theme calculation. [Token reference](../../tests/reference/ant-design-theme-context-reference.json) · [Reference comparison](../../src/lib/theme/theme-context-reference.test.ts) · [Inheritance](../../src/lib/theme/theme-config.engine.test.ts)
- Reading the theme in components. [SSR](../../tests/package/theme/theme-context.ssr.test.ts) · [Browser](../../tests/browser/theme/theme-context.spec.ts)

### Field and selection control checks

| Component | Checks and upstream measurements |
| --- | --- |
| Buttons and input fields | [Calculation](../../src/lib/theme/theme-control-tokens-reference.test.ts), [SSR](../../tests/package/theme/control-theme.ssr.test.ts), [Browser](../../tests/browser/theme/control-theme.spec.ts) |
| Checkbox, Radio, and Switch | [Calculation](../../src/lib/theme/theme-toggle-tokens-reference.test.ts), [SSR](../../tests/package/theme/toggle-theme.ssr.test.ts), [Browser](../../tests/browser/theme/toggle-theme.spec.ts) |
| Date and time pickers | [Confirm button](../../tests/browser/picker/picker-button.spec.ts) |
| Compact theme | [Browser](../../tests/browser/space/compact-theme.spec.ts), [SSR](../../tests/package/space/compact-theme.ssr.test.ts), [Sizes](../../tests/browser/fixtures/ant-design-compact-metrics.json) |
| Select | [Calculation](../../src/lib/theme/theme-select-tokens-reference.test.ts), [Browser](../../tests/browser/select/select-theme.spec.ts), [SSR](../../tests/package/select/select-theme.ssr.test.ts) |
| AutoComplete | [Sizes](../../tests/browser/fixtures/ant-design-auto-complete-metrics.json), [Browser](../../tests/browser/auto-complete/auto-complete-theme.spec.ts), [SSR](../../tests/package/auto-complete/auto-complete-theme.ssr.test.ts) |
| TreeSelect | [Calculation](../../src/lib/theme/theme-tree-select-tokens-reference.test.ts), [Sizes](../../tests/browser/fixtures/ant-design-tree-select-metrics.json), [Browser](../../tests/browser/tree-select/tree-select-theme.spec.ts), [SSR](../../tests/package/tree-select/tree-select-theme.ssr.test.ts) |
| Slider | [Calculation](../../src/lib/theme/theme-slider-tokens-reference.test.ts), [Sizes and colors](../../tests/browser/fixtures/ant-design-slider-theme-reference.json), [SSR](../../tests/package/slider/slider-theme.ssr.test.ts), [Browser](../../tests/browser/slider/slider-theme.spec.ts) |
| Mentions | [Browser](../../tests/browser/mentions/mentions-theme.spec.ts), [Calculation](../../src/lib/theme/theme-mentions-tokens-reference.test.ts), [SSR](../../tests/package/mentions/mentions-theme.ssr.test.ts) |
| Upload | [Calculation](../../src/lib/theme/theme-upload-tokens-reference.test.ts), [SSR](../../tests/package/upload/upload-theme.ssr.test.ts), [Browser](../../tests/browser/upload/upload-theme.spec.ts) |

### Layout and navigation checks

| Component | Checks and upstream measurements |
| --- | --- |
| Flex | [Settings and styles](../../tests/browser/flex/flex-source.spec.ts) |
| Flex and Divider | [SSR prefix](../../tests/package/config-provider/core-prefix.ssr.test.ts), [Browser prefix](../../tests/browser/config-provider/core-prefix.spec.ts) |
| Divider | [Browser](../../tests/browser/divider/divider-theme.spec.ts), [SSR](../../tests/package/divider/divider-theme.ssr.test.ts), [Styles and prefix](../../tests/browser/divider/divider-config.spec.ts) |
| Affix | [Calculation](../../src/lib/theme/theme-affix-tokens-reference.test.ts), [Geometry](../../tests/browser/fixtures/ant-design-affix-theme-reference.json), [SSR](../../tests/package/affix/affix-theme.ssr.test.ts), [Browser](../../tests/browser/affix/affix-theme.spec.ts) |
| Space | [Theme and settings](../../tests/browser/fixtures/ant-design-space-theme-reference.json), [SSR](../../tests/package/space/space-theme.ssr.test.ts), [Browser](../../tests/browser/space/space-theme.spec.ts) |
| Layout | [Section sizes](../../tests/browser/fixtures/ant-design-layout-theme-reference.json) |
| Masonry | [Styles and sizes](../../tests/browser/fixtures/ant-design-masonry-theme-reference.json) |
| Row and Col | [Calculation](../../src/lib/theme/theme-grid-tokens-reference.test.ts), [SSR](../../tests/package/grid/grid-theme.ssr.test.ts), [Browser](../../tests/browser/grid/grid-theme.spec.ts), [Component breakpoints](../../tests/browser/fixtures/ant-design-grid-media-observation.json) |
| Responsive grid breakpoints | [Reference](../../tests/browser/fixtures/ant-design-grid-breakpoints-reference.json), [Browser](../../tests/browser/grid/grid-breakpoints.spec.ts), [Page without JavaScript](../../tests/browser/grid/grid-breakpoints-ssr.spec.ts), [SSR](../../tests/package/grid/grid-breakpoints.ssr.test.ts), [Breakpoint calculation](../../src/lib/grid/grid-style.engine.test.ts), [Theme updates](../../tests/browser/fixtures/ant-design-grid-breakpoints-update-observation.json) |
| Steps and Timeline | [Calculation](../../src/lib/theme/theme-steps-tokens-reference.test.ts), [Sizes](../../tests/browser/fixtures/ant-design-steps-metrics.json), [Browser](../../tests/browser/steps/steps-theme.spec.ts), [SSR](../../tests/package/steps/steps-theme.ssr.test.ts) |
| Pagination | [Calculation](../../src/lib/theme/theme-pagination-tokens-reference.test.ts), [Sizes](../../tests/browser/fixtures/ant-design-pagination-metrics.json), [SSR](../../tests/package/pagination/pagination-theme.ssr.test.ts), [Browser](../../tests/browser/pagination/pagination-theme.spec.ts) |
| Tabs | [Calculation](../../src/lib/theme/theme-tabs-tokens-reference.test.ts), [Sizes](../../tests/browser/fixtures/ant-design-tabs-theme-metrics.json), [SSR](../../tests/package/tabs/tabs-theme.ssr.test.ts), [Browser](../../tests/browser/tabs/tabs-theme.spec.ts) |
| Tab styles and transitions | [Styles](../../tests/browser/fixtures/ant-design-tabs-semantic-reference.json), [SSR styles](../../tests/package/tabs/tabs-semantic.ssr.test.ts), [Browser styles](../../tests/browser/tabs/tabs-semantic.spec.ts), [Transitions](../../tests/browser/fixtures/ant-design-tabs-motion-reference.json), [SSR transitions](../../tests/package/tabs/tabs-motion.ssr.test.ts), [Browser transitions](../../tests/browser/tabs/tabs-motion.spec.ts) |

### Data display and feedback checks

| Component | Checks and upstream measurements |
| --- | --- |
| Avatar and Badge | [Calculation](../../src/lib/theme/theme-display-tokens-reference.test.ts), [Browser](../../tests/browser/theme/avatar-badge-theme.spec.ts), [SSR](../../tests/package/theme/avatar-badge-theme.ssr.test.ts) |
| Image | [Thumbnail and preview](../../tests/browser/fixtures/ant-design-image-theme-reference.json) |
| Watermark | [Rendering](../../tests/browser/fixtures/ant-design-watermark-theme-reference.json), [Browser](../../tests/browser/watermark/watermark-theme.spec.ts), [SSR](../../tests/package/watermark/watermark-theme.ssr.test.ts) |
| BorderBeam | [Calculation](../../src/lib/theme/theme-border-beam-tokens-reference.test.ts), [External container](../../tests/browser/fixtures/ant-design-border-beam-theme-reference.json), [Browser](../../tests/browser/border-beam/border-beam-theme.spec.ts), [SSR](../../tests/package/border-beam/border-beam-theme.ssr.test.ts) |
| Table | [Calculation](../../src/lib/theme/theme-table-tokens-reference.test.ts), [SSR](../../tests/package/table/table-theme.ssr.test.ts), [Browser](../../tests/browser/table/table-theme.spec.ts) |
| Table styles and states | [Root styles](../../tests/browser/fixtures/ant-design-table-root-style-observation.json), [Panels](../../tests/browser/fixtures/ant-design-table-panels-reference.json), [Panels in the browser](../../tests/browser/table/table-panels.spec.ts), [Row highlighting](../../tests/browser/fixtures/ant-design-table-hover-observation.json), [Row settings](../../tests/browser/table/table-row-options.spec.ts) |
| Alert | [Styles](../../tests/browser/fixtures/ant-design-alert-reference.json), [Default styling](../../tests/browser/fixtures/alert-native-reference.json), [SSR](../../tests/package/alert/alert.ssr.test.ts), [Browser](../../tests/browser/alert/alert-source.spec.ts) |
| Result | [Styles and statuses](../../tests/browser/fixtures/ant-design-result-reference.json), [Browser](../../tests/browser/result/result-source.spec.ts), [SSR](../../tests/package/result/result.ssr.test.ts) |
| Empty | [Theme and images](../../tests/browser/fixtures/ant-design-empty-reference.json) |
| Spin | [Sizes and styling](../../tests/browser/fixtures/ant-design-spin-source-reference.json), [Browser](../../tests/browser/spin/spin-source.spec.ts) |
| Progress | [Line](../../tests/browser/fixtures/ant-design-progress-line-reference.json), [Circle](../../tests/browser/fixtures/ant-design-progress-circle-reference.json) |
| Skeleton | [Individual elements](../../tests/browser/fixtures/ant-design-skeleton-element-reference.json), [Main placeholder](../../tests/browser/fixtures/ant-design-skeleton-main-reference.json) |

### Dialog and notification checks

| Component | Checks and upstream measurements |
| --- | --- |
| Drawer | [Calculation](../../src/lib/theme/theme-drawer-tokens-reference.test.ts), [SSR](../../tests/package/drawer/drawer-theme.ssr.test.ts), [Browser](../../tests/browser/drawer/drawer-theme.spec.ts) |
| Modal | [Calculation](../../src/lib/theme/theme-modal-tokens-reference.test.ts), [SSR](../../tests/package/modal/modal-theme.ssr.test.ts), [Browser](../../tests/browser/modal/modal-theme.spec.ts) |
| Message | [Calculation](../../src/lib/theme/theme-message-tokens-reference.test.ts), [SSR](../../tests/package/message/message-theme.ssr.test.ts), [Browser](../../tests/browser/message/message-theme.spec.ts), [Text wrapping](../../tests/browser/fixtures/ant-design-message-wrap-observation.json) |
| Notification | [Calculation](../../src/lib/theme/theme-notification-tokens-reference.test.ts), [SSR](../../tests/package/notification/notification-theme.ssr.test.ts), [Browser](../../tests/browser/notification/notification-theme.spec.ts), [Status colors](../../tests/browser/fixtures/ant-design-notification-background-observation.json), [Card width](../../tests/browser/fixtures/ant-design-notification-width-observation.json) |
| Popups | [Calculation](../../src/lib/theme/theme-overlay-tokens-reference.test.ts), [Browser](../../tests/browser/popup/overlay-theme.spec.ts), [SSR](../../tests/package/popup/overlay-theme.ssr.test.ts) |
| Tour | [zIndex precedence](../../tests/browser/fixtures/ant-design-tour-z-index-observation.json) |

Upstream licenses for [Ant Design](../../src/lib/vendor/LICENSE.ant-design), [cssinjs](../../src/lib/vendor/LICENSE.cssinjs), [cssinjs-utils](../../src/lib/vendor/LICENSE.cssinjs-utils), [emotion/hash](../../src/lib/vendor/LICENSE.emotion-hash).
