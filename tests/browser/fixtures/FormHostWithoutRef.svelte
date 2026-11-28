<script lang="ts">
  import type { FormRootProps } from '@woodger/antd';

  let { children, ...attributes }: FormRootProps = $props();
</script>

<aside {...attributes}>{@render children()}</aside>
