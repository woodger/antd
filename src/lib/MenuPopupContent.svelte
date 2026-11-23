<script lang="ts">
  import type { MenuEntry } from './menu.engine';
  import type { MenuTheme } from './menu.types';
  import { provideMenu, useMenu, type MenuContext } from './menu-context';
  import MenuList from './MenuList.svelte';

  let {
    entries,
    theme,
    isInlineCopy,
    inOverflow = false
  }: {
    entries: readonly MenuEntry[];
    theme: MenuTheme;
    isInlineCopy: boolean;
    inOverflow?: boolean;
  } = $props();
  const parent = useMenu();
  // Hidden inline portal не заменяет native refs основного списка; getters остаются реактивными.
  const context: MenuContext = Object.create(parent, {
    mode: {
      get: () => inOverflow ? 'vertical' : parent.mode
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
</script>

{#key isInlineCopy}<MenuList {entries} {theme} />{/key}
