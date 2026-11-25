<script lang="ts">
  // Пользовательский Menu может выбирать значения, сохраняя фокус и портал Dropdown.
  import { provideDropdownMenu, takeDropdownMenu } from './dropdown-menu-context';
  import type { TableColumn, TableFilterDropdownProps } from './table.types';
  import RenderContent from './RenderContent.svelte';

  let { content, info }: {
    content: NonNullable<TableColumn<object>['filterDropdown']>;
    info: TableFilterDropdownProps;
  } = $props();

  const scope = takeDropdownMenu();
  if (scope?.context) {
    provideDropdownMenu(scope.context, true);
  }
</script>

{#if typeof content === 'function'}
  {@render content(info)}
{:else}
  <RenderContent value={content} />
{/if}
