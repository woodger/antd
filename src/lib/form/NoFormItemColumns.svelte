<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provideForm, useForm, type FormContext } from './form-context';

  let { children }: { children: Snippet } = $props();
  const parent = useForm();

  if (parent) {
    // Upstream clears only the columns and preserves the reactive model context and other defaults.
    const context: FormContext = Object.create(parent, {
      labelCol: { value: undefined },
      wrapperCol: { value: undefined }
    });
    provideForm(context);
  }
</script>

{@render children()}
