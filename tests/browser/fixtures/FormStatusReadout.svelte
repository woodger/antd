<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useFormItemStatus } from '@woodger/antd';

  let { scope, children }: { scope: string; children?: Snippet } = $props();
  const state = useFormItemStatus();
</script>

<div>
  {@render children?.()}
  <output data-form-status-read={scope} data-form-rich-errors={state.errorMessages?.length}
    data-form-rich-warnings={state.warningMessages?.length}>{JSON.stringify({
    status: state.status ?? null, errors: state.errors, warnings: state.warnings
  })}</output>
</div>
