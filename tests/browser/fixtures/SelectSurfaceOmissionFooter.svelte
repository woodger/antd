<script lang="ts">
  import { onMount, untrack } from 'svelte';
  let { nextInstance, trace, inputRef, onInput }: {
    nextInstance: () => number;
    trace: (kind: string, details?: Record<string, unknown>) => void;
    inputRef: (node: HTMLInputElement | null) => void;
    onInput: (value: string) => void;
  } = $props();
  const instance = untrack(() => nextInstance());
  onMount(() => {
    trace('footer-mount', { instance });
    return () => trace('footer-unmount', { instance });
  });
</script>

<div data-surface-omission-footer data-footer-instance={instance}><label for="surface-omission-footer-note">Footer note</label><input
  id="surface-omission-footer-note" data-surface-footer-input aria-label="Footer note" defaultValue=""
  oninput={event => onInput(event.currentTarget.value)}
  {@attach node => { inputRef(node); return () => inputRef(null); }} /></div>
