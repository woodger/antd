<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { ModalLoadingActivity } from '../modal-loading-metrics.mjs';
  let { attachBody, attachEditor, activity, lifecycle }: {
    attachBody: (node: HTMLElement) => () => void;
    attachEditor: (node: HTMLInputElement) => () => void;
    activity: (kind: ModalLoadingActivity['kind']) => void;
    lifecycle: (slot: 'body', event: 'mount' | 'unmount') => void;
  } = $props();
  // An actual Svelte component setup invocation, not a simulated React render.
  untrack(() => activity('body-render'));
  onMount(() => {
    lifecycle('body', 'mount');
    return () => lifecycle('body', 'unmount');
  });
</script>
<section data-modal-loading-body="" {@attach attachBody}><p>Body content</p><input aria-label="Loading body draft" value="Body draft" {@attach attachEditor} /></section>
