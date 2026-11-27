<script lang="ts">
  // Adjacent caller if and markup boundaries do not separate whitespace because head creates no DOM root.
  import { useConfig } from './config-context';

  let { css, scope }: { css: string; scope: string; } = $props();
  const config = useConfig();
  const nonce = $derived(config.csp?.nonce);
</script>

<svelte:head>
  <!-- The browser checks nonce when inserting the stylesheet, so a new nonce requires a new style element. -->
  {#key nonce}
    <svelte:element this={'style'} data-ant-svelte-theme={scope} {nonce}>{css}</svelte:element>
  {/key}
</svelte:head>
