<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provideConfig, useConfig, type ConfigContext } from '../config-context';
  import { provideFormField, useForm } from './form-context';

  let { children }: { children: Snippet } = $props();
  const config = useConfig();
  const form = useForm();

  // Labels and help text stay in Form without registering as controls for the current field.
  provideFormField(undefined);
  if (form) {
    const context: ConfigContext = Object.create(config, {
      componentDisabled: { get: () => form.disabled }
    });
    provideConfig(context);
  }
</script>

{@render children()}
