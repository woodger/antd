# ImagePreviewGroup (Image.PreviewGroup)

ImagePreviewGroup gives its child Image components a shared viewer. Children
render without an extra DOM wrapper.

```svelte
<script lang="ts">
  import { Image, ImagePreviewGroup } from '@woodger/antd';
</script>
<ImagePreviewGroup>
  <Image src="/first.jpg" alt="First image" width={160} />
  <Image src="/second.jpg" alt="Second image" width={160} />
</ImagePreviewGroup>
```

The group's previewPrefixCls sets the base Image prefix, as in Ant Design. The
viewer adds -preview. An empty string inherits ConfigProvider. Child Image
prefixes are independent of the group. Changing a shared or local prefix preserves
the viewer, current image, and transform.

Without items, the list comes from registered child Image components with
preview=true. It follows creation and registration order and keeps that order
through keyed DOM reordering. Updating src keeps the entry in place. Repeated
src values are distinguished by id. Image.preview=false excludes the thumbnail.
A child Image registers its preview.src in place of the thumbnail src. Its own
preview configuration and onOpenChange leave the group viewer alone.

Items accepts URL strings or objects with src, alt, and shared native image
attributes. An explicit array, including an empty one, takes precedence over
registrations. Opening a thumbnail finds the first matching preview src, with
index 0 as the fallback. Items do not render thumbnails automatically. The group
fallback applies to the viewer. Individual Image.fallback is excluded from
registration data.

Preview configuration supports open and onOpenChange, current and onChange,
countRender, and shared viewer, transform, and render snippet settings. Current
is zero-based and defaults to 0. Prev, next, and the physical Left and Right keys
change the index within the list. RTL adapts switch icons and logical placement
and keeps the keyboard index order. OnChange(next, previous) reports navigation.
Opening a thumbnail directly sets the internal index without calling onChange.
The owner controls a controlled current. Navigation captures previous before
callbacks, even if onTransform updates owner props.

OnOpenChange(open, { current }) runs on user visibility changes. As in rc-image
1.10.0, opening from a thumbnail reports a snapshot of the previous current to
the callback while the viewer uses the clicked image's index. An external open
change leaves the callback untouched. After closing, programmatic reopening
starts uncontrolled current at 0. Reopening from a thumbnail uses the selected
thumbnail index. External controlled current changes preserve the transform.
User navigation resets it without a scale transition.

The default `preview.motionName` uses the group base prefix and `-preview-fade`.
Thumbnail activation sets the transform origin to the center of the event
target. A close request from the viewer clears that origin, and the leave phase
uses the default or `styles.popup.body` origin. A controlled close from the
owner keeps the last thumbnail origin. `afterOpenChange` follows the settled
phase. [Preview motion](image.md#preview-motion)

CountRender(current, total) receives one-based current. Render info for
imageRender and actionsRender contains zero-based current, total, and actions.
Info.actions.onActive(offset) takes a relative offset as in rc-image runtime.
The `info.icons` snippets render the operation buttons. With at least two
images, `prevIcon` and `nextIcon` navigate the group and follow the RTL artwork.
Refs, DOM, and focus management belong to the shared viewer. Closing returns
focus to the thumbnail that opened the group. [Preview action buttons](image.md#preview-action-buttons)

Removing images or items updates the list and leaves the owner responsible for a
valid current index. The viewer can be closed even with an empty list. In another
preserved rc-image 1.10.0 case, preview=false on the group clears its configuration
and skips the provider's container. A child Image can still open the fullscreen
viewer. Set Image.preview=false to disable a particular thumbnail.

In this child-opened mode, a top-level `ImagePreviewGroup.icons` record replaces
the default artwork. Its `prev` and `next` entries follow the navigation action
in either direction. Omit the prop to retain the defaults. An explicit
`undefined` or an empty record leaves the controls without glyphs. The buttons
retain their accessible names and actions. [React measurements](../../../tests/browser/fixtures/ant-design-image-action-icons-reference.json)

`preview.getContainer` uses the same types and local-before-provider resolution as
the single viewer. Changing the destination while open recreates the panel and
preserves the current index and transform. [Image preview containers](image.md)

The fixture is `?fixture=image-preview-group`. SSR renders children and leaves
DOM registration and the viewer inactive. Group viewers share Image's
`classNames.popup` and `styles.popup` slots and the provider's mask and close icon
defaults. [Image appearance and provider defaults](image.md#semantics-and-provider-defaults)
