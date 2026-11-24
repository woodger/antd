<script lang="ts">
  // Владеет состоянием открытых и выбранных пунктов Menu. Клавиатура обрабатывает
  // зарегистрированные видимые элементы.
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import {
    buildMenuEntries,
    menuLevel,
    menuVisible,
    menuOpenKeys,
    menuSelection,
    menuKeyboardAction,
    menuItem,
    menuSubMenu
  } from './menu.engine';
  import type { MenuEntry } from './menu.engine';
  import type { MenuProps, MenuClickInfo } from './menu.types';
  import { provideMenu, type MenuBranchHover } from './menu-context';
  import { takeDropdownMenu } from './dropdown-menu-context';
  import { getDropdownPrefixCss } from './dropdown-prefix.engine';
  import { isDropdownMenuKey } from './dropdown.engine';
  import { useConfig } from './config-context';
  import { useSider } from './layout-context';
  import { useComponentTheme } from './theme-component.svelte';
  import { useToken } from './theme-context.svelte';
  import MenuList from './MenuList.svelte';
  import MenuSubMenu from './MenuSubMenu.svelte';
  import EllipsisIcon from './TabsMoreIcon.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getMenuMotionCss, getMenuPrefixCss } from './menu-prefix.engine';
  import { menuSemantics } from './menu-semantic.engine';
  import { buildMenuMore, getMenuMoreKey } from './menu-overflow.engine';
  import { connectMenuOverflow, type MenuOverflowLayout } from './menu-overflow.dom';
  import { getPopupActiveElement } from './popup.dom';

  let { nativeElement = $bindable(), ...menuProps }: MenuProps = $props();
  let {
    prefixCls: customizePrefixCls,
    items = [],
    mode = 'vertical',
    direction: _direction,
    theme = 'light',
    disabled = false,
    disabledOverflow = false,
    overflowedIndicator,
    overflowedIndicatorPopupClassName,
    selectedKeys,
    defaultSelectedKeys = [],
    multiple = false,
    selectable,
    openKeys,
    defaultOpenKeys = [],
    onOpenChange,
    onClick,
    onSelect,
    onDeselect,
    inlineIndent = 24,
    inlineCollapsed,
    forceSubMenuRender = false,
    motion,
    defaultMotions: _defaultMotions,
    triggerSubMenuAction = 'hover',
    subMenuOpenDelay = 0.1,
    subMenuCloseDelay = 0.1,
    builtinPlacements,
    classNames: _classNames,
    styles: _styles,
    expandIcon,
    itemIcon,
    tooltip,
    popupRender,
    class: className = '',
    rootClassName = '',
    style: _style,
    onkeydown,
    tabindex = 0,
    ...rest
  } = $derived(menuProps);

  const config = useConfig();
  const dropdown = takeDropdownMenu();
  let componentPrefix = $derived(config.getPrefixCls('menu', customizePrefixCls
    || (dropdown ? `${dropdown.prefixCls}-menu` : undefined)));
  let rootPrefix = $derived(config.getPrefixCls());
  const prefixCss = $derived.by(() => {
    if (!dropdown) return getMenuPrefixCss(componentPrefix, rootPrefix);
    if (componentPrefix !== dropdown.menuPrefix) {
      return getDropdownPrefixCss(dropdown.prefixCls, rootPrefix, componentPrefix);
    }
  });
  const prefixScope = $derived(dropdown
    ? `dropdown-menu-prefix:${dropdown.prefixCls}:${rootPrefix}:${componentPrefix}`
    : `menu-prefix:${componentPrefix}:${rootPrefix}`);
  let motionCss = $derived(getMenuMotionCss(rootPrefix));
  let popupContainer = $derived(Object.hasOwn(rest, 'getPopupContainer')
    ? rest.getPopupContainer : config.getPopupContainer);
  let attributes = $derived.by(() => {
    const { getPopupContainer: _container, ...attributes } = rest;
    return attributes;
  });
  const componentTheme = useComponentTheme('Menu');
  const tokens = useToken();
  const sider = useSider();
  let resolvedCollapse = $derived(inlineCollapsed ?? (dropdown ? undefined : sider?.collapsed));
  let resolvedMode = $derived(dropdown ? 'vertical' : mode);
  let isSelectable = $derived(selectable ?? !dropdown);
  let semantics = $derived(menuSemantics(config.menu, {
    ...menuProps,
    ...dropdown ? { mode: resolvedMode, selectable: isSelectable } : {},
    theme,
    inlineCollapsed: resolvedCollapse
  }));
  let resolvedExpandIcon = $derived(
    expandIcon === undefined && !dropdown ? config.menu?.expandIcon : expandIcon
  );
  const generated = $props.id();
  let model = $derived(buildMenuEntries(items));
  let selected = $state.raw<string[]>(untrack(() => [...selectedKeys ?? defaultSelectedKeys]));
  let opened = $state.raw<string[]>(untrack(() => [...openKeys ?? defaultOpenKeys]));
  let actualSelected = $derived(selectedKeys ?? selected);
  let actualOpen = $derived(openKeys ?? opened);
  let collapsed = $derived(resolvedMode !== 'horizontal' && (resolvedCollapse ?? false));
  let actualMode = $derived(collapsed ? 'vertical' : resolvedMode);
  let responsive = $derived(actualMode === 'horizontal' && !disabledOverflow);
  let overflowLayout = $state.raw<MenuOverflowLayout>();
  let visibleCount = $derived(overflowLayout?.visibleCount ?? model.roots.length);
  let omitted = $derived(responsive ? model.roots.slice(visibleCount) : []);
  let showMore = $derived(responsive && overflowLayout?.hasWidth === true && omitted.length > 0);
  let indicator = $derived.by(() => {
    if (!Object.hasOwn(menuProps, 'overflowedIndicator')) {
      return defaultIndicator;
    }
    return overflowedIndicator === false || overflowedIndicator === null
      ? undefined : overflowedIndicator ?? '...';
  });
  let indicatorLabel = $derived(indicator === defaultIndicator || !indicator && indicator !== 0
    ? 'ellipsis' : undefined);
  let more = $derived(buildMenuMore({
    key: getMenuMoreKey(model.entries),
    label: indicator,
    disabled: !showMore,
    popupClassName: overflowedIndicatorPopupClassName,
    children: omitted.map(entry => entry.item)
  }, showMore ? omitted : []));
  let rootEntries = $derived(responsive
    ? [...model.roots.slice(0, visibleCount), ...showMore ? [more.root] : []]
    : model.roots);

  let active = $state<string | null>(null);
  let dropdownFocusKey = $derived(dropdown ? resolveDropdownFocusKey(dropdown.activeKey ?? active)
    : null);
  let previousDropdownActiveKey = untrack(() => dropdown?.activeKey);
  let rootElement = $state<HTMLUListElement>();
  let mounted = $state(false);
  let reducedMotion = $state(false);
  const elements = new Map<string, HTMLElement>();
  const hoverHandlers = new Map<string, MenuBranchHover>();
  const handledKeys = new WeakSet<KeyboardEvent>();
  const frames = new Set<number>();
  let previous = untrack(() => ({ selectedKeys, openKeys, mode: actualMode, collapsed }));
  let inlineCache = untrack(() => [...actualOpen]);
  let overflowRevision = 0;

  onMount(() => { mounted = true; });
  $effect(() => {
    const view = rootElement?.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
    // Один media listener определяет motion для обеих поверхностей каждого подменю.
    function update() { reducedMotion = preference.matches; }
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  });

  onDestroy(() => {
    overflowRevision++;
    frames.forEach(frame => cancelAnimationFrame(frame));
    frames.clear();
    hoverHandlers.clear();
  });

  $effect(() => {
    nativeElement = rootElement;
    return () => { nativeElement = undefined; };
  });

  $effect.pre(() => {
    const next = dropdown?.activeKey;
    if (previousDropdownActiveKey !== undefined && next === undefined) active = null;
    previousDropdownActiveKey = next;
  });

  $effect(() => {
    const element = rootElement;
    if (element && dropdown) {
      return dropdown.registerMenu({
        element,
        get focusKey() { return dropdownFocusKey; },
        isEnabled: key => isEnabled(navigationEntry(key)),
        focus: focusDropdown
      });
    }
  });

  $effect(() => {
    if (rootElement && responsive) {
      return connectMenuOverflow(rootElement, updateOverflowLayout);
    }
  });

  function focusedEntry() {
    for (const [key, element] of elements) {
      const target = getPopupActiveElement(element);
      if (target && element.contains(target)) {
        return { key, element, target };
      }
    }
  }

  function updateOverflowLayout(next: MenuOverflowLayout) {
    if (next.visibleCount === overflowLayout?.visibleCount
      && next.hasWidth === overflowLayout.hasWidth) {
      return;
    }

    const focused = focusedEntry();
    const revision = ++overflowRevision;
    overflowLayout = next;
    if (focused) {
      void tick().then(() => {
        if (revision === overflowRevision && responsive) {
          restoreOverflowFocus(focused);
        }
      });
    }
  }

  function restoreOverflowFocus(focused: NonNullable<ReturnType<typeof focusedEntry>>) {
    const current = getPopupActiveElement(focused.element);
    const document = focused.element.ownerDocument;
    if (current && current !== focused.target && current !== document.body) {
      return;
    }

    const entry = navigationEntry(focused.key);
    if (entry && available(entry)) {
      if (current !== focused.target || elements.get(entry.key) !== focused.element) {
        focusItem(entry.key);
      }
    }
    else if (showMore && available(more.root)) {
      focusItem(more.root.key);
    }
    else {
      const replacement = menuLevel(rootEntries).find(available);
      if (replacement) {
        focusItem(replacement.key);
      }
    }
  }

  function navigationEntry(key: string) {
    return (showMore ? more.entries.get(key) : undefined) ?? model.entries.get(key);
  }

  $effect(() => {
    const next = { selectedKeys, openKeys, mode: actualMode, collapsed };

    untrack(() => {
      if (next.selectedKeys !== previous.selectedKeys)
        selected = [...next.selectedKeys ?? []];
      if (next.openKeys !== previous.openKeys)
        opened = [...next.openKeys ?? []];
      if (next.mode !== previous.mode || next.collapsed !== previous.collapsed) {
        if (next.mode === 'inline') {
          opened = [...inlineCache];
        }
        else {
          opened = [];
          onOpenChange?.([]);
        }
      }
      previous = next;
    });
  });

  $effect(() => {
    const keys = actualOpen;
    if (actualMode === 'inline')
      inlineCache = [...keys];
  });

  function id(key: string) {
    return `ant-menu-${generated}-${encodeURIComponent(key)}`;
  }

  function register(key: string, element: HTMLElement) {
    elements.set(key, element);
    return () => {
      if (elements.get(key) === element)
        elements.delete(key);
    };
  }

  function registerHover(key: string, handler: MenuBranchHover) {
    hoverHandlers.set(key, handler);
    return () => {
      if (hoverHandlers.get(key) === handler) hoverHandlers.delete(key);
    };
  }

  function hover(entry: MenuEntry, open: boolean) {
    for (let current: MenuEntry | undefined = entry; current; current = current.parent) {
      hoverHandlers.get(current.key)?.schedule(open);
    }
  }

  // Нативные события идут по физическому DOM. Portal добавляет пропущенные логические ветки.
  function notifyPopupHover(
    entry: MenuEntry, event: MouseEvent, entering: boolean, surface: HTMLElement
  ) {
    const path = entering ? entry.path : [...entry.path].reverse();

    for (const key of path) {
      hoverHandlers.get(key)?.notify(event, entering, surface);
    }
  }

  function setOpen(entry: MenuEntry, next: boolean) {
    const keys = menuOpenKeys(actualOpen, entry, next, actualMode);
    if (keys.length === actualOpen.length
      && keys.every((key, index) => key === actualOpen[index])) {
      return;
    }

    opened = keys;
    onOpenChange?.(keys);
  }

  function click(entry: MenuEntry, event: MouseEvent | KeyboardEvent) {
    const item = menuItem(entry);
    if (disabled || item.disabled || dropdown && !dropdown.canActivate(event)) {
      return;
    }

    const before = [...actualSelected];
    const { onMouseEnter: _enter, onMouseLeave: _leave, ...itemData } = item;
    const info: MenuClickInfo = {
      key: entry.key,
      keyPath: [...entry.path].reverse(),
      domEvent: event,
      itemData
    };
    item.onClick?.(info);
    for (let parent = entry.parent; parent; parent = parent.parent) {
      if (dropdown && !dropdown.canActivate(event)) return;
      menuSubMenu(parent).onClick?.(info);
    }
    if (dropdown && !dropdown.canActivate(event)) return;
    onClick?.(info);
    if (dropdown) {
      if (!dropdown.canActivate(event)) return;
      dropdown.command();
    }

    if (isSelectable) {
      const next = menuSelection(before, entry.key, multiple);
      selected = next.keys;
      const detail = { ...info, selectedKeys: [...next.keys] };
      if (next.deselect) {
        onDeselect?.(detail);
      }
      else {
        onSelect?.(detail);
      }
    }
    if (!multiple && actualMode !== 'inline' && actualOpen.length) {
      opened = [];
      onOpenChange?.([]);
    }
  }

  function titleClick(entry: MenuEntry, event: MouseEvent) {
    const submenu = menuSubMenu(entry);
    if (disabled || submenu.disabled || dropdown && !dropdown.canActivate(event)) {
      return;
    }

    const toggles = actualMode === 'inline' || triggerSubMenuAction === 'click';
    // Trigger Dropdown меняет openKeys до уведомления заголовка.
    if (dropdown && toggles) setOpen(entry, !actualOpen.includes(entry.key));
    submenu.onTitleClick?.({ key: entry.key, domEvent: event });
    if (!dropdown && toggles) setOpen(entry, !actualOpen.includes(entry.key));
  }

  function focusItem(key: string) {
    const element = elements.get(key);
    if (!element?.isConnected) {
      return;
    }

    active = key;
    if (dropdown) {
      dropdown.focusRow(element);
      return;
    }
    const link = element.querySelector<HTMLAnchorElement>('a[href]');
    (link ?? element).focus({ preventScroll: true });
  }

  function isEnabled(entry: MenuEntry | undefined) {
    if (disabled || !entry) return false;
    return !('disabled' in entry.item && entry.item.disabled);
  }

  function available(entry: MenuEntry) {
    if (!isEnabled(entry)) {
      return false;
    }

    const element = elements.get(entry.key);
    return Boolean(element?.getClientRects().length && !element.closest('[inert]'));
  }

  function resolveDropdownFocusKey(key: string | null) {
    const entry = key === null ? undefined : navigationEntry(key);
    if (entry && isEnabled(entry)) {
      let ancestor = entry.parent;
      while (ancestor && isEnabled(ancestor) && actualOpen.includes(ancestor.key)) {
        ancestor = ancestor.parent;
      }
      if (!ancestor) return entry.key;
    }

    return menuLevel(rootEntries).find(isEnabled)?.key ?? null;
  }

  function focusDropdown(edge?: 'first' | 'last') {
    const preferred = dropdownFocusKey === null ? undefined : navigationEntry(dropdownFocusKey);
    const roots = visibleLevel(menuLevel(rootEntries));
    const target = edge === 'first' ? roots[0] : edge === 'last' ? roots.at(-1)
      : preferred && available(preferred) ? preferred : roots[0];
    if (target) focusItem(target.key);
    else rootElement?.focus({ preventScroll: true });
  }

  function visibleLevel(items: MenuEntry[], parent?: MenuEntry) {
    const visible = items.filter(available);
    if (parent && (menuSubMenu(parent).popupRender || popupRender)) {
      // Пользовательский список может переставить строки, сохранив их ключи и пути.
      visible.sort(comparePopupItems);
    }
    return visible;
  }

  function comparePopupItems(first: MenuEntry, second: MenuEntry) {
    const left = elements.get(first.key);
    const right = elements.get(second.key);
    if (!left || !right) {
      return 0;
    }

    const position = left.compareDocumentPosition(right);
    if (!position || position & Node.DOCUMENT_POSITION_DISCONNECTED) {
      return 0;
    }
    return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  }

  async function keyboard(entry: MenuEntry | null, event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || disabled
      || dropdown && !isDropdownMenuKey(event)) {
      return;
    }

    const action = menuKeyboardAction(
      actualMode,
      !entry?.parent,
      config.direction === 'rtl',
      event.key
    );
    const boundary = event.key === 'Home' || event.key === 'End';
    if (!action && !boundary) {
      return;
    }
    if (event.key.startsWith('Arrow') || boundary)
      event.preventDefault();

    if (boundary || action === 'previous' || action === 'next' || !entry) {
      const parent = entry?.parent;
      const candidates = actualMode === 'inline'
        ? menuVisible(rootEntries, actualOpen, true).filter(available)
        : visibleLevel(menuLevel(parent?.children ?? rootEntries), parent);
      const position = candidates.findIndex(item => item.key === entry?.key);
      const offset = action === 'previous' ? -1 : 1;
      const index = position < 0 ? (offset < 0 ? candidates.length - 1 : 0)
        : (position + offset + candidates.length) % candidates.length;
      const target = event.key === 'Home'
        ? candidates[0]
        : event.key === 'End' ? candidates.at(-1) : candidates[index];
      if (target)
        focusItem(target.key);
    }
    else if (entry.kind === 'submenu' && (action === 'children' || action === 'toggle')) {
      if (event.key === 'Enter')
        event.preventDefault();
      setOpen(entry, action === 'toggle' ? !actualOpen.includes(entry.key) : true);

      if (action === 'children') {
        await tick();
        await new Promise<void>(resolve => {
          const frame = requestAnimationFrame(() => {
            frames.delete(frame);
            resolve();
          });
          frames.add(frame);
        });
        const first = visibleLevel(menuLevel(entry.children), entry)[0];
        if (first && actualOpen.includes(entry.key))
          focusItem(first.key);
      }
    }
    else if (action === 'parent' && entry.parent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(entry.parent, false);
      await tick();
      focusItem(entry.parent.key);
    }
  }

  provideMenu({
    dropdown,
    get prefixCls() { return componentPrefix; },
    get rootPrefixCls() { return rootPrefix; },
    get rootClassName() { return rootClassName; },
    componentTheme,
    get semantics() { return semantics; },
    get expandIcon() { return resolvedExpandIcon; },
    get itemIcon() { return itemIcon; },
    get tooltip() { return tooltip; },
    get tooltipCollapsed() { return Boolean(!dropdown && sider?.collapsed || resolvedCollapse); },
    get popupRender() { return popupRender; },
    get builtinPlacements() { return builtinPlacements; },
    get motion() { return mounted ? motion : undefined; },
    get motionReady() { return mounted; },
    get motionEnabled() { return mounted && tokens.token.motion && !reducedMotion; },
    locked: false,
    exiting: false,
    get mode() {
      return actualMode;
    },
    get theme() {
      return theme;
    },
    get collapsed() {
      return collapsed;
    },
    get disabled() {
      return disabled;
    },
    get direction() {
      return config.direction;
    },
    get inlineIndent() {
      return inlineIndent;
    },
    get selected() {
      return actualSelected;
    },
    get open() {
      return actualOpen;
    },
    get active() {
      if (dropdown) {
        return dropdown.activeKey ?? (dropdown.isFocused(rootElement) || !dropdown.sourceTheme
          ? dropdownFocusKey : null);
      }
      return active;
    },
    get focusKey() { return dropdownFocusKey; },
    get forceRender() {
      return forceSubMenuRender;
    },
    get trigger() {
      return triggerSubMenuAction;
    },
    get openDelay() {
      return subMenuOpenDelay;
    },
    get closeDelay() {
      return subMenuCloseDelay;
    },
    get nativeElement() {
      return rootElement;
    },
    get getPopupContainer() {
      return popupContainer;
    },
    id,
    register,
    registerHover,
    hover,
    notifyPopupHover,
    keydown,
    activate: key => {
      active = key;
    },
    click,
    titleClick,
    setOpen,
    keyboard,
    focusItem
  });

  function keydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLUListElement; }) {
    // Вложенные portal могут находиться в одном контейнере; событие обрабатывается один раз.
    if (handledKeys.has(event)) {
      return;
    }
    handledKeys.add(event);
    const target = event.composedPath().find((node): node is Element =>
      node instanceof Element && node.hasAttribute('data-menu-id'));
    const match = [...elements].find(([, element]) => element === target
      || target && element.id === target.id);
    const key = match?.[0];
    if (key !== undefined || event.target === rootElement) {
      // Элементы управления в собственном содержимом popup получают обычные клавиши.
      const entry = key === undefined ? null : navigationEntry(key) ?? null;
      void keyboard(entry, event);
    }
    dropdown?.keydown(event, event.currentTarget);
    onkeydown?.(event);
  }

  export function focus(options?: FocusOptions) {
    const entry = active === null ? undefined : navigationEntry(active);
    const target = entry && available(entry)
      ? entry
      : menuVisible(rootEntries, actualOpen, actualMode === 'inline').find(available);
    if (target) {
      const element = elements.get(target.key);
      const link = element?.querySelector<HTMLAnchorElement>('a[href]');
      active = target.key;
      (link ?? element)?.focus(options);
    }
  }

  export function findItem(params: { key: string; }) {
    return elements.get(params.key) ?? null;
  }
</script>

<style>
  [data-menu-responsive] > :global([data-menu-overflow-hidden]) {
    position: absolute !important;
    inset-inline-start: 0;
    height: 0 !important;
    overflow-y: hidden;
    visibility: hidden;
    pointer-events: none;
  }
  [data-ant-dropdown-menu] { box-sizing: border-box; width: 100%; max-width: 100%; max-height: calc(100dvh - 16px); overflow: auto; overflow-wrap: anywhere; }
  :global([data-ant-dropdown-source-theme]) [data-ant-dropdown-menu] { box-sizing: content-box; width: auto; max-height: calc(100vh - var(--ant-control-height-lg) * 2.5); }
  :global([data-ant-dropdown-source-align]) > [data-ant-dropdown-menu] { overflow-wrap: break-word; }
  [data-ant-dropdown-empty] { padding: 8px 12px; color: var(--ant-color-text-description); }
</style>

{#snippet defaultIndicator()}<EllipsisIcon />{/snippet}
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={prefixScope} />{/if}{#if motionCss}<ThemeScopeStyle css={motionCss} scope={`menu-motion:${rootPrefix}`} />{/if}<ul {...attributes} data-ant-menu-prefix={dropdown ? undefined : componentPrefix} data-ant-menu-root-prefix={dropdown ? undefined : rootPrefix} bind:this={rootElement} role="menu" tabindex={tabindex} data-menu-list="true" dir={config.direction}
  data-ant-dropdown-menu={dropdown ? true : undefined}
  data-ant-dropdown-prefix={dropdown?.prefixCls}
  data-ant-dropdown-root-prefix={dropdown ? rootPrefix : undefined}
  data-ant-dropdown-menu-prefix={dropdown ? componentPrefix : undefined}
  data-menu-responsive={responsive || undefined}
  aria-disabled={disabled || undefined} aria-orientation={actualMode === 'horizontal' ? 'horizontal' : 'vertical'}
  style={[componentTheme.style, semantics.styles.root].filter(Boolean).join(';') || undefined} class={[
      dropdown ? `${componentPrefix} ${componentPrefix}-root`
        : `${componentPrefix} ant-menu-css-var ${componentPrefix}-root`,
      dropdown?.sourceTheme && 'ant-dropdown-menu-css-var',
      !dropdown && componentTheme.className,
      !dropdown && componentTheme.className && 'ant-menu-source-theme',
      responsive && `${componentPrefix}-overflow`,
      `${componentPrefix}-${actualMode}`,
      `${componentPrefix}-${theme}`,
      collapsed && `${componentPrefix}-inline-collapsed`,
      config.direction === 'rtl' && `${componentPrefix}-rtl`,
      config.menu?.class,
      className,
      rootClassName,
      semantics.classes.root
    ]}
  onkeydown={keydown}>
  {#if dropdown && !model.roots.length}<li data-ant-dropdown-empty role="none"
    class={`${componentPrefix}-empty`}>{config.locale.emptyText}</li>
  {:else}<MenuList entries={model.roots} {theme} overflowCount={responsive ? visibleCount : undefined} />{/if}
  {#if responsive && model.roots.length}
    <MenuSubMenu entry={more.root} {theme} overflowItem overflowHidden={!showMore}
      accessibleTitle={indicatorLabel} />
  {/if}
</ul>
