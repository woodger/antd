<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { SelectPopupContent } from './select.types';
  import SelectPopupContentBody from './SelectPopupContentBody.svelte';

  let { value, origin, active, isolate }: {
    value: SelectPopupContent; origin: Snippet; active: boolean; isolate: boolean
  } = $props();
  // rc-trigger 3.10.1 memoizes the accepted subtree in PopupContent while cache=!open. Closed props
  // cannot recreate that display history. The original Snippet and its contexts stay reactive in
  // the retained subtree.
  let accepted = $state.raw(untrack(() => ({ value, isolate })));
  let rendered = $derived(active ? { value, isolate } : accepted);
  $effect(() => { if (active) accepted = { value, isolate }; });
</script>

{#key rendered.isolate}<SelectPopupContentBody value={rendered.value} {origin} isolate={rendered.isolate} />{/key}
