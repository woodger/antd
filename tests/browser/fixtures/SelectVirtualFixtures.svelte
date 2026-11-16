<script lang="ts">
  import { untrack } from 'svelte';
  import SelectVirtualCase from './SelectVirtualCase.svelte';
  import { selectVirtualSamples } from './select-virtual-cases';
  let selected = $state(selectVirtualSamples[0].id);
  let sample = $derived(selectVirtualSamples.find(sample => sample.id === selected)!);
</script>

<section id="select-virtual-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">
    Select virtual sample
    <select bind:value={selected}>
      {#each selectVirtualSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#key selected}
    {@const currentSample = untrack(() => sample)}
    <SelectVirtualCase sample={currentSample} />
  {/key}
</section>
