<script lang="ts">
  // Applies size, position, and content to the popup surface. Imperative alignment uses the current
  // popup.
  import { getAllContexts, onDestroy, onMount, untrack } from 'svelte';
  import RenderContent from '../RenderContent.svelte';
  import {
    hasTooltipPopupAncestor, isolateTooltipUnique, useTooltipUnique, type TooltipUniqueOwner
  } from './tooltip-unique.model.svelte';
  import { useConfig } from '../config-provider/config-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { getOverlaySemantics } from '../popup/overlay-semantic.engine';
  import { createOverlayStyle } from '../popup/overlay-style.model.svelte';
  import { useOverlayMotion } from '../popup/overlay-motion.svelte';
  import { getPopupArrowStyle, getPopupPlacement, getPopupPlacements } from '../popup/popup-position.engine';
  import type { TooltipPosition } from './tooltip.engine';
  import { getTooltipColor } from './tooltip-color.engine';
  import { getOverlayPrefixCss } from '../popup/overlay-prefix.engine';
  import prefixTemplate from '../vendor/tooltip-prefix.css.js';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { connectInlineStyle } from '../style/inline-style.dom';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { useDesignTokenContext, useRuntimeStyles } from '../theme/theme-context.svelte';
  import { provideZIndex, useZIndex, type ZIndexLayer } from '../popup/z-index-context.svelte';
  import {
    connectTooltipDescription, connectTooltipOpenClass, defaultTooltipContainer
  } from './tooltip.dom';
  import {
    getTooltipArrow,
    getTooltipDelay,
    getTooltipPlacementConfig,
    hasTooltipContent,
    isTooltipCorner
  } from './tooltip.engine';
  import { connectPopup, type PopupConnection } from '../popup/popup.dom';
  import { createPopupContainer } from '../popup/popup-container.model.svelte.js';
  import type { TooltipPopupProps } from './tooltip-popup.types';
  import type { TooltipContent, TooltipSemanticProps } from './tooltip.types';

  let props: TooltipPopupProps = $props();
  let {
    title,
    contentAvailable,
    color,
    prefixCls,
    openClassName,
    destroyOnHidden,
    fresh,
    open: rawOpen,
    id: providedId,
    disabled,
    forceRender,
    zIndex,
    zIndexLayer,
    anchor,
    describe,
    trigger,
    placement = 'top',
    align,
    builtinPlacements,
    onPopupAlign,
    arrow,
    autoAdjustOverflow = true,
    getPopupContainer,
    semanticProps,
    ownerClassName,
    sourceAnchor = false,
    unique,
    outsideEvents,
    onDismiss,
    onHoverChange
  } = $derived(props);

  const config = useConfig();
  const componentTheme = useComponentTheme('Tooltip');
  const designTokens = useDesignTokenContext();
  const group = useTooltipUnique();
  if (group) isolateTooltipUnique();
  const context = group ? getAllContexts() : undefined;
  const grouped = $derived(Boolean(group
    && (unique ?? semanticProps?.unique) !== false && !hasTooltipPopupAncestor(anchor)));
  let prefix = $derived(config.getPrefixCls('tooltip', prefixCls));
  const runtimeStyles = untrack(() => props.runtimeStyles) ?? useRuntimeStyles();
  let prefixCss = $derived(runtimeStyles && getOverlayPrefixCss('tooltip', prefix, prefixTemplate));
  let resolvedOpenClassName = $derived(openClassName || semanticProps?.openClassName || `${prefix}-open`);
  const generatedId = $props.id();
  let resolvedId = $derived((providedId ?? semanticProps?.id) || `ant-tooltip-${generatedId}`);
  let resolvedDisabled = $derived(disabled ?? semanticProps?.disabled ?? false);
  let open = $derived(rawOpen && !resolvedDisabled);
  let force = $derived(forceRender ?? semanticProps?.forceRender ?? false);
  const localLayer = useZIndex('container', () => zIndex ?? semanticProps?.zIndex);
  const layer = $derived(zIndexLayer ?? localLayer);
  provideZIndex(() => layer.contextZIndex);
  let popup = $state<HTMLSpanElement>();
  let connection: PopupConnection | undefined;
  let actualPlacement = $state(untrack(() => placement));
  let actualPosition = $state.raw<TooltipPosition>();
  let resolvedAlign = $derived(align ?? semanticProps?.align);
  let configuredPlacements = $derived(builtinPlacements ?? semanticProps?.builtinPlacements);
  let configuredContainer = $derived(getPopupContainer || config.getPopupContainer);
  // The portal owns the built-in tooltip fallback. Semantic props reflect configuration.
  let container = $derived(configuredContainer
    || (sourceAnchor ? defaultTooltipContainer : undefined));
  let alignCallback = $derived(onPopupAlign ?? semanticProps?.onPopupAlign);
  let explicitGeometry = $derived(Boolean(resolvedAlign || configuredPlacements));
  let customPosition = $derived(explicitGeometry || Boolean(alignCallback));
  let arrowConfig = $derived(getTooltipArrow(arrow, config.tooltip?.arrow));
  let sourceGeometry = $derived(sourceAnchor || Boolean(config.tooltip) || typeof arrow === 'object'
    || typeof autoAdjustOverflow === 'object' || explicitGeometry);
  let sourcePlacement = $derived(sourceGeometry || Boolean(alignCallback));
  let destroy = $derived(destroyOnHidden ?? semanticProps?.destroyOnHidden ?? false);
  let localClassNames = $derived(ownerClassName
    ? { root: ownerClassName } : semanticProps?.classNames);
  let callbackProps = $derived.by<TooltipSemanticProps>(() => {
    const source = getTooltipPlacementConfig(arrowConfig, designTokens.state.token);
    const placements = getPopupPlacements(
      source.pointAtCenter ?? false,
      source.arrowWidth,
      source.offset,
      source.radius,
      autoAdjustOverflow
    );
    for (const align of Object.values(placements)) align.htmlRegion = 'visibleFirst';
    return {
      ...(semanticProps ?? {
        title,
        open: rawOpen,
        placement,
        arrow,
        color,
        prefixCls,
        openClassName,
        destroyOnHidden,
        align,
        builtinPlacements,
        onPopupAlign,
        id: providedId,
        disabled,
        forceRender,
        zIndex
      }),
      ...(ownerClassName ? { classNames: localClassNames } : {}),
      trigger: semanticProps?.trigger || config.tooltip?.trigger
        || (config.tooltip ? 'hover' : ['hover', 'focus']),
      mouseEnterDelay: semanticProps?.mouseEnterDelay ?? config.tooltip?.mouseEnterDelay ?? 0.1,
      mouseLeaveDelay: semanticProps?.mouseLeaveDelay ?? config.tooltip?.mouseLeaveDelay ?? 0.1,
      getPopupContainer: configuredContainer,
      destroyOnHidden: destroy,
      builtinPlacements: configuredPlacements || placements
    };
  });
  let classPlacement = $derived.by(() => {
    if (!customPosition) {
      return open ? actualPlacement : placement;
    }
    return actualPosition?.sourceAlign
      ? getPopupPlacement(callbackProps.builtinPlacements, actualPosition.sourceAlign) : undefined;
  });
  let arrowPositionStyle = $derived(customPosition && actualPosition ? getPopupArrowStyle({
    align: actualPosition.sourceAlign,
    arrowX: actualPosition.arrowX,
    arrowY: actualPosition.arrowY
  }) : '');
  let semantics = $derived(getOverlaySemantics(
    config.tooltip,
    localClassNames,
    semanticProps?.styles,
    callbackProps
  ));
  let colorInfo = $derived(getTooltipColor(color, prefix));
  let rootClasses = $derived([
    prefix,
    'ant-tooltip-css-var',
    componentTheme.className,
    colorInfo.className,
    config.direction === 'rtl' && `${prefix}-rtl`,
    semanticProps?.rootClassName,
    config.tooltip?.class,
    semantics.classNames.root
  ]);
  let rootLayers = $derived([
    componentTheme.style,
    layer.style,
    colorInfo.arrowStyle,
    semantics.styles.root
  ]);
  let rootStyle = $derived(serializeInlineStyleLayers(rootLayers));
  let containerLayers = $derived([
    semantics.styles.container, colorInfo.overlayStyle
  ]);
  let refresh = $derived(fresh ?? semanticProps?.fresh ?? false);
  let payload = $derived({
    id: resolvedId,
    title,
    layers: containerLayers,
    classes: [`${prefix}-container`, semantics.classNames.container],
    customColor: colorInfo.overlayStyle.length > 0
  });
  let cached = $state.raw(untrack(() => ({ ...payload, title: captureContent(title) })));
  let rendered = $derived(open || refresh ? payload : cached);
  let id = $derived(rendered.id);
  const initialContainerStyle = untrack(() => serializeInlineStyleLayers(rendered.layers));
  const initialStyle = untrack(() => rootStyle);
  const popupStyle = createOverlayStyle(() => rootLayers);
  let available = $derived(contentAvailable ?? hasTooltipContent(title));
  const visible = $derived(open && available);
  const owner: TooltipUniqueOwner | undefined = context && {
    view: {
      kind: 'tooltip',
      get id() { return resolvedId; },
      get prefix() { return prefix; },
      get direction() { return config.direction; },
      get content() { return title; },
      get available() { return available; },
      get rootClasses() { return rootClasses; },
      get containerClasses() { return payload.classes; },
      get backgroundClasses() {
        return [`${prefix}-css-var`, componentTheme.className, semantics.classNames.container];
      },
      get rootLayers() { return [designTokens.style, ...rootLayers]; },
      get containerLayers() { return containerLayers; },
      get presetBackground() { return colorInfo.presetBackground; },
      get customColor() { return payload.customColor; },
      get anchor() { return anchor; },
      get trigger() { return trigger; },
      get placement() { return placement; },
      get autoAdjustOverflow() { return autoAdjustOverflow; },
      get sourcePlacement() {
        return sourceGeometry
          ? getTooltipPlacementConfig(arrowConfig, designTokens.state.token) : undefined;
      },
      get sourceAlign() { return explicitGeometry ? resolvedAlign ?? {} : undefined; },
      get placements() { return callbackProps.builtinPlacements; },
      get gap() {
        return designTokens.enabled || isTooltipCorner(placement) || sourceGeometry
          ? designTokens.state.token.marginXXS : undefined;
      },
      get motion() { return designTokens.state.token.motion; },
      get defaultMotionName() { return `${config.getPrefixCls()}-zoom-big-fast`; },
      get motionName() { return semanticProps?.motion?.motionName; },
      get outsideEvents() { return outsideEvents; },
      onDismiss: reason => onDismiss(reason),
      onHoverChange: next => onHoverChange?.(next)
    },
    context,
    isOpen: () => Boolean(grouped && visible && anchor?.isConnected)
  };
  const motion = useOverlayMotion(() => popup, () => ({
    visible,
    forceRender: force,
    enabled: designTokens.state.token.motion,
    defaultName: semanticProps ? `${config.getPrefixCls()}-zoom-big-fast` : undefined,
    customName: semanticProps?.motion?.motionName,
    afterOpenChange: settleVisibility
  }));
  const presented = $derived(visible || motion.leaving);
  let mounted = $state(false);
  let renderContent = $derived(!destroy || mounted && (force || visible || motion.retained));
  let initialized = false;
  const portal = createPopupContainer(() => ({
    open: !grouped && (force || presented),
    reference: anchor,
    getPopupContainer: grouped ? undefined : container,
    themeStyle: rootStyle
  }));

  onMount(() => { mounted = true; });
  onDestroy(() => { if (owner) group?.release(owner); });

  $effect(() => {
    if (!group || !owner) return;
    if (!grouped) {
      untrack(() => group.release(owner));
      return;
    }

    const next = owner.isOpen();
    untrack(() => {
      const delay = next ? semanticProps?.mouseEnterDelay ?? config.tooltip?.mouseEnterDelay
        : semanticProps?.mouseLeaveDelay ?? config.tooltip?.mouseLeaveDelay;
      group.request(owner, next, getTooltipDelay(delay));
    });
  });

  $effect.pre(() => {
    // The first forced render receives the current payload. Later updates while hidden use fresh.
    if (open || refresh || force && !initialized) {
      cached = { ...payload, title: captureContent(title) };
    }
    if (open || force) {
      initialized = true;
    }
    else if (destroy) initialized = false;
  });

  // The array snapshot retains no reactive proxy. Svelte still owns the Snippet's internal state.
  function captureContent(value: TooltipContent): TooltipContent {
    return Array.isArray(value) ? value.map(captureContent) : value;
  }

  function containerStyle(node: HTMLElement) {
    const update = connectInlineStyle(node);
    $effect(() => update(rendered.layers));
  }

  export function getPopupElement() {
    return grouped && owner ? group?.surfaceFor(owner)?.getPopupElement() : popup;
  }

  export function forceAlign() {
    untrack(() => {
      if (grouped && owner) group?.surfaceFor(owner)?.forceAlign();
      else if (open && available) connection?.forceAlign();
    });
  }

  function settleVisibility(next: boolean) {
    if (next) connection?.align();
    semanticProps?.afterOpenChange?.(next);
  }

  $effect(() => {
    if (grouped && !(visible && group?.owner === owner && group?.open)) return;
    if (describe && available && !resolvedDisabled) {
      return typeof describe === 'function' ? describe(id) : connectTooltipDescription(describe, id);
    }
  });

  $effect(() => {
    if (anchor && open && available) {
      return connectTooltipOpenClass(anchor, resolvedOpenClassName);
    }
  });

  $effect(() => {
    const surface = popup;
    const reference = anchor;
    const source = trigger;

    if (!surface || !reference || !presented) {
      return;
    }

    const disconnect = untrack(() => connectPopup(surface, reference, {
      trigger: source,
      get interactive() { return visible; },
      pauseAlignment: () => motion.pauseAlignment,
      get placement() { return placement; },
      get autoAdjustOverflow() { return autoAdjustOverflow; },
      get sourcePlacement() {
        return sourcePlacement
          ? getTooltipPlacementConfig(arrowConfig, designTokens.state.token) : undefined;
      },
      get sourceAlign() { return customPosition ? resolvedAlign ?? {} : undefined; },
      get builtinPlacements() { return configuredPlacements; },
      get onAlign() {
        return customPosition ? (position: TooltipPosition) => {
          actualPosition = position;
          alignCallback?.(surface, position.sourceAlign ?? {});
        } : undefined;
      },
      onVisibilityChange: shown => {
        if (shown && customPosition) {
          queueMicrotask(() => {
            if (open && available) connection?.forceAlign();
          });
        }
      },
      gap: () => untrack(() => designTokens.enabled || isTooltipCorner(placement) || sourcePlacement
        ? (arrowConfig.show ? designTokens.state.token.sizePopupArrow / 2 : 0)
          + designTokens.state.token.marginXXS : undefined),
      get outsideEvents() { return outsideEvents; },
      onDismiss: reason => onDismiss(reason),
      applyPosition: popupStyle.position,
      onPlacement: (next) => {
        actualPlacement = next;
      }
    }));
    connection = disconnect;

    return () => {
      connection = undefined;
      disconnect();
    };
  });
</script>

<style>
  [data-ant-tooltip] {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
  }
  [data-ant-tooltip][hidden], [data-ant-tooltip]:not(:popover-open) { display: none; }
  [data-ant-tooltip-container] {
    display: block;
    max-height: calc(100dvh - 16px);
    overflow: auto;
    overflow-wrap: anywhere;
  }
  [data-ant-placement="top"] > [data-ant-tooltip-arrow], [data-ant-placement="bottom"] > [data-ant-tooltip-arrow] { left: var(--arrow-x, 50%); }
  [data-ant-placement="left"] > [data-ant-tooltip-arrow], [data-ant-placement="right"] > [data-ant-tooltip-arrow] { top: var(--arrow-y, 50%); }
  /* With no getter, the upstream portal isolates the parent popup's private contrast. */
  :global([data-ant-overlay-color]) [data-ant-tooltip][data-ant-tooltip-inline] { --ant-tooltip-overlay-color: initial; }
  @media (prefers-reduced-motion: reduce) {
    [data-ant-tooltip], [data-ant-tooltip-container] {
      animation: none;
      transition: none;
    }
  }
</style>

{#if prefixCss && (!grouped || group?.owner === owner)}<ThemeScopeStyle css={prefixCss}
  scope={`tooltip-prefix:${prefix}`} />{/if}{#if !grouped}<span bind:this={popup} {id} role="tooltip" popover="manual" hidden dir={config.direction}
  inert={motion.leaving || undefined}
  data-ant-tooltip="" data-ant-placement={classPlacement} data-ant-overlay-motion={motion.zoom}
  data-ant-tooltip-inline={!container || undefined} class={[
    rootClasses,
    classPlacement && `${prefix}-placement-${classPlacement}`,
    motion.className
  ]} style={initialStyle}
  {@attach popupStyle.attach} {@attach portal}
  onpointerenter={(event) => {
      if (event.pointerType !== 'touch')
        onHoverChange?.(true);
    }} onpointerleave={() => onHoverChange?.(false)}
  onanimationend={motion.end} ontransitionend={motion.end}>
  {#if arrowConfig.show}<span data-ant-tooltip-arrow="" class={[`${prefix}-arrow`, semantics.classNames.arrow]}
    style={arrowPositionStyle
      ? `${arrowPositionStyle};${semantics.styles.arrow ?? ''}` : semantics.styles.arrow}
    aria-hidden="true"></span>{/if}
  <span data-ant-tooltip-container="" class={rendered.classes}
    data-ant-overlay-color={rendered.customColor || undefined}
    style={initialContainerStyle} {@attach containerStyle}
    tabindex="-1">{#if renderContent}<RenderContent value={rendered.title} />{/if}</span>
</span>{/if}
