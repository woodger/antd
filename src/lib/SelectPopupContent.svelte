<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { SelectPopupContent } from './select.types';
  import SelectPopupContentBody from './SelectPopupContentBody.svelte';

  let { value, origin, active, isolate }: {
    value: SelectPopupContent; origin: Snippet; active: boolean; isolate: boolean
  } = $props();
  // rc-trigger3.10.1 PopupContent memo сохраняет принятый subtree при cache=!open.
  // Это история показанного результата: текущие closed props её не восстанавливают.
  // Сам origin Snippet и его контексты остаются реактивными внутри прежнего subtree.
  let accepted = $state.raw(untrack(() => ({ value, isolate })));
  let rendered = $derived(active ? { value, isolate } : accepted);
  $effect(() => { if (active) accepted = { value, isolate }; });
</script>

{#key rendered.isolate}<SelectPopupContentBody value={rendered.value} {origin} isolate={rendered.isolate} />{/key}
