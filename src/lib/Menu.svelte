<script lang="ts">
  // Владеет состоянием открытых и выбранных пунктов Menu. Клавиатура обрабатывает
  // зарегистрированные видимые элементы.
  import { onDestroy, tick, untrack } from 'svelte';
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
  import { provideMenu } from './menu-context';
  import { useConfig } from './config-context';
  import { useSider } from './layout-context';
  import { useComponentTheme } from './theme-component.svelte';
  import MenuList from './MenuList.svelte';
  import MenuSubMenu from './MenuSubMenu.svelte';
  import EllipsisIcon from './TabsMoreIcon.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getMenuPrefixCss } from './menu-prefix.engine';
  import { menuSemantics } from './menu-semantic.engine';
  import { buildMenuMore, getMenuMoreKey } from './menu-overflow.engine';
  import { connectMenuOverflow, type MenuOverflowLayout } from './menu-overflow.dom';
  import { getPopupActiveElement } from './popup.dom';

  let { nativeElement = $bindable(), ...menuProps }: MenuProps = $props();
  let {
    prefixCls: customizePrefixCls,
    items = [],
    mode = 'vertical',
    theme = 'light',
    disabled = false,
    disabledOverflow = false,
    overflowedIndicator,
    overflowedIndicatorPopupClassName,
    selectedKeys,
    defaultSelectedKeys = [],
    multiple = false,
    selectable = true,
    openKeys,
    defaultOpenKeys = [],
    onOpenChange,
    onClick,
    onSelect,
    onDeselect,
    inlineIndent = 24,
    inlineCollapsed,
    forceSubMenuRender = false,
    triggerSubMenuAction = 'hover',
    subMenuOpenDelay = 0.1,
    subMenuCloseDelay = 0.1,
    classNames: _classNames,
    styles: _styles,
    expandIcon,
    popupRender,
    class: className = '',
    rootClassName = '',
    style: _style,
    onkeydown,
    tabindex = 0,
    ...rest
  } = $derived(menuProps);

  const config = useConfig();
  let componentPrefix = $derived(config.getPrefixCls('menu', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getMenuPrefixCss(componentPrefix, rootPrefix));
  let popupContainer = $derived(Object.hasOwn(rest, 'getPopupContainer')
    ? rest.getPopupContainer : config.getPopupContainer);
  let attributes = $derived.by(() => {
    const { getPopupContainer: _container, ...attributes } = rest;
    return attributes;
  });
  const componentTheme = useComponentTheme('Menu');
  const sider = useSider();
  let resolvedCollapse = $derived(inlineCollapsed ?? sider?.collapsed);
  let semantics = $derived(menuSemantics(config.menu, {
    ...menuProps,
    theme,
    inlineCollapsed: resolvedCollapse
  }));
  let resolvedExpandIcon = $derived(
    expandIcon === undefined ? config.menu?.expandIcon : expandIcon
  );
  const generated = $props.id();
  let model = $derived(buildMenuEntries(items));
  let selected = $state.raw<string[]>(untrack(() => [...selectedKeys ?? defaultSelectedKeys]));
  let opened = $state.raw<string[]>(untrack(() => [...openKeys ?? defaultOpenKeys]));
  let actualSelected = $derived(selectedKeys ?? selected);
  let actualOpen = $derived(openKeys ?? opened);
  let collapsed = $derived(mode !== 'horizontal' && (resolvedCollapse ?? false));
  let actualMode = $derived(collapsed ? 'vertical' : mode);
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
  let rootElement = $state<HTMLUListElement>();
  const elements = new Map<string, HTMLElement>();
  const hoverHandlers = new Map<string, (open: boolean) => void>();
  const handledKeys = new WeakSet<KeyboardEvent>();
  const frames = new Set<number>();
  let previous = untrack(() => ({ selectedKeys, openKeys, mode: actualMode, collapsed }));
  let inlineCache = untrack(() => [...actualOpen]);
  let overflowRevision = 0;

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

  function registerHover(key: string, handler: (open: boolean) => void) {
    hoverHandlers.set(key, handler);
    return () => {
      if (hoverHandlers.get(key) === handler) hoverHandlers.delete(key);
    };
  }

  function hover(entry: MenuEntry, open: boolean) {
    for (let current: MenuEntry | undefined = entry; current; current = current.parent) {
      hoverHandlers.get(current.key)?.(open);
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
    if (disabled || menuItem(entry).disabled) {
      return;
    }

    const before = [...actualSelected];
    const info: MenuClickInfo = {
      key: entry.key,
      keyPath: [...entry.path].reverse(),
      domEvent: event,
      itemData: { ...menuItem(entry) }
    };
    menuItem(entry).onClick?.(info);
    for (let parent = entry.parent; parent; parent = parent.parent)
      menuSubMenu(parent).onClick?.(info);
    onClick?.(info);

    if (selectable) {
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
    if (disabled || menuSubMenu(entry).disabled) {
      return;
    }

    menuSubMenu(entry).onTitleClick?.({ key: entry.key, domEvent: event });
    if (actualMode === 'inline' || triggerSubMenuAction === 'click')
      setOpen(entry, !actualOpen.includes(entry.key));
  }

  function focusItem(key: string) {
    const element = elements.get(key);
    if (!element?.isConnected) {
      return;
    }

    const link = element.querySelector<HTMLAnchorElement>('a[href]');
    active = key;
    (link ?? element).focus({ preventScroll: true });
  }

  function available(entry: MenuEntry) {
    if (disabled || ('disabled' in entry.item && entry.item.disabled)) {
      return false;
    }

    const element = elements.get(entry.key);
    return Boolean(element?.getClientRects().length && !element.closest('[inert]'));
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
    if (event.defaultPrevented || event.isComposing || disabled) {
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
    get prefixCls() { return componentPrefix; },
    get rootPrefixCls() { return rootPrefix; },
    get rootClassName() { return rootClassName; },
    componentTheme,
    get semantics() { return semantics; },
    get expandIcon() { return resolvedExpandIcon; },
    get popupRender() { return popupRender; },
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
      return active;
    },
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
</style>

{#snippet defaultIndicator()}<EllipsisIcon />{/snippet}
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`menu-prefix:${componentPrefix}:${rootPrefix}`} />{/if}<ul {...attributes} data-ant-menu-prefix={componentPrefix} data-ant-menu-root-prefix={rootPrefix} bind:this={rootElement} role="menu" tabindex={tabindex} data-menu-list="true" dir={config.direction}
  data-menu-responsive={responsive || undefined}
  aria-disabled={disabled || undefined} aria-orientation={actualMode === 'horizontal' ? 'horizontal' : 'vertical'}
  style={[componentTheme.style, semantics.styles.root].filter(Boolean).join(';') || undefined} class={[
      `${componentPrefix} ant-menu-css-var ${componentPrefix}-root`,
      componentTheme.className,
      componentTheme.className && 'ant-menu-source-theme',
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
  <MenuList entries={model.roots} {theme} overflowCount={responsive ? visibleCount : undefined} />
  {#if responsive && model.roots.length}
    <MenuSubMenu entry={more.root} {theme} overflowItem overflowHidden={!showMore}
      accessibleTitle={indicatorLabel} />
  {/if}
</ul>
