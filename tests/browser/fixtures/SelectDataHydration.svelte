<script lang="ts">
  import SelectDataCase from './SelectDataCase.svelte';
  import type { SelectDataSample } from './select-data-cases';
  let { sample }: { sample: SelectDataSample } = $props();
  let fixture = $state<ReturnType<typeof SelectDataCase>>();
  export function fixtureApi() { return fixture; }
</script>

<section data-select-data-hydration>
  <form data-select-data-form><SelectDataCase {sample} named bind:this={fixture} /></form>
  <input aria-label="Data outside draft" style={'position:fixed;'
    + 'left:16px;'
    + 'bottom:16px'} />
</section>
