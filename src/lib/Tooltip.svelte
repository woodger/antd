<script module lang="ts">
  import { getContext, setContext } from 'svelte';

  interface TooltipAnchor {
    element: () => HTMLElement | undefined;
    enabled: () => boolean;
    connectClick: (handler: (event: MouseEvent) => void) => () => void;
    connectDescription?: (id: string) => () => void;
  }

  const anchorKey = Symbol('tooltip-anchor');

  /** Attaches Tooltip to an existing element without a wrapper or public prop changes. */
  export function provideTooltipAnchor(anchor: TooltipAnchor) {
    setContext(anchorKey, anchor);
  }
</script>

<script lang="ts">
  // Coordinates Tooltip opening delays with trigger events. The popup receives the accepted
  // visibility state.
  import NoCompactStyle from './space/NoCompactStyle.svelte';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import { useConfig } from './config-context';
  import { provideZIndex, useZIndex } from './z-index-context.svelte';
  import {
    getTooltipActions,
    getTooltipContent,
    getTooltipDelay,
    hasTooltipContent
  } from './tooltip.engine';
  import type { TooltipProps, TooltipRef, TooltipTrigger } from './tooltip.types';
  import TooltipPopup from './TooltipPopup.svelte';

  let {
    ref = $bindable<TooltipRef | undefined>(),
    open = $bindable<boolean | undefined>(),
    open: providedOpen,
    ...props
  }: TooltipProps & { ref?: TooltipRef } = $props();
  let {
    title,
    overlay,
    children,
    defaultOpen = false,
    onOpenChange,
    placement = 'top',
    arrow,
    autoAdjustOverflow = true,
    trigger,
    mouseEnterDelay,
    mouseLeaveDelay,
    getPopupContainer,
    class: className = '',
    style
  } = $derived(props);

  const config = useConfig();
  const layer = useZIndex('container', () => props.zIndex);
  provideZIndex(() => layer.contextZIndex);
  const external = getContext<TooltipAnchor | undefined>(anchorKey);
  if (external) {
    // A Tooltip inside custom content gets its own trigger.
    setContext(anchorKey, undefined);
  }
  // Upstream configuration uses hover. Without it, the existing native hover and focus behavior stays in use.
  let resolvedTrigger = $derived<TooltipTrigger | readonly TooltipTrigger[]>(
    trigger || config.tooltip?.trigger || (external || config.tooltip ? 'hover' : ['hover', 'focus'])
  );
  let enterDelay = $derived(mouseEnterDelay ?? config.tooltip?.mouseEnterDelay ?? 0.1);
  let leaveDelay = $derived(mouseLeaveDelay ?? config.tooltip?.mouseLeaveDelay ?? 0.1);
  let actionOverrides = $derived(props.showAction !== undefined || props.hideAction !== undefined);
  let actions = $derived(getTooltipActions(resolvedTrigger, props.showAction, props.hideAction));
  let sourceTouch = $derived(actionOverrides || Boolean(external || config.tooltip));
  let sourceTrigger = $derived(Boolean(external || config.tooltip) || resolvedTrigger.length === 0
    || supports('click') || supports('contextMenu') || actionOverrides);
  const initialDefault = untrack(() => defaultOpen);
  // Separate raw state survives spread prop updates without an open prop.
  let uncontrolledOpen = $state(initialDefault);
  let rawOpen = $derived(providedOpen === undefined ? uncontrolledOpen : open ?? initialDefault);
  let wrapper = $state<HTMLSpanElement>();
  let childAnchor = $state<Element>();
  let host = $derived(external ? external.element() : wrapper);
  let anchor = $derived(external ? host : childAnchor);
  let popupController = $state<{
    getPopupElement: () => HTMLSpanElement | undefined;
    forceAlign: () => void;
  }>();
  let pending: ReturnType<typeof setTimeout> | undefined;
  let hovered = false;
  let focused = false;
  let popupHovered = false;
  let clicked = false;
  let dismissed = false;
  let touched = false;
  let active = true;
  let content = $derived(getTooltipContent(title, overlay));
  let available = $derived(hasTooltipContent(content));
  let visible = $derived(!props.disabled && available && rawOpen);
  const describe = $derived(anchor && (!external || visible)
    ? external?.connectDescription ?? anchor : undefined);
  let popupVisited = $state(false);
  const renderPopup = $derived(!external || props.forceRender || visible || popupVisited);

  $effect.pre(() => {
    if (external && (visible || props.forceRender)) popupVisited = true;
  });

  onMount(() => {
    ref = {
      get nativeElement() { return anchor; },
      get popupElement() { return popupController?.getPopupElement(); },
      forceAlign: () => untrack(() => popupController?.forceAlign())
    };

    return () => { ref = undefined; };
  });

  $effect(() => {
    const element = wrapper;

    if (!element) {
      return;
    }

    function update() {
      childAnchor = element!.firstElementChild ?? element;
    }

    update();
    const observer = new MutationObserver(update);
    observer.observe(element, { childList: true });

    return () => observer.disconnect();
  });

  $effect(() => {
    const element = external?.element();
    if (!external || !element || !external.enabled()) {
      return;
    }

    const disconnect = [
      on(element, 'pointerenter', handleEnter),
      on(element, 'pointerleave', handleLeave),
      on(element, 'focusin', handleFocus),
      on(element, 'focusout', handleBlur),
      external.connectClick(handleClick),
      on(element, 'contextmenu', handleContextMenu),
      on(element, 'touchstart', handleTouchStart)
    ];

    return () => {
      for (const dispose of disconnect) dispose();
      cancelPending();
      hovered = false;
      focused = false;
      popupHovered = false;
      clicked = false;
      dismissed = false;
      touched = false;
    };
  });

  onDestroy(() => {
    active = false;
    cancelPending();
  });

  function cancelPending() {
    if (pending !== undefined)
      clearTimeout(pending);
    pending = undefined;
  }

  function supports(kind: TooltipTrigger) {
    return typeof resolvedTrigger === 'string'
      ? resolvedTrigger === kind : resolvedTrigger.includes(kind);
  }

  function wanted() {
    return !dismissed
      && (clicked
        || hovered
        && supports('hover')
        || focused
        && supports('focus')
        || popupHovered);
  }

  function request(next: boolean, delay = 0) {
    cancelPending();
    const target = anchor;
    const ownerValue = providedOpen;
    // Removing overrides does not cancel an upstream action already in progress.
    const independentActions = actionOverrides;

    function apply() {
      pending = undefined;

      if (!active
        || !available
        || !target?.isConnected
        || target !== anchor
        || !Object.is(
          providedOpen,
          ownerValue
        )
        || !independentActions && !actionOverrides && next
        && !wanted()
        || next === rawOpen) {
        return;
      }

      // When attached to an existing node, state belongs to its owner.
      if (!external) {
        uncontrolledOpen = next;
        open = next;
      }
      onOpenChange?.(next);
    }

    if (delay !== 0) {
      pending = setTimeout(apply, delay);
    }
    else {
      apply();
    }
  }

  function handleEnter(event: PointerEvent) {
    if (event.pointerType === 'touch' || sourceTouch && touched) {
      return;
    }

    hovered = true;
    dismissed = false;
    if (actions.show.has('hover'))
      request(true, getTooltipDelay(enterDelay));
  }

  function handleLeave() {
    if (sourceTouch && touched) {
      return;
    }

    hovered = false;
    if (sourceTrigger ? actions.hide.has('hover') : !wanted())
      request(false, getTooltipDelay(leaveDelay));
  }

  function handleFocus() {
    focused = true;
    dismissed = false;
    if (actions.show.has('focus'))
      request(true, (props.focusDelay ?? 0) * 1000);
  }

  function handleBlur(event: FocusEvent) {
    const target = anchor;
    function closeIfOutside() {
      if (!active || !target?.isConnected || target !== anchor) {
        return;
      }
      if (event.relatedTarget instanceof Node && host?.contains(event.relatedTarget)) {
        return;
      }

      focused = false;
      if (sourceTrigger ? actions.hide.has('focus') : !wanted()) {
        request(false, (props.blurDelay ?? 0) * 1000);
      }
    }
    // Native blur without a relatedTarget also fires when the focused DOM is removed.
    if (event.relatedTarget === null) {
      queueMicrotask(closeIfOutside);
    }
    else {
      closeIfOutside();
    }
  }

  function handlePopupHover(next: boolean) {
    if (actionOverrides) {
      if (next) {
        if (actions.show.has('hover') && visible) request(true, getTooltipDelay(enterDelay));
      }
      else if (actions.hide.has('hover')) request(false, getTooltipDelay(leaveDelay));
      return;
    }
    if (sourceTrigger && !supports('hover')) {
      return;
    }

    popupHovered = next;
    if (next) {
      cancelPending();
    }
    else if (sourceTrigger ? supports('hover') : !wanted())
      request(false, getTooltipDelay(leaveDelay));
  }

  function showByClick() {
    if (anchor?.matches(':disabled, [aria-disabled="true"]')) {
      return;
    }

    dismissed = false;
    clicked = true;
    request(true);
    if (!visible) clicked = false;
  }

  function handleClick(event: MouseEvent) {
    const show = actions.show.has('click');
    const hide = actions.hide.has('click') || actions.hide.has('contextMenu');
    if (event.defaultPrevented && !actionOverrides || !show && !hide) {
      return;
    }

    if (visible && hide) {
      dismiss();
    }
    else if (!visible && show) showByClick();
    if (sourceTouch) touched = false;
  }

  function handleContextMenu(event: MouseEvent) {
    if (!actions.show.has('contextMenu')) {
      return;
    }

    event.preventDefault();
    if (visible && actions.hide.has('contextMenu')) {
      dismiss();
    }
    else {
      showByClick();
    }
  }

  function handleTouchStart() {
    if (!sourceTouch || !actions.show.has('touch') && !actions.hide.has('touch')) {
      return;
    }

    touched = true;
    if (visible && actions.hide.has('touch')) {
      dismiss();
    }
    else if (!visible && actions.show.has('touch')) showByClick();
  }

  function dismiss(reason?: 'escape' | 'outside') {
    if (reason === 'outside' && actionOverrides && !actions.hide.has('click')
      && !actions.hide.has('contextMenu') && !actions.hide.has('touch')) {
      return;
    }

    dismissed = true;
    clicked = false;
    request(false);
  }
</script>

<style>
  .ant-tooltip-trigger {
    display: inline-block;
    max-width: 100%;
    vertical-align: middle;
  }
</style>

{#if !external}<span bind:this={wrapper} role="presentation" class={['ant-tooltip-trigger', className]} {style} onpointerenter={handleEnter} onpointerleave={handleLeave} onfocusin={handleFocus} onfocusout={handleBlur} onclick={handleClick} oncontextmenu={handleContextMenu} ontouchstart={handleTouchStart}>{@render children()}</span>{/if}{#if renderPopup}<NoCompactStyle><TooltipPopup bind:this={popupController} title={content} color={props.color} prefixCls={props.prefixCls} open={visible} {anchor} {describe} trigger={host} {placement} {arrow} {autoAdjustOverflow} {getPopupContainer}
  sourceAnchor={Boolean(external)}
  outsideEvents={actionOverrides ? 'mouse' : undefined}
  zIndexLayer={layer}
  semanticProps={{ ...props, open: providedOpen, trigger: resolvedTrigger,
    mouseEnterDelay: enterDelay, mouseLeaveDelay: leaveDelay }}
  onDismiss={dismiss} onHoverChange={handlePopupHover} /></NoCompactStyle>{/if}
