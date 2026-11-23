<script lang="ts">
  // Владеет узлом строки, её фокусом и временем жизни закреплённой за ней подсказки.
  import { on } from 'svelte/events';
  import { menuItem, type MenuEntry } from './menu.engine';
  import type { MenuContent } from './menu.types';
  import { useMenu } from './menu-context';
  import MenuItemTooltip from './MenuItemTooltip.svelte';

  let { entry, overflowItem, overflowHidden, inactive }: {
    entry: MenuEntry;
    overflowItem: boolean;
    overflowHidden: boolean;
    inactive: boolean;
  } = $props();
  const context = useMenu();
  let element = $state<HTMLLIElement>();
  const item = $derived(menuItem(entry));
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

  function connectFocus(element: HTMLLIElement, entry: MenuEntry) {
    function focus() {
      if (!context.locked && !context.disabled && !menuItem(entry).disabled) {
        context.activate(entry.key);
      }
    }
    // Переходы между пунктами одного ShadowRoot не доходят до document delegation.
    return on(element, 'focusin', focus);
  }

  function activate(event: MouseEvent, entry: MenuEntry) {
    tooltipClick?.(event);
    if (context.locked || context.disabled || menuItem(entry).disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    context.click(entry, event);
  }

  function keyboard(event: KeyboardEvent, entry: MenuEntry) {
    if (context.locked || context.disabled || menuItem(entry).disabled) {
      if (event.key === 'Enter')
        event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      // Enter на настоящей ссылке создаёт native click, который запускает callback.
      if (event.composedPath()[0] instanceof HTMLAnchorElement) {
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
</style>

{#snippet content(value: MenuContent | undefined)}{#if typeof value === 'function'}{@render value()}{:else}{value ?? ''}{/if}{/snippet}
<li bind:this={element} data-ant-menu-item
  data-ant-menu-item-disabled={blocked || undefined} {id}
  data-menu-id={id} role="menuitem" data-menu-overflow-item={overflowItem || undefined}
  data-menu-overflow-hidden={overflowHidden || undefined}
  inert={overflowHidden || undefined} aria-hidden={overflowHidden || undefined}
  {@attach node => locked ? undefined : context.register(entry.key, node)}
  tabindex={blocked || locked ? undefined : -1} aria-disabled={blocked || undefined}
  title={nativeTitle}
  aria-label={context.collapsed && !entry.parent ? accessibleTitle : undefined}
  class={[
      overflowItem && `${context.prefixCls}-overflow-item`,
      `${context.prefixCls}-item`,
      context.active === entry.key && `${context.prefixCls}-item-active`,
      selected && `${context.prefixCls}-item-selected`,
      blocked && `${context.prefixCls}-item-disabled`,
      item.danger && `${context.prefixCls}-item-danger`,
      classes.item,
      item.class
    ]}
  style={[
      context.mode === 'inline'
      && `padding-${context.direction === 'rtl'
        ? 'right'
        : 'left'}:${entry.level * context.inlineIndent}px`,
      styles.item,
      item.style
    ].filter(
      Boolean
    ).join(
      ';'
    )}
  onclick={event => activate(event, entry)} onkeydown={event => keyboard(event, entry)}
  {@attach node => connectFocus(node, entry)} onmouseenter={() => {
        if (!blocked && !context.locked)
          context.activate(entry.key);
      }}
  onmouseleave={() => {
      if (!context.locked && context.active === entry.key)
        context.activate(null);
    }}>
  <!-- Source icon/label идут подряд; native-тема сохраняет межэлементный пробел. -->
  {#if item.icon}<span class={[`${context.prefixCls}-item-icon`, classes.itemIcon]}
    style={styles.itemIcon}>{@render item.icon()}</span>{#if !context.componentTheme.className}{' '}{/if}{/if}<span class={[
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
{/if}</li>
