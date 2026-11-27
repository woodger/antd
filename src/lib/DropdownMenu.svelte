<script lang="ts">
  // Connects Dropdown settings and visibility to a single Menu instance.
  import Menu from './Menu.svelte';
  import { untrack } from 'svelte';
  import { provideDropdownMenu, type DropdownMenuContext } from './dropdown-menu-context';
  import type { DropdownMenuProps } from './dropdown.types';
  import { dropdownSemantics, isDropdownClick, toDropdownMenuItems } from './dropdown.engine';
  import type { MenuClickInfo } from './menu.types';

  let { menu, context, semantics, nativeElement = $bindable(), id, label, labelReference, labelledby }: {
    menu: DropdownMenuProps;
    context: DropdownMenuContext;
    semantics: ReturnType<typeof dropdownSemantics>;
    nativeElement?: HTMLUListElement;
    id: string;
    label?: string;
    labelReference?: string;
    labelledby: string;
  } = $props();

  // The owner object lives with Dropdown and exposes its values through getters.
  provideDropdownMenu(untrack(() => context));
  const { items, activeKey: _activeKey, ...menuProps } = $derived(menu);
  const entries = $derived(toDropdownMenuItems(items ?? []));
  const accessibleLabel = $derived(menu['aria-label'] ?? label);
  const accessibleReference = $derived(menu['aria-labelledby']
    ?? (menu['aria-label'] === undefined ? labelReference : undefined)
    ?? (accessibleLabel ? undefined : labelledby));

  function click(info: MenuClickInfo) {
    if (isDropdownClick(info)) menu.onClick?.(info);
  }
</script>

<Menu {...menuProps} items={entries} {id} tabindex={menu.tabindex ?? -1} onClick={click}
  classNames={semantics.classNames} styles={semantics.styles}
  bind:nativeElement aria-label={accessibleLabel}
  aria-labelledby={accessibleReference} />
