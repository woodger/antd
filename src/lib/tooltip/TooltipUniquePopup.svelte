<script lang="ts">
  // One native surface supplies a shared background for tooltips and cards. Content mounts in the
  // selected trigger's context. Changing owners reconnects only alignment.
  import { untrack } from 'svelte';
  import TooltipUniqueContent from './TooltipUniqueContent.svelte';
  import { connectInlineStyle } from '../style/inline-style.dom';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { useOverlayMotion } from '../popup/overlay-motion.svelte';
  import { createOverlayStyle } from '../popup/overlay-style.model.svelte';
  import { createPopupContainer } from '../popup/popup-container.model.svelte';
  import { connectPopup, type PopupConnection } from '../popup/popup.dom';
  import { getPopupPlacement } from '../popup/popup-position.engine';
  import { defaultTooltipContainer } from './tooltip.dom';
  import type { TooltipPosition } from './tooltip.engine';
  import { connectTooltipUniqueBackground } from './tooltip-unique-background.dom';
  import type { TooltipUnique, TooltipUniqueOwner } from './tooltip-unique.model.svelte';

  let { group }: { group: TooltipUnique; } = $props();
  let popup = $state<HTMLDivElement>();
  let shownOwner = $state.raw<TooltipUniqueOwner>();
  let layout = $state.raw<{ owner: TooltipUniqueOwner; position: TooltipPosition; }>();
  let connection: PopupConnection | undefined;
  let connectedOwner: TooltipUniqueOwner | undefined;
  let backgroundLayout: ReturnType<typeof connectTooltipUniqueBackground> | undefined;

  const owner = $derived(group.owner);
  const view = $derived(owner?.view);
  const tooltip = $derived(view?.kind === 'tooltip');
  const visible = $derived(Boolean(group.open && view?.available));
  const rootLayers = $derived(view?.rootLayers ?? []);
  const initialStyle = untrack(() => serializeInlineStyleLayers(rootLayers));
  const popupStyle = createOverlayStyle(() => rootLayers);
  const motion = useOverlayMotion(() => popup, () => ({
    visible,
    forceRender: false,
    enabled: view?.motion ?? false,
    defaultName: view?.defaultMotionName,
    customName: view?.motionName,
    afterOpenChange: settleVisibility
  }));
  const presented = $derived(visible || motion.leaving);
  const portal = createPopupContainer(() => ({
    open: presented,
    reference: view?.anchor,
    getPopupContainer: defaultTooltipContainer,
    themeStyle: serializeInlineStyleLayers(rootLayers)
  }));
  const placement = $derived.by(() => {
    const position = layout?.owner === owner ? layout?.position : undefined;
    if (view?.sourceAlign) {
      const align = position?.sourceAlign;
      return align ? getPopupPlacement(view.placements, align) : undefined;
    }

    return group.open && position ? position.placement : view?.placement;
  });
  const placementClass = $derived(
    view && placement ? `${view.prefix}-placement-${placement}` : undefined
  );

  // After movement, restores ordinary geometry and allows the queued owner change.
  function settleVisibility(next: boolean) {
    if (next) {
      connection?.align();
    }
    else {
      backgroundLayout?.stop();
    }
    group.settled(next);
  }

  function attachContainer(node: HTMLElement) {
    const update = connectInlineStyle(node);
    $effect(() => update(view?.containerLayers ?? []));
  }

  function attachBackground(node: HTMLElement) {
    const update = connectInlineStyle(node);
    const background = connectTooltipUniqueBackground(
      node, () => Boolean(group.ready && view?.motion)
    );
    backgroundLayout = background;
    $effect(() => update(view?.containerLayers ?? []));
    $effect(background.syncMotion);

    return () => {
      background.destroy();
      backgroundLayout = undefined;
    };
  }

  export function getPopupElement() {
    return popup;
  }

  export function isShowing() {
    return owner !== undefined && owner === shownOwner;
  }

  export function forceAlign() {
    connection?.forceAlign();
  }

  $effect.pre(() => {
    const surface = popup;
    const next = owner;
    const previous = connectedOwner;
    if (surface && previous && previous !== next) {
      // Transfers focus before removing the previous owner's snippet.
      untrack(() => previous.view.onTransfer?.(surface));
    }
  });

  $effect(() => {
    const surface = popup;
    const current = owner;
    const selected = current?.view;
    const reference = selected?.anchor;
    const trigger = selected?.trigger;
    if (!surface || !current || !selected || !reference || !presented) {
      return;
    }

    shownOwner = undefined;
    let bounds: DOMRect | undefined;
    // Upstream computes right and bottom coordinates for a separate panel. The shared background
    // moves from its top-left corner and preserves the caller's placements.
    const placements = $derived(Object.fromEntries(
      Object.entries(selected.placements).map(([key, align]) => [
        key, { ...align, dynamicInset: false }
      ])
    ));
    const disconnect = untrack(() => connectPopup(surface, reference, {
      trigger,
      preserveFocus: selected.kind === 'tooltip',
      maxWidth: selected.kind === 'dialog' ? '100vw' : undefined,
      get interactive() { return visible && group.owner === current; },
      get outsideEvents() { return selected.outsideEvents; },
      get placement() { return selected.placement; },
      get autoAdjustOverflow() { return selected.autoAdjustOverflow; },
      get sourcePlacement() { return selected.sourcePlacement; },
      get sourceAlign() { return selected.sourceAlign; },
      get builtinPlacements() { return placements; },
      gap: () => selected.gap,
      pauseAlignment: () => motion.pauseAlignment,
      onDismiss: selected.onDismiss,
      measurePopup: () => (bounds = surface.getBoundingClientRect()),
      applyPosition: position => {
        if (bounds && backgroundLayout) {
          backgroundLayout.position(position, bounds, popupStyle.position);
        }
        else {
          popupStyle.position(position);
        }
      },
      onPlacement: (_next, position) => {
        layout = { owner: current, position };
      },
      onVisibilityChange: next => {
        if (next) {
          shownOwner = current;
        }
        else if (shownOwner === current) {
          shownOwner = undefined;
          selected.onHidden?.();
        }
      }
    }));
    connection = disconnect;
    connectedOwner = current;

    return () => {
      connection = undefined;
      connectedOwner = undefined;
      disconnect(true);
    };
  });
</script>

<style>
  [data-ant-tooltip-unique] {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
  }
  [data-ant-tooltip-unique][hidden], [data-ant-tooltip-unique]:not(:popover-open) { display: none; }
  [data-ant-tooltip-unique-content] {
    display: block;
    box-sizing: border-box;
    max-height: calc(100dvh - 16px);
    overflow: auto;
    overflow-wrap: anywhere;
    background: transparent !important;
    box-shadow: none !important;
  }
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
  [data-ant-popover] > [data-ant-tooltip-unique-background] {
    border-radius: var(--ant-border-radius-lg);
    background: var(--ant-tooltip-unique-color, var(--ant-color-bg-elevated));
  }
  [data-ant-popover][data-ant-custom-prefix] :global([data-ant-popover-title]) {
    min-width: min(var(--ant-popover-title-min-width), calc(100vw - 48px));
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
</style>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Only the dialog receives a negative tabindex.) -->
<div bind:this={popup}
  id={view?.id}
  role={view?.kind ?? 'tooltip'}
  tabindex={tooltip ? undefined : -1}
  dir={view?.direction}
  aria-label={view?.ariaLabel}
  aria-labelledby={view?.ariaLabelledby}
  aria-describedby={view?.ariaDescribedby}
  aria-busy={view?.ariaBusy}
  popover="manual" hidden inert={motion.leaving || undefined}
  data-ant-tooltip-unique=""
  data-ant-tooltip={tooltip ? '' : undefined}
  data-ant-popover={tooltip ? undefined : ''}
  data-ant-custom-prefix={view && view.prefix !== (tooltip ? 'ant-tooltip' : 'ant-popover') || undefined}
  data-ant-placement={placement}
  data-ant-overlay-motion={motion.zoom}
  class={[
    view?.rootClasses,
    placementClass,
    view && `${view.prefix}-unique-controlled`,
    motion.className
  ]}
  style={initialStyle} {@attach popupStyle.attach} {@attach portal}
  onpointerenter={event => {
    if (event.pointerType !== 'touch') view?.onHoverChange?.(true);
  }}
  onpointerleave={() => view?.onHoverChange?.(false)}
  onfocusin={event => view?.onFocusIn?.(event)}
  onfocusout={event => view?.onFocusOut?.(event)}
  onclick={view?.onPopupClick}
  onanimationend={motion.end} ontransitionend={motion.end}>
  <span data-ant-tooltip-unique-background="" aria-hidden="true"
    class={[
      view?.backgroundClasses,
      view && `${view.prefix}-unique-container`,
      placementClass,
      view && group.ready && `${view.prefix}-unique-container-visible`,
      view && !presented && `${view.prefix}-unique-container-hidden`
    ]}
    style:--ant-tooltip-unique-color={view?.presetBackground}
    {@attach attachBackground}></span>
  {#key owner}{#if view}<svelte:element this={tooltip ? 'span' : 'div'}
    data-ant-tooltip-unique-content=""
    data-ant-tooltip-container={tooltip ? '' : undefined}
    data-ant-popover-container={tooltip ? undefined : ''}
    data-ant-tooltip-unique-fade={view.motion || undefined}
    data-ant-overlay-color={view.customColor || undefined}
    tabindex={tooltip ? -1 : undefined}
    class={view.containerClasses}
    {@attach attachContainer}><TooltipUniqueContent
    context={owner?.context} content={view.content} clearCompact={!tooltip} />
  </svelte:element>{/if}{/key}
</div>
