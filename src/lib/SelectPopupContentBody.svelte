<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { SelectPopupContent } from './select.types';
  import { provideFormField } from './form-context';
  import { provideFormItemStatus, useFormItemStatusContext } from './form-item-status';
  import { provideFormFeedback } from './form-feedback-context';
  import { provideCompact } from './space-compact-context';

  let { value, origin, isolate }: { value: SelectPopupContent; origin: Snippet; isolate: boolean } = $props();
  // Родитель меняет key при принятом переходе между origin и ContextIsolator.
  if (untrack(() => isolate)) {
    provideFormField(undefined);
    provideFormFeedback({});
    provideFormItemStatus(Object.create(useFormItemStatusContext(), { status: { value: undefined } }));
    provideCompact(null);
  }
</script>

{#snippet content(node: SelectPopupContent)}
  {#if Array.isArray(node)}
    {#each node as child}{@render content(child)}{/each}
  {:else if typeof node === 'function'}{@render node(origin)}
  {:else if typeof node !== 'boolean'}{node}{/if}
{/snippet}

{@render content(value)}
