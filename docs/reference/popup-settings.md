# Popups

## Container

`ConfigProvider.getPopupContainer` sets a function that selects a DOM container
for a popup. The function receives the element that opens the panel, or
`undefined`, and returns an `HTMLElement` or `ShadowRoot`. It runs in the browser.
If you choose a `ShadowRoot`, load the styles inside it.

A nested provider inherits its parent's function. Each component uses its default
container in the absence of a setting. For `Select`, for example, a local function
takes priority over the provider's function. In `Tabs`, an explicit
`getPopupContainer={undefined}` disables the provider setting. In `Tour` and
`Mentions`, set the container on the component itself.

Tooltips, dropdown menus, color and date pickers, `Modal`, and `Drawer` also use
the shared container. If a new function returns the same DOM element, an open panel
keeps its state and focus.

## List placement

`ConfigProvider.popupOverflow` defines the area that `Select`, `TreeSelect`,
`Cascader`, and `AutoComplete` use to place their dropdown lists. The default is
the window viewport (`'viewport'`). The `'scroll'` setting uses the document's
scrollable area and also accounts for the visible viewport when shifting a list
vertically. A setting change takes effect the next time the list opens, the page
scrolls, or the window resizes.

## List width

`ConfigProvider.popupMatchSelectWidth` sets the dropdown width for `Select`,
`AutoComplete`, and `TreeSelect`. The default `true` matches the field width.
With `false`, width depends on the contents. A number sets a width in pixels.
Both cases use the field width as the minimum.

A nested provider inherits this setting. Set it locally to override the width of a
specific list. `Cascader` sets its width locally. Calendar's built-in lists inherit
the provider width and open inside the header. Pagination defaults its page-size
selector to `false`. Pass `popupMatchSelectWidth` in the `showSizeChanger` object to
choose a different width. The color format selector in `ColorPicker` has its own width.

See how width changes interact with virtualization. [Select appearance and state](components/select.md#styling-and-state)
