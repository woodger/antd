<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';
  import MasonryPrefixScope from './MasonryPrefixScope.svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <MasonryPrefixScope scope="normal" sample={{ id: 'ssr' }} />
  <ConfigProvider prefixCls="inner">
    <MasonryPrefixScope scope="nested" sample={{ id: 'ssr' }} />
  </ConfigProvider>
</ConfigProvider>
