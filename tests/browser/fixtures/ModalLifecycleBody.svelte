<script lang="ts">
  import { onMount } from 'svelte';

  let { record, close }: { record(kind: 'mount' | 'destroy'): void; close(): void; } = $props();

  onMount(() => {
    record('mount');
    return () => record('destroy');
  });
</script>

<input id="lifecycle-editor" aria-label="Lifecycle editor" value="Seed" />
<button type="button" onclick={close}>Close lifecycle</button>
