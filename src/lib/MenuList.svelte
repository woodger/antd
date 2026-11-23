<script lang="ts">
  // Регистрирует пункты одной панели Menu и передаёт клавиши владельцу выбора. Фокус остаётся в
  // активном уровне списка.
  import { on } from 'svelte/events';
  import type { MenuEntry } from './menu.engine';
  import { menuItem } from './menu.engine';
  import type { MenuContent, MenuTheme } from './menu.types';
  import { useMenu } from './menu-context';
  import MenuList from './MenuList.svelte';
  import MenuSubMenu from './MenuSubMenu.svelte';

  let {
    entries,
    theme,
    overflowCount,
    inactive = false
  }: {
    entries: readonly MenuEntry[];
    theme: MenuTheme;
    overflowCount?: number;
    inactive?: boolean;
  } = $props();
  const context = useMenu();

  function connectFocus(element: HTMLLIElement, entry: MenuEntry) {
    function focus() {
      if (!context.disabled && !menuItem(entry).disabled) context.activate(entry.key);
    }
    // Переходы между пунктами одного ShadowRoot не доходят до document delegation.
    return on(element, 'focusin', focus);
  }

  function activate(event: MouseEvent, entry: MenuEntry) {
    if (context.disabled || menuItem(entry).disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    context.click(entry, event);
  }

  function keyboard(event: KeyboardEvent, entry: MenuEntry) {
    if (context.disabled || menuItem(entry).disabled) {
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
{#each entries as entry, index (entry.key)}
  {@const semantic = context.semantics}
  {@const nested = entry.parent && !entry.parent.overflow}
  {@const classes = nested ? semantic.classes.subMenu : semantic.classes}
  {@const styles = nested ? semantic.styles.subMenu : semantic.styles}
  {@const overflowItem = overflowCount !== undefined}
  {@const overflowHidden = overflowCount !== undefined && index >= overflowCount}
  {@const entryInactive = inactive || overflowHidden}
  {#if entry.kind === 'divider'}
    <li role="separator" data-menu-overflow-item={overflowItem || undefined}
      data-menu-overflow-hidden={overflowHidden || undefined}
      inert={overflowHidden || undefined} aria-hidden={overflowHidden || undefined} class={[
        `${context.prefixCls}-item-divider`,
        'dashed' in entry.item && entry.item.dashed && `${context.prefixCls}-item-divider-dashed`,
        entry.item.class
      ]} style={entry.item.style}></li>
  {:else if entry.kind === 'group'}
    <li role="presentation" class={[`${context.prefixCls}-item-group`, entry.item.class]}
      style={entry.item.style} data-menu-overflow-item={overflowItem || undefined}
      data-menu-overflow-hidden={overflowHidden || undefined}
      inert={overflowHidden || undefined} aria-hidden={overflowHidden || undefined}>
      <div class={[`${context.prefixCls}-item-group-title`, classes.itemTitle]}
        style={styles.itemTitle} role="presentation">{@render content('label' in entry.item ? entry.item.label : undefined)}</div>
      <ul class={[`${context.prefixCls}-item-group-list`, classes.list]} style={styles.list}
        role="group"><MenuList entries={entry.children} {theme} inactive={entryInactive} /></ul>
    </li>
  {:else if entry.kind === 'submenu'}<MenuSubMenu {entry} {theme} {overflowItem} {overflowHidden}
      inactive={entryInactive} />
  {:else}
    {@const item = menuItem(entry)}{@const blocked = context.disabled || item.disabled}
    {@const id = entryInactive ? undefined : context.id(entry.key)}
    <li data-ant-menu-item data-ant-menu-item-disabled={blocked || undefined} {id}
      data-menu-id={id} role="menuitem" data-menu-overflow-item={overflowItem || undefined}
      data-menu-overflow-hidden={overflowHidden || undefined}
      inert={overflowHidden || undefined} aria-hidden={overflowHidden || undefined}
      {@attach node => entryInactive ? undefined : context.register(entry.key, node)}
      tabindex={blocked || entryInactive ? undefined : -1} aria-disabled={blocked || undefined}
      title={item.title
          ?? (context.collapsed && typeof item.label === 'string'
            ? item.label
            : undefined)}
      aria-label={context.collapsed && !entry.parent
          ? (item.title ?? (typeof item.label === 'string' ? item.label : undefined))
          : undefined}
      class={[
          overflowItem && `${context.prefixCls}-overflow-item`,
          `${context.prefixCls}-item`,
          context.active === entry.key && `${context.prefixCls}-item-active`,
          context.selected.includes(entry.key) && `${context.prefixCls}-item-selected`,
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
            if (!blocked)
              context.activate(entry.key);
          }}
      onmouseleave={() => {
          if (context.active === entry.key)
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
      </span>
    </li>
  {/if}
{/each}
