<script lang="ts">
  // Keeps the native dialog until the panel finishes. A named mask can finish its transition after
  // the modal state ends. Loading replaces content independently of visibility.
  import { flushSync, tick, untrack, type Snippet } from 'svelte';
  import { on } from 'svelte/events';
  import NoCompactStyle from '../space/NoCompactStyle.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { getModalPrefixCss } from './modal-prefix.engine';
  import { useConfig } from '../config-provider/config-context';
  import { isolateFormItemStyle } from '../form/form-item-status';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import { resolveModalClose } from './modal-close.engine';
  import { getModalLayout } from './modal-layout.engine';
  import { resolveModalPart, resolveModalSemantics, type ModalSemanticBody }
    from './modal-semantic.engine';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { provideZIndex, useZIndex } from '../popup/z-index-context.svelte';
  import { useWatermarkPanel } from '../watermark/watermark-context';
  import { createDialogContainer } from '../dialog/dialog-container.model.svelte.js';
  import { connectDialogFocus } from '../dialog/dialog-focus.dom';
  import { resolveDialogFocusable, resolveDialogMask } from '../dialog/dialog-interaction.engine';
  import { createModalMotion, type ModalMotionPart, type ModalMotionSettings }
    from './modal-motion.dom';
  import type { CssMotionState } from '../motion/css-motion.dom';
  import type { CssMotionEvent } from '../motion/css-motion.types';
  import { getPopupActiveElement, isPopupFocusWithin } from '../popup/popup.dom';
  import type { ModalContent, ModalProps as ModalComponentProps } from './modal.types';
  import ModalActionButton from './ModalActionButton.svelte';
  import Icon from '../icon/Icon.svelte';
  import Skeleton from '../skeleton/Skeleton.svelte';

  export type ModalProps = ModalComponentProps;

  let {
    open = $bindable(false),
    panelRef = $bindable(),
    _renderSemanticContent,
    ...props
  }: ModalProps & {
    /** @internal A confirmation applies the body slot to its own content. */
    _renderSemanticContent?: Snippet<[body: ModalSemanticBody]>;
  } = $props();
  let {
    prefixCls: customizePrefixCls,
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
    class: className = '',
    rootClassName,
    rootStyle,
    wrapClassName,
    wrapProps,
    bodyProps,
    maskProps,
    modalRender,
    style: contentStyle
  } = $derived(props);

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
      focusTriggerAfterClose: focus.restoreFocus,
      native: focus.trap && restoreFocus,
      autoFocus: true
    };
  });
  let componentPrefix = $derived(config.getPrefixCls('modal', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  const iconPrefix = $derived(config.iconPrefixCls);
  const customIconPrefix = $derived(iconPrefix === 'anticon' ? undefined : iconPrefix);
  let prefixCss = $derived(getModalPrefixCss(componentPrefix, rootPrefix, iconPrefix));
  const prefixScope = $derived(customIconPrefix
    ? `modal-prefix:${componentPrefix}:${rootPrefix}:${customIconPrefix}`
    : `modal-prefix:${componentPrefix}:${rootPrefix}`);
  const componentTheme = useComponentTheme('Modal');
  const designTheme = useDesignTokenContext();
  const placement = $derived(centered ?? config.modal?.centered);
  const layout = $derived(getModalLayout(
    width, height, placement, componentPrefix, designTheme.state.token
  ));
  const layer = useZIndex('container', () => zIndex);
  provideZIndex(() => layer.contextZIndex);
  const { classes, styles }: ReturnType<typeof resolveModalSemantics> = $derived.by(() => {
    const provider = config.modal;
    if (!provider?.classNames && !provider?.styles && !props.classNames && !props.styles) {
      return { classes: {}, styles: {} };
    }

    return resolveModalSemantics({
      ...props,
      open,
      width,
      mask: interaction.mask.enabled,
      focusable: {
        ...provider?.focusable, ...focusable,
        trap: interaction.trap, focusTriggerAfterClose: interaction.focusTriggerAfterClose
      },
      zIndex: layer.zIndex
    }, provider);
  });
  const wrapper = $derived(resolveModalPart<HTMLDialogElement>(
    wrapProps, [wrapClassName, classes.wrapper], serializeInlineStyleLayers([layer.style, styles.wrapper])
  ));
  const dialogStyle = $derived(serializeInlineStyleLayers([
    componentTheme.style, rootStyle, styles.root, wrapper.style, layout.variables
  ]));
  const dialogLabel = $derived(ariaLabel ?? wrapper.attributes['aria-label']);
  const dialogLabelledBy = $derived(ariaLabelledBy ?? wrapper.attributes['aria-labelledby']);
  const semanticBody = $derived({ className: classes.body, style: styles.body });
  const body = $derived(resolveModalPart<HTMLDivElement>(
    bodyProps, [`${componentPrefix}-body`, !_renderSemanticContent && classes.body],
    _renderSemanticContent ? undefined : styles.body
  ));
  const watermarkPanel = useWatermarkPanel();
  const generatedId = $props.id();
  const titleId = `ant-modal-${generatedId}`;
  let hasTitle = $derived(!_renderSemanticContent
    && title !== undefined && title !== null && title !== false && title !== '');
  let dialog = $state<HTMLDialogElement>();
  let backdrop = $state<HTMLDivElement>();
  let backdropPointer: number | undefined;
  let presented = $state(false);
  let visited = $state(false);
  let panelMotion = $state.raw<CssMotionState>({});
  let maskMotion = $state.raw<CssMotionState>({});
  let transformOrigin = $state<string>();
  const maskLeaving = $derived(maskMotion.phase === 'leave');
  // With no lifecycle options, eager SSR and mounting of closed snippets are preserved.
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
  const cssMask = $derived(namedMotion || Boolean(maskMotion.phase));
  const customMask = $derived(Boolean(classes.mask || styles.mask || maskProps));
  const elementBackdrop = $derived((cssMask || customMask)
    && (open || presented || maskLeaving));
  const backdropVisible = $derived(cssMask && elementBackdrop
    ? (open && interaction.mask.enabled) || maskLeaving
    : interaction.mask.enabled);
  const semanticMaskStyle = $derived(serializeInlineStyleLayers([
    customMask ? layer.style : undefined, styles.mask
  ]));
  const maskPart = $derived(resolveModalPart<HTMLDivElement>(
    maskProps, [elementBackdrop && `${componentPrefix}-mask`, classes.mask], semanticMaskStyle
  ));
  const maskStyle = $derived(serializeInlineStyleLayers([
    maskMotion.style, backdropVisible ? maskPart.style : undefined
  ]));
  const panelStyle = $derived(serializeInlineStyleLayers([
    panelMotion.style, config.modal?.style, contentStyle,
    transformOrigin ? `transform-origin:${transformOrigin}` : undefined,
    layout.height === undefined ? undefined : 'height:100%'
  ]));
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
    style: dialogStyle,
    onPointerDown: event => {
      backdropPointer = event.button === 0 && isBackdrop(event)
        && !(event.defaultPrevented && (wrapProps || maskProps)) ? event.pointerId : undefined;
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
      // The top dialog's mask stays above the previous dialog while preserving access to its elements.
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
      // Changing the mode also creates a close event. Notify the owner when the dialog actually closes.
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
        // With destroyOnHidden, callbacks can still access the mask before it is removed with the wrapper.
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
      // afterClose sees the children removed and cleanup complete.
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

  function bindPanel(node: HTMLDivElement) {
    const owner = node.closest('dialog');
    if (!owner) {
      return;
    }

    panelRef = owner;
    return () => {
      if (panelRef === owner) panelRef = undefined;
    };
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

  function listenForAnimationCancel(node: HTMLElement) {
    return on(node, 'animationcancel', event => runtime?.end('panel', event));
  }

  function listenForMaskMotion(node: HTMLDivElement) {
    const events = ['animationend', 'animationcancel', 'transitionend', 'transitioncancel'] as const;
    const listeners = events.map(type => on(node, type, event => runtime?.end('mask', event)));
    return () => {
      for (const remove of listeners) remove();
    };
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
    const maskLayer = backdrop?.parentElement;
    if (event.target === backdrop
      || (event.target === maskLayer && maskLayer?.hasAttribute('data-ant-modal-mask-layer'))) {
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
    // In the upstream wrapper, substituting these handlers takes over background dismissal.
    if ((wrapProps && ('onclick' in wrapProps || 'onmousedown' in wrapProps))
      || (event.defaultPrevented && (wrapProps || maskProps))) {
      return;
    }

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
  .ant-svelte-dialog {
    max-width: calc(100vw - 32px);
    max-height: calc(100dvh - 48px);
    padding: 0;
    border: 0;
    overflow: visible;
    background: transparent;
    color: var(--ant-color-text);
  }
  .ant-svelte-dialog {
    --ant-svelte-modal-offset: 24px;
    z-index: var(--ant-z-index-popup-base, 1000);
  }
  .ant-svelte-dialog[data-ant-modal-managed] {
    position: fixed;
    inset: 0;
    margin: auto;
  }
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
  [data-ant-modal-backdrop] {
    position: fixed;
    inset: 0;
    z-index: -1;
  }
  [data-ant-modal-mask-layer] {
    position: fixed;
    inset: 0;
    z-index: -1;
  }
  .ant-svelte-dialog:not([data-ant-modal-managed]) > [data-ant-modal-mask-layer],
  [data-ant-modal-mask-layer] > [data-ant-modal-backdrop] { pointer-events: none; }
  [data-ant-modal-mask] { background: var(--ant-color-bg-mask); }
  [data-ant-modal-zoom='before'] { opacity: 0; }
  [data-ant-modal-zoom='enter'] { animation: antZoomIn var(--ant-svelte-modal-zoom-in) both; }
  [data-ant-modal-zoom='leave'] { animation: antZoomOut var(--ant-svelte-modal-zoom-out) both; }
  [data-ant-modal-fade='before'] { opacity: 0; }
  [data-ant-modal-fade='enter'] { animation: antFadeIn var(--ant-svelte-modal-fade) linear both; }
  [data-ant-modal-fade='leave'] { animation: antFadeOut var(--ant-svelte-modal-fade) linear both; }
  @keyframes antZoomIn {
    from {
      transform: scale(0.2);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  @keyframes antZoomOut {
    from {
      transform: scale(1);
      opacity: 1;
    }
    to {
      transform: scale(0.2);
      opacity: 0;
    }
  }
  @keyframes antFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes antFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  [data-ant-modal-panel] {
    top: auto;
    max-width: none;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  [data-ant-modal-container] {
    max-height: calc(100dvh - var(--ant-svelte-modal-offset, 24px) - 24px);
    overflow: auto;
  }
  [data-ant-modal-title] { padding-inline-end: 32px; }
  [data-ant-modal-close] {
    display: flex;
    align-items: center;
    justify-content: center;
  }
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

{#snippet backdropSurface()}
  <div
    data-ant-modal-backdrop
    aria-hidden="true"
    {...backdropVisible ? maskPart.attributes : {}}
    data-ant-modal-mask={backdropVisible || undefined}
    data-ant-modal-mask-blur={interaction.mask.blur || undefined}
    data-ant-modal-fade={fadeFrame}
    class={[backdropVisible && maskPart.classes, maskMotion.className]}
    style={maskStyle}
    {@attach listenForMaskMotion}
    bind:this={backdrop}
  ></div>
{/snippet}

{#snippet modalContent()}
  <div data-ant-modal-container
    class={[`${componentPrefix}-container`, classes.container]} style={styles.container}
    {@attach modalRender ? undefined : watermarkPanel}>
    {#if closeControl}
      <button type="button" data-ant-modal-close
        class={[`${componentPrefix}-close`, classes.close]} style={styles.close}
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
    {#if hasTitle}
      <div data-ant-modal-header class={[`${componentPrefix}-header`, classes.header]}
        style={styles.header}>
        <h2 id={titleId} data-ant-modal-title class={[`${componentPrefix}-title`, classes.title]}
          style={styles.title}>{@render content(title)}</h2>
      </div>
    {/if}
    <div {...body.attributes} data-ant-modal-body class={body.classes} style={body.style}>
      {#if loading}
        <Skeleton active title={false} paragraph={{ rows: 4 }}
          rootClassName={`${componentPrefix}-body-skeleton`} />
      {:else if _renderSemanticContent}
        {@render _renderSemanticContent(semanticBody)}
      {:else}
        {@render children?.()}
      {/if}
    </div>
    {#if footer !== null && !loading}
      <div data-ant-modal-footer class={[`${componentPrefix}-footer`, classes.footer]}
        style={styles.footer}>
        {#if footer}
          {@render footer(defaultFooter, { OkBtn, CancelBtn })}
        {:else}
          {@render defaultFooter()}
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<!-- The keyed range contains only the dialog being moved. The head style anchors stay outside. -->
<NoCompactStyle>
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={prefixScope} />{/if}{#if layout.css && layout.scope}<ThemeScopeStyle css={layout.css} scope={layout.scope} />{/if}{#if renderDialog}{#key container.key}<dialog
  {...wrapper.attributes}
  data-ant-modal-prefix={componentPrefix} data-ant-modal-root-prefix={rootPrefix}
  data-ant-modal-icon-prefix={customIconPrefix}
  data-ant-modal-layout={layout.scope}
  data-ant-modal-top={placement === false || undefined}
  data-ant-modal-managed={!interaction.native || undefined}
  data-ant-modal-element-mask={elementBackdrop || undefined}
  data-ant-modal-mask-tail={maskLeaving || undefined}
  data-ant-modal-mask-blur={interaction.mask.enabled && interaction.mask.blur || undefined}
  data-ant-dialog-unlocked={scrollUnlocked || undefined}
  bind:this={dialog}
  tabindex={wrapper.attributes.tabindex ?? (interaction.native ? undefined : -1)}
  class={[
    'ant-svelte-dialog ant-modal-css-var',
    componentTheme.className,
    placement && `${componentPrefix}-centered`,
    className,
    rootClassName,
    classes.root,
    wrapper.classes
  ]}
  style={dialogStyle}
  style:width={layout.width}
  style:height={layout.height}
  style:--ant-svelte-modal-zoom-in={zoomFrame ? `${motionToken.motionDurationSlow} ${motionToken.motionEaseOutCirc}` : undefined}
  style:--ant-svelte-modal-zoom-out={zoomFrame ? `${motionToken.motionDurationMid} ${motionToken.motionEaseInOutCirc}` : undefined}
  style:--ant-svelte-modal-fade={fadeFrame ? motionToken.motionDurationMid : undefined}
  dir={wrapper.attributes.dir ?? config.direction}
  aria-label={dialogLabel}
  aria-labelledby={dialogLabelledBy ?? (dialogLabel?.trim() ? undefined : hasTitle ? titleId : undefined)}
  aria-modal={interaction.trap || undefined}
  oncancel={handleCancel}
  onclose={handleClose}
  {@attach container.attach}
  {@attach connectDialog}
>
  {#if !interaction.native || elementBackdrop}
    {#if customMask && elementBackdrop}
      <div data-ant-modal-mask-layer>{@render backdropSurface()}</div>
    {:else}
      {@render backdropSurface()}
    {/if}
  {/if}
  {#if renderPanel}<div data-ant-modal-panel data-ant-modal-prefix={componentPrefix}
    data-ant-modal-root-prefix={rootPrefix}
    data-ant-modal-icon-prefix={customIconPrefix}
    class={[componentPrefix, config.modal?.class, panelMotion.className]}
    data-ant-modal-zoom={zoomFrame}
    style={panelStyle}
    {@attach bindPanel}
    {@attach listenForAnimationCancel}
    onanimationend={endPanelMotion}
    ontransitionend={endPanelMotion} ontransitioncancel={endPanelMotion}>
    {#if modalRender}
      <div data-ant-modal-render class={`${componentPrefix}-render`} {@attach watermarkPanel}>
        {@render modalRender(modalContent)}
      </div>
    {:else}
      {@render modalContent()}
    {/if}
  </div>{/if}
</dialog>
{/key}{/if}
</NoCompactStyle>
