<script lang="ts">
  // Владеет видимостью меню, позицией привязки и возвратом фокуса к trigger.
  import NoCompactStyle from './NoCompactStyle.svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getDropdownPrefixCss } from './dropdown-prefix.engine';
  import { onDestroy, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import { useConfig } from './config-context';
  import { useForm } from './form-context';
  import { connectPopup, getPopupActiveElement } from './popup.dom';
  import { getPopupArrowStyle, getPopupPlacements } from './popup-position.engine';
  import { createDropdownPosition, dropdownFitVariables } from './dropdown-position.dom';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { connectPopoverTrigger } from './popover.dom';
  import { useComponentTheme } from './theme-component.svelte';
  import { connectInlineStyle } from './inline-style.dom';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { getTooltipDelay, type TooltipPosition } from './tooltip.engine';
  import { dropdownSemantics, getDropdownMatch, isDropdownMenuKey } from './dropdown.engine';
  import type { DropdownMenuContext, DropdownMenuView } from './dropdown-menu-context';
  import type {
    DropdownProps,
    DropdownTrigger
  } from './dropdown.types';

  let { open = $bindable<boolean | undefined>(), open: providedOpen, ...dropdownProps }:
  DropdownProps = $props();
  let {
    prefixCls: customizePrefixCls,
    children,
    menu = { items: [] },
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
    classNames: _classNames,
    styles: _styles,
    'aria-label': ariaLabel,
    class: className = '',
    style
  } = $derived(dropdownProps);

  const config = useConfig();
  let componentPrefix = $derived(config.getPrefixCls('dropdown', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  const menuPrefix = $derived(menu.prefixCls || `${componentPrefix}-menu`);
  let prefixCss = $derived(getDropdownPrefixCss(componentPrefix, rootPrefix, menuPrefix));
  const componentTheme = useComponentTheme('Dropdown');
  const semantics = $derived(dropdownSemantics({ ...dropdownProps, open: providedOpen }));
  const popupStyleLayers = $derived([componentTheme.style, semantics.rootStyle]);
  const popupStyle = $derived(serializeInlineStyleLayers(popupStyleLayers));
  const designTokens = useDesignTokenContext();
  const form = useForm();
  const generatedId = $props.id();
  const menuId = $derived(menu.id ?? `ant-dropdown-${generatedId}-menu`);
  const triggerId = `ant-dropdown-${generatedId}-trigger`;
  const initialDefault = untrack(() => defaultOpen);
  let internalOpen = $state(initialDefault);
  let previousOwnerOpen = untrack(() => providedOpen);
  // Spread update может вернуть omitted open в undefined; собственное состояние сохраняется отдельно.
  let isOpen = $derived(providedOpen === undefined ? internalOpen : open ?? initialDefault);
  let host = $state<HTMLSpanElement>();
  let anchor = $state<Element>();
  let popup = $state<HTMLDivElement>();
  let list = $state<HTMLUListElement>();
  let menuView = $state.raw<DropdownMenuView>();
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
  let closing = false;
  let leavingByTab = false;
  let repairFocus = false;
  let resumeFocus = false;
  let search = { text: '', time: 0 };
  let active = true;
  let resolvedDisabled = $derived(disabled ?? form?.disabled ?? config.componentDisabled);
  let visible = $derived(!resolvedDisabled && isOpen);
  const alignPoint = $derived(supports('contextMenu'));
  const portal = createPopupContainer(() => ({
    open: visible,
    reference: anchor,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: popupStyle,
    preserveVariables: ['--ant-dropdown-anchor-width', ...dropdownFitVariables]
  }));
  const requestedPlacement = $derived(
    placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')
  );
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

  $effect.pre(() => {
    const next = providedOpen;

    // Сохраняем прежний fallback defaultOpen при снятии внешнего управления.
    if (next === undefined && previousOwnerOpen !== undefined) internalOpen = initialDefault;
    previousOwnerOpen = next;
  });

  $effect(() => {
    const element = host;
    if (!element) {
      return;
    }

    function update() {
      anchor = element!.firstElementChild ?? element;
    }

    update();
    const observer = new MutationObserver(update);
    observer.observe(element, { childList: true });
    return () => observer.disconnect();
  });

  $effect(() => {
    if (anchor) {
      return connectPopoverTrigger(anchor, menuId, shown, 'menu');
    }
  });

  $effect.pre(() => {
    const source = anchor;
    const view = menuView;

    if (!visible) {
      clicked = false;
      focusPending = null;
      search = { text: '', time: 0 };
      if (focusedInMenu() && source instanceof HTMLElement && source.isConnected)
        untrack(() => restoreTriggerFocus(source));
    }
    else if (view) {
      const key = view.focusKey;
      const focused = focusedInMenu();
      const rowKey = focused instanceof HTMLElement ? focused.dataset.dropdownKey : undefined;
      if (focused === list && key !== null || rowKey !== undefined && !view.isEnabled(rowKey)) {
        repairFocus = true;
      }
    }
  });

  $effect(() => {
    const view = menuView;
    void view?.focusKey;
    if (shown && view && repairFocus) {
      repairFocus = false;
      untrack(() => view.focus());
    }
  });

  $effect(() => {
    const surface = popup;
    const source = anchor;
    if (!surface || !source || !visible) {
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
      onDismiss: close,
      onVisibilityChange: (next) => {
        shown = next;
        if (!next) {
          menuFocused = false;
          hoveredSurfaces.clear();
        }
        else if (resumeFocus) {
          resumeFocus = false;
          menuView?.focus();
        }
        else if (focusPending) {
          focusRequestedEdge();
        }
        else if (autoFocus) {
          menuView?.focus();
        }
      }
    }));

    return () => {
      resumeFocus = Boolean(focusedInMenu());
      closing = true;
      disconnect();
      position.reset();
      closing = false;
    };
  });

  $effect(() => {
    const source = anchor;
    const surface = popup;
    if (shown && alignPoint && source && surface) {
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

  // Прокрутка контейнеров и resize закрывают меню, привязанное к координате окна.
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

  function request(next: boolean, delay = 0, notify = true) {
    cancelPending();
    const source = anchor;
    const ownerValue = isOpen;
    // У hover+contextMenu нет hideAction=hover. Уход указателя не отменяет задержку открытия.
    const retainedHover = next && delay > 0 && alignPoint;

    function apply() {
      pending = undefined;
      if (!active
        || next && (resolvedDisabled
          || !(wanted() || retainedHover && alignPoint && supports('hover')))
        || !source?.isConnected
        || source !== anchor
        || !Object.is(isOpen, ownerValue)) {
        return;
      }

      if (next !== isOpen) {
        internalOpen = next;
        open = next;
        if (notify)
          onOpenChange?.(next);
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
    focusPending = null;
    if (edge) menuView?.focus(edge);
  }

  function focusRow(row: HTMLElement, options: FocusOptions = { preventScroll: true }) {
    row.focus(options);
    const level = row.closest<HTMLElement>('ul[data-menu-list]');
    if (!level) return;

    const bounds = row.getBoundingClientRect();
    const menuBounds = level.getBoundingClientRect();
    if (bounds.top < menuBounds.top + 4) {
      level.scrollTop -= menuBounds.top + 4 - bounds.top;
    }
    else if (bounds.bottom > menuBounds.bottom - 4) {
      level.scrollTop += bounds.bottom - menuBounds.bottom + 4;
    }
  }

  function restoreTriggerFocus(source: HTMLElement) {
    closing = true;
    source.focus({ preventScroll: true });
    closing = false;
  }

  function close(reason: 'escape' | 'outside' | 'trigger' | 'tab' | 'menu') {
    const previous = { clicked, dismissed, focusPending };
    clicked = false;
    dismissed = true;
    focusPending = null;
    request(false, 0, reason !== 'menu');
    if (visible) {
      ({ clicked, dismissed, focusPending } = previous);
      return;
    }

    search = { text: '', time: 0 };
    if ((reason === 'escape'
      || reason === 'menu')
      && focusedInMenu()
      && anchor instanceof HTMLElement
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
      // У contextMenu обычный клик закрывает панель даже без trigger=click.
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
    focusPending = autoFocus ? null : 'first';
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
    if (event.pointerType === 'touch') return;

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

  function focusedInMenu() {
    if (!popup) return undefined;

    let focused = getPopupActiveElement(popup);
    while (focused?.shadowRoot?.activeElement) {
      const inner = focused.shadowRoot.activeElement;
      if (!ownsMenuTarget(inner)) break;
      focused = inner;
    }
    return focused && ownsMenuTarget(focused) ? focused : undefined;
  }

  function handleFocusin() {
    menuFocused = true;
    cancelPending();
  }

  function handleFocusout(event: FocusEvent) {
    if (closing
      || !shown
      || event.relatedTarget instanceof Node
      && ownsMenuTarget(event.relatedTarget)) {
      return;
    }
    if (event.relatedTarget === null && !leavingByTab) {
      return;
    }
    if (!leavingByTab
      && event.relatedTarget instanceof Node
      && host?.contains(event.relatedTarget)) {
      menuFocused = false;
      return;
    }

    menuFocused = false;
    leavingByTab = false;
    close('tab');
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    if (!isDropdownMenuKey(event)) return;

    leavingByTab = event.key === 'Tab';
    if (event.key === ' ' || Array.from(event.key).length !== 1) {
      return;
    }

    const target = event.composedPath()[0];
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>('[data-dropdown-key]');
    if (!row && target !== list) return;
    const level = row?.closest('ul[data-menu-list]') ?? list;
    if (!level) return;

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
    const key = getDropdownMatch(commands, row?.dataset.dropdownKey ?? menuView?.focusKey ?? null,
      search.text);
    const command = commands.find(command => command.key === key);
    if (command) focusRow(command.element);
  }

  function registerMenu(view: DropdownMenuView) {
    menuView = view;
    return () => {
      if (menuView === view) menuView = undefined;
    };
  }

  function connectPopupStyle(surface: HTMLDivElement) {
    const update = connectInlineStyle(surface);
    $effect(() => update(popupStyleLayers));
  }

  // Внешний portal продолжает фокус и hover всей панели. Вложенный DOM всплывает сам.
  function registerPopup(surface: HTMLElement) {
    nestedPopups.add(surface);
    const dispose = [
      on(surface, 'pointerenter', event => {
        if (!popup?.contains(surface)) enterPopup(surface, event);
      }),
      on(surface, 'pointerleave', event => {
        if (!popup?.contains(surface)) leavePopup(surface, event);
      }),
      on(surface, 'focusin', () => {
        if (!popup?.contains(surface)) handleFocusin();
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

  const menuContext: DropdownMenuContext = {
    get prefixCls() { return componentPrefix; },
    get activeKey() { return menu.activeKey; },
    get visible() { return visible; },
    get focused() { return menuFocused; },
    get sourceTheme() { return Boolean(componentTheme.className); },
    get themeStyle() { return componentTheme.style; },
    canActivate: event => active && visible && shown && !event.defaultPrevented,
    command: stayOpen => {
      if (!stayOpen) close('menu');
    },
    focusRow,
    registerMenu,
    registerPopup
  };
</script>

<style>
  [data-ant-dropdown-trigger] { display: inline-block; max-width: 100%; vertical-align: middle; }
  [data-ant-dropdown-popup] { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; background: transparent; width: max-content; min-width: var(--ant-dropdown-anchor-width, 0px); overflow: visible; }
  [data-ant-dropdown-popup][data-ant-dropdown-source-align] {
    width: fit-content;
    right: var(--ant-dropdown-fit-right, auto);
    bottom: var(--ant-dropdown-fit-bottom, auto);
    justify-self: var(--ant-dropdown-fit-justify, unsafe left);
  }
  [data-ant-dropdown-popup][hidden], [data-ant-dropdown-popup]:not(:popover-open) { display: none; }
  [data-ant-dropdown-placement^="top"]:where(:not([data-ant-dropdown-source-theme], [data-ant-dropdown-source-align])) > [data-ant-dropdown-arrow] { left: var(--arrow-x, 50%); right: auto; transform: translateX(-50%) translateY(100%) rotate(180deg); }
  [data-ant-dropdown-placement^="bottom"]:where(:not([data-ant-dropdown-source-theme], [data-ant-dropdown-source-align])) > [data-ant-dropdown-arrow] { left: var(--arrow-x, 50%); right: auto; transform: translateX(-50%) translateY(-100%); }
  @media (prefers-reduced-motion: reduce) {
    [data-ant-dropdown-popup],
    [data-ant-dropdown-popup] :global([data-ant-dropdown-menu]) {
      animation: none;
      transition: none;
    }
  }
</style>

{#if prefixCss}<ThemeScopeStyle css={prefixCss}
  scope={`dropdown-prefix:${componentPrefix}:${rootPrefix}${menu.prefixCls ? `:${menuPrefix}` : ''}`} />{/if}<span data-ant-dropdown-trigger data-ant-dropdown-prefix={componentPrefix} data-ant-dropdown-root-prefix={rootPrefix} data-ant-dropdown-menu-prefix={menuPrefix} bind:this={host} id={triggerId} role="presentation" class={[`${componentPrefix}-trigger`, className]} {style} onpointerenter={handleEnter} onpointerleave={handleLeave} ontouchstart={handleTouchStart} onclick={handleClick} oncontextmenucapture={handleContextMenu} onkeydown={handleTriggerKeydown}>{@render children()}</span>
<NoCompactStyle>
<div data-ant-dropdown-popup data-ant-dropdown-prefix={componentPrefix} data-ant-dropdown-root-prefix={rootPrefix} data-ant-dropdown-menu-prefix={menuPrefix} data-ant-dropdown-source-theme={componentTheme.className ? true : undefined}
  data-ant-dropdown-source-align={builtinPlacements ? true : undefined}
  data-ant-dropdown-placement={actualPlacement} bind:this={popup} id={`${menuId}-popup`} popover="manual" role="presentation" hidden dir={config.direction} class={[
    componentPrefix,
    'ant-dropdown-css-var',
    componentTheme.className,
    componentTheme.className && 'ant-dropdown-source-theme',
    semantics.rootClass,
    actualPlacement && `${componentPrefix}-placement-${actualPlacement}`,
    config.direction === 'rtl' && `${componentPrefix}-rtl`
  ]} style={untrack(() => popupStyle)}
  {@attach connectPopupStyle} {@attach portal}
  onpointerenter={event => enterPopup(event.currentTarget, event)}
  onpointerleave={event => leavePopup(event.currentTarget, event)}
  onfocusin={handleFocusin} onfocusout={handleFocusout}>
  {#if arrow}<span data-ant-dropdown-arrow class={`${componentPrefix}-arrow`}
    style={arrowStyle} aria-hidden="true"></span>{/if}
  <DropdownMenu {menu} {semantics} context={menuContext} id={menuId} label={ariaLabel}
    labelledby={triggerId} onkeydown={handleMenuKeydown} bind:nativeElement={list} />
</div>
</NoCompactStyle>
