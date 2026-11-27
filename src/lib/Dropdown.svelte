<script lang="ts">
  // Owns the panel, its positioning, and its focus from first open through the end of the animation.
  import NoCompactStyle from './NoCompactStyle.svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import DropdownPopupContent from './DropdownPopupContent.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getDropdownMotionCss, getDropdownPrefixCss } from './dropdown-prefix.engine';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import { useConfig } from './config-context';
  import { useForm } from './form-context';
  import { connectPopup, getPopupActiveElement, type PopupConnection } from './popup.dom';
  import { getPopupArrowStyle, getPopupPlacements } from './popup-position.engine';
  import { createDropdownPosition, dropdownFitVariables } from './dropdown-position.dom';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { connectPopoverTrigger, focusPopover } from './popover.dom';
  import { connectTooltipOpenClass } from './tooltip.dom';
  import { useComponentTheme } from './theme-component.svelte';
  import { connectInlineStyle } from './inline-style.dom';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { getInlineZIndex, provideZIndex, useZIndex } from './z-index-context.svelte';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { getTooltipDelay, type TooltipPosition } from './tooltip.engine';
  import {
    dropdownSemantics, getDropdownMatch, getDropdownMotionName, isDropdownMenuKey
  } from './dropdown.engine';
  import type { DropdownMenuContext, DropdownMenuView } from './dropdown-menu-context';
  import { useMenuMotion } from './menu-motion.svelte';
  import type {
    DropdownOpenChangeInfo,
    DropdownProps,
    DropdownTrigger
  } from './dropdown.types';

  let {
    open = $bindable<boolean | undefined>(),
    open: providedOpen,
    ref = $bindable<Element | undefined>(),
    ...dropdownProps
  }: DropdownProps = $props();
  let {
    prefixCls: customizePrefixCls,
    children,
    menu,
    rootClassName,
    openClassName,
    popupRender,
    forceRender,
    destroyOnHidden,
    transitionName,
    defaultOpen = false,
    onOpenChange,
    trigger = ['hover'],
    autoFocus = false,
    disabled,
    placement,
    align,
    arrow = false,
    autoAdjustOverflow = true,
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0.1,
    getPopupContainer,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    class: className = '',
    style
  } = $derived(dropdownProps);

  const config = useConfig();
  let componentPrefix = $derived(config.getPrefixCls('dropdown', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  const menuPrefix = $derived(menu?.prefixCls || `${componentPrefix}-menu`);
  let prefixCss = $derived(getDropdownPrefixCss(componentPrefix, rootPrefix, menuPrefix));
  const requestedPlacement = $derived(
    placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')
  );
  const componentTheme = useComponentTheme('Dropdown');
  const semantics = $derived.by(() => {
    const props = { ...dropdownProps, open: providedOpen };
    const providerProps = { ...props, mouseEnterDelay, mouseLeaveDelay, autoAdjustOverflow };
    return dropdownSemantics(config.dropdown, props, providerProps);
  });
  const designTokens = useDesignTokenContext();
  const localZIndex = $derived(getInlineZIndex(semantics.rootStyle));
  const layer = useZIndex('popup', () => localZIndex);
  // Upstream Dropdown retains the parent's context when zIndex is zero or unset.
  provideZIndex(() => layer.zIndex ? layer.contextZIndex : layer.parentZIndex);
  const form = useForm();
  const generatedId = $props.id();
  const menuId = $derived(menu?.id ?? `ant-dropdown-${generatedId}-menu`);
  const popupId = $derived(`${menuId}-popup`);
  const triggerId = `ant-dropdown-${generatedId}-trigger`;
  const initialDefault = untrack(() => defaultOpen);
  let internalOpen = $state(initialDefault);
  let previousOwnerOpen = untrack(() => providedOpen);
  // Writing to the bindable prop notifies its binding. The owner controls an ordinary open prop.
  let isOpen = $derived(providedOpen === undefined ? internalOpen : providedOpen ?? initialDefault);
  let host = $state<HTMLSpanElement>();
  let anchor = $state<Element>();
  let popup = $state<HTMLDivElement>();
  let list = $state<HTMLUListElement>();
  const registeredMenus = new Set<DropdownMenuView>();
  let menuViews = $state.raw<DropdownMenuView[]>([]);
  let focusedMenu = $state<HTMLUListElement>();
  const menuView = $derived(menuViews.find(view => view.element === (focusedMenu ?? list))
    ?? menuViews[0]);
  let shown = $state(false);
  let actualSide = $state<'top' | 'bottom'>('bottom');
  let alignedPlacement = $state<string>();
  let arrowStyle = $state<string>();
  let pointer = $state.raw<{ x: number; y: number; }>();
  let pending: ReturnType<typeof setTimeout> | undefined;
  let focusPending: 'first' | 'last' | null = null;
  let hovered = false;
  const hoveredSurfaces = new Set<HTMLElement>();
  const nestedPopups = new Set<HTMLElement>();
  let menuFocused = $state(false);
  let clicked = false;
  let dismissed = false;
  let dismissedFocusTarget: Node | undefined;
  let closing = false;
  let leavingByTab = false;
  let repairFocus = false;
  let resumeFocus = false;
  let search = { text: '', time: 0 };
  let active = true;
  let mounted = $state(false);
  let visited = $state(false);
  let reducedMotion = $state(false);
  let popupConnection: PopupConnection | undefined;
  let resolvedDisabled = $derived(disabled ?? form?.disabled ?? config.componentDisabled);
  let visible = $derived(!resolvedDisabled && isOpen);
  const expanded = $derived(visible && shown);
  const alignPoint = $derived(supports('contextMenu'));
  const requestedContent = $derived({ renderer: popupRender, hasMenu: Boolean(menu?.items) });
  let acceptedContent = $state.raw<typeof requestedContent>();
  const content = $derived(visible || !acceptedContent ? requestedContent : acceptedContent);
  const customContent = $derived(Boolean(content.renderer) || !content.hasMenu);
  const nativeShell = $derived(Boolean(menu?.items) && !popupRender
    && destroyOnHidden === undefined && forceRender === undefined);
  const retain = $derived(Boolean(forceRender || visited && !destroyOnHidden));
  const renderRequested = $derived(visible || retain);
  const motionName = $derived(transitionName ?? getDropdownMotionName(rootPrefix, requestedPlacement));
  const motionCss = $derived(getDropdownMotionCss(componentPrefix, rootPrefix));
  const popupMotion = useMenuMotion(() => host, () => popup, () => ({
    motion: {
      motionName,
      onAppearPrepare: preparePopup,
      onEnterPrepare: preparePopup
    },
    present: mounted && renderRequested,
    visible: mounted && visible,
    enabled: mounted && designTokens.state.token.motion && !reducedMotion,
    inactive: !mounted || resolvedDisabled,
    forced: Boolean(forceRender),
    settleWithoutAnimation: true
  }));
  const leaving = $derived(popupMotion.state.phase === 'leave');
  const presented = $derived(visible || leaving);
  const rendered = $derived(nativeShell || mounted && (renderRequested || leaving));
  const popupStyleLayers = $derived([
    componentTheme.style,
    popupMotion.state.style,
    localZIndex === undefined ? layer.style : undefined,
    semantics.rootStyle
  ]);
  const popupStyle = $derived(serializeInlineStyleLayers(popupStyleLayers));
  const portal = createPopupContainer(() => ({
    open: mounted && (presented || Boolean(forceRender)),
    rendered,
    reference: anchor,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: popupStyle,
    preserveVariables: ['--ant-dropdown-anchor-width', ...dropdownFitVariables]
  }));
  const legacySide = $derived(requestedPlacement.startsWith('top') ? 'top' : 'bottom');
  const legacyAlignment = $derived(
    requestedPlacement.endsWith('Left')
      ? 'left' as const
      : requestedPlacement.endsWith('Right') ? 'right' as const : undefined
  );
  const builtinPlacements = $derived.by(() => {
    const lateral = requestedPlacement.startsWith('left') || requestedPlacement.startsWith('right');
    if (!alignPoint && !lateral && !align && typeof arrow !== 'object'
      && typeof autoAdjustOverflow !== 'object') {
      return undefined;
    }

    const token = designTokens.state.token;
    const pointAtCenter = typeof arrow === 'object' && arrow.pointAtCenter === true;
    return getPopupPlacements(pointAtCenter, arrow ? token.sizePopupArrow : 0, token.marginXXS,
      token.borderRadius, autoAdjustOverflow);
  });
  const legacySuffix = $derived(legacyAlignment === 'left' ? 'Left'
    : legacyAlignment === 'right' ? 'Right' : '');
  const actualPlacement = $derived.by(() => {
    if (!shown) return requestedPlacement;

    return builtinPlacements ? alignedPlacement : `${actualSide}${legacySuffix}`;
  });

  onMount(() => { mounted = true; });

  $effect.pre(() => {
    // A forceRender panel prepared before its first open has not yet been retained.
    if (mounted && visible) visited = true;
    else if (!rendered) visited = false;

    if (!rendered) acceptedContent = undefined;
    else if (visible || !acceptedContent) acceptedContent = requestedContent;
  });

  $effect(() => {
    const view = host?.ownerDocument.defaultView;
    if (!view) return;

    const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
    function update() { reducedMotion = preference.matches; }

    update();
    return on(preference, 'change', update);
  });

  $effect.pre(() => {
    const next = providedOpen;

    // Preserves the previous defaultOpen fallback when external control is removed.
    if (next === undefined && previousOwnerOpen !== undefined) internalOpen = initialDefault;
    previousOwnerOpen = next;
  });

  $effect(() => {
    const element = host;
    if (!element) {
      return;
    }

    const update = () => {
      const triggerNode = element.firstElementChild ?? element;
      anchor = triggerNode;
      ref = triggerNode;
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(element, { childList: true });
    return () => {
      observer.disconnect();
      ref = undefined;
    };
  });

  $effect(() => {
    if (!anchor || !visible) return;

    const resolvedOpenClass = openClassName === undefined ? `${componentPrefix}-open` : openClassName;
    if (resolvedOpenClass) return connectTooltipOpenClass(anchor, resolvedOpenClass);
  });

  $effect(() => {
    if (anchor) {
      const id = rendered ? customContent ? popupId : menuId : '';
      return connectPopoverTrigger(anchor, id, expanded, customContent ? 'dialog' : 'menu');
    }
  });

  $effect.pre(() => {
    const source = anchor;
    const view = menuView;

    if (!visible) {
      clicked = false;
      focusPending = null;
      search = { text: '', time: 0 };
      if (focusedInPopup() && (source instanceof HTMLElement || source instanceof SVGElement)
        && source.isConnected) {
        untrack(() => restoreTriggerFocus(source));
      }
    }
    else if (view) {
      const key = view.focusKey;
      const focused = focusedInPopup();
      const rowKey = focused instanceof HTMLElement ? focused.dataset.dropdownKey : undefined;
      if (focused === view.element && key !== null || rowKey !== undefined && !view.isEnabled(rowKey)) {
        repairFocus = true;
      }
    }
  });

  $effect(() => {
    const view = menuView;
    void view?.focusKey;
    if (expanded && view && repairFocus) {
      repairFocus = false;
      untrack(() => view.focus());
    }
  });

  $effect(() => {
    if (!expanded) return;

    // A custom renderer can mount Menu in the same update as the popup.
    let cancelled = false;
    void tick().then(() => {
      if (!cancelled && expanded) focusOnOpen();
    });
    return () => { cancelled = true; };
  });

  $effect(() => {
    const surface = popup;
    const source = anchor;
    if (!surface || !source || !presented) {
      return;
    }

    const position = createDropdownPosition(surface, () => Boolean(builtinPlacements),
      () => Boolean(getPopupContainer || config.getPopupContainer));
    const disconnect = untrack(() => connectPopup(surface, source, {
      trigger: host,
      get placement() { return builtinPlacements ? requestedPlacement : legacySide; },
      get align() { return builtinPlacements ? undefined : legacyAlignment; },
      get autoAdjustOverflow() { return autoAdjustOverflow; },
      get sourceAlign() { return align; },
      get builtinPlacements() { return builtinPlacements; },
      get alignPoint() { return alignPoint; },
      get outsideEvents() { return alignPoint ? 'mouse' : 'pointer'; },
      get interactive() { return visible; },
      pauseAlignment: () => leaving || popupMotion.state.step === 'start'
        || popupMotion.state.step === 'active',
      maxWidth: '100vw',
      gap: () => untrack(() => designTokens.enabled
        ? (arrow ? designTokens.state.token.sizePopupArrow / 2 : 0)
          + designTokens.state.token.marginXXS : undefined),
      anchorWidthVariable: '--ant-dropdown-anchor-width',
      getAnchorWidth: () => alignPoint ? 0 : undefined,
      getAnchorRect(rect) {
        return alignPoint && pointer ? new DOMRect(pointer.x, pointer.y) : rect;
      },
      measurePopup: position.measure,
      get applyPosition() { return builtinPlacements ? position.apply : undefined; },
      preserveFocus: false,
      isRelatedTarget: ownsNestedTarget,
      onPlacement: (_, current) => updatePlacement(current),
      onDismiss: handleDismiss,
      onVisibilityChange: (next) => {
        shown = next;
        if (!next) {
          menuFocused = false;
          focusedMenu = undefined;
          dismissedFocusTarget = undefined;
          hoveredSurfaces.clear();
        }
      }
    }));
    popupConnection = disconnect;

    return () => {
      resumeFocus = visible && Boolean(focusedInPopup());
      closing = true;
      disconnect();
      position.reset();
      if (popupConnection === disconnect) popupConnection = undefined;
      closing = false;
    };
  });

  $effect(() => {
    const source = anchor;
    const surface = popup;
    if (expanded && alignPoint && source && surface) {
      return connectPointDismissal(source, surface);
    }
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

  // For prepare, the browser measures the original panel size before scaling begins.
  function preparePopup() {
    popupConnection?.forceAlign();
  }

  function supports(kind: DropdownTrigger) {
    return typeof trigger === 'string' ? trigger === kind : trigger.includes(kind);
  }

  function updatePlacement(position: TooltipPosition) {
    if (builtinPlacements) {
      alignedPlacement = position.alignedPlacement;
      arrowStyle = getPopupArrowStyle({
        align: position.sourceAlign, arrowX: position.arrowX, arrowY: position.arrowY
      });
      return;
    }

    actualSide = position.placement === 'top' ? 'top' : 'bottom';
    arrowStyle = undefined;
  }

  // Container scrolling and resize close a menu anchored to viewport coordinates.
  function connectPointDismissal(source: Element, surface: HTMLElement) {
    const document = source.ownerDocument;
    const view = document.defaultView;
    if (!view) return;

    const targets = new Set<EventTarget>([view]);
    for (const node of [source, surface]) {
      const root = node.getRootNode();
      if (root instanceof ShadowRoot) targets.add(root);
    }

    function dismiss() {
      if (visible && shown) close('outside');
    }

    function scroll(event: Event) {
      const target = event.target;
      if (target === document || target === view || target instanceof Element
        && (target !== source && target.contains(source)
          || target !== surface && target.contains(surface))) {
        dismiss();
      }
    }

    const dispose = Array.from(targets, target =>
      on(target, 'scroll', scroll, { capture: true, passive: true }));
    dispose.push(on(view, 'resize', dismiss, { passive: true }));
    return () => dispose.forEach(remove => remove());
  }

  function isTriggerDisabled() {
    return resolvedDisabled || anchor?.matches(':disabled, [aria-disabled="true"]');
  }

  function rememberPointer(event: MouseEvent) {
    pointer = { x: event.clientX, y: event.clientY };
  }

  function wanted() {
    return !dismissed && (clicked || menuFocused || hoveredSurfaces.size > 0
      || hovered && supports('hover'));
  }

  function request(
    next: boolean,
    delay = 0,
    source: DropdownOpenChangeInfo['source'] = 'trigger'
  ) {
    cancelPending();
    const requestAnchor = anchor;
    const ownerValue = isOpen;
    // hover combined with contextMenu has no hideAction=hover. Leaving the trigger does not cancel the opening delay.
    const retainedHover = next && delay > 0 && alignPoint;

    function apply() {
      pending = undefined;
      if (!active
        || next && (resolvedDisabled
          || !(wanted() || retainedHover && alignPoint && supports('hover')))
        || !requestAnchor?.isConnected
        || requestAnchor !== anchor
        || !Object.is(isOpen, ownerValue)) {
        return;
      }

      if (next !== isOpen) {
        internalOpen = next;
        open = next;
        onOpenChange?.(next, { source });
      }
      if (next && visible && shown && focusPending) {
        focusRequestedEdge();
      }
    }

    if (delay) {
      pending = setTimeout(apply, delay);
    }
    else {
      apply();
    }
  }

  function focusRequestedEdge() {
    const edge = focusPending;
    // When the panel reopens quickly, its DOM can stay inert until the next update.
    if (!edge || !popup || popup.inert) return;

    focusPending = null;
    if (menuView) menuView.focus(edge);
    else if (customContent) focusPopover(popup);
  }

  function focusOnOpen() {
    if (focusPending) {
      resumeFocus = false;
      focusRequestedEdge();
      return;
    }
    if (resumeFocus) {
      resumeFocus = false;
      menuView?.focus();
      return;
    }
    if (autoFocus && !focusCustomRoot()) menuView?.focus();
  }

  // A snippet can focus its single focusable root. Menu owns its own rows.
  function focusCustomRoot() {
    if (!customContent || !popup) return false;

    const roots = popup.querySelectorAll(':scope > :not([data-ant-dropdown-arrow])');
    const root = roots[0];
    if (roots.length !== 1 || !(root instanceof HTMLElement || root instanceof SVGElement)
      || root.tabIndex < 0 && !root.hasAttribute('tabindex')
      || menuViews.some(view => view.element === root)) {
      return false;
    }

    root.focus({ preventScroll: true });
    return focusedInPopup() === root;
  }

  // Layout coordinates account for the panel at zero or intermediate scale.
  function layoutTop(element: HTMLElement) {
    let top = element.offsetTop;
    let parent = element.offsetParent;
    while (parent instanceof HTMLElement) {
      top += parent.offsetTop + parent.clientTop;
      parent = parent.offsetParent;
    }
    return top;
  }

  function focusRow(row: HTMLElement, options: FocusOptions = { preventScroll: true }) {
    row.focus(options);
    const level = row.closest<HTMLElement>('ul[data-menu-list]');
    if (!level) return;

    const top = layoutTop(row) - layoutTop(level) - level.clientTop;
    const bottom = top + row.offsetHeight;
    const scrollTop = level.scrollTop;
    const scrollBottom = scrollTop + level.clientHeight;
    if (top < scrollTop + 4) {
      level.scrollTop = top - 4;
    }
    else if (bottom > scrollBottom - 4) {
      level.scrollTop = bottom - level.clientHeight + 4;
    }
  }

  function restoreTriggerFocus(source: HTMLElement | SVGElement) {
    closing = true;
    source.focus({ preventScroll: true });
    closing = false;
  }

  // An outside click can move focus to the same control after requesting close.
  function handleDismiss(reason: 'escape' | 'outside', target?: Node) {
    const label = target instanceof Element ? target.closest<HTMLLabelElement>('label') : null;
    dismissedFocusTarget = target && focusedInPopup() ? label?.control ?? target : undefined;
    close(reason);
  }

  function close(reason: 'escape' | 'outside' | 'trigger' | 'tab' | 'menu') {
    const previous = { clicked, dismissed, focusPending };
    clicked = false;
    dismissed = true;
    focusPending = null;
    request(false, 0, reason === 'menu' ? 'menu' : 'trigger');
    if (visible) {
      ({ clicked, dismissed, focusPending } = previous);
      return;
    }

    search = { text: '', time: 0 };
    if ((reason === 'escape'
      || reason === 'menu')
      && focusedInPopup()
      && (anchor instanceof HTMLElement || anchor instanceof SVGElement)
      && anchor.isConnected) {
      restoreTriggerFocus(anchor);
    }
  }

  function handleEnter(event: PointerEvent) {
    if (isTriggerDisabled() || event.pointerType === 'touch') {
      return;
    }

    hovered = true;
    dismissed = false;
    if (supports('hover')) {
      rememberPointer(event);
      request(true, getTooltipDelay(mouseEnterDelay));
    }
  }

  function handleLeave() {
    hovered = false;
    if (!alignPoint && supports('hover') && !wanted())
      request(false, getTooltipDelay(mouseLeaveDelay));
  }

  function handleTouchStart() {
    if (!alignPoint || !supports('hover') || supports('click') || visible || isTriggerDisabled()) {
      return;
    }

    clicked = true;
    dismissed = false;
    request(true);
  }

  function handleClick(event: MouseEvent) {
    if (event.defaultPrevented || isTriggerDisabled()) {
      return;
    }

    const clickToOpen = supports('click');
    if (alignPoint) {
      // A regular click closes a contextMenu panel even without trigger=click.
      if (visible) close('trigger');
      else if (clickToOpen) openFromClick(event);
      return;
    }
    if (!clickToOpen && !(event.detail === 0 && supports('hover'))) return;

    if (clicked || visible && !wanted()) {
      close('trigger');
    }
    else {
      openFromClick(event);
    }
  }

  function openFromClick(event: MouseEvent) {
    rememberPointer(event);
    clicked = true;
    dismissed = false;
    focusPending = autoFocus || popupRender && event.detail !== 0 ? null : 'first';
    request(true);
  }

  function handleContextMenu(event: MouseEvent) {
    if (!alignPoint || event.defaultPrevented || isTriggerDisabled()) return;

    event.preventDefault();
    rememberPointer(event);
    clicked = true;
    dismissed = false;
    focusPending = null;
    request(true);
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || isTriggerDisabled()
      || !visible && !supports('click') && !supports('hover')) {
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    clicked = true;
    dismissed = false;
    focusPending = event.key === 'ArrowDown' ? 'first' : 'last';
    request(true);
  }

  function enterPopup(surface: HTMLElement, event: PointerEvent) {
    if (!visible || event.pointerType === 'touch') return;

    hoveredSurfaces.add(surface);
    cancelPending();
  }

  function leavePopup(surface: HTMLElement, event: PointerEvent) {
    hoveredSurfaces.delete(surface);
    if (event.relatedTarget instanceof Node && ownsMenuTarget(event.relatedTarget)) return;

    if (!alignPoint && supports('hover') && !wanted()) {
      request(false, getTooltipDelay(mouseLeaveDelay));
    }
  }

  function ownsNestedTarget(target: Node) {
    for (const nested of nestedPopups) {
      if (nested.hidden || !nested.isConnected) continue;
      const root = nested.getRootNode();
      if (nested.contains(target) || root instanceof ShadowRoot && root.host === target) {
        return true;
      }
    }
    return false;
  }

  function ownsMenuTarget(target: Node) {
    return Boolean(popup?.contains(target)) || ownsNestedTarget(target);
  }

  function focusedInPopup() {
    if (!popup) return undefined;

    let focused = getPopupActiveElement(popup);
    while (focused?.shadowRoot?.activeElement) {
      const inner = focused.shadowRoot.activeElement;
      if (!ownsMenuTarget(inner)) break;
      focused = inner;
    }
    return focused && ownsMenuTarget(focused) ? focused : undefined;
  }

  function handleFocusin(event: FocusEvent) {
    const target = event.composedPath()[0];
    if (target instanceof Node) {
      const owner = menuViews.find(view => view.element.contains(target));
      if (owner || popup?.contains(target)) focusedMenu = owner?.element;
    }

    menuFocused = true;
    dismissedFocusTarget = undefined;
    leavingByTab = false;
    cancelPending();
  }

  function handleFocusout(event: FocusEvent) {
    const next = event.relatedTarget;
    if (closing
      || !expanded
      || next instanceof Node && ownsMenuTarget(next)) {
      return;
    }

    const outsideTarget = dismissedFocusTarget;
    dismissedFocusTarget = undefined;
    if (next === null && !leavingByTab) {
      return;
    }

    const clickedOutside = outsideTarget && next instanceof Node
      && (next.contains(outsideTarget) || outsideTarget.contains(next));
    const returnsToTrigger = next instanceof Node && host?.contains(next);
    const keepOpen = !leavingByTab && (clickedOutside || returnsToTrigger);
    menuFocused = false;
    focusedMenu = undefined;
    leavingByTab = false;
    if (!keepOpen) {
      close('tab');
    }
  }

  function handleMenuKeydown(event: KeyboardEvent, root: HTMLUListElement) {
    if (!isDropdownMenuKey(event)) return;

    leavingByTab = event.key === 'Tab';
    if (event.key === ' ' || Array.from(event.key).length !== 1) {
      return;
    }

    const target = event.composedPath()[0];
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>('[data-dropdown-key]');
    if (!row && target !== root) return;
    const level = row?.closest('ul[data-menu-list]') ?? root;

    event.preventDefault();
    const now = Date.now();
    const previous = now - search.time < 1000 ? search.text : '';
    const repeated = previous
      && Array.from(previous).every(
        (character) => character.toLocaleLowerCase() === event.key.toLocaleLowerCase()
      );
    search = { text: repeated ? event.key : previous + event.key, time: now };
    const rows = level.querySelectorAll<HTMLElement>('[data-dropdown-key][role="menuitem"]');
    const commands = Array.from(rows).flatMap(element => {
      const key = element.dataset.dropdownKey;
      if (key === undefined || element.closest('ul[data-menu-list]') !== level
        || element.matches(':disabled, [aria-disabled="true"]')) return [];

      const text = element.dataset.dropdownText
        ?? element.querySelector('[data-ant-dropdown-title]')?.textContent ?? '';
      return [{ key, text, element }];
    });
    const view = menuViews.find(view => view.element === root);
    const current = row?.dataset.dropdownKey ?? view?.focusKey ?? null;
    const key = getDropdownMatch(commands, current, search.text);
    const command = commands.find(command => command.key === key);
    if (command) focusRow(command.element);
  }

  function handlePopupKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' && !event.defaultPrevented) leavingByTab = true;
  }

  function registerMenu(view: DropdownMenuView) {
    // When the renderer changes, cleanup and the new registration use the same current set.
    registeredMenus.add(view);
    menuViews = [...registeredMenus];
    return () => {
      registeredMenus.delete(view);
      menuViews = [...registeredMenus];
      if (focusedMenu === view.element) focusedMenu = undefined;
    };
  }

  function connectPopupStyle(surface: HTMLDivElement) {
    const update = connectInlineStyle(surface);
    $effect(() => update(popupStyleLayers));
  }

  // The external portal extends focus and hover across the whole panel. Events from nested DOM bubble normally.
  function registerPopup(surface: HTMLElement) {
    nestedPopups.add(surface);
    const dispose = [
      on(surface, 'pointerenter', event => {
        if (!popup?.contains(surface)) enterPopup(surface, event);
      }),
      on(surface, 'pointerleave', event => {
        if (!popup?.contains(surface)) leavePopup(surface, event);
      }),
      on(surface, 'focusin', event => {
        if (!popup?.contains(surface)) handleFocusin(event);
      }),
      on(surface, 'focusout', event => {
        if (!popup?.contains(surface)) handleFocusout(event);
      })
    ];
    return () => {
      dispose.forEach(disconnect => disconnect());
      nestedPopups.delete(surface);
      hoveredSurfaces.delete(surface);
    };
  }

  function createMenuContext(origin: boolean): DropdownMenuContext {
    return {
      get prefixCls() { return componentPrefix; },
      get menuPrefix() { return menuPrefix; },
      get activeKey() { return origin ? menu?.activeKey : undefined; },
      get visible() { return visible; },
      get sourceTheme() { return Boolean(componentTheme.className); },
      get themeStyle() { return componentTheme.style; },
      isFocused: element => menuFocused && (origin && !customContent || focusedMenu === element),
      canActivate: event => active && expanded && !event.defaultPrevented,
      command() {
        if (!(menu?.selectable && menu.multiple)) close('menu');
      },
      keydown: handleMenuKeydown,
      focusRow,
      registerMenu,
      registerPopup
    };
  }

  const menuContext = createMenuContext(true);
  const popupContext = createMenuContext(false);
</script>

<style>
  [data-ant-dropdown-trigger] {
    display: inline-block;
    max-width: 100%;
    vertical-align: middle;
  }
  [data-ant-dropdown-popup] {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    width: max-content;
    min-width: var(--ant-dropdown-anchor-width, 0px);
    overflow: visible;
  }
  [data-ant-dropdown-popup][data-ant-dropdown-source-align] {
    width: fit-content;
    right: var(--ant-dropdown-fit-right, auto);
    bottom: var(--ant-dropdown-fit-bottom, auto);
    justify-self: var(--ant-dropdown-fit-justify, unsafe left);
  }
  [data-ant-dropdown-popup][hidden], [data-ant-dropdown-popup]:not(:popover-open) { display: none; }
  [data-ant-dropdown-placement^="top"]:where(:not([data-ant-dropdown-source-theme], [data-ant-dropdown-source-align])) > [data-ant-dropdown-arrow] {
    left: var(--arrow-x, 50%);
    right: auto;
    transform: translateX(-50%) translateY(100%) rotate(180deg);
  }
  [data-ant-dropdown-placement^="bottom"]:where(:not([data-ant-dropdown-source-theme], [data-ant-dropdown-source-align])) > [data-ant-dropdown-arrow] {
    left: var(--arrow-x, 50%);
    right: auto;
    transform: translateX(-50%) translateY(-100%);
  }
  @media (prefers-reduced-motion: reduce) {
    [data-ant-dropdown-popup],
    [data-ant-dropdown-popup] :global([data-ant-dropdown-menu]) {
      animation: none;
      transition: none;
    }
  }
</style>

{#snippet originMenu()}
  {#if menu?.items}<DropdownMenu {menu} {semantics} context={menuContext} id={menuId}
    label={ariaLabel} labelReference={ariaLabelledby} labelledby={triggerId}
    bind:nativeElement={list} />{/if}
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss}
  scope={`dropdown-prefix:${componentPrefix}:${rootPrefix}${menu?.prefixCls ? `:${menuPrefix}` : ''}`} />{/if}{#if mounted}<ThemeScopeStyle css={motionCss}
  scope={`dropdown-motion:${componentPrefix}:${rootPrefix}`} />{/if}<span data-ant-dropdown-trigger data-ant-dropdown-prefix={componentPrefix} data-ant-dropdown-root-prefix={rootPrefix} data-ant-dropdown-menu-prefix={menuPrefix} bind:this={host} id={triggerId} role="presentation" class={[`${componentPrefix}-trigger`, className]} {style} onpointerenter={handleEnter} onpointerleave={handleLeave} ontouchstart={handleTouchStart} onclick={handleClick} oncontextmenucapture={handleContextMenu} onkeydown={handleTriggerKeydown}>{@render children()}</span>
<NoCompactStyle>{#if rendered}
<div data-ant-dropdown-popup data-ant-dropdown-prefix={componentPrefix} data-ant-dropdown-root-prefix={rootPrefix} data-ant-dropdown-menu-prefix={menuPrefix} data-ant-dropdown-source-theme={componentTheme.className ? true : undefined}
  data-ant-dropdown-source-align={builtinPlacements ? true : undefined}
  data-ant-dropdown-motion data-ant-dropdown-placement={actualPlacement}
  bind:this={popup} id={popupId} popover="manual" role={customContent ? 'dialog' : 'presentation'}
  tabindex="-1" aria-label={customContent ? ariaLabel : undefined}
  aria-labelledby={customContent ? ariaLabelledby ?? (ariaLabel ? undefined : triggerId) : undefined}
  hidden
  inert={leaving || undefined} aria-hidden={leaving || undefined} dir={config.direction} class={[
    componentPrefix,
    rootClassName,
    'ant-dropdown-css-var',
    componentTheme.className,
    componentTheme.className && 'ant-dropdown-source-theme',
    config.dropdown?.class,
    semantics.rootClass,
    actualPlacement && `${componentPrefix}-placement-${actualPlacement}`,
    config.direction === 'rtl' && `${componentPrefix}-rtl`,
    popupMotion.state.className
  ]} style={untrack(() => popupStyle)}
  {@attach connectPopupStyle} {@attach portal}
  onpointerenter={event => enterPopup(event.currentTarget, event)}
  onpointerleave={event => leavePopup(event.currentTarget, event)}
  onfocusin={handleFocusin} onfocusout={handleFocusout}
  onkeydown={customContent ? handlePopupKeydown : undefined}
  onanimationend={popupMotion.end} ontransitionend={popupMotion.end}>
  {#if arrow}<span data-ant-dropdown-arrow class={`${componentPrefix}-arrow`}
    style={arrowStyle} aria-hidden="true"></span>{/if}
  {#if content.renderer}<DropdownPopupContent renderer={content.renderer}
    origin={content.hasMenu ? originMenu : undefined} context={popupContext} />
  {:else if content.hasMenu}{@render originMenu()}{/if}
</div>
{/if}</NoCompactStyle>
