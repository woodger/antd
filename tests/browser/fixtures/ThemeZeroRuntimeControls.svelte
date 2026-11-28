<script lang="ts">
  import { Button, Input, theme } from '@woodger/antd';

  let { id, buttonPrefix }: { id: string; buttonPrefix?: string; } = $props();
  const tokens = theme.useToken();
</script>

<Button id={`${id}-button`} prefixCls={buttonPrefix} type="primary">Apply</Button>
<Input id={`${id}-input`} aria-label={`${id} draft`} />
<output id={`${id}-primary`}>{tokens.token.colorPrimary}</output>
