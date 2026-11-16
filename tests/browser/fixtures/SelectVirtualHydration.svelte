<script lang="ts">
  import SelectVirtualCase from './SelectVirtualCase.svelte';
  import type { SelectVirtualSample } from './select-virtual-cases';
  let { sample }: { sample: SelectVirtualSample } = $props();
  let fixture = $state<ReturnType<typeof SelectVirtualCase>>();
  export function fixtureApi() { return fixture; }
</script>

<section data-select-virtual-hydration>
  <form data-select-virtual-form><SelectVirtualCase {sample} named bind:this={fixture} /></form>
  <input aria-label="Virtual outside draft" style="position:fixed;left:16px;bottom:16px" />
</section>
