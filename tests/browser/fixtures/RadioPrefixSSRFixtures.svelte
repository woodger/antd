<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';
  import RadioPrefixScope from './RadioPrefixScope.svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <RadioPrefixScope scope="normal" sample={{ id: 'server' }} />
  <ConfigProvider prefixCls="inner">
    <RadioPrefixScope scope="nested" sample={{ id: 'server', local: 'choice', button: true }} />
  </ConfigProvider>
</ConfigProvider>
