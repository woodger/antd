<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { provideFormField, type FormFieldContext } from './form-context';

  let { field, children }: { field: FormFieldContext; children: Snippet } = $props();
  // The context owner is stable. Its reactive getters read current props and model values.
  provideFormField(untrack(() => field));
</script>

{@render children()}
