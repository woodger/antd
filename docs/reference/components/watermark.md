# Watermark

Watermark overlays repeating text or an image on its content.

```svelte
<script lang="ts">
  import { Watermark } from '@woodger/antd';
</script>
<Watermark content={['Ant Design', { text: 'Svelte 5', font: { fontSize: 12 } }]}>
  <p>Page content</p>
</Watermark>
```

Content accepts a string, WatermarkText { text, font }, or a mixed readonly
array. Omitted content has zero lines. An empty string remains a line of its
own. Font sets color, including CanvasGradient or CanvasPattern, as well
as fontSize, fontWeight, fontStyle, fontFamily, and textAlign. Per-line font
overrides only defined values. FontSize uses Number as in upstream. Numeric
strings work, and CSS units such as '18px' do not. FontGap is 3 between lines.

Three canvases reproduce upstream text and image drawing, rotation, and
alternating clips. Text size comes from measureText and fontBoundingBoxAscent
and Descent. Width and height override measurement. Image takes priority and
uses crossOrigin=anonymous and referrerPolicy=no-referrer. A load failure draws
content, keeping the image defaults of 120×64. DPR is read when drawing, with
no separate subscription. An empty drawing skips copies of zero-sized canvases.
The DOM layer uses a PNG data URL, background-repeat=repeat, and
floor(logical width). The canvases themselves stay out of the DOM.

Rotate defaults to -22, gap to [100,100], and offset to gap/2. Positive offset
relative to the gap center shifts and narrows the layer. Negative offset changes
background-position. Coordinates stay physical in RTL. ZIndex defaults to
zIndexPopupBase-1, or 999 in the standard theme. The absolute layer covers
100%, leaves pointer events to the contents, uses visibility:visible!important,
and stays out of the accessibility tree. Children and focus are preserved.

The wrapper uses position:relative and overflow:hidden. ConfigProvider.watermark
takes class and style. Class and rootClassName are added, and owner style
follows default and context. An explicit nested record replaces the parent.
Bind:nativeElement exposes the div. As in upstream WatermarkProps, pass
arbitrary HTML attributes and events to children.

With an upstream theme, font defaults read global colorFill and fontSizeLG, and
zIndex reads zIndexPopupBase - 1. Alias, seed, and algorithm changes redraw the
PNG while preserving layer, container, ref, and contents. Explicit font and
zIndex and per-line overrides take precedence. Canvas color is independent of
CSS variables and components.Watermark as in upstream. Without an upstream
theme, the previous CSS defaults and reactive light, dark, and compact modes
apply. Shared disabled leaves the drawing visible.

MutationObserver follows upstream subtree, childList, style, and class tracking.
Changing style or class on the layer restores styles and removes class and hidden.
A change to hidden alone waits for the next observed mutation. A removed or
moved layer returns as the same DOM node with its cached PNG and calls onRemove.
Style-only changes leave onRemove alone. On the root, the observer restores
expected position and overflow, including explicit overrides. Other missing
inline styles remain as supplied. Normal unmount and panel removal leave
onRemove untouched.

The cache and scheduling reproduce Ant Design 6.6.8. The cache keeps the most
recent parameters and excludes HTMLElement and top-level NaN from its keys.
Changing only the image URL reuses the old PNG when geometry and parameters
match. Rotate, size, or gap changes update the drawing. In-flight image requests
keep upstream completion order. An older response with a different geometry
can briefly replace the newer drawing, and the observer can then schedule a
current render. Native paint objects without enumerable fields also use
upstream deep key comparison. The leading RAF throttle performs the first call
immediately and skips later calls until the frame, without a trailing call.
Changes during a frame can wait for the next independent update. These upstream
behaviors remain visible in the port.

Inherit=true supplies context to child Modal and Drawer. They register
.ant-modal-container and .ant-drawer-section, respectively. Each gets the same
drawing, including in the native dialog top layer. Registration follows the
existing Modal and Drawer lifecycles. Inherit=false omits its own provider.
An inner Watermark can still read an outer Watermark context. Changing inherit
remounts the children branch, as with the upstream conditional provider.
The panel attachment unregisters on destruction without restoring its registration.

SSR renders the wrapper and children without Canvas, Image, observers, or
callbacks. Unmount stops observation, animation frames, and pending image
callbacks and removes owned layers. Without a 2D context, children stay
visible. Without MutationObserver, the drawing appears and DOM mutations
are not repaired. Upstream has no separate Watermark CSS, component tokens,
or prefixCls API, so a CSS recipe is unnecessary. The `?fixture=watermark-theme`
checks compare global tokens, algorithms, zero and undefined, cssVar prefix
and key, precedence, and scopes with the official UMD, including Canvas calls
and repeatable PNG output. Theme changes update inherited Modal and Drawer
layers while preserving focus. [Ant Design MIT license](../../../src/lib/vendor/LICENSE.ant-design)

The main fixture is `?fixture=watermark`. Unit and SSR checks cover geometry,
font, drawing calls, and the server boundary. Browser checks cover real PNG
pixels, DOM restoration, images and cache, DPI, and panels.
