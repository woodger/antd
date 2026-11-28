<script lang="ts">
  import type { FormRootProps } from '@woodger/antd';

  let { children, nativeElement = $bindable(), ...attributes }: FormRootProps = $props();
</script>

<article {...attributes} bind:this={nativeElement}>{@render children()}</article>
