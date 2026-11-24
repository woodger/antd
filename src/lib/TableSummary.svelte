<script lang="ts">
  import type { TableSummaryProps } from './table.types';

  let { children }: TableSummaryProps = $props();
</script>

{@render children?.()}
