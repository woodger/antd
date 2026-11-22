<script lang="ts">
  import { ConfigProvider, Drawer } from '@woodger/antd-svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <Drawer title="First" forceRender>First body</Drawer>
  <ConfigProvider prefixCls="inner">
    <Drawer prefixCls="panel" title="Second" forceRender>Second body</Drawer>
  </ConfigProvider>
</ConfigProvider>
