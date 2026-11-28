<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';

  let { name }: { name: string; } = $props();
  const settings = ConfigProvider.useConfig();
  const { componentDisabled, componentSize } = $derived(settings);
  const snapshot = $derived({
    fields: Object.keys(settings),
    sizeIsUndefined: componentSize === undefined,
    componentSize: componentSize ?? null,
    componentDisabled
  });
</script>

<output data-config-scope={name}>{JSON.stringify(snapshot)}</output>
