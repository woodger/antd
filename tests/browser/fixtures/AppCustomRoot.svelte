<script lang="ts">
  import { App, type AppRootProps } from '@woodger/antd';

  let { children, label, class: className, nativeElement = $bindable(), ...attributes }:
    AppRootProps & { label: string; } = $props();
  const api = App.useApp();
</script>

<main
  {...attributes}
  bind:this={nativeElement}
  class={`${className ?? ''} custom-shell`}
  id="custom-root"
  aria-label={label}
  data-root-api={Object.keys(api).sort().join(',')}
>{@render children?.()}</main>
