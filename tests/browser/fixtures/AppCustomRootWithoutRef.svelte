<script lang="ts">
  import { useApp, type AppRootProps } from '@woodger/antd';

  let { children, label, ...attributes }: AppRootProps & { label: string; } = $props();
  const api = useApp();
</script>

<aside
  {...attributes}
  id="custom-root"
  aria-label={label}
  data-root-api={Object.keys(api).sort().join(',')}
>{@render children?.()}</aside>
