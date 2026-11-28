<script module lang="ts">
  // Shares the standard artwork between Image semantic resolvers and the preview controls.
  import ImagePreviewIcon from './ImagePreviewIcon.svelte';

  export const defaultImagePreviewIcons = {
    rotateLeft, rotateRight, zoomIn, zoomOut, close, prev, next, flipX, flipY
  } as const;
</script>

{#snippet rotateLeft()}<ImagePreviewIcon name="rotateLeft" />{/snippet}
{#snippet rotateRight()}<ImagePreviewIcon name="rotateRight" />{/snippet}
{#snippet zoomIn()}<ImagePreviewIcon name="zoomIn" />{/snippet}
{#snippet zoomOut()}<ImagePreviewIcon name="zoomOut" />{/snippet}
{#snippet close()}<ImagePreviewIcon name="close" />{/snippet}
{#snippet prev()}<ImagePreviewIcon name="prev" />{/snippet}
{#snippet next()}<ImagePreviewIcon name="next" />{/snippet}
{#snippet flipX()}<ImagePreviewIcon name="flipX" />{/snippet}
{#snippet flipY()}<ImagePreviewIcon name="flipY" />{/snippet}
