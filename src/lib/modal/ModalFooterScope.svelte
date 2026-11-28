<script lang="ts">
  // Resets the inherited disabled setting for the ordinary Modal footer.
  import type { Snippet } from 'svelte';
  import { provideConfig, useConfig, type ConfigContext } from '../config-provider/config-context';

  let { children }: { children: Snippet; } = $props();
  const parent = useConfig();
  const footer: ConfigContext = Object.create(parent, {
    configuredComponentDisabled: { value: false },
    componentDisabled: { value: false }
  });
  provideConfig(footer);
</script>

{@render children()}
