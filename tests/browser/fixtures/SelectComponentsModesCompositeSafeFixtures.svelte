<script lang="ts">
  import { ConfigProvider } from 'antd-svelte';
  import SelectComponentsModesCompositeSafeCase from './SelectComponentsModesCompositeSafeCase.svelte';
</script>
<section id="select-components-modes-composite-safe-fixture">
  <ConfigProvider theme={{ token: { motion: false }, cssVar: { key: 'select-modes-composite-safe' } }}>
    <SelectComponentsModesCompositeSafeCase mode="multiple" />
    <SelectComponentsModesCompositeSafeCase mode="tags" />
  </ConfigProvider>
</section>
