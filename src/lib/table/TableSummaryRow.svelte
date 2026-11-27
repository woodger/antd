<script lang="ts">
  import type { TableSummaryRowProps } from './table.types';

  let { children, ...attributes }: TableSummaryRowProps = $props();
</script>

<tr {...attributes}>{@render children?.()}</tr>
