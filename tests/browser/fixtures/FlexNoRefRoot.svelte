<script lang="ts">
  import type { FlexRootProps } from '@woodger/antd';

  let { children, ...rest }: FlexRootProps = $props();
</script>

<article {...rest}>{#if children}{@render children()}{/if}</article>
