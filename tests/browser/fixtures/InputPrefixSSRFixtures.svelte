<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';
  import InputPrefixScope from './InputPrefixScope.svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <InputPrefixScope scope="normal" sample={{ id: 'server', clear: true }} />
  <ConfigProvider prefixCls="inner">
    <InputPrefixScope scope="nested" sample={{ id: 'server', local: 'field', count: true }} />
  </ConfigProvider>
</ConfigProvider>
