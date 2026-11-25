<script lang="ts">
  // Применяет размеры, положение и содержимое всплывающей поверхности. Императивное выравнивание
  // использует текущий popup.
  import { getAllContexts, onDestroy, onMount, untrack } from 'svelte';
  import RenderContent from './RenderContent.svelte';
  import TooltipUniqueContent from './TooltipUniqueContent.svelte';
  import { connectTooltipUniqueBackground } from './tooltip-unique-background.dom';
  import {
    hasTooltipPopupAncestor, isolateTooltipUnique, useTooltipUnique, type TooltipUniqueOwner
  } from './tooltip-unique.model.svelte';
  import { useConfig } from './config-context';
  import { useComponentTheme } from './theme-component.svelte';
  import { getOverlaySemantics } from './overlay-semantic.engine';
  import { createOverlayStyle } from './overlay-style.model.svelte';
  import { useOverlayMotion } from './overlay-motion.svelte';
  import { getPopupArrowStyle, getPopupPlacement, getPopupPlacements } from './popup-position.engine';
  import type { TooltipPosition } from './tooltip.engine';
  import { getTooltipColor } from './tooltip-color.engine';
  import { getOverlayPrefixCss } from './overlay-prefix.engine';
  import prefixTemplate from './vendor/tooltip-prefix.css.js';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { connectInlineStyle } from './inline-style.dom';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { provideZIndex, useZIndex, type ZIndexLayer } from './z-index-context.svelte';
  import { connectTooltipDescription, connectTooltipOpenClass } from './tooltip.dom';
  import {
    getTooltipArrow,
    getTooltipDelay,
    getTooltipPlacementConfig,
    hasTooltipContent,
    isTooltipCorner
  } from './tooltip.engine';
  import { connectPopup, type PopupConnection } from './popup.dom';
  import { createPopupContainer } from './popup-container.model.svelte.js';
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
    presentation,
    outsideEvents,
    onDismiss,
    onHoverChange
  } = $derived(props);

  const localConfig = useConfig();
  const localTheme = useComponentTheme('Tooltip');
  const localTokens = useDesignTokenContext();
  const group = useTooltipUnique();
  if (group) isolateTooltipUnique();
  const context = group ? getAllContexts() : undefined;
  const grouped = $derived(Boolean(group && !presentation
    && (unique ?? semanticProps?.unique) !== false && !hasTooltipPopupAncestor(anchor)));
  const config = $derived(presentation?.owner?.config ?? localConfig);
  const componentTheme = $derived(presentation?.owner?.theme ?? localTheme);
  const designTokens = $derived(presentation?.owner?.tokens ?? localTokens);
  let prefix = $derived(config.getPrefixCls('tooltip', prefixCls));
  let prefixCss = $derived(getOverlayPrefixCss('tooltip', prefix, prefixTemplate));
  let resolvedOpenClassName = $derived(openClassName || semanticProps?.openClassName || `${prefix}-open`);
  const generatedId = $props.id();
  let resolvedId = $derived((providedId ?? semanticProps?.id) || `ant-tooltip-${generatedId}`);
  let resolvedDisabled = $derived(!presentation && (disabled ?? semanticProps?.disabled ?? false));
  let open = $derived(rawOpen && !resolvedDisabled);
  let force = $derived(!presentation && (forceRender ?? semanticProps?.forceRender ?? false));
  const localLayer = useZIndex('container', () => zIndex ?? semanticProps?.zIndex);
  const layer = $derived(zIndexLayer ?? localLayer);
  provideZIndex(() => layer.contextZIndex);
  let popup = $state<HTMLSpanElement>();
  let connection: PopupConnection | undefined;
  let backgroundLayout: ReturnType<typeof connectTooltipUniqueBackground> | undefined;
  let actualPlacement = $state(untrack(() => placement));
  let actualPosition = $state.raw<TooltipPosition>();
  let resolvedAlign = $derived(align ?? semanticProps?.align);
  let configuredPlacements = $derived(builtinPlacements ?? semanticProps?.builtinPlacements);
  let configuredContainer = $derived(getPopupContainer || config.getPopupContainer);
  // Fallback встроенной подсказки принадлежит порталу, semantic props отражают конфигурацию.
  let container = $derived(presentation ? defaultTooltipContainer : configuredContainer
    || (sourceAnchor ? defaultTooltipContainer : undefined));
  let alignCallback = $derived(presentation ? undefined : onPopupAlign ?? semanticProps?.onPopupAlign);
  let customPosition = $derived(Boolean(resolvedAlign || configuredPlacements || alignCallback));
  let placementArrow = $derived(getTooltipArrow(arrow, config.tooltip?.arrow));
  let arrowConfig = $derived(presentation ? { ...placementArrow, show: false } : placementArrow);
  let sourcePlacement = $derived(sourceAnchor || Boolean(config.tooltip) || typeof arrow === 'object'
    || typeof autoAdjustOverflow === 'object' || customPosition);
  let destroy = $derived(!presentation && (destroyOnHidden ?? semanticProps?.destroyOnHidden ?? false));
  let localClassNames = $derived(ownerClassName
    ? { root: ownerClassName } : semanticProps?.classNames);
  let callbackProps = $derived.by<TooltipSemanticProps>(() => {
    const source = getTooltipPlacementConfig(placementArrow, designTokens.state.token);
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
  let rootLayers = $derived([
    presentation ? designTokens.style : undefined,
    componentTheme.style,
    layer.style,
    colorInfo.arrowStyle,
    semantics.styles.root
  ]);
  let rootStyle = $derived(serializeInlineStyleLayers(rootLayers));
  let containerLayers = $derived([
    semantics.styles.container, colorInfo.overlayStyle
  ]);
  let refresh = $derived(Boolean(presentation) || (fresh ?? semanticProps?.fresh ?? false));
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
    get props() { return { ...props, id: resolvedId, zIndexLayer: layer }; },
    config: localConfig,
    tokens: localTokens,
    theme: localTheme,
    get layer() { return layer; },
    context,
    isOpen: () => Boolean(grouped && visible && anchor?.isConnected)
  };
  const motion = useOverlayMotion(() => popup, () => ({
    visible,
    forceRender: force,
    enabled: designTokens.state.token.motion,
    defaultName: semanticProps || presentation ? `${config.getPrefixCls()}-zoom-big-fast` : undefined,
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
    if (!group || !owner || presentation) return;
    if (!grouped) {
      untrack(() => group.release(owner));
      return;
    }

    const next = owner.isOpen();
    untrack(() => {
      const delay = next ? semanticProps?.mouseEnterDelay ?? localConfig.tooltip?.mouseEnterDelay
        : semanticProps?.mouseLeaveDelay ?? localConfig.tooltip?.mouseLeaveDelay;
      group.request(owner, next, getTooltipDelay(delay));
    });
  });

  // Встроенная подсказка внутри нативного модального окна остаётся в его top layer.
  function defaultTooltipContainer(element: HTMLElement) {
    return element.closest<HTMLDialogElement>('dialog:modal') ?? element.ownerDocument.body;
  }

  $effect.pre(() => {
    // Первый force render получает текущий payload; последующие скрытые updates используют fresh.
    if (open || refresh || force && !initialized) {
      cached = { ...payload, title: captureContent(title) };
    }
    if (open || force) {
      initialized = true;
    }
    else if (destroy) initialized = false;
  });

  // Снимок массива не удерживает reactive proxy; внутреннее состояние Snippet остаётся Svelte-owned.
  function captureContent(value: TooltipContent): TooltipContent {
    return Array.isArray(value) ? value.map(captureContent) : value;
  }

  function containerStyle(node: HTMLElement) {
    const update = connectInlineStyle(node);
    $effect(() => update(rendered.layers));
  }

  function attachBackground(node: HTMLElement) {
    const update = connectInlineStyle(node);
    const current = connectTooltipUniqueBackground(node,
      () => Boolean(presentation?.ready && designTokens.state.token.motion));
    backgroundLayout = current;
    $effect(() => update(rendered.layers));
    $effect(current.syncMotion);

    return () => {
      current.destroy();
      backgroundLayout = undefined;
    };
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
    else backgroundLayout?.stop();
    if (presentation) {
      presentation.settled(next);
      return;
    }

    semanticProps?.afterOpenChange?.(next);
  }

  $effect(() => {
    if (presentation || grouped && !(visible && group?.owner === owner && group?.open)) return;
    if (describe && available && !resolvedDisabled) {
      return typeof describe === 'function' ? describe(id) : connectTooltipDescription(describe, id);
    }
  });

  $effect(() => {
    if (!presentation && anchor && open && available) {
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

    let bounds: DOMRect | undefined;
    const shared = presentation;
    const disconnect = untrack(() => connectPopup(surface, reference, {
      trigger: source,
      get interactive() { return visible; },
      pauseAlignment: () => motion.pauseAlignment,
      get placement() { return placement; },
      get autoAdjustOverflow() { return autoAdjustOverflow; },
      get sourcePlacement() {
        return sourcePlacement
          ? getTooltipPlacementConfig(placementArrow, designTokens.state.token) : undefined;
      },
      get sourceAlign() { return customPosition ? resolvedAlign ?? {} : undefined; },
      get builtinPlacements() { return shared ? sharedPlacements : configuredPlacements; },
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
      measurePopup: shared ? () => (bounds = surface.getBoundingClientRect()) : undefined,
      applyPosition: next => {
        if (bounds && backgroundLayout) backgroundLayout.position(next, bounds, popupStyle.position);
        else popupStyle.position(next);
      },
      onPlacement: (next) => {
        actualPlacement = next;
      }
    }));
    connection = disconnect;

    return () => {
      connection = undefined;
      disconnect(Boolean(shared));
    };
  });

  // Аргументы align не мутируются при отключении динамического правого/нижнего inset.
  const sharedPlacements = $derived.by(() => Object.fromEntries(
    Object.entries(callbackProps.builtinPlacements).map(([name, value]) => [
      name, { ...value, dynamicInset: false }
    ])
  ));
</script>

<style>
  [data-ant-tooltip] { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; background: transparent; overflow: visible; }
  [data-ant-tooltip][hidden], [data-ant-tooltip]:not(:popover-open) { display: none; }
  [data-ant-tooltip-container] { display: block; max-height: calc(100dvh - 16px); overflow: auto; overflow-wrap: anywhere; }
  [data-ant-tooltip-unique-background] {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: var(--ant-border-radius);
    background: var(--ant-tooltip-unique-color, var(--ant-color-bg-spotlight));
    pointer-events: none;
    z-index: -1;
  }
  [data-ant-tooltip-unique] > [data-ant-tooltip-container] {
    background: transparent !important;
    box-shadow: none !important;
  }
  @media (prefers-reduced-motion: no-preference) {
    [data-ant-tooltip-unique-fade] {
      animation: tooltip-unique-fade var(--ant-motion-duration-mid, 0.2s) linear both;
    }
  }
  @keyframes tooltip-unique-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  [data-ant-placement="top"] > [data-ant-tooltip-arrow], [data-ant-placement="bottom"] > [data-ant-tooltip-arrow] { left: var(--arrow-x, 50%); }
  [data-ant-placement="left"] > [data-ant-tooltip-arrow], [data-ant-placement="right"] > [data-ant-tooltip-arrow] { top: var(--arrow-y, 50%); }
  /* Без getter source portal изолирует private contrast родительского popup. */
  :global([data-ant-overlay-color]) [data-ant-tooltip][data-ant-tooltip-inline] { --ant-tooltip-overlay-color: initial; }
  @media (prefers-reduced-motion: reduce) { [data-ant-tooltip], [data-ant-tooltip-container] { animation: none; transition: none; } }
</style>

{#snippet popupBody()}
  <span data-ant-tooltip-container="" class={rendered.classes}
    data-ant-tooltip-unique-fade={presentation && designTokens.state.token.motion || undefined}
    data-ant-overlay-color={rendered.customColor || undefined}
    style={initialContainerStyle} {@attach containerStyle}
    tabindex="-1">{#if renderContent}{#if presentation?.owner}<TooltipUniqueContent
      context={presentation.owner?.context} content={rendered.title} />
    {:else}<RenderContent value={rendered.title} />{/if}{/if}</span>
{/snippet}

{#if !grouped}{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`tooltip-prefix:${prefix}`} />{/if}<span bind:this={popup} {id} role="tooltip" popover="manual" hidden dir={config.direction}
  inert={motion.leaving || undefined}
  data-ant-tooltip="" data-ant-placement={classPlacement} data-ant-overlay-motion={motion.zoom}
  data-ant-tooltip-unique={Boolean(presentation) || undefined}
  data-ant-tooltip-inline={!container || undefined} class={[
    prefix,
    'ant-tooltip-css-var',
    componentTheme.className,
    colorInfo.className,
    classPlacement && `${prefix}-placement-${classPlacement}`,
    config.direction === 'rtl' && `${prefix}-rtl`,
    semanticProps?.rootClassName,
    config.tooltip?.class, semantics.classNames.root,
    presentation && `${prefix}-unique-controlled`,
    motion.className
  ]} style={initialStyle}
  {@attach popupStyle.attach} {@attach portal}
  onpointerenter={(event) => {
      if (event.pointerType !== 'touch')
        onHoverChange?.(true);
    }} onpointerleave={() => onHoverChange?.(false)}
  onanimationend={motion.end} ontransitionend={motion.end}>
  {#if presentation}<span data-ant-tooltip-unique-background="" aria-hidden="true"
    class={[`${prefix}-unique-container`, `${prefix}-css-var`, componentTheme.className,
      semantics.classNames.container, classPlacement && `${prefix}-placement-${classPlacement}`,
      presentation.ready && `${prefix}-unique-container-visible`,
      !presented && `${prefix}-unique-container-hidden`]}
    style:--ant-tooltip-unique-color={colorInfo.className && color && !color.endsWith('-inverse')
      ? `var(--ant-${color}-6)` : undefined}
    {@attach attachBackground}></span>{/if}
  {#if arrowConfig.show}<span data-ant-tooltip-arrow="" class={[`${prefix}-arrow`, semantics.classNames.arrow]}
    style={arrowPositionStyle
      ? `${arrowPositionStyle};${semantics.styles.arrow ?? ''}` : semantics.styles.arrow}
    aria-hidden="true"></span>{/if}
  {#key presentation?.owner}{@render popupBody()}{/key}
</span>{/if}
