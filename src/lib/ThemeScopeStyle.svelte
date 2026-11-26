<script lang="ts">
  // Соседние if/markup boundaries вызывающей стороны не разделяют whitespace: head не создаёт DOM root.
  import { useConfig } from './config-context';

  let { css, scope }: { css: string; scope: string; } = $props();
  const config = useConfig();
  const nonce = $derived(config.csp?.nonce);
</script>

<svelte:head>
  <!-- Браузер проверяет nonce при вставке stylesheet, поэтому новый nonce получает новый style. -->
  {#key nonce}
    <svelte:element this={'style'} data-ant-svelte-theme={scope} {nonce}>{css}</svelte:element>
  {/key}
</svelte:head>
