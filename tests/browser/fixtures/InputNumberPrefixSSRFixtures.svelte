<script lang="ts">
  import { ConfigProvider } from '@woodger/antd-svelte';
  import InputNumberPrefixScope from './InputNumberPrefixScope.svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <InputNumberPrefixScope scope="normal" sample={{ id: 'server', affix: true }} />
  <ConfigProvider prefixCls="inner">
    <InputNumberPrefixScope scope="nested"
      sample={{ id: 'server', local: 'meter', spinner: true }} />
  </ConfigProvider>
</ConfigProvider>
