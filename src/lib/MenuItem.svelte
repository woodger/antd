<script lang="ts">
  // Владеет узлом строки, её фокусом и временем жизни закреплённой за ней подсказки.
  import { on } from 'svelte/events';
  import { menuItem, type MenuEntry } from './menu.engine';
  import type { MenuContent } from './menu.types';
  import { useMenu } from './menu-context';
  import { getDropdownCommandAttributes, isDropdownMenuKey } from './dropdown.engine';
  import MenuItemTooltip from './MenuItemTooltip.svelte';

  let { entry, overflowItem, overflowHidden, inactive }: {
    entry: MenuEntry;
    overflowItem: boolean;
    overflowHidden: boolean;
    inactive: boolean;
  } = $props();
  const context = useMenu();
  const dropdown = context.dropdown;
  let element = $state<HTMLElement>();
  const item = $derived(menuItem(entry));
  const native = $derived(dropdown ? getDropdownCommandAttributes(item) : undefined);
  const dataAttributes = $derived(Object.fromEntries(
    Object.entries(item).filter(([name]) => name.startsWith('data-'))
  ));
  const blocked = $derived(context.disabled || item.disabled);
  const nested = $derived(entry.parent && !entry.parent.overflow);
  const semantic = $derived(context.semantics);
  const classes = $derived(nested ? semantic.classes.subMenu : semantic.classes);
  const styles = $derived(nested ? semantic.styles.subMenu : semantic.styles);
  const selected = $derived(context.selected.includes(entry.key));
  const trailingIcon = $derived(item.itemIcon || context.itemIcon);
  const locked = $derived(inactive || context.locked);
  const id = $derived(inactive || context.exiting ? undefined : context.id(entry.key));
  const nativeTitle = $derived(typeof item.title === 'string' ? item.title : undefined);
  const accessibleTitle = $derived(nativeTitle
    ?? (typeof item.label === 'string' ? item.label : undefined));
  const rowClass = $derived([
    overflowItem && `${context.prefixCls}-overflow-item`,
    `${context.prefixCls}-item`,
    context.active === entry.key && `${context.prefixCls}-item-active`,
    selected && `${context.prefixCls}-item-selected`,
    blocked && `${context.prefixCls}-item-disabled`,
    item.danger && `${context.prefixCls}-item-danger`,
    classes.item,
    item.class
  ]);
  const rowStyle = $derived([
    context.mode === 'inline'
      && `padding-${context.direction === 'rtl' ? 'right' : 'left'}:${entry.level * context.inlineIndent}px`,
    styles.item,
    item.style
  ].filter(Boolean).join(';'));
  const rowAttributes = $derived({
    ...dataAttributes,
    id,
    'data-menu-id': id,
    'data-menu-overflow-item': overflowItem || undefined,
    'data-menu-overflow-hidden': overflowHidden || undefined,
    inert: overflowHidden || undefined,
    'aria-hidden': overflowHidden || undefined,
    'data-dropdown-key': dropdown ? entry.key : undefined,
    'data-dropdown-text': native?.textValue,
    tabindex: blocked || locked ? (dropdown ? -1 : undefined)
      : dropdown && context.focusKey === entry.key ? 0 : -1,
    title: nativeTitle,
    'aria-label': dropdown ? (typeof item.label === 'function' ? native?.textValue : undefined)
      : context.collapsed && !entry.parent ? accessibleTitle : undefined,
    class: rowClass,
    style: rowStyle,
    onclick: activate,
    onkeydown: keyboard,
    onpointermove: dropdown ? pointerMove : undefined,
    onmouseenter: enter,
    onmouseleave: leave
  });

  const tooltip = $derived(context.tooltip || undefined);
  const showTooltip = $derived(!locked && context.tooltip !== false
    && (context.tooltipCollapsed || Boolean(tooltip?.forceRender)));
  let tooltipMounted = $state(false);
  let tooltipClick: ((event: MouseEvent) => void) | undefined;

  $effect.pre(() => {
    if (showTooltip) {
      tooltipMounted = true;
    }
    else if (locked || context.tooltip === false) {
      tooltipMounted = false;
    }
  });

  // Compose на строке сохраняет порядок Tooltip → Menu после событий дочерней ссылки.
  function connectClick(handler: (event: MouseEvent) => void) {
    tooltipClick = handler;
    return () => {
      if (tooltipClick === handler) tooltipClick = undefined;
    };
  }

  function registerRow(element: HTMLElement) {
    if (!locked) return context.register(entry.key, element);
  }

  function connectFocus(element: HTMLElement) {
    function focus() {
      if (!context.locked && !blocked) {
        context.activate(entry.key);
      }
    }
    // Переходы между пунктами одного ShadowRoot не доходят до document delegation.
    return on(element, 'focusin', focus);
  }

  function enter(event: MouseEvent) {
    if (locked || blocked || element?.closest('[inert]')) return;

    const handler = item.onMouseEnter;
    handler?.({ key: entry.key, domEvent: event });
    context.activate(entry.key);
  }

  function leave(event: MouseEvent) {
    if (locked || element?.closest('[inert]')) return;

    const handler = item.onMouseLeave;
    if (!blocked) handler?.({ key: entry.key, domEvent: event });
    if (!dropdown && context.active === entry.key) context.activate(null);
  }

  function pointerMove(event: PointerEvent & { currentTarget: HTMLElement; }) {
    if (!dropdown || blocked || locked || event.pointerType === 'touch') return;

    context.activate(entry.key);
    if (dropdown.isFocused(context.nativeElement)) dropdown.focusRow(event.currentTarget);
  }

  function activate(event: MouseEvent) {
    tooltipClick?.(event);
    if (context.locked || blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    context.click(entry, event);
  }

  function keyboard(event: KeyboardEvent) {
    const activatesChoice = Boolean(context.itemRole) && event.key === ' ';
    if (context.locked || blocked) {
      if (event.key === 'Enter' || activatesChoice)
        event.preventDefault();
      return;
    }
    if (dropdown) {
      if (event.key === ' ' && native?.href !== undefined && isDropdownMenuKey(event)) {
        event.preventDefault();
        element?.click();
      }
      return;
    }
    if (event.key === 'Enter' || activatesChoice) {
      // Enter на настоящей ссылке создаёт native click, который запускает callback.
      if (!activatesChoice && event.composedPath()[0] instanceof HTMLAnchorElement) {
        return;
      }
      event.preventDefault();
      context.click(entry, event);
    }
  }
</script>

<style>
  [data-ant-menu-item]:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: -2px; }
  [data-ant-menu-item-disabled] :global(a) { pointer-events: none; cursor: not-allowed; }
  :where([data-ant-dropdown-item]) { appearance: none; width: 100%; margin: 0; border: 0; background: transparent; color: inherit; text-align: start; font: inherit; }
  :global([data-ant-dropdown-source-theme]) [data-ant-dropdown-item] { box-sizing: content-box; width: stretch; height: auto; }
  a[data-ant-dropdown-item] { box-sizing: border-box; text-decoration: none; }
  [data-ant-dropdown-title] { min-width: 0; white-space: normal; }

  @media (prefers-reduced-motion: reduce) {
    :global([data-ant-dropdown-prefix][data-ant-dropdown-menu-prefix]) [data-ant-dropdown-item] {
      animation: none;
      transition: none;
    }
  }
</style>

{#snippet content(value: MenuContent | undefined)}{#if typeof value === 'function'}{@render value()}{:else}{value ?? ''}{/if}{/snippet}
{#snippet rowContents()}
  <!-- Source icon/label идут подряд; native-тема сохраняет межэлементный пробел. -->
  {#if item.icon}<span class={[`${context.prefixCls}-item-icon`, classes.itemIcon]}
    style={styles.itemIcon} aria-hidden={dropdown ? true : undefined}>{@render item.icon()}</span>{#if !dropdown && !context.componentTheme.className}{' '}{/if}{/if}<span data-ant-dropdown-title={dropdown ? true : undefined} class={[
      `${context.prefixCls}-title-content`,
      item.extra !== undefined && `${context.prefixCls}-title-content-with-extra`,
      classes.itemContent
    ]} style={styles.itemContent}>
    {#if context.collapsed && !entry.parent && !item.icon && typeof item.label === 'string'}
      <span class={`${context.prefixCls}-inline-collapsed-noicon`}>{item.label.charAt(0)}</span>
    {:else if item.extra !== undefined}
      <span class={`${context.prefixCls}-item-label`}>{@render content(item.label)}</span><span class={`${context.prefixCls}-item-extra`}>{@render content(item.extra)}</span>
    {:else}{@render content(item.label)}{/if}
  </span>{#if typeof trailingIcon === 'function'}{@render trailingIcon({
    ...item,
    eventKey: entry.key,
    isSelected: selected
  })}{:else if trailingIcon && typeof trailingIcon !== 'boolean'}{trailingIcon}{/if}{#if !locked && context.tooltip !== false && (showTooltip || tooltipMounted)}
  <MenuItemTooltip {element} {item} firstLevel={!entry.parent} {connectClick} />
{/if}
{/snippet}

<!-- При гидратации svelte:element повторно вставляет строку и теряет её фокус. -->
{#if dropdown}<li role="none">
  {#if native?.href === undefined}<button type="button" disabled={blocked} {...rowAttributes}
    bind:this={element} data-ant-dropdown-item role="menuitem"
    {@attach registerRow} {@attach connectFocus}>{@render rowContents()}</button>
  {:else}<a href={blocked ? undefined : native.href} target={native.target} rel={native.rel}
    {...rowAttributes} bind:this={element} data-ant-dropdown-item role="menuitem"
    aria-disabled={blocked || undefined}
    {@attach registerRow} {@attach connectFocus}>{@render rowContents()}</a>{/if}
</li>
{:else}<li role={context.itemRole ?? 'menuitem'}
  aria-checked={context.itemRole ? selected : undefined} {...rowAttributes} bind:this={element}
  data-ant-menu-item data-ant-menu-item-disabled={blocked || undefined}
  aria-disabled={blocked || undefined}
  {@attach registerRow} {@attach connectFocus}>{@render rowContents()}</li>{/if}
