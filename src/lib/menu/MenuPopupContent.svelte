<script lang="ts">
  // Owns the original popup list and retains its row context when it is restyled.
  import type { Snippet } from 'svelte';
  import { menuSubMenu, type MenuEntry } from './menu.engine';
  import type {
    MenuItemType, MenuPopupRender, MenuPopupRenderInfo, MenuTheme
  } from './menu.types';
  import { provideMenu, useMenu, type MenuContext } from './menu-context';
  import MenuList from './MenuList.svelte';

  let {
    entry,
    theme,
    id,
    style,
    popupRender,
    isInlineCopy,
    mode,
    leaving
  }: {
    entry: MenuEntry;
    theme: MenuTheme;
    id?: string;
    style?: string;
    popupRender?: MenuPopupRender;
    isInlineCopy: boolean;
    mode: MenuContext['mode'];
    leaving: boolean;
  } = $props();
  const parent = useMenu();
  // The hidden inline portal leaves the main list's native refs in place. The getters stay reactive.
  const context: MenuContext = Object.create(parent, {
    mode: {
      get: () => entry.overflow ? 'vertical' : mode
    },
    locked: {
      get: () => isInlineCopy || leaving || parent.locked
    },
    exiting: {
      get: () => leaving || parent.exiting
    },
    open: {
      get: () => context.locked ? [] : parent.open
    }
  });
  provideMenu(context);

  const rows = $derived(new Map(entry.children.map(child => [child.item, child])));
  const info = $derived<MenuPopupRenderInfo>({
    item: {
      ...menuSubMenu(entry),
      eventKey: entry.key,
      children: entry.children.map(child => child.item)
    },
    keys: [...entry.path],
    renderItem
  });
</script>

{#snippet renderItem(child: MenuItemType)}
  {@const row = child ? rows.get(child) : undefined}
  {#if row}
    {#key isInlineCopy}<MenuList entries={[row]} {theme} />{/key}
  {/if}
{/snippet}

{#snippet originMenu(children?: Snippet)}
  <ul data-ant-menu-prefix={parent.dropdown ? undefined : parent.prefixCls}
    data-ant-menu-root-prefix={parent.dropdown ? undefined : parent.rootPrefixCls}
    data-ant-dropdown-prefix={parent.dropdown?.prefixCls}
    data-ant-dropdown-root-prefix={parent.dropdown ? parent.rootPrefixCls : undefined}
    data-ant-dropdown-menu-prefix={parent.dropdown ? parent.prefixCls : undefined}
    {id} role="menu" data-menu-list="true" class={[
      `${parent.prefixCls} ${parent.dropdown ? 'ant-dropdown-menu-css-var' : 'ant-menu-css-var'} ${parent.prefixCls}-sub`,
      mode === 'inline' ? `${parent.prefixCls}-inline` : `${parent.prefixCls}-vertical`,
      parent.direction === 'rtl' && `${parent.prefixCls}-rtl`
    ]} {style}>
    {#key isInlineCopy}
      {#if children}{@render children()}
      {:else}<MenuList entries={entry.children} {theme} />{/if}
    {/key}
  </ul>
{/snippet}

{#if popupRender}{@render popupRender(originMenu, info)}
{:else}{@render originMenu()}{/if}
