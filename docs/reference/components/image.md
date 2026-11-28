# Image

Image displays an image and supports a preview. Use ImagePreviewGroup for
group previews.

```svelte
<script lang="ts">
  import { Image } from '@woodger/antd';
  let open = $state(false);
</script>
<Image src="/photo.jpg" alt="Photo" width={240}
  preview={{ open, onOpenChange: next => { open = next; } }} />
```

Image supports src, alt, width, height, and native image attributes. Numeric
sizes use pixels, and CSS strings remain intact. Class and style apply to
img. RootClassName and styles.root apply to the wrapper. Bind:nativeElement and
bind:imageElement expose native refs. Preview defaults to true. False gives a
passive image. The interactive wrapper uses a native non-submit button.
Enter and Space open preview, and onKeyDown is available. Pointer opening occurs
before onClick as in upstream. Image is independent of Form and ConfigProvider
control disabled.

PrefixCls sets the local Image base prefix. An empty string inherits the shared
ConfigProvider.prefixCls. Thumbnail, placeholder and cover, and preview classes
use that prefix. The viewer adds -preview by default. A prefix change preserves
DOM, refs, an open viewer, scale, and focus. Canonical theme variable names stay
in place.

Image.previewPrefixCls sets the complete viewer name independently. Undefined
uses the derived name. An empty string is retained as in rc-image. The thumbnail
classes stay the same, and the group viewer ignores this setting. Svelte loads
styles for both namespaces and preserves dialog, transform, and focus. The
upstream wrapper loses CSS with an independent name. The reference keeps raw
measurements and separately styled counterparts. [Reference data](../../../tests/browser/fixtures/ant-design-image-independent-preview-reference.json)

Fallback replaces the image on original src failure. The root keeps
ant-image-error even if fallback loads. A new src clears the error. The
source probe follows useStatus and ignores results from old src values and
events from detached img elements. OnError and onLoad receive the native event.
Placeholder=true uses the upstream img background. A snippet renders until load
and can render on its own without preview when src is missing. After mount,
a cached complete img is handled so the placeholder can clear.

`placeholder={{ progress: true }}` replaces the thumbnail and preview with an
indeterminate loading surface. The owner enables the thumbnail request by
setting `progress` to `false` or removing the progress configuration.
An ordinary placeholder snippet can cover the resumed request until the image loads.
`progress.percent` rounds finite values and clamps them to 0–100. A finite
value gives the surface a progressbar role and a percentage label. An omitted
or non-finite value sets `aria-busy` and announces `Loading` in a polite status.

`progress.render` takes a snippet with the default rail and the rounded
percentage. The rail snippet renders when a finite percentage is available.
For indeterminate progress, the render snippet receives `0`. The `root`,
`content`, `rail`, and `indicator` slots accept
`classNames.placeholder.progress` and CSS strings in `styles.placeholder.progress`.
The progress root takes `width`, `height`, `styles.root`, and `style`, followed
by `styles.placeholder.progress.root`. [React measurements](../../../tests/browser/fixtures/ant-design-image-progress-reference.json)

Preview configuration includes src, open, onOpenChange, afterOpenChange, cover,
closeIcon, mask, focusTrap, movable, wheel, scaleStep, minScale, maxScale, and
onTransform. Preview.src can differ from the thumbnail. Open remains controlled
when onOpenChange is omitted. Without open, the component owns state.
Programmatic open changes leave onOpenChange untouched. Cover accepts a boolean,
snippet, or { coverNode, placement }, with top, bottom, and center placement.
As in the 6.6.8 runtime, default cover=true creates an empty hover surface.
CloseIcon accepts a boolean, null, or snippet. False and null hide the button.

The viewer is a native dialog and opens only after SSR. Its DOM stays mounted
after the first opening. FocusTrap defaults to true. False allows focus outside
the viewer. Escape closes the top preview and focus returns to the opener.
Closing or unmounting releases scroll unless an open host Modal still needs
the lock. Mask accepts a boolean or { enabled, blur, closable }. Closable
defaults to true. ClassNames.popup.root on Image and ImagePreviewGroup and
preview.zIndex apply to the viewer. AfterOpenChange follows native visibility
changes. The rc-motion fade timing is still outside the port.

The default transform is x=y=rotate=0, scale=1, and flipX=flipY=false.
MinScale defaults to 1, maxScale to 50, and scaleStep to 0.5. Toolbar zoom
uses 1+step as a multiplier. Wheel zoom accounts for deltaY and clamps the
ratio while retaining the point under the cursor. Double click toggles zoom
and scale=1. Rotation uses 90° steps, and flipping reverses the corresponding
axis. Movable=false disables drag and touch movement. Wheel is controlled
separately. Pinch can temporarily scale below the minimum and restores it on
release. Mouse rebound preserves the upstream check for changes on both axes.

OnTransform({ transform, action }) reports changes through an animation frame
queue. Close resets a changed transform. Actions include zoomIn, zoomOut,
rotateLeft, rotateRight, flipX, flipY, wheel, doubleClick, move, dragRebound,
touchZoom, and reset or close. ActionsRender(original, info) and
imageRender(original, info) are snippets. Render original with @render. Info
contains transform and image, and toolbar info also has current, total, and
actions. Call info.actions.onReset to reset. Native Pointer Events and capture
handle mouse and touch interaction and clean up on unmount.

The preview supports themes, RTL, Russian and English accessible labels, and
reduced motion. The image recipe extracts 58 rules and four progress keyframes.
Preview rc-motion remains outside the port. Icons come from Ant Design Icons SVG
4.6.0 with the existing MIT license. The fixture is `?fixture=image`.

ConfigProvider.theme.components.Image sets zIndexPopup, previewOperationSize,
previewOperationColor, previewOperationHoverColor, previewOperationColorDisabled,
and progressAnimationDuration. The shared theme applies to the thumbnail and
viewer, including ImagePreviewGroup. Aliases, algorithms, cssVar prefix and key,
and nested providers are supported. `styles.root` takes priority over thumbnail
variables. A theme change preserves the viewer, transforms, current, and focus.
`progressAnimationDuration` controls the ink and rail animations. The browser
fixture `?fixture=image-progress` checks animation, progress updates, and the
return to the interactive thumbnail.

The viewer adds 1 to the owner layer. An explicit `preview.zIndex` sets the layer,
including 0. A root viewer uses `styles.popup.root` for its custom layer and
defaults to `zIndexPopup`. The browser orders native dialogs in the top layer.
With `preview.zIndex=0`, React
6.6.8 uses the Image CSS token, and Svelte applies 0. [Owner layer](../theme-context.md#layering-nested-panels)

## Semantics and provider defaults

`classNames` and `styles` accept a slot record or a resolver `({ props }) => slots`.
The slots `root`, `image`, and `cover` address the thumbnail wrapper, its native
`img`, and the preview cover. Both Image and ImagePreviewGroup expose `popup.root`,
`popup.mask`, `popup.body`, `popup.footer`, `popup.actions`, and `popup.close`.
The actions slot applies to the original toolbar when a snippet renders it.

`ConfigProvider.image` supplies `class`, `style`, `fallback`, `classNames`,
`styles`, and `preview.mask` and `preview.closeIcon` defaults. An omitted `image`
inherits the parent record. An explicit record replaces it, including an empty
object. The fallback applies to Image and its standalone viewer. A group viewer
uses the group's own `fallback`.

Classes accumulate from the provider and the component. Thumbnail CSS declarations
apply in provider-to-local order. Within the `image` slot, each layer's `style`
comes after its semantic CSS. While progress is active, `style` applies to its root.
A local `styles.popup` replaces each supplied slot, and a local
`styles.placeholder.progress` replaces that progress style record. The preview layer
applies its resolved `z-index` after `styles.popup.root`.

Preview mask fields inherit individually. An undefined close icon inherits from
the provider. In the Svelte API, `closeIcon: null` hides the close button.
The pinned React example with a provider icon renders that icon for a local
`null`. React also flattens nested progress classes in the test case. Svelte
applies the progress classes from both layers.

An Image semantic resolver receives the effective `preview`, with `mask` as a
boolean and `preview` set to `null` when disabled. A group resolver receives its
items and other group props except `preview` and `previewPrefixCls`. The provider's
resolver can receive either shape. Use the top-level semantic fields for settings
that affect the viewer. In the pinned React capture, the semantic fields under
`ConfigProvider.image.preview` have no effect. [React measurements](../../../tests/browser/fixtures/ant-design-image-semantics-reference.json)

Remaining work covers `getContainer`, preview icons and React `info.icons`
wrappers, and upstream fade, appear, leave, and mouse-position motion.
