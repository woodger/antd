<script lang="ts">
  // Пользовательский Menu может выбирать значения, сохраняя фокус и портал Dropdown.
  import type { Snippet } from 'svelte';
  import { provideDropdownMenu, takeDropdownMenu } from './dropdown-menu-context';
  import type { TableFilterDropdownProps } from './table.types';

  let { renderer, info }: {
    renderer: Snippet<[info: TableFilterDropdownProps]>;
    info: TableFilterDropdownProps;
  } = $props();

  const scope = takeDropdownMenu();
  if (scope) {
    provideDropdownMenu(scope.context, true);
  }
</script>

{@render renderer(info)}
