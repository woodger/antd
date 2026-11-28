<script lang="ts">
  // Manages the native viewer, zoom, and navigation between images. Coordinates the frame elements
  // with gestures and the popup lifecycle.
  import { onDestroy, tick, untrack } from 'svelte';
  import type {
    ImageElementData,
    ImageInfo,
    ImagePopupSlots,
    ImagePreviewConfig,
    ImagePreviewRenderInfo,
    ImageTransform,
    ImageTransformAction
  } from './image.types';
  import type { ResolvedImagePreviewAppearance } from './image-semantic.engine';
  import { initialImageTransform, zoomImage, type ImagePoint } from './image-preview.engine';
  import {
    connectImagePreview,
    registerImagePreview,
    isTopImagePreview
  } from './image-preview.dom';
  import { checkImageSource } from './image-status.dom';
  import { useConfig } from '../config-provider/config-context';
  import { createDialogContainer } from '../dialog/dialog-container.model.svelte.js';
  import { getDialogActiveElement } from '../dialog/dialog-focus.dom';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { getPopupActiveElement } from '../popup/popup.dom';
  import { useZIndex } from '../popup/z-index-context.svelte';
  import NoCompactStyle from '../space/NoCompactStyle.svelte';
  import ImagePreviewIcon from './ImagePreviewIcon.svelte';

  let {
    open,
    imagePrefix = 'ant-image',
    previewPrefix: customizePreviewPrefix,
    image,
    config: preview = {},
    inheritContainer = true,
    appearance,
    fallback,
    imageAttributes = {},
    onClose,
    current = 0,
    count = 1,
    group = false,
    onChange,
    countRender,
    classNames,
    styles
  }: {
    open: boolean;
    imagePrefix?: string;
    previewPrefix?: string;
    image: ImageInfo;
    config?: ImagePreviewConfig;
    inheritContainer?: boolean;
    appearance: ResolvedImagePreviewAppearance;
    classNames?: ImagePopupSlots;
    styles?: ImagePopupSlots;
    fallback?: string;
    imageAttributes?: ImageElementData;
    onClose: () => void;
    current?: number;
    count?: number;
    group?: boolean;
    onChange?: (next: number, previous: number) => void;
    countRender?: import('svelte').Snippet<[number, number]>;
  } = $props();
  const context = useConfig();
  let previewPrefix = $derived(customizePreviewPrefix ?? `${imagePrefix}-preview`);
  const componentTheme = useComponentTheme('Image');
  const layer = useZIndex('preview', () => preview.zIndex);
  const dialogStyle = $derived([componentTheme.style, styles?.root, layer.style]
    .filter(Boolean).join(';'));
  const container = createDialogContainer(() => ({
    component: 'image',
    open,
    getContainer: preview.getContainer ?? undefined,
    getPopupContainer: inheritContainer ? context.getPopupContainer : undefined,
    style: dialogStyle
  }));
  let dialog = $state<HTMLDialogElement>();
  let element = $state<HTMLImageElement>();
  let mounted = $state(false);
  let transform = $state.raw(initialImageTransform());
  let moving = $state(false);
  let failed = $state(false);
  let originalSource = $derived(image.url);
  let source = $derived(failed && fallback ? fallback : originalSource);
  let focusTrap = $derived(preview.focusTrap !== false);
  let min = $derived(preview.minScale ?? 1);
  let max = $derived(preview.maxScale ?? 50);
  let switchFrame = 0;
  let switchId = 0;
  let switching = $state(false);
  let frame = 0;
  let queue: ImageTransform[] = [];
  let alive = true;
  let opener: HTMLElement | undefined;
  let activeDialog: HTMLDialogElement | undefined;
  let presentedDialog: HTMLDialogElement | undefined;
  let releaseLayer: (() => void) | undefined;
  $effect(() => {
    if (open)
      mounted = true;
  });
  $effect(() => {
    const source = originalSource;
    if (!dialog) {
      return;
    }
    failed = false;
    return checkImageSource(source, dialog.ownerDocument, () => {
      failed = true;
    });
  });
  $effect(() => {
    const next = open;
    const root = dialog;
    const connected = container.connected;
    const trap = focusTrap;
    untrack(() => syncPresentation(next, connected ? root : undefined, trap));
  });
  $effect(() => {
    if (!open || !element) {
      return;
    }
    const target = element;
    return connectImagePreview(target, {
      config: () => preview,
      transform: () => transform,
      update,
      zoom,
      moving: next => {
        moving = next;
      }
    });
  });
  $effect(() => {
    if (!open || !dialog) {
      return;
    }
    const view = dialog.ownerDocument.defaultView!;
    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || !dialog?.open || !isTopImagePreview(dialog)) {
        return;
      }
      const active = getPopupActiveElement(dialog);
      if (focusTrap && active && !dialog.contains(active)) {
        return;
      }
      if (group && count > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        activate(event.key === 'ArrowLeft' ? -1 : 1);
      }
      else if (event.key === 'Escape' && !focusTrap) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
    view.addEventListener('keydown', keydown);
    return () => view.removeEventListener('keydown', keydown);
  });
  onDestroy(() => {
    alive = false;
    cancelFrame();
    stopSwitch();
    releasePresentation();
    restoreOpener();
  });

  function showDialog(root: HTMLDialogElement, trap: boolean) {
    if (trap) {
      root.showModal();
    }
    else {
      root.show();
    }
    root.focus({ preventScroll: true });
  }

  /** Releases the native layer while leaving the logical preview session intact. */
  function releasePresentation() {
    if (activeDialog?.open) activeDialog.close();
    activeDialog = undefined;
    releaseLayer?.();
    releaseLayer = undefined;
  }

  function restoreOpener() {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = undefined;
  }

  /** A new container presents a new dialog within the same open preview session. */
  function syncPresentation(next: boolean, root: HTMLDialogElement | undefined, trap: boolean) {
    if (!next) {
      if (!presentedDialog) {
        return;
      }

      releasePresentation();
      cancelFrame();
      stopSwitch();
      reset('close');
      moving = false;
      restoreOpener();
      presentedDialog = undefined;
      preview.afterOpenChange?.(false);
      return;
    }

    if (activeDialog && (activeDialog !== root || !activeDialog.isConnected)) {
      releasePresentation();
    }

    if (!root?.isConnected) {
      return;
    }

    if (!root.open) {
      if (!presentedDialog) {
        const focused = getDialogActiveElement(root.ownerDocument);
        opener = focused instanceof HTMLElement ? focused : undefined;
      }
      showDialog(root, trap);
      activeDialog = root;
      releaseLayer?.();
      releaseLayer = registerImagePreview(root);

      if (presentedDialog !== root) {
        presentedDialog = root;
        preview.afterOpenChange?.(true);
      }
    }
    else if (root.matches(':modal') !== trap) {
      root.close();
      showDialog(root, trap);
    }
  }

  function cancelFrame() {
    if (frame)
      cancelAnimationFrame(frame);
    frame = 0;
    queue = [];
  }
  function update(patch: Partial<ImageTransform>, action: ImageTransformAction) {
    queue.push({ ...transform, ...patch });
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!alive || !open) {
          queue = [];
          return;
        }
        transform = Object.assign({}, transform, ...queue);
        queue = [];
        preview.onTransform?.({ transform: { ...transform }, action });
      });
    }
  }
  function reset(action: ImageTransformAction) {
    const initial = initialImageTransform();
    if (Object.keys(initial).some(
      key => initial[key as keyof ImageTransform] !== transform[key as keyof ImageTransform]
    )) {
      transform = initial;
      preview.onTransform?.({ transform: { ...initial }, action });
    }
  }
  function zoom(ratio: number, action: ImageTransformAction, center?: ImagePoint, touch = false) {
    if (!element) {
      return;
    }
    const viewport = {
      width: element.ownerDocument.documentElement.clientWidth,
      height: element.ownerDocument.defaultView!.innerHeight
    };
    update(zoomImage(transform, ratio, element, viewport, min, max, center, touch), action);
  }
  function stopSwitch() {
    switchId++;
    if (switchFrame)
      cancelAnimationFrame(switchFrame);
    switchFrame = 0;
    switching = false;
  }
  function activate(offset: number) {
    const before = current;
    const next = before + offset;
    if (next < 0 || next >= count) {
      return;
    }
    stopSwitch();
    switching = true;
    const id = switchId;
    cancelFrame();
    reset(offset < 0 ? 'prev' : 'next');
    onChange?.(next, before);
    void tick().then(() => {
      if (!alive || !open || id !== switchId) {
        return;
      }
      switchFrame = requestAnimationFrame(() => {
        if (!alive || id !== switchId) {
          return;
        }
        switchFrame = requestAnimationFrame(() => {
          switchFrame = 0;
          if (alive && id === switchId)
            switching = false;
        });
      });
    });
  }
  let info = $derived<ImagePreviewRenderInfo>({
    transform,
    current,
    total: count,
    image,
    actions: {
      onActive: activate,
      onFlipY: () => update({ flipY: !transform.flipY }, 'flipY'),
      onFlipX: () => update({ flipX: !transform.flipX }, 'flipX'),
      onRotateLeft: () => update({ rotate: transform.rotate - 90 }, 'rotateLeft'),
      onRotateRight: () => update({ rotate: transform.rotate + 90 }, 'rotateRight'),
      onZoomOut: () => zoom(1 / (1 + (preview.scaleStep ?? 0.5)), 'zoomOut'),
      onZoomIn: () => zoom(1 + (preview.scaleStep ?? 0.5), 'zoomIn'),
      onClose,
      onReset: () => {
        cancelFrame();
        reset('reset');
      }
    }
  });
</script>

<style>
  :global(html:has(dialog.image-preview-dialog[open])) { overflow: hidden; }
  .image-preview-dialog {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: hidden;
    color: var(--ant-color-text-light-solid);
  }
  .image-preview-dialog:not([open]) { display: none; }
  .image-preview-dialog::backdrop { background: transparent; }
  [data-ant-image-preview-img] { touch-action: none; }
  [data-ant-image-preview-img].moving { transition-duration: 0s; }
  [data-ant-image-preview-action]:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) { .image-preview-dialog [data-ant-image-preview-img] { transition: none; } }
</style>

{#snippet defaultImage()}
  {#key source}<img {...imageAttributes} data-ant-image-preview-img bind:this={element} src={source || undefined} alt={image.alt} draggable="false" class={[`${previewPrefix}-img`, moving && 'moving']}
    style={`transform:translate3d(${transform
        .x}px,${transform
          .y}px,0) scale3d(${transform
            .flipX
            ? '-'
            : ''}${transform.scale},${transform.flipY
              ? '-'
              : ''}${transform.scale},1) rotate(${transform.rotate}deg);`
      + `${switching
                ? 'transition-duration:0s;'
                : ''}`}
    onerror={event => {
        if (event.currentTarget === element)
          failed = true;
      }} />{/key}
{/snippet}
{#snippet defaultActions()}
  <div class={[`${previewPrefix}-actions`, classNames?.actions]} style={styles?.actions}>
    {#each [
        'flipY',
        'flipX',
        'rotateLeft',
        'rotateRight',
        'zoomOut',
        'zoomIn'
      ] as action}
      <button data-ant-image-preview-action type="button" aria-label={action} class={[
          `${previewPrefix}-actions-action`,
          `${previewPrefix}-actions-action-${action}`,
          (action === 'zoomOut'
            && transform.scale <= min
            || action === 'zoomIn'
            && transform.scale === max)
          && `${previewPrefix}-actions-action-disabled`
        ]}
        disabled={action === 'zoomOut'
            && transform.scale <= min
            || action === 'zoomIn'
            && transform.scale === max}
        onclick={() => {
            if (action === 'flipY')
              info.actions.onFlipY();
            else if (action === 'flipX')
              info.actions.onFlipX();
              else if (action === 'rotateLeft')
              info.actions.onRotateLeft();
              else if (action === 'rotateRight')
              info.actions.onRotateRight();
              else if (action === 'zoomOut')
              info.actions.onZoomOut();
              else info.actions.onZoomIn();
          }}>
        <ImagePreviewIcon name={action as
            'flipY'
            | 'flipX'
            | 'rotateLeft'
            | 'rotateRight'
            | 'zoomOut'
            | 'zoomIn'} />
      </button>
    {/each}
  </div>
{/snippet}
{#if mounted}{#key container.key}
  <NoCompactStyle>
    <dialog data-ant-image-prefix={imagePrefix} data-ant-image-preview-prefix={previewPrefix} bind:this={dialog} tabindex="-1" class={[
        `image-preview-dialog ${previewPrefix} ant-image-css-var`,
        componentTheme.className,
        classNames?.root,
        preview.movable !== false && `${previewPrefix}-movable`,
        moving && `${previewPrefix}-moving`
      ]}
      dir={context.direction} aria-label={image.alt || context.locale.image?.preview || 'Image preview'} aria-modal={focusTrap ? 'true' : undefined}
      style={dialogStyle} {@attach container.attach} oncancel={event => {
              event.preventDefault();
              onClose();
            }}>
      <div class={[
          `${previewPrefix}-mask`,
          !appearance.mask.enabled && `${previewPrefix}-mask-hidden`,
          appearance.mask.blur && `${previewPrefix}-mask-blur`,
          classNames?.mask
        ]}
        style={styles?.mask} role="presentation" onclick={() => {
            if (appearance.mask.closable)
              onClose();
          }}></div>
      <div class={[`${previewPrefix}-body`, classNames?.body]} style={styles?.body}>
        {#if preview.imageRender}{@render preview.imageRender(
            defaultImage,
            { transform, image, ...(group ? { current } : {}) }
          )}{:else}{@render defaultImage()}{/if}
      </div>
      {#if appearance.closeIcon !== false && appearance.closeIcon !== null}
        <button type="button" class={[`${previewPrefix}-close`, classNames?.close]}
          style={styles?.close} aria-label={context.locale.closeText} onclick={onClose}>
          {#if typeof appearance.closeIcon === 'function'}
            {@render appearance.closeIcon()}
          {:else}
            <ImagePreviewIcon name="close" />
          {/if}
        </button>
      {/if}
      {#if group && count > 1}
        <button type="button" class={[
            `${previewPrefix}-switch ${previewPrefix}-switch-prev`,
            current === 0 && `${previewPrefix}-switch-disabled`
          ]} aria-label="prev" disabled={current === 0} onclick={() => activate(-1)}><ImagePreviewIcon name={context.direction === 'rtl' ? 'next' : 'prev'} /></button>
        <button type="button" class={[
            `${previewPrefix}-switch ${previewPrefix}-switch-next`,
            current === count - 1 && `${previewPrefix}-switch-disabled`
          ]} aria-label="next" disabled={current === count - 1} onclick={() => activate(1)}><ImagePreviewIcon name={context.direction === 'rtl' ? 'prev' : 'next'} /></button>
      {/if}
      <div class={[`${previewPrefix}-footer`, classNames?.footer]} style={styles?.footer}>
        {#if group && count >= 1}<div class={`${previewPrefix}-progress`}>{#if countRender}{@render countRender(current + 1, count)}{:else}<bdi>{current + 1} / {count}</bdi>{/if}</div>{/if}
        {#if preview.actionsRender}{@render preview.actionsRender(defaultActions, info)}{:else}{@render defaultActions()}{/if}
      </div>
    </dialog>
  </NoCompactStyle>
{/key}{/if}
