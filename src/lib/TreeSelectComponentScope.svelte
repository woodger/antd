<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provideFormField } from './form/form-context';

  let { children }: { children: Snippet } = $props();
  // The inner editor does not become a second successful control for the selected field. Status,
  // feedback, Form, and other contexts continue to be inherited.
  provideFormField(undefined);
</script>

{@render children()}
