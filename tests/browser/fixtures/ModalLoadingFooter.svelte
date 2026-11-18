<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { ModalLoadingActivity } from '../modal-loading-metrics.mjs';
  let { attachFooter, activity, lifecycle }: {
    attachFooter: (node: HTMLButtonElement) => () => void;
    activity: (kind: ModalLoadingActivity['kind']) => void;
    lifecycle: (slot: 'footer', event: 'mount' | 'unmount') => void;
  } = $props();
  untrack(() => activity('footer-render'));
  onMount(() => { lifecycle('footer', 'mount'); return () => lifecycle('footer', 'unmount'); });
</script>
<button type="button" data-modal-loading-footer="" {@attach attachFooter}>Custom footer action</button>
