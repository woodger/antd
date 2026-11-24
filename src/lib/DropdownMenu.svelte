<script lang="ts">
  // Подключает параметры и видимость Dropdown к одному экземпляру Menu.
  import Menu from './Menu.svelte';
  import { untrack } from 'svelte';
  import { provideDropdownMenu, type DropdownMenuContext } from './dropdown-menu-context';
  import type { DropdownMenuProps } from './dropdown.types';
  import { dropdownSemantics, isDropdownClick, toDropdownMenuItems } from './dropdown.engine';
  import type { MenuClickInfo, MenuProps } from './menu.types';

  let { menu, context, semantics, nativeElement = $bindable(), id, label, labelledby, onkeydown }: {
    menu: DropdownMenuProps;
    context: DropdownMenuContext;
    semantics: ReturnType<typeof dropdownSemantics>;
    nativeElement?: HTMLUListElement;
    id: string;
    label?: string;
    labelledby: string;
    onkeydown: NonNullable<MenuProps['onkeydown']>;
  } = $props();

  // Объект-владелец живёт вместе с Dropdown, его значения доступны через getters.
  provideDropdownMenu(untrack(() => context));
  const { items, activeKey: _activeKey, ...menuProps } = $derived(menu);
  const entries = $derived(toDropdownMenuItems(items ?? []));
  const accessibleLabel = $derived(menu['aria-label'] ?? label);

  function click(info: MenuClickInfo) {
    if (isDropdownClick(info)) menu.onClick?.(info);
  }

  function keydown(event: Parameters<NonNullable<MenuProps['onkeydown']>>[0]) {
    onkeydown(event);
    menu.onkeydown?.(event);
  }
</script>

<Menu {...menuProps} items={entries} {id} tabindex={menu.tabindex ?? -1} onClick={click}
  classNames={semantics.classNames} styles={semantics.styles}
  onkeydown={keydown} bind:nativeElement aria-label={accessibleLabel}
  aria-labelledby={menu['aria-labelledby'] ?? (accessibleLabel ? undefined : labelledby)} />
