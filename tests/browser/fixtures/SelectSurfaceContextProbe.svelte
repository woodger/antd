<script lang="ts">
  import { useFormItemStatus } from '@woodger/antd-svelte';
  import type { SelectSurfaceRecorder } from '../select-surface-producers.mjs';
  let { side, recorder }: { side: 'inside' | 'outside'; recorder: SelectSurfaceRecorder } = $props();
  const status = useFormItemStatus();
  let output = $derived.by(() => {
    const value = { status: status.status, errors: status.errors, warnings: status.warnings };
    recorder.record('Form.Item.useStatus', side, [], value, { rawHook: recorder.raw(status) });
    return recorder.encode(value);
  });
</script>

<output hidden data-surface-context-status={side}>{JSON.stringify(output)}</output>
