<script lang="ts">
  // Владеет исходным списком popup и сохраняет контекст его строк при переоформлении.
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
    isInlineCopy
  }: {
    entry: MenuEntry;
    theme: MenuTheme;
    id: string;
    style?: string;
    popupRender?: MenuPopupRender;
    isInlineCopy: boolean;
  } = $props();
  const parent = useMenu();
  // Hidden inline portal не заменяет native refs основного списка; getters остаются реактивными.
  const context: MenuContext = Object.create(parent, {
    mode: {
      get: () => entry.overflow ? 'vertical' : parent.mode
    },
    register: {
      value: (key: string, element: HTMLElement) => isInlineCopy
        ? () => {} : parent.register(key, element)
    },
    registerHover: {
      value: (key: string, handler: (open: boolean) => void) => isInlineCopy
        ? () => {} : parent.registerHover(key, handler)
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
  <ul data-ant-menu-prefix={parent.prefixCls} data-ant-menu-root-prefix={parent.rootPrefixCls}
    {id} role="menu" data-menu-list="true" class={[
      `${parent.prefixCls} ant-menu-css-var ${parent.prefixCls}-sub`,
      parent.mode === 'inline' ? `${parent.prefixCls}-inline` : `${parent.prefixCls}-vertical`,
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
