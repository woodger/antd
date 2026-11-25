<script lang="ts">
  // Рисует один уровень Menu с пунктами, разделителями, группами и подменю.
  import type { MenuEntry } from './menu.engine';
  import type { MenuTheme } from './menu.types';
  import { useMenu } from './menu-context';
  import MenuList from './MenuList.svelte';
  import MenuSubMenu from './MenuSubMenu.svelte';
  import MenuItem from './MenuItem.svelte';
  import RenderContent from './RenderContent.svelte';

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
</script>

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
        style={styles.itemTitle} role="presentation"><RenderContent
          value={'label' in entry.item ? entry.item.label : undefined} /></div>
      <ul class={[`${context.prefixCls}-item-group-list`, classes.list]} style={styles.list}
        role="group"><MenuList entries={entry.children} {theme} inactive={entryInactive} /></ul>
    </li>
  {:else if entry.kind === 'submenu'}<MenuSubMenu {entry} {theme} {overflowItem} {overflowHidden}
      inactive={entryInactive} />
  {:else}<MenuItem {entry} {overflowItem} {overflowHidden} inactive={entryInactive} />
  {/if}
{/each}
