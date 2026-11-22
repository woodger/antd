<script lang="ts">
  import { ConfigProvider } from '@woodger/antd-svelte';
  import InputOTPPrefixScope from './InputOTPPrefixScope.svelte';
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <InputOTPPrefixScope scope="normal" sample={{ id: 'server', mask: true }} />
  <ConfigProvider prefixCls="inner">
    <InputOTPPrefixScope scope="nested"
      sample={{ id: 'server', local: 'code-otp', mask: true, separator: true }} />
  </ConfigProvider>
</ConfigProvider>
