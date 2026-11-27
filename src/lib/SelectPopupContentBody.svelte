<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { SelectPopupContent } from './select.types';
  import { provideFormField } from './form/form-context';
  import { provideFormItemStatus, useFormItemStatusContext } from './form/form-item-status';
  import { provideFormFeedback } from './form/form-feedback-context';
  import { provideCompact } from './space-compact-context';

  let { value, origin, isolate }: { value: SelectPopupContent; origin: Snippet; isolate: boolean } = $props();
  // The parent changes the key when a transition between origin and ContextIsolator is accepted.
  if (untrack(() => isolate)) {
    provideFormField(undefined);
    provideFormFeedback({});
    provideFormItemStatus(Object.create(
      useFormItemStatusContext(),
      { status: { value: undefined } }
    ));
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
