<script lang="ts">
  // Координирует native dialog, маску и показ содержимого Drawer. Запрос закрытия проходит через
  // callbacks владельца.
  import NoCompactStyle from './NoCompactStyle.svelte';
  import DrawerPanel from './DrawerPanel.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getDrawerPrefixCss } from './drawer-prefix.engine';
  import { onDestroy, untrack } from 'svelte';
  import { useConfig } from './config-context';
  import { useComponentTheme } from './theme-component.svelte';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { provideZIndex, useZIndex } from './z-index-context.svelte';
  import { useWatermarkPanel } from './watermark-context';
  import { createDrawerDialog } from './drawer.dom';
  import {
    DEFAULT_DRAWER_PUSH_DISTANCE, DEFAULT_DRAWER_SIZE,
    getDrawerPushDistance, getDrawerPushOffset, getDrawerSize, isDrawerHorizontal,
    resolveDrawerInteraction
  } from './drawer.engine';
  import { resolveDrawerSemantics } from './drawer-panel.engine';
  import { provideDrawerPush, useDrawerPush } from './drawer-push-context';
  import { connectDrawerResize } from './drawer-resize.dom';
  import { createDialogContainer } from './dialog-container.model.svelte.js';
  import type { DrawerProps } from './drawer.types';

  let {
    open = $bindable(false),
    panelRef = $bindable(),
    ...props
  }: DrawerProps = $props();
  let {
    prefixCls: customizePrefixCls,
    title,
    drawerRender,
    placement = 'right',
    size,
    defaultSize = DEFAULT_DRAWER_SIZE,
    maxSize,
    resizable = false,
    push,
    zIndex,
    keyboard = true,
    mask,
    focusable,
    autoFocus = true,
    forceRender = false,
    destroyOnHidden = false,
    getContainer,
    onClose,
    afterOpenChange,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    class: className = '',
    style,
    rootClassName,
    rootStyle
  } = $derived(props);

  const config = useConfig();
  const interaction = $derived(resolveDrawerInteraction(mask, focusable, autoFocus, config.drawer));
  let componentPrefix = $derived(config.getPrefixCls('drawer', customizePrefixCls));
  let prefixCss = $derived(getDrawerPrefixCss(componentPrefix));
  const componentTheme = useComponentTheme('Drawer');
  const designTheme = useDesignTokenContext();
  const layer = useZIndex('container', () => zIndex);
  provideZIndex(() => layer.contextZIndex);
  const semanticProps = $derived<DrawerProps>({
    ...props,
    open,
    zIndex: layer.zIndex,
    defaultSize,
    push: push ?? { distance: DEFAULT_DRAWER_PUSH_DISTANCE },
    mask: interaction.mask.enabled,
    focusable: { trap: interaction.trap, focusTriggerAfterClose: interaction.restoreFocus }
  });
  const { classes, styles } = $derived(resolveDrawerSemantics(semanticProps, config.drawer, 'shell'));

  const parentDrawer = useDrawerPush();
  let pushedChildren = $state(0);
  const pushDistance = $derived(getDrawerPushDistance(push, parentDrawer?.distance));
  provideDrawerPush({
    get distance() { return pushDistance; },
    registerChild() {
      pushedChildren++;
      return () => { pushedChildren--; };
    }
  });
  const pushOffset = $derived(
    pushedChildren > 0 ? getDrawerPushOffset(placement, pushDistance) : undefined
  );
  const wrapperStyle = $derived([
    pushOffset && `translate:${pushOffset}`,
    styles.wrapper
  ].filter(Boolean).join(';') || undefined);
  const watermarkPanel = useWatermarkPanel();
  const generatedId = $props.id();
  let dialog = $state<HTMLDialogElement>();
  let mounted = $state(false);
  let resizedSize = $state<number>();
  let resizing = $state(false);
  const panelSize = $derived(size ?? resizedSize ?? defaultSize);
  const allowZero = $derived(Boolean(resizable) || size === undefined);
  const sizeInCss = $derived(getDrawerSize(panelSize, allowZero));
  const horizontal = $derived(isDrawerHorizontal(placement));
  const resizeCallbacks = $derived(typeof resizable === 'object' ? resizable : undefined);
  // Это фаза фактической DOM-анимации, а не копия запрошенного open.
  let closing = $state(false);
  let runtime = $state.raw<ReturnType<typeof createDrawerDialog>>();
  let backdropPointer: number | undefined;
  let active = true;
  let rootId = $derived(id ?? `ant-drawer-${generatedId}`);
  let titleId = $derived(`${rootId}-title`);
  let renderContent = $derived(open || closing || forceRender || mounted && !destroyOnHidden);
  const dialogStyle = $derived([
    componentTheme.style,
    layer.style,
    styles.root,
    style,
    rootStyle
  ].filter(Boolean).join(';') || undefined);
  const container = createDialogContainer(() => ({
    component: 'drawer',
    getContainer,
    getPopupContainer: config.getPopupContainer,
    enabled: !destroyOnHidden || open || closing || forceRender,
    portalByDefault: !interaction.native && (open || closing),
    style: dialogStyle,
    onPointerDown: event => {
      backdropPointer = interaction.mask.enabled && event.button === 0 && isBackdrop(event)
        ? event.pointerId : undefined;
    },
    onPointerUp: handlePointerUp,
    onPointerCancel: () => { backdropPointer = undefined; }
  }));
  const scrollUnlocked = $derived.by(() => {
    if (!interaction.mask.enabled) return true;
    if (interaction.native) return false;

    const target = container.target;
    return target === false || target !== undefined && target !== dialog?.ownerDocument.body;
  });

  function connectRuntime(node: HTMLDialogElement) {
    closing = false;
    const current = createDrawerDialog(
      node,
      value => { closing = value; },
      next => afterOpenChange?.(next),
      () => interaction
    );
    runtime = current;
    return () => {
      current.destroy();
      if (runtime === current) runtime = undefined;
    };
  }

  function resizePanel(nextSize: number) {
    resizedSize = nextSize;
    resizeCallbacks?.onResize?.(nextSize);
  }

  function connectResizeHandle(node: HTMLElement) {
    const wrapper = node.parentElement;
    if (!wrapper) {
      return;
    }

    const connection = connectDrawerResize(node, wrapper, () => ({
      enabled: open && Boolean(dialog?.open) && Boolean(resizable),
      placement,
      size: sizeInCss,
      maxSize,
      onResizeStart: resizeCallbacks?.onResizeStart,
      onResize: resizePanel,
      onResizeEnd: resizeCallbacks?.onResizeEnd
    }), dragging => { resizing = dragging; });
    $effect(() => connection.sync(open && Boolean(resizable), placement));

    return connection.destroy;
  }

  // Содержимое остаётся смонтированным до завершения ухода панели.
  $effect.pre(() => {
    const node = dialog;
    const requested = open;
    const side = placement;
    if (node && !requested)
      untrack(() => runtime?.sync(false, side));
  });

  $effect(() => {
    const node = dialog;
    const requested = open;
    const side = placement;
    const current = runtime;
    // Смена mask или focusable должна обновить режим открытого dialog.
    void interaction;
    if (!node || !current || !container.connected || !node.isConnected) {
      return;
    }

    untrack(() => {
      current.sync(requested, side);
    });
  });

  $effect(() => {
    // Markup уже обновил inline CSS, активная анимация уступает явно заданным свойствам.
    void styles.wrapper;
    void styles.mask;
    const current = runtime;
    if (current) untrack(current.syncStyles);
  });

  $effect(() => {
    if (parentDrawer && open && dialog && container.connected) {
      // Одновременно открытые дети освобождают только свою регистрацию.
      return untrack(() => parentDrawer.registerChild());
    }
  });

  onDestroy(() => {
    active = false;
  });

  function rememberContent() {
    mounted = true;
    return () => {
      mounted = false;
      resizedSize = undefined;
    };
  }

  function bindPanel(node: HTMLDivElement) {
    panelRef = node;
    return () => {
      if (panelRef === node) panelRef = undefined;
    };
  }

  function requestClose(event: Event) {
    if (!active || !open) {
      return;
    }

    backdropPointer = undefined;
    open = false;
    onClose?.(event);
  }

  function handleCancel(event: Event) {
    event.preventDefault();
    if (keyboard)
      requestClose(event);
  }

  function isBackdrop(event: PointerEvent) {
    return event.target === dialog
      || event.target instanceof HTMLElement
      && event.target.hasAttribute('data-ant-drawer-mask')
      && event.target.parentElement === dialog;
  }

  function handlePointerUp(event: PointerEvent) {
    const dismiss = event.pointerId === backdropPointer && isBackdrop(event);
    backdropPointer = undefined;
    if (interaction.mask.enabled && interaction.mask.closable && dismiss)
      requestClose(event);
  }

  function handleClose(event: Event) {
    if (!active || event.currentTarget !== dialog || dialog?.open) {
      return;
    }

    runtime?.nativeClosed();
    open = false;
  }
</script>

<style>
  :global(html:has(dialog.ant-svelte-drawer[open]:not([data-ant-dialog-unlocked]))) {
    overflow: hidden;
  }
  .ant-svelte-drawer { width: 100%; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; overflow: hidden; background: transparent; pointer-events: auto; outline: none; }
  .ant-svelte-drawer[data-ant-drawer-maskless] { pointer-events: none; }
  .ant-svelte-drawer[data-ant-drawer-inline] { position: absolute; height: 100%; }
  .ant-svelte-drawer:not([open]) { display: none; }
  .ant-svelte-drawer::backdrop { background: transparent; }
  .ant-svelte-drawer > [data-ant-drawer-content-wrapper] {
    max-width: 100%;
    max-height: 100%;
    transition: translate var(--ant-motion-duration-slow);
  }
  .ant-svelte-drawer > [data-ant-drawer-content-wrapper][data-ant-drawer-dragging] {
    transition: none;
    user-select: none;
    will-change: width, height;
  }
  [data-ant-drawer-placement="left"] > [data-ant-drawer-content-wrapper], [data-ant-drawer-placement="right"] > [data-ant-drawer-content-wrapper] { width: min(var(--ant-svelte-drawer-size), 100%); height: 100%; }
  [data-ant-drawer-placement="top"] > [data-ant-drawer-content-wrapper], [data-ant-drawer-placement="bottom"] > [data-ant-drawer-content-wrapper] { width: 100%; height: min(var(--ant-svelte-drawer-size), 100%); }
  [data-ant-drawer-section] { min-height: 0; }
  [data-ant-drawer-dragging] > [data-ant-drawer-section] { pointer-events: none; }
  [data-ant-drawer-dragger] {
    position: absolute;
    background: transparent;
    touch-action: none;
    pointer-events: auto;
    z-index: 1;
  }
  [data-ant-drawer-dragger]:hover { background: var(--ant-color-primary); opacity: 0.2; }
  [data-ant-drawer-dragging] > [data-ant-drawer-dragger] {
    background: var(--ant-color-primary);
    opacity: 0.3;
  }
  [data-ant-drawer-placement="left"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger],
  [data-ant-drawer-placement="right"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] {
    top: 0;
    bottom: 0;
    width: var(--ant-drawer-dragger-size);
    cursor: col-resize;
  }
  [data-ant-drawer-placement="top"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger],
  [data-ant-drawer-placement="bottom"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] {
    inset-inline: 0;
    height: var(--ant-drawer-dragger-size);
    cursor: row-resize;
  }
  [data-ant-drawer-placement="left"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] { right: 0; }
  [data-ant-drawer-placement="right"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] { left: 0; }
  [data-ant-drawer-placement="top"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] { bottom: 0; }
  [data-ant-drawer-placement="bottom"] > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger] { top: 0; }
  @media (prefers-reduced-motion: reduce) {
    .ant-svelte-drawer > [data-ant-drawer-content-wrapper] { transition: none; }
  }
</style>

<!-- Keyed range содержит только переносимый dialog; head-style anchors остаются снаружи. -->
<NoCompactStyle>
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`drawer-prefix:${componentPrefix}`} />{/if}{#key container.key}<dialog data-ant-drawer-prefix={componentPrefix} data-ant-drawer-placement={placement}
  data-ant-drawer-maskless={!interaction.mask.enabled || undefined}
  data-ant-drawer-inline={!interaction.native && getContainer === false || undefined}
  data-ant-dialog-unlocked={scrollUnlocked || undefined}
  closedby="closerequest"
  tabindex={interaction.native ? undefined : -1}
  bind:this={dialog} id={rootId} class={[
    `${componentPrefix} ant-drawer-css-var ant-svelte-drawer`,
    componentTheme.className,
    designTheme.enabled && 'drawer-source-theme',
    `${componentPrefix}-${placement}`,
    !interaction.mask.enabled && 'no-mask',
    config.direction === 'rtl' && `${componentPrefix}-rtl`,
    rootClassName,
    classes.root,
    className
  ]} style={dialogStyle} style:--ant-svelte-drawer-size={sizeInCss} dir={config.direction}
    aria-modal={interaction.mask.enabled && interaction.trap || undefined}
    aria-label={ariaLabel} aria-labelledby={ariaLabelledby
      ?? (ariaLabel === undefined && title !== undefined
        ? titleId
        : undefined)} aria-describedby={ariaDescribedby} oncancel={handleCancel} onclose={handleClose}
    {@attach container.attach} {@attach connectRuntime}>
  {#if interaction.mask.enabled}<div data-ant-drawer-mask class={[
    `${componentPrefix}-mask`, interaction.mask.blur && `${componentPrefix}-mask-blur`, classes.mask
  ]} style={styles.mask} aria-hidden="true"></div>{/if}
  <div data-ant-drawer-content-wrapper data-ant-drawer-dragging={resizing || undefined} class={[
    `${componentPrefix}-content-wrapper`,
    resizing && `${componentPrefix}-content-wrapper-dragging`,
    classes.wrapper
  ]} style={wrapperStyle} {@attach renderContent ? rememberContent : undefined}>
    {#if renderContent}
      {#if resizable}<div data-ant-drawer-dragger aria-hidden="true" class={[
        `${componentPrefix}-resizable-dragger`,
        `${componentPrefix}-resizable-dragger-${placement}`,
        `${componentPrefix}-resizable-dragger-${horizontal ? 'horizontal' : 'vertical'}`,
        resizing && `${componentPrefix}-resizable-dragger-dragging`,
        classes.dragger
      ]} style={styles.dragger} {@attach connectResizeHandle}></div>{/if}
      {#snippet section()}
        <div data-ant-drawer-section
          class={[`${componentPrefix}-section`, config.drawer?.class, classes.section]}
          style={styles.section} {@attach bindPanel} {@attach watermarkPanel}>
          <DrawerPanel {props} prefix={componentPrefix} {titleId} {requestClose} />
        </div>
      {/snippet}
      {#if drawerRender}{@render drawerRender(section)}
      {:else}{@render section()}{/if}
    {/if}
  </div>
</dialog>
{/key}
</NoCompactStyle>
