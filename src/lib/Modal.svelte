<script lang="ts">
  // Удерживает native dialog до завершения панели. Именованная маска может доиграть после
  // освобождения модальности. Содержимое при loading заменяется независимо от видимости.
  import { flushSync, tick, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import NoCompactStyle from './NoCompactStyle.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getModalPrefixCss } from './modal-prefix.engine';
  import { useConfig } from './config-context';
  import { isolateFormItemStyle } from './form-item-status';
  import { useComponentTheme } from './theme-component.svelte';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { resolveModalClose } from './modal-close.engine';
  import { getModalLayout } from './modal-layout.engine';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { provideZIndex, useZIndex } from './z-index-context.svelte';
  import { useWatermarkPanel } from './watermark-context';
  import { createDialogContainer } from './dialog-container.model.svelte.js';
  import { connectDialogFocus } from './dialog-focus.dom';
  import { resolveDialogFocusable, resolveDialogMask } from './dialog-interaction.engine';
  import { createModalMotion, type ModalMotionPart, type ModalMotionSettings }
    from './modal-motion.dom';
  import type { CssMotionState } from './css-motion.dom';
  import type { CssMotionEvent } from './css-motion.types';
  import { getPopupActiveElement, isPopupFocusWithin } from './popup.dom';
  import type { ModalContent, ModalProps as ModalComponentProps } from './modal.types';
  import ModalActionButton from './ModalActionButton.svelte';
  import Icon from './Icon.svelte';
  import Skeleton from './Skeleton.svelte';

  export type ModalProps = ModalComponentProps;

  let {
    prefixCls: customizePrefixCls,
    open = $bindable(false),
    title,
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    footer,
    width = 520,
    height,
    centered,
    zIndex,
    closable,
    closeIcon,
    keyboard = true,
    mask,
    focusable,
    scrollLock = true,
    confirmLoading = false,
    loading = false,
    forceRender,
    destroyOnHidden,
    transitionName,
    maskTransitionName,
    mousePosition,
    okText,
    cancelText,
    okType = 'primary',
    okButtonProps,
    cancelButtonProps,
    onOk,
    onCancel,
    afterClose,
    afterOpenChange,
    getContainer,
    class: className = ''
  }: ModalProps = $props();

  const config = useConfig();
  isolateFormItemStyle();
  const closeControl = $derived(resolveModalClose(closable, closeIcon, config.modal));
  const closeCallbacks = $derived(typeof closable === 'object' ? closable : undefined);
  const interaction = $derived.by(() => {
    const mergedMask = resolveDialogMask(mask, config.modal?.mask);
    const focus = resolveDialogFocusable(focusable, config.modal?.focusable, mergedMask.enabled);
    const restoreFocus = mergedMask.enabled && focus.restoreFocus;

    return {
      mask: mergedMask,
      trap: focus.trap,
      restoreFocus,
      native: focus.trap && restoreFocus,
      autoFocus: true
    };
  });
  let componentPrefix = $derived(config.getPrefixCls('modal', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getModalPrefixCss(componentPrefix, rootPrefix));
  const componentTheme = useComponentTheme('Modal');
  const designTheme = useDesignTokenContext();
  const placement = $derived(centered ?? config.modal?.centered);
  const layout = $derived(getModalLayout(
    width, height, placement, componentPrefix, designTheme.state.token
  ));
  const style = $derived(serializeInlineStyleLayers([componentTheme.style, layout.variables]));
  const layer = useZIndex('container', () => zIndex);
  provideZIndex(() => layer.contextZIndex);
  const watermarkPanel = useWatermarkPanel();
  const generatedId = $props.id();
  const titleId = `ant-modal-${generatedId}`;
  let hasTitle = $derived(title !== undefined && title !== null && title !== false && title !== '');
  let dialog = $state<HTMLDialogElement>();
  let backdrop = $state<HTMLDivElement>();
  let backdropPointer: number | undefined;
  let presented = $state(false);
  let visited = $state(false);
  let panelMotion = $state.raw<CssMotionState>({});
  let maskMotion = $state.raw<CssMotionState>({});
  let transformOrigin = $state<string>();
  const maskLeaving = $derived(maskMotion.phase === 'leave');
  // Без параметров lifecycle остаётся прежний eager SSR и монтаж закрытых snippets.
  const preload = $derived(forceRender ?? (destroyOnHidden === undefined));
  const renderPanel = $derived(open || presented || preload || (visited && !destroyOnHidden));
  const renderDialog = $derived(renderPanel || maskLeaving);
  const motionToken = $derived(designTheme.state.token);
  const namedMotion = $derived(transitionName !== undefined || maskTransitionName !== undefined);
  const motionSettings = $derived<ModalMotionSettings>({
    token: motionToken,
    named: namedMotion,
    masked: interaction.mask.enabled,
    forceRender: forceRender === true,
    rootPrefix,
    transitionName,
    maskTransitionName,
    mousePosition
  });
  const namedBackdrop = $derived((namedMotion || Boolean(maskMotion.phase))
    && (open || presented || maskLeaving));
  const backdropVisible = $derived(namedBackdrop
    ? (open && interaction.mask.enabled) || maskLeaving
    : interaction.mask.enabled);
  const stockZoom = $derived(transitionName === undefined || transitionName === `${rootPrefix}-zoom`);
  const stockFade = $derived(maskTransitionName === undefined || maskTransitionName === `${rootPrefix}-fade`);
  const zoomFrame = $derived(stockZoom ? stockFrame(panelMotion) : undefined);
  const fadeFrame = $derived(stockFade ? stockFrame(maskMotion) : undefined);
  let runtime = $state.raw<{
    sync(open: boolean, settings: ModalMotionSettings, movingMask: boolean): void;
    closed(): void;
    end(part: ModalMotionPart, event: CssMotionEvent): void;
  }>();
  const container = createDialogContainer(() => ({
    component: 'modal',
    open,
    getContainer,
    getPopupContainer: config.getPopupContainer,
    resolveWhenClosed: renderDialog,
    portalByDefault: !interaction.native && (open || presented || maskLeaving),
    style,
    onPointerDown: event => {
      backdropPointer = event.button === 0 && isBackdrop(event) ? event.pointerId : undefined;
    },
    onPointerUp: handlePointerUp,
    onPointerCancel: () => { backdropPointer = undefined; }
  }));
  const scrollUnlocked = $derived.by(() => {
    if (!scrollLock) {
      return true;
    }
    if (interaction.native) {
      return false;
    }

    const target = container.target;
    return target === false || target !== undefined && target !== dialog?.ownerDocument.body;
  });

  $effect(() => {
    const current = runtime;
    const requested = open;
    const settings = motionSettings;
    const movingMask = maskLeaving;
    if (!current || !container.connected || !dialog?.isConnected) {
      return;
    }

    untrack(() => current.sync(requested, settings, movingMask));
  });

  $effect(() => {
    if (!open && !presented && destroyOnHidden && !preload) {
      visited = false;
    }
  });

  function connectDialog(node: HTMLDialogElement) {
    const focus = connectDialogFocus(node, () => interaction, controls => {
      const autofocus = controls.find(control => control.hasAttribute('autofocus'));
      return autofocus ?? (interaction.trap ? controls[0] : undefined);
    });
    const motion = createModalMotion(node, {
      settled,
      paint,
      origin: value => { transformOrigin = value; }
    });
    let shown = false;
    let passiveMask = false;
    let pendingRestore: (() => void) | undefined;

    function sync(visible: boolean, options: ModalMotionSettings, movingMask: boolean) {
      if (visible) {
        releaseMask();
        if (node.open) focus.sync();
        else focus.open();

        shown = node.open;
        if (shown) {
          pendingRestore = undefined;
          presented = true;
        }
      }
      if (node.open || movingMask) {
        motion.sync(visible, options);
      }
    }

    function paint(part: ModalMotionPart, state: CssMotionState, commit?: boolean) {
      if (runtime !== current) {
        return;
      }
      function apply() {
        if (part === 'panel') {
          panelMotion = state;
        }
        else {
          maskMotion = state;
          if (state.phase !== 'leave') releaseMask();
        }
      }

      if (commit) flushSync(apply);
      else apply();
    }

    function presentMask(keepNativeLayer: boolean) {
      passiveMask = true;
      node.inert = true;
      node.setAttribute('aria-hidden', 'true');
      // Маска верхнего dialog остаётся над предыдущим, сохраняя доступ к его элементам.
      if (keepNativeLayer && typeof node.showPopover === 'function') {
        node.popover = 'manual';
        node.showPopover();
      }
    }

    function releaseMask() {
      if (!passiveMask) {
        return;
      }

      passiveMask = false;
      if (typeof node.hidePopover === 'function' && node.matches(':popover-open')) {
        node.hidePopover();
      }
      node.removeAttribute('popover');
      node.removeAttribute('aria-hidden');
      node.inert = false;
    }

    function settled(visible: boolean) {
      if (!node.open || open !== visible) {
        return;
      }
      if (visible) {
        afterOpenChange?.(true);
      }
      else {
        const keepNativeLayer = maskLeaving && focus.ownsNativeLayer();
        pendingRestore = focus.close();
        if (maskLeaving && node.isConnected) presentMask(keepNativeLayer);
      }
    }

    function closed() {
      // Смена режима тоже создаёт close event. Уведомление принадлежит фактическому закрытию.
      if (node.open || !shown) {
        return;
      }

      shown = false;
      const restore = pendingRestore ?? focus.close();
      pendingRestore = undefined;
      motion.closed();
      const destroy = destroyOnHidden === true && forceRender !== true;
      const afterCloseButton = closeCallbacks?.afterClose;
      finishClose(destroy);
      restore?.();
      try {
        afterCloseButton?.();
        afterClose?.();
        afterOpenChange?.(false);
      }
      finally {
        // При destroyOnHidden маска доступна в колбэках, затем уходит вместе с оболочкой.
        if (destroy) motion.reset();
      }
    }

    const current = { sync, closed, end: motion.end };
    panelMotion = {};
    maskMotion = {};
    visited = true;
    runtime = current;
    return () => {
      const document = node.ownerDocument;
      const active = getPopupActiveElement(node);
      const restore = pendingRestore ?? focus.close();
      releaseMask();
      motion.reset();
      if (runtime === current) {
        runtime = undefined;
        presented = false;
      }

      if (active && active !== document.body && !isPopupFocusWithin(node, active)) {
        return;
      }
      if (restore) {
        void tick().then(() => {
          const focused = document.activeElement;
          if (!focused || focused === document.body || focused === node) {
            restore();
          }
        });
      }
    };
  }

  function finishClose(destroy: boolean) {
    if (destroy) {
      // afterClose наблюдает удалённые children и завершённый cleanup.
      flushSync(() => {
        open = false;
        presented = false;
        visited = false;
      });
    }
    else {
      open = false;
      presented = false;
    }
  }

  function stockFrame(motion: CssMotionState) {
    if (!motion.phase) {
      return undefined;
    }
    if (motion.step === 'active') {
      return motion.phase === 'leave' ? 'leave' : 'enter';
    }

    return motion.phase === 'leave' ? undefined : 'before';
  }

  function endPanelMotion(event: CssMotionEvent) {
    runtime?.end('panel', event);
  }

  function endMaskMotion(event: CssMotionEvent) {
    runtime?.end('mask', event);
  }

  function listenForAnimationCancel(node: HTMLElement) {
    const part = node.hasAttribute('data-ant-modal-panel') ? 'panel' : 'mask';
    return on(node, 'animationcancel', event => runtime?.end(part, event));
  }

  function handleClose(event: Event) {
    if (event.currentTarget === dialog) runtime?.closed();
  }

  function cancel() {
    if (confirmLoading) {
      return;
    }

    const onClose = closeCallbacks?.onClose;
    open = false;
    onCancel?.();
    onClose?.();
  }

  function handleCancel(event: Event) {
    event.preventDefault();

    if (keyboard) {
      cancel();
    }
  }

  function isBackdrop(event: PointerEvent) {
    if (event.target === backdrop) {
      return true;
    }
    if (!dialog || event.target !== dialog || !dialog.matches(':modal')) {
      return false;
    }

    const bounds = dialog.getBoundingClientRect();

    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  function handlePointerUp(event: PointerEvent) {
    const start = backdropPointer;
    backdropPointer = undefined;
    if (start === event.pointerId && interaction.mask.closable && isBackdrop(event)) {
      cancel();
    }
  }

  function handleOk() {
    const onClose = closeCallbacks?.onClose;
    if (onOk) {
      onOk();
    }
    else {
      open = false;
    }
    onClose?.();
  }
</script>

<style>
  :global(html:has(dialog.ant-svelte-dialog[open]:not([data-ant-dialog-unlocked]))) {
    overflow: hidden;
  }
  .ant-svelte-dialog { max-width: calc(100vw - 32px); max-height: calc(100dvh - 48px); padding: 0; border: 0; overflow: visible; background: transparent; color: var(--ant-color-text); }
  .ant-svelte-dialog {
    --ant-svelte-modal-offset: 24px;
    z-index: var(--ant-z-index-popup-base, 1000);
  }
  .ant-svelte-dialog[data-ant-modal-managed] { position: fixed; inset: 0; margin: auto; }
  .ant-svelte-dialog[data-ant-modal-layout] { max-width: var(--ant-svelte-modal-max-width); }
  .ant-svelte-dialog[data-ant-modal-top] {
    --ant-svelte-modal-offset: min(var(--ant-svelte-modal-top, 100px), max(0px, 100dvh - 96px));
    inset-block-start: var(--ant-svelte-modal-offset);
    inset-block-end: auto;
    margin-block: 0;
    max-height: calc(100dvh - var(--ant-svelte-modal-offset) - 24px);
  }
  .ant-svelte-dialog::backdrop { background: var(--ant-color-bg-mask); }
  .ant-svelte-dialog[data-ant-modal-mask-blur]::backdrop,
  [data-ant-modal-mask][data-ant-modal-mask-blur] { backdrop-filter: blur(4px); }
  .ant-svelte-dialog[data-ant-modal-element-mask]::backdrop {
    background: transparent;
    backdrop-filter: none;
  }
  .ant-svelte-dialog[data-ant-modal-mask-tail]:not([open]) {
    display: block;
    position: fixed;
    pointer-events: none;
  }
  .ant-svelte-dialog[data-ant-modal-mask-tail]:not([open]) > [data-ant-modal-panel] { display: none; }
  [data-ant-modal-backdrop] { position: fixed; inset: 0; z-index: -1; }
  [data-ant-modal-mask] { background: var(--ant-color-bg-mask); }
  [data-ant-modal-zoom='before'] { opacity: 0; }
  [data-ant-modal-zoom='enter'] { animation: antZoomIn var(--ant-svelte-modal-zoom-in) both; }
  [data-ant-modal-zoom='leave'] { animation: antZoomOut var(--ant-svelte-modal-zoom-out) both; }
  [data-ant-modal-fade='before'] { opacity: 0; }
  [data-ant-modal-fade='enter'] { animation: antFadeIn var(--ant-svelte-modal-fade) linear both; }
  [data-ant-modal-fade='leave'] { animation: antFadeOut var(--ant-svelte-modal-fade) linear both; }
  @keyframes antZoomIn {
    from { transform: scale(0.2); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes antZoomOut {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.2); opacity: 0; }
  }
  @keyframes antFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes antFadeOut { from { opacity: 1; } to { opacity: 0; } }
  [data-ant-modal-panel] { top: auto; max-width: none; width: 100%; margin: 0; padding: 0; }
  [data-ant-modal-container] {
    max-height: calc(100dvh - var(--ant-svelte-modal-offset, 24px) - 24px);
    overflow: auto;
  }
  [data-ant-modal-title] { padding-inline-end: 32px; }
  [data-ant-modal-close] { display: flex; align-items: center; justify-content: center; }
</style>

{#snippet content(value: ModalContent | undefined)}
  {#if typeof value === 'function'}{@render value()}
  {:else if typeof value !== 'boolean'}{value ?? ''}{/if}
{/snippet}

{#snippet CloseIcon(icon: ModalContent | undefined)}
  {#if icon === undefined}<Icon name="close" />{:else}{@render content(icon)}{/if}
{/snippet}

{#snippet OkBtn()}
  <ModalActionButton
    inherited={config.modal?.okButtonProps}
    options={okButtonProps}
    type={okType}
    loading={confirmLoading}
    text={okText === undefined ? config.locale.okText : okText}
    action={handleOk}
  />
{/snippet}

{#snippet CancelBtn()}
  <ModalActionButton
    inherited={config.modal?.cancelButtonProps}
    options={cancelButtonProps}
    disabled={confirmLoading}
    text={cancelText === undefined ? config.locale.cancelText : cancelText}
    action={cancel}
  />
{/snippet}

{#snippet defaultFooter()}
  {@render CancelBtn()}{@render OkBtn()}
{/snippet}

<!-- Keyed range содержит только переносимый dialog; head-style anchors остаются снаружи. -->
<NoCompactStyle>
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`modal-prefix:${componentPrefix}:${rootPrefix}`} />{/if}{#if layout.css && layout.scope}<ThemeScopeStyle css={layout.css} scope={layout.scope} />{/if}{#if renderDialog}{#key container.key}<dialog
  data-ant-modal-prefix={componentPrefix} data-ant-modal-root-prefix={rootPrefix}
  data-ant-modal-layout={layout.scope}
  data-ant-modal-top={placement === false || undefined}
  data-ant-modal-managed={!interaction.native || undefined}
  data-ant-modal-element-mask={namedBackdrop || undefined}
  data-ant-modal-mask-tail={maskLeaving || undefined}
  data-ant-modal-mask-blur={interaction.mask.enabled && interaction.mask.blur || undefined}
  data-ant-dialog-unlocked={scrollUnlocked || undefined}
  bind:this={dialog}
  tabindex={interaction.native ? undefined : -1}
  class={[
    'ant-svelte-dialog ant-modal-css-var',
    componentTheme.className,
    placement && `${componentPrefix}-centered`,
    className
  ]}
  {style}
  style:width={layout.width}
  style:height={layout.height}
  style:z-index={layer.zIndex}
  style:--ant-svelte-modal-zoom-in={zoomFrame ? `${motionToken.motionDurationSlow} ${motionToken.motionEaseOutCirc}` : undefined}
  style:--ant-svelte-modal-zoom-out={zoomFrame ? `${motionToken.motionDurationMid} ${motionToken.motionEaseInOutCirc}` : undefined}
  style:--ant-svelte-modal-fade={fadeFrame ? motionToken.motionDurationMid : undefined}
  dir={config.direction}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy ?? (ariaLabel?.trim() ? undefined : hasTitle ? titleId : undefined)}
  aria-modal={interaction.trap || undefined}
  oncancel={handleCancel}
  onclose={handleClose}
  {@attach container.attach}
  {@attach connectDialog}
>
  {#if !interaction.native || namedBackdrop}<div data-ant-modal-backdrop
    data-ant-modal-mask={backdropVisible || undefined}
    data-ant-modal-mask-blur={interaction.mask.blur || undefined}
    data-ant-modal-fade={fadeFrame}
    class={[namedBackdrop && backdropVisible && `${componentPrefix}-mask`, maskMotion.className]}
    style={maskMotion.style}
    {@attach listenForAnimationCancel}
    onanimationend={endMaskMotion}
    ontransitionend={endMaskMotion} ontransitioncancel={endMaskMotion}
    aria-hidden="true" bind:this={backdrop}></div>{/if}
  {#if renderPanel}<div data-ant-modal-panel data-ant-modal-prefix={componentPrefix}
    data-ant-modal-root-prefix={rootPrefix} class={[componentPrefix, panelMotion.className]}
    data-ant-modal-zoom={zoomFrame}
    style={panelMotion.style}
    style:transform-origin={transformOrigin}
    style:height={layout.height === undefined ? undefined : '100%'}
    {@attach listenForAnimationCancel}
    onanimationend={endPanelMotion}
    ontransitionend={endPanelMotion} ontransitioncancel={endPanelMotion}>
    <div data-ant-modal-container class={`${componentPrefix}-container`} {@attach watermarkPanel}>
      {#if closeControl}
        <button type="button" data-ant-modal-close class={`${componentPrefix}-close`}
          aria-label={config.locale.closeText} {...closeControl.attributes}
          disabled={confirmLoading || closeControl.disabled} onclick={cancel}>
          {#if closeControl.icon !== null}
            {#if designTheme.enabled}
              <span data-ant-modal-close-x class={`${componentPrefix}-close-x`}>
                {@render CloseIcon(closeControl.icon)}
              </span>
            {:else}
              {@render CloseIcon(closeControl.icon)}
            {/if}
          {/if}
        </button>
      {/if}
      {#if hasTitle}<div data-ant-modal-header class={`${componentPrefix}-header`}><h2 id={titleId} data-ant-modal-title class={`${componentPrefix}-title`}>{@render content(title)}</h2></div>{/if}
      <div data-ant-modal-body class={`${componentPrefix}-body`}>{#if loading}<Skeleton active title={false} paragraph={{ rows: 4 }} rootClassName={`${componentPrefix}-body-skeleton`} />{:else}{@render children?.()}{/if}</div>
      {#if footer !== null && !loading}
        <div data-ant-modal-footer class={`${componentPrefix}-footer`}>
          {#if footer}
            {@render footer(defaultFooter, { OkBtn, CancelBtn })}
          {:else}
            {@render defaultFooter()}
          {/if}
        </div>
      {/if}
    </div>
  </div>{/if}
</dialog>
{/key}{/if}
</NoCompactStyle>
