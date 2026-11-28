<script lang="ts">
  // Manages the native viewer, zoom, and navigation between images. Coordinates the frame elements
  // with gestures and the popup lifecycle.
  import { onDestroy, tick, untrack } from 'svelte';
  import type {
    ImageElementData,
    ImageInfo,
    ImagePopupSlots,
    ImagePreviewIcons,
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
  import {
    connectImagePreviewMotion, type ImagePreviewMotionFrame, type ImagePreviewMotionSettings
  } from './image-preview-motion.dom';
  import { checkImageSource } from './image-status.dom';
  import { useConfig } from '../config-provider/config-context';
  import { createDialogContainer } from '../dialog/dialog-container.model.svelte.js';
  import { getDialogActiveElement } from '../dialog/dialog-focus.dom';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { getPopupActiveElement } from '../popup/popup.dom';
  import { useZIndex } from '../popup/z-index-context.svelte';
  import NoCompactStyle from '../space/NoCompactStyle.svelte';
  import { defaultImagePreviewIcons } from './ImagePreviewIcons.svelte';

  type PreviewOperation = Exclude<keyof ImagePreviewIcons, 'close'>;

  let {
    open,
    imagePrefix = 'ant-image',
    previewPrefix: customizePreviewPrefix,
    image,
    config: preview = {},
    motionName,
    inheritContainer = true,
    icons: customIcons,
    origin,
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
    motionName?: string;
    inheritContainer?: boolean;
    icons?: ImagePreviewIcons;
    origin?: ImagePoint;
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
  const artwork = $derived<ImagePreviewIcons>(customIcons ?? (context.direction === 'rtl'
    ? { ...defaultImagePreviewIcons, prev: defaultImagePreviewIcons.next, next: defaultImagePreviewIcons.prev }
    : defaultImagePreviewIcons));
  const showSwitch = $derived(group && count > 1);
  let previewPrefix = $derived(customizePreviewPrefix ?? `${imagePrefix}-preview`);
  const componentTheme = useComponentTheme('Image');
  const design = useDesignTokenContext();
  const motionSettings = $derived({
    name: motionName,
    enabled: design.state.token.motion,
    builtInFade: motionName === `${imagePrefix}-preview-fade`
  });
  const bodyStyle = $derived(serializeInlineStyleLayers([
    styles?.body, origin && `transform-origin:${origin.x}px ${origin.y}px`
  ]));
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
  let presented = false;
  let leaving = false;
  let releaseLayer: (() => void) | undefined;
  let motionRoot: HTMLDialogElement | undefined;
  let motion: ReturnType<typeof connectImagePreviewMotion> | undefined;
  let motionFrame = $state.raw<ImagePreviewMotionFrame>({ fadeStarting: false });
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
    const settings = motionSettings;
    untrack(() => syncPresentation(next, connected ? root : undefined, trap, settings));
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
  onDestroy(() => {
    alive = false;
    cancelFrame();
    stopSwitch();
    clearMotion();
    releasePresentation();
    restoreOpener();
  });

  /** Escape belongs to the active viewer until its native layer closes. */
  function connectLayer(root: HTMLDialogElement) {
    const release = registerImagePreview(root);
    const view = root.ownerDocument.defaultView;
    if (!view) {
      return release;
    }

    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || !root.open || !isTopImagePreview(root)) {
        return;
      }
      const active = getPopupActiveElement(root);
      if (focusTrap && active && !root.contains(active)) {
        return;
      }
      if (open && group && count > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        activate(event.key === 'ArrowLeft' ? -1 : 1);
      }
      else if (event.key === 'Escape' && !focusTrap) {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }
    }
    view.addEventListener('keydown', keydown);
    return () => {
      view.removeEventListener('keydown', keydown);
      release();
    };
  }

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

  function requestClose() {
    if (open) onClose();
  }

  /** Cancels phases tied to a root that will be removed or replaced. */
  function clearMotion() {
    motion?.destroy();
    motion = undefined;
    motionRoot = undefined;
    motionFrame = { fadeStarting: false };
  }

  /** The native layer and opener stay in place until the visible exit has completed. */
  function completeClose() {
    releasePresentation();
    restoreOpener();
    presented = false;
    leaving = false;
    preview.afterOpenChange?.(false);
  }

  function startClose(root: HTMLDialogElement | undefined, settings: ImagePreviewMotionSettings) {
    if (!presented) {
      return;
    }

    if (!leaving) {
      leaving = true;
      cancelFrame();
      stopSwitch();
      reset('close');
      moving = false;
    }

    if (root?.open && root.isConnected && root === activeDialog && motion) {
      motion.sync(false, settings);
      return;
    }

    clearMotion();
    completeClose();
  }

  /** Reports completion only for the current root and current requested visibility. */
  function settleMotion(root: HTMLDialogElement, visible: boolean) {
    if (root !== activeDialog || visible !== open || !root.isConnected) {
      return;
    }

    if (visible) preview.afterOpenChange?.(true);
    else completeClose();
  }

  /** A new container presents a new dialog within the same open preview session. */
  function syncPresentation(
    next: boolean,
    root: HTMLDialogElement | undefined,
    trap: boolean,
    settings: ImagePreviewMotionSettings
  ) {
    if (!next) {
      startClose(root, settings);
      return;
    }

    leaving = false;
    if (activeDialog && (activeDialog !== root || !activeDialog.isConnected)) {
      releasePresentation();
      clearMotion();
    }

    if (!root?.isConnected) {
      return;
    }

    const newlyShown = !root.open;
    if (newlyShown) {
      if (!presented) {
        const focused = getDialogActiveElement(root.ownerDocument);
        opener = focused instanceof HTMLElement ? focused : undefined;
      }
      showDialog(root, trap);
      activeDialog = root;
      releaseLayer?.();
      releaseLayer = connectLayer(root);
      presented = true;
    }
    else if (root.matches(':modal') !== trap) {
      root.close();
      showDialog(root, trap);
    }

    if (motionRoot !== root) {
      clearMotion();
      motionRoot = root;
      motion = connectImagePreviewMotion(
        root,
        state => { motionFrame = state; },
        visible => settleMotion(root, visible)
      );
    }
    motion?.sync(true, settings, newlyShown);
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
    if (!open || next < 0 || next >= count) {
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
    icons: {
      prevIcon: showSwitch ? prevIcon : undefined,
      nextIcon: showSwitch ? nextIcon : undefined,
      flipYIcon,
      flipXIcon,
      rotateLeftIcon,
      rotateRightIcon,
      zoomOutIcon,
      zoomInIcon
    },
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
      onClose: requestClose,
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
  .image-preview-dialog.image-preview-fade-start {
    transition-property: none;
  }
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
{#snippet actionButton(action: PreviewOperation, perform: () => void, disabled = false)}
  {@const glyph = artwork[action]}
  <button data-ant-image-preview-action type="button" aria-label={action} class={[
      `${previewPrefix}-actions-action`,
      `${previewPrefix}-actions-action-${action}`,
      disabled && `${previewPrefix}-actions-action-disabled`
    ]} {disabled} onclick={perform}>
    {#if glyph}{@render glyph()}{/if}
  </button>
{/snippet}
{#snippet prevIcon()}{@render actionButton('prev', () => activate(-1), current === 0)}{/snippet}
{#snippet nextIcon()}{@render actionButton('next', () => activate(1), current === count - 1)}{/snippet}
{#snippet flipYIcon()}{@render actionButton('flipY', info.actions.onFlipY)}{/snippet}
{#snippet flipXIcon()}{@render actionButton('flipX', info.actions.onFlipX)}{/snippet}
{#snippet rotateLeftIcon()}{@render actionButton('rotateLeft', info.actions.onRotateLeft)}{/snippet}
{#snippet rotateRightIcon()}{@render actionButton('rotateRight', info.actions.onRotateRight)}{/snippet}
{#snippet zoomOutIcon()}{@render actionButton('zoomOut', info.actions.onZoomOut, transform.scale <= min)}{/snippet}
{#snippet zoomInIcon()}{@render actionButton('zoomIn', info.actions.onZoomIn, transform.scale === max)}{/snippet}
{#snippet defaultActions()}
  <div class={[`${previewPrefix}-actions`, classNames?.actions]} style={styles?.actions}>
    {@render flipYIcon()}{@render flipXIcon()}
    {@render rotateLeftIcon()}{@render rotateRightIcon()}
    {@render zoomOutIcon()}{@render zoomInIcon()}
  </div>
{/snippet}
{#if mounted}{#key container.key}
  <NoCompactStyle>
    <dialog data-ant-image-prefix={imagePrefix} data-ant-image-preview-prefix={previewPrefix} bind:this={dialog} tabindex="-1" class={[
        `image-preview-dialog ${previewPrefix} ant-image-css-var`,
        componentTheme.className,
        classNames?.root,
        motionFrame.className,
        motionFrame.fadeStarting && 'image-preview-fade-start',
        preview.movable !== false && `${previewPrefix}-movable`,
        moving && `${previewPrefix}-moving`
      ]}
      dir={context.direction} aria-label={image.alt || context.locale.image?.preview || 'Image preview'} aria-modal={focusTrap ? 'true' : undefined}
      style={dialogStyle} {@attach container.attach} oncancel={event => {
              event.preventDefault();
              requestClose();
            }}>
      <div class={[
          `${previewPrefix}-mask`,
          !appearance.mask.enabled && `${previewPrefix}-mask-hidden`,
          appearance.mask.blur && `${previewPrefix}-mask-blur`,
          classNames?.mask
        ]}
        style={styles?.mask} role="presentation" onclick={() => {
            if (appearance.mask.closable)
              requestClose();
          }}></div>
      <div class={[`${previewPrefix}-body`, classNames?.body]} style={bodyStyle}>
        {#if preview.imageRender}{@render preview.imageRender(
            defaultImage,
            { transform, image, ...(group ? { current } : {}) }
          )}{:else}{@render defaultImage()}{/if}
      </div>
      {#if appearance.closeIcon !== false && appearance.closeIcon !== null}
        <button type="button" class={[`${previewPrefix}-close`, classNames?.close]}
          style={styles?.close} aria-label={context.locale.closeText} onclick={requestClose}>
          {#if typeof appearance.closeIcon === 'function'}
            {@render appearance.closeIcon()}
          {:else if artwork.close}
            {@render artwork.close()}
          {/if}
        </button>
      {/if}
      {#if showSwitch}
        <button type="button" class={[
            `${previewPrefix}-switch ${previewPrefix}-switch-prev`,
            current === 0 && `${previewPrefix}-switch-disabled`
          ]} aria-label="prev" disabled={current === 0} onclick={() => activate(-1)}>
          {#if artwork.prev}{@render artwork.prev()}{/if}
        </button>
        <button type="button" class={[
            `${previewPrefix}-switch ${previewPrefix}-switch-next`,
            current === count - 1 && `${previewPrefix}-switch-disabled`
          ]} aria-label="next" disabled={current === count - 1} onclick={() => activate(1)}>
          {#if artwork.next}{@render artwork.next()}{/if}
        </button>
      {/if}
      <div class={[`${previewPrefix}-footer`, classNames?.footer]} style={styles?.footer}>
        {#if group && count >= 1}<div class={`${previewPrefix}-progress`}>{#if countRender}{@render countRender(current + 1, count)}{:else}<bdi>{current + 1} / {count}</bdi>{/if}</div>{/if}
        {#if preview.actionsRender}{@render preview.actionsRender(defaultActions, info)}{:else}{@render defaultActions()}{/if}
      </div>
    </dialog>
  </NoCompactStyle>
{/key}{/if}
