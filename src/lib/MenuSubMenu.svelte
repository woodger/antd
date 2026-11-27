<script lang="ts">
  // Connects the submenu trigger to its content and portal. Hover listeners belong to the current
  // container.
  import { onDestroy, onMount, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import type { MenuEntry } from './menu.engine';
  import { menuSubMenu } from './menu.engine';
  import type { MenuExpandIconInfo, MenuTheme } from './menu.types';
  import { provideMenu, useMenu, type MenuContext } from './menu-context';
  import { getMenuPopupAlignment } from './menu-popup-align.engine';
  import { createMenuPopupPosition } from './menu-popup-align.dom';
  import { connectPopup, type PopupConnection } from './popup.dom';
  import { getPopupPlacement, type PopupSourceAlign } from './popup-position.engine';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { getMenuHoverRelatedTarget, withMenuCurrentTarget } from './menu-event.dom';
  import { connectInlineStyle } from './inline-style.dom';
  import { getInlineStyleDeclarations, serializeInlineStyleLayers } from './inline-style.engine';
  import { useZIndex } from './z-index-context.svelte';
  import type { TooltipPosition } from './tooltip.engine';
  import type { TooltipPlacement } from './tooltip.types';
  import { getMenuMotionStyle } from './menu-motion.dom';
  import { getMenuPopupMotion } from './menu-motion.engine';
  import { useMenuMotion } from './menu-motion.svelte';
  import type { MenuMotion } from './menu-motion.types';
  import MenuInlineSubMenu from './MenuInlineSubMenu.svelte';
  import MenuPopupContent from './MenuPopupContent.svelte';
  import Icon from './Icon.svelte';
  import RenderContent from './RenderContent.svelte';

  let {
    entry,
    theme,
    inactive = false,
    overflowItem = false,
    overflowHidden = false,
    accessibleTitle
  }: {
    entry: MenuEntry;
    theme: MenuTheme;
    inactive?: boolean;
    overflowItem?: boolean;
    overflowHidden?: boolean;
    accessibleTitle?: string;
  } = $props();
  const context = useMenu();
  const dropdown = context.dropdown;
  const layer = useZIndex('popup');
  let overflowRest = $derived(entry.overflow === true);
  let popupPath = $derived(entry.path.map(context.id).join(' '));
  let item = $derived(menuSubMenu(entry));
  // Rows inherit the branch icon, including their copies in the More popup.
  const itemContext: MenuContext = Object.create(context, {
    itemIcon: { get: () => item.itemIcon ?? context.itemIcon }
  });
  provideMenu(itemContext);

  let popupRender = $derived(item.popupRender || context.popupRender);
  let popupId = $derived(`${context.id(entry.key)}-popup`);
  let surfaceId = $derived(`${popupId}-content`);
  let controlledId = $derived(context.mode !== 'inline' && popupRender ? surfaceId : popupId);
  let actualTheme = $derived(item.theme ?? theme);
  let opened = $derived(!inactive && context.open.includes(entry.key));
  let popupOpen = $derived(opened && (!overflowRest || entry.children.length > 0));
  const ownerVisible = $derived(dropdown?.visible ?? true);
  let popupRequested = $derived(ownerVisible && context.mode !== 'inline' && popupOpen
    && !overflowHidden && !context.locked);
  let blocked = $derived(inactive || context.disabled || Boolean(item.disabled));
  let expandIcon = $derived(item.expandIcon === undefined ? context.expandIcon : item.expandIcon);
  let hasArrow = $derived(context.mode !== 'horizontal' || Boolean(entry.parent));
  let iconInfo = $derived<MenuExpandIconInfo>({
    ...item,
    eventKey: entry.key,
    isSubMenu: true,
    isOpen: opened,
    disabled: blocked
  });
  const dropdownStyle = $derived.by(() => {
    const style = dropdown?.themeStyle;
    const declarations = Array.from(getInlineStyleDeclarations([style]));
    const inherited = declarations.filter(entry => entry.property !== 'z-index');
    // The submenu inherits the Dropdown theme and computes its own layer.
    return inherited.length === declarations.length ? style
      : inherited.map(({ property, value, priority }) =>
        [property, value, priority === 'important' ? 'important' : ''] as const);
  });
  const popupBaseLayers = $derived([dropdownStyle, context.componentTheme.style, layer.style]);
  let popupLayers = $derived([
    ...popupBaseLayers, item.popupStyle, context.semantics.styles.popup
  ]);
  let popupStyle = $derived(serializeInlineStyleLayers(popupLayers));
  let popupProperties = $derived(new Set(Array.from(
    getInlineStyleDeclarations([popupStyle]),
    declaration => declaration.property
  )));
  let childrenActive = $state(false);
  let active = $derived(!blocked && (context.active === entry.key
    || context.mode !== 'inline' && (childrenActive
      || entry.children.some(child => contains(child, context.active)))));
  const nestedStyle = $derived(context.componentTheme.className
    ? `${context.componentTheme.inheritedStyle};color:inherit;`
      + `font:inherit` : undefined);
  let selected = $derived(
    context.selected.some(key => entry.children.some(child => contains(child, key)))
  );
  let row = $state<HTMLLIElement>();
  let title = $state<HTMLButtonElement>();
  let popup = $state<HTMLDivElement>();
  let positionConnection: PopupConnection | undefined;
  let popupContainer = $state<HTMLElement | ShadowRoot>();
  let client = $state(false);
  let shown = $state(false);
  let popupPlacement = $state<TooltipPlacement>();
  let alignedPoints = $state.raw<PopupSourceAlign>();
  // The nested list context can read the parent object when resolving its mode.
  const popupMode = $derived(context.mode);
  let lastPopupMode = $state<'horizontal' | 'vertical'>(untrack(() =>
    context.mode === 'horizontal' ? 'horizontal' : 'vertical'
  ));
  let lastPopupMotion = $state.raw<MenuMotion | undefined>();
  const effectivePopupMode = $derived(popupMode === 'inline' ? lastPopupMode : popupMode);
  const customMotion = $derived(popupMode === 'inline' ? lastPopupMotion : context.motion);
  const horizontalPopup = $derived(effectivePopupMode === 'horizontal' && !entry.parent);
  const rtl = $derived(context.direction === 'rtl');
  const alignment = $derived(getMenuPopupAlignment(
    horizontalPopup,
    rtl,
    context.builtinPlacements,
    item.popupOffset
  ));
  const placementClass = $derived.by(() => {
    if (alignment) {
      // The map updates its class from the latest points even while coordinates await measurement.
      const name = getPopupPlacement(alignment.placements, alignedPoints ?? alignment.align);
      return name === undefined ? undefined : `${context.prefixCls}-submenu-placement-${name}`;
    }

    if (!context.componentTheme.className) {
      return undefined;
    }

    const side = popupPlacement ?? (horizontalPopup ? 'bottom' : rtl ? 'left' : 'right');
    const name = side === 'left' ? `${rtl ? 'right' : 'left'}Top`
      : side === 'right' ? `${rtl ? 'left' : 'right'}Top` : `${side}Left`;

    return `${context.prefixCls}-submenu-placement-${name}`;
  });
  const titleId = $derived(inactive || context.exiting ? undefined : context.id(entry.key));
  let popupVisited = $state(untrack(() => popupRequested));
  let popupForced = $state(false);
  let containerUsed = $state(untrack(() => Boolean(context.getPopupContainer)));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shadowTransfer: { host: Element; timeStamp: number; } | undefined;
  onMount(() => { client = true; });

  const motion = $derived(getMenuPopupMotion(
    `${context.rootPrefixCls}-${horizontalPopup ? 'slide-up' : 'zoom-big'}`,
    customMotion,
    preparePopup
  ));
  const allowForcePopup = $derived(!customMotion
    || !Object.hasOwn(customMotion, 'forceRender') || !!customMotion.forceRender);
  const forcePopup = $derived(context.forceRender && allowForcePopup);
  const popupMotion = useMenuMotion(() => context.nativeElement, () => popup, () => ({
    motion,
    enabled: context.motionEnabled,
    present: context.forceRender || popupForced || popupVisited || popupRequested,
    visible: popupRequested,
    inactive: inactive || overflowHidden,
    forced: context.forceRender || popupForced,
    settleWithoutAnimation: !customMotion
  }));
  const popupLeaving = $derived(popupMotion.state.phase === 'leave');
  const popupPresented = $derived(ownerVisible && (popupRequested || popupLeaving));
  const inlineCopy = $derived(popupMode === 'inline' && !popupLeaving);
  const popupRendered = $derived(!inactive
    && (popupVisited || popupRequested || forcePopup || popupForced && allowForcePopup)
    && (!inlineCopy || client && containerUsed));
  const transitionStyle = $derived(popupMotion.state.phase ? popupMotion.state.style
    : popupRequested || popupVisited ? getMenuMotionStyle(motion.eventProps?.style) : undefined);

  $effect.pre(() => {
    if (popupMode !== 'inline') {
      lastPopupMode = popupMode;
      lastPopupMotion = context.motion;
    }
    if (popupRequested) popupVisited = true;
    // Hidden copies retain their state when the owner removes forceSubMenuRender.
    if (forcePopup && (popupMode !== 'inline' || context.getPopupContainer)) popupForced = true;
  });

  // Measures the popup in prepare while the transform still allows reading its full size.
  function preparePopup() {
    positionConnection?.forceAlign();
  }

  function resolveContainer(trigger?: HTMLElement) {
    const target = context.getPopupContainer!(trigger!);
    popupContainer = target;
    return target;
  }
  $effect.pre(() => {
    const getter = context.getPopupContainer;
    if (!getter || inactive) {
      popupContainer = undefined;
    }
    // A regular Menu opens Trigger after RAF. forceRender allows the first value to be undefined.
    else if (ownerVisible && context.forceRender && !title && !getter.length) {
      resolveContainer(undefined);
    }
  });
  const portal = createPopupContainer(() => ({
    open: ownerVisible && !inactive && (popupPresented || context.forceRender),
    rendered: popupRendered,
    reference: title,
    getPopupContainer: context.getPopupContainer ? resolveContainer : undefined,
    themeStyle: popupStyle
  }));

  function connectPopupStyle(node: HTMLDivElement) {
    const update = connectInlineStyle(node);
    // Diffing the semantic layers leaves positioning and portal tokens on the surface.
    $effect(() => update([
      ...popupBaseLayers, transitionStyle, item.popupStyle,
      context.semantics.styles.popup
    ]));
  }

  function positionPopup(surface: HTMLDivElement, position: TooltipPosition) {
    alignedPoints = position.sourceAlign;
    // Explicit coordinates in popupStyle and the semantic root override Trigger's calculations.
    const properties = untrack(() => new Set([
      ...popupProperties,
      ...Array.from(getInlineStyleDeclarations([transitionStyle]), entry => entry.property)
    ]));
    const hasInset = properties.has('inset');
    const left = `${position.left}px`;
    const top = `${position.top}px`;
    const arrowX = `${position.arrowX}px`;
    const arrowY = `${position.arrowY}px`;

    if (!hasInset && !properties.has('left') && surface.style.left !== left) {
      surface.style.left = left;
    }
    if (!hasInset && !properties.has('top') && surface.style.top !== top) {
      surface.style.top = top;
    }
    if (surface.style.getPropertyValue('--arrow-x') !== arrowX) {
      surface.style.setProperty('--arrow-x', arrowX);
    }
    if (surface.style.getPropertyValue('--arrow-y') !== arrowY) {
      surface.style.setProperty('--arrow-y', arrowY);
    }
  }

  function contains(node: MenuEntry, key: string | null): boolean {
    return key !== null && (node.key === key || node.children.some(child => contains(child, key)));
  }

  function containsPopupTarget(target: Node) {
    // The portal separates the surfaces in the DOM, so check the Menu instance path.
    const element = target instanceof Element ? target : target.parentElement;
    const owner = element?.closest('[data-menu-popup-path]');
    const path = owner?.getAttribute('data-menu-popup-path');
    return path?.split(' ').includes(context.id(entry.key)) ?? false;
  }

  // The branch has one boundary for all its surfaces, including those with different DOM parents.
  function notifyBranchHover(event: MouseEvent, entering: boolean, surface?: HTMLElement) {
    if ((!item.onMouseEnter && !item.onMouseLeave) || !row || inactive || context.locked
      || row.closest('[inert]') || surface && row.contains(surface)) {
      return;
    }

    if (entering && shadowTransfer?.host === event.relatedTarget
      && shadowTransfer.timeStamp === event.timeStamp) {
      return;
    }
    shadowTransfer = undefined;

    const related = getMenuHoverRelatedTarget(event, entering);
    if (related && (row.contains(related) || containsPopupTarget(related))) {
      const root = surface?.getRootNode();
      if (!entering && root instanceof ShadowRoot) {
        // For the mouseenter from the same movement, relatedTarget is the previous surface's host.
        shadowTransfer = { host: root.host, timeStamp: event.timeStamp };
      }
      return;
    }

    const handler = entering ? item.onMouseEnter : item.onMouseLeave;
    if (handler) {
      withMenuCurrentTarget(event, row, domEvent => handler({ key: entry.key, domEvent }));
    }
  }

  function branchEnter(event: MouseEvent) {
    if (!blocked) context.activate(entry.key);
    context.hover(entry, true);
    notifyBranchHover(event, true);
  }

  function branchLeave(event: MouseEvent) {
    if (context.active === entry.key) context.activate(null);
    context.hover(entry, false);
    notifyBranchHover(event, false);
  }

  function titleHover(event: MouseEvent, entering: boolean) {
    if (blocked || context.locked || title?.closest('[inert]')) return;

    const handler = entering ? item.onTitleMouseEnter : item.onTitleMouseLeave;
    handler?.({ key: entry.key, domEvent: event });
  }

  function popupHover(event: MouseEvent, entering: boolean) {
    if (popupRequested) context.hover(entry, entering);
    if (popup && !popup.inert && !popup.hidden) {
      context.notifyPopupHover(entry, event, entering, popup);
    }
  }

  function connectEvents(element: HTMLElement) {
    const disconnectOwner = dropdown?.registerPopup(element) ?? context.registerPopup?.(element);
    const keyboard = on(element, 'keydown', event => {
      const root = context.nativeElement;
      if (!root || root.contains(element) || element.inert) {
        return;
      }

      // The portal preserves the root callback's currentTarget and the original event target. Enter
      // can close the popup before that event bubbles to this surface.
      withMenuCurrentTarget(event, root, context.keydown);
    });
    // Svelte calls delegated child handlers inside the ShadowRoot first and preserves domEvent.target.
    const click = on(element, 'click', () => {});
    return () => {
      disconnectOwner?.();
      keyboard();
      click();
    };
  }

  $effect(() => {
    if (context.getPopupContainer) containerUsed = true;
  });
  $effect(() => inactive || overflowHidden || context.locked
    ? undefined : context.registerHover(entry.key, { schedule: hover, notify: notifyBranchHover }));
  $effect(() => {
    if (!popupPresented || !popup || !title) {
      return;
    }

    const horizontal = horizontalPopup;
    const anchor = title;
    const surface = popup;
    const getPosition = createMenuPopupPosition(anchor, () => alignment);
    // The first measurement is synchronous. Settings can change without reconnecting the popup.
    const connection = untrack(() => connectPopup(surface, anchor, {
      get placement() {
        return horizontal ? 'bottom' : rtl ? 'left' : 'right';
      },
      get align() {
        if (horizontal) {
          return rtl ? 'right' : 'left';
        }
        return 'top';
      },
      autoAdjustOverflow: true,
      get maxWidth() {
        return untrack(() => popupProperties.has('max-width')) ? false : '100vw';
      },
      get matchAnchorWidth() {
        return horizontal && !untrack(() => popupProperties.has('min-width'));
      },
      gap: () => untrack(() => context.componentTheme.className ? 0 : undefined),
      // Upstream Menu keeps a controlled popup open even when itemHeight=0.
      allowZeroSize: () => untrack(() => Boolean(context.componentTheme.className)),
      pauseAlignment: () => popupLeaving
        || popupMotion.state.step === 'start' || popupMotion.state.step === 'active',
      get interactive() { return popupRequested; },
      preserveFocus: false,
      isRelatedTarget: containsPopupTarget,
      getPosition,
      applyPosition: position => positionPopup(surface, position),
      onPlacement: next => {
        if (!alignment) popupPlacement = next;
      },
      onVisibilityChange: next => {
        shown = next;
      },
      onDismiss: reason => {
        context.setOpen(entry, false);
        if (reason === 'escape')
          context.focusItem(entry.key);
      }
    }));
    positionConnection = connection;
    return () => {
      if (positionConnection === connection) positionConnection = undefined;
      connection();
    };
  });
  $effect(() => {
    if (!ownerVisible || blocked || context.locked || context.mode === 'inline'
      || context.trigger !== 'hover')
      cancel();
  });

  function cancel() {
    if (timer !== undefined)
      clearTimeout(timer);
    timer = undefined;
  }
  function hover(next: boolean) {
    childrenActive = next;
    cancel();
    if (!ownerVisible || blocked || context.locked || context.mode === 'inline'
      || context.trigger !== 'hover') {
      return;
    }

    timer = setTimeout(() => {
      timer = undefined;
      context.setOpen(entry, next);
    }, Math.max(0, next ? context.openDelay : context.closeDelay) * 1000);
  }
  onDestroy(cancel);
</script>

<style>
  [data-ant-menu-submenu-title] {
    display: block;
    width: 100%;
    padding-block: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
  }
  [data-ant-menu-submenu-title]:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: -2px;
  }
  .menu-popup {
    position: fixed;
    margin: 0;
    border: 0;
    overflow: visible;
    background: transparent;
  }
  .menu-popup[data-ant-dropdown-prefix] { z-index: var(--ant-dropdown-z-index-popup, 1050); }
  /* The vendor display rule for horizontal menus must keep a forceSubMenuRender popup hidden. */
  .menu-popup[hidden] { display: none; }
  .menu-popup:global(.ant-menu-source-theme) { border-radius: var(--ant-border-radius-lg); }
  [data-ant-dropdown-branch] { position: relative; }
  [data-ant-dropdown-branch] > [data-ant-menu-submenu-title] { padding-inline-end: calc(var(--ant-control-padding-horizontal) + var(--ant-font-size-sm)); }
  .dropdown-arrow {
    position: absolute;
    inset-inline-end: var(--ant-padding-xs);
    display: inline-flex;
    color: var(--ant-color-icon);
    font-size: var(--ant-font-size-icon);
  }

  @media (prefers-reduced-motion: reduce) {
    [data-ant-dropdown-branch][data-ant-dropdown-menu-prefix] > [data-ant-menu-submenu-title] {
      animation: none;
      transition: none;
    }
  }
</style>

<li bind:this={row} data-ant-menu-prefix={dropdown ? undefined : context.prefixCls}
  data-ant-menu-root-prefix={dropdown ? undefined : context.rootPrefixCls}
  data-ant-dropdown-branch={dropdown ? true : undefined}
  data-ant-dropdown-prefix={dropdown?.prefixCls}
  data-ant-dropdown-root-prefix={dropdown ? context.rootPrefixCls : undefined}
  data-ant-dropdown-menu-prefix={dropdown ? context.prefixCls : undefined}
  role={overflowHidden ? undefined : 'none'} class={[
    overflowItem && `${context.prefixCls}-overflow-item`,
    overflowRest && `${context.prefixCls}-overflow-item-rest`,
    `${context.prefixCls}-submenu`,
    `${context.prefixCls}-submenu-${context.mode}`,
    opened && `${context.prefixCls}-submenu-open`,
    selected && `${context.prefixCls}-submenu-selected`,
    blocked && `${context.prefixCls}-submenu-disabled`,
    active && `${context.prefixCls}-submenu-active`,
    item.class
  ]}
  data-menu-overflow-item={overflowItem || undefined}
  data-menu-overflow-rest={overflowRest || undefined}
  data-menu-overflow-hidden={overflowHidden || undefined}
  inert={overflowHidden || undefined} aria-hidden={overflowHidden || undefined}
  style={item.style} onmouseenter={branchEnter} onmouseleave={branchLeave}>
  <button data-ant-menu-submenu-title type="button" disabled={blocked} bind:this={title}
    {@attach node => inactive || overflowHidden || context.locked
      ? undefined : context.register(entry.key, node)}
    id={titleId} data-menu-id={titleId} data-dropdown-key={dropdown ? entry.key : undefined}
    class={`${context.prefixCls}-submenu-title`} role="menuitem"
    tabindex={blocked ? undefined : dropdown && context.focusKey === entry.key ? 0 : -1}
    aria-disabled={blocked || undefined}
    aria-haspopup="menu" aria-expanded={opened} aria-controls={controlledId}
    title={item.title
        ?? (context.collapsed && typeof item.label === 'string'
          ? item.label
          : undefined)}
    aria-label={accessibleTitle ?? (context.collapsed && !entry.parent
        ? (item.title ?? (typeof item.label === 'string' ? item.label : undefined))
        : undefined)}
    style={[
        !dropdown && context.componentTheme.className && (context.mode === 'horizontal' && !entry.parent
          ? 'width:auto;'
            + 'padding-inline:0'
          : 'width:stretch;'
            + 'min-width:var(--ant-menu-item-width);'
            + 'max-width:var(--ant-menu-item-width)'),
        context.mode === 'inline' && `padding-${context.direction === 'rtl'
          ? 'right' : 'left'}:${entry.level * context.inlineIndent}px`
      ].filter(Boolean).join(';') || undefined}
    onclick={event => {
        if (context.locked) return;
        cancel();
        context.titleClick(entry, event);
      }} onkeydown={event => {
          if (event.key === ' ')
            event.preventDefault();
        }}
    onmouseenter={event => titleHover(event, true)}
    onmouseleave={event => titleHover(event, false)}
    onfocus={() => {
        if (!blocked)
          context.activate(entry.key);
      }}>
    {#if item.icon}<span class={[`${context.prefixCls}-item-icon`, context.semantics.classes.itemIcon]}
      style={context.semantics.styles.itemIcon}>{@render item.icon()}</span>{#if !context.componentTheme.className}{' '}{/if}{/if}{#if context.collapsed && !entry.parent && !item.icon && typeof item.label === 'string'}
      <span class={`${context.prefixCls}-inline-collapsed-noicon`}>{item.label.charAt(0)}</span>
    {:else}<span data-ant-dropdown-title={dropdown ? true : undefined}
      class={`${context.prefixCls}-title-content`}><RenderContent value={item.label} /></span>{/if}
    {#if hasArrow}
      {#if typeof expandIcon === 'function'}<span class={`${context.prefixCls}-submenu-expand-icon`}
        aria-hidden="true">{@render expandIcon(iconInfo)}</span>
      {:else if expandIcon === undefined && dropdown}<span class={[
        `${context.prefixCls}-submenu-expand-icon`, `${context.prefixCls}-submenu-arrow`,
        `${context.prefixCls}-submenu-arrow-icon`, 'dropdown-arrow'
      ]} aria-hidden="true"><Icon name={rtl ? 'left' : 'right'} /></span>
      {:else if expandIcon === undefined}<i class={`${context.prefixCls}-submenu-arrow`}
        aria-hidden="true"></i>{/if}
    {/if}
  </button>
  {#if !inactive && !overflowHidden}
    <MenuInlineSubMenu {entry} {theme} id={popupId} style={nestedStyle} open={opened} />
  {/if}
  {#if popupRendered}
    {#key popupContainer}
      <div data-ant-menu-prefix={dropdown ? undefined : context.prefixCls}
        data-ant-menu-root-prefix={dropdown ? undefined : context.rootPrefixCls}
        data-ant-dropdown-prefix={dropdown?.prefixCls}
        data-ant-dropdown-root-prefix={dropdown ? context.rootPrefixCls : undefined}
        data-ant-dropdown-menu-prefix={dropdown ? context.prefixCls : undefined}
        data-ant-dropdown-source-theme={dropdown?.sourceTheme || undefined}
        data-menu-popup-path={popupPath} id={popupRender && !context.exiting ? surfaceId : undefined}
        data-ant-menu-motion={context.rootPrefixCls}
        bind:this={popup} role="presentation" popover="manual"
        hidden={!popupPresented || !shown}
        inert={popupLeaving || context.locked || undefined}
        aria-hidden={popupLeaving || context.locked || undefined}
        class={[
            `menu-popup ${context.prefixCls} ${dropdown ? 'ant-dropdown-css-var' : 'ant-menu-css-var'} ${context.prefixCls}-submenu ${context.prefixCls}-submenu-popup`,
            !dropdown && context.componentTheme.className,
            !dropdown && context.componentTheme.className && 'ant-menu-source-theme',
            placementClass,
            `${context.prefixCls}-${actualTheme}`,
            context.direction === 'rtl' && `${context.prefixCls}-rtl`,
            item.popupClassName,
            context.semantics.classes.popup,
            context.rootClassName,
            context.semantics.classes.root,
            !popupPresented && popupVisited && `${context.prefixCls}-submenu-hidden`,
            !popupMotion.state.phase && (popupRequested || !popupVisited)
              && motion.eventProps?.className,
            popupMotion.state.className
          ]}
        style={untrack(() => popupStyle)}
        onmouseenter={event => popupHover(event, true)}
        onmouseleave={event => popupHover(event, false)}
        onanimationend={popupMotion.end} ontransitionend={popupMotion.end}
        {@attach portal}
        {@attach connectPopupStyle}
        {@attach connectEvents}>
        <MenuPopupContent {entry} {theme} {popupRender} isInlineCopy={inlineCopy}
          mode={inlineCopy ? 'inline' : effectivePopupMode} leaving={popupLeaving}
          id={popupLeaving && popupMode === 'inline' ? undefined
            : inlineCopy && popupRender ? `${surfaceId}-list` : popupId}
          style={nestedStyle} />
      </div>
    {/key}
  {/if}
</li>
