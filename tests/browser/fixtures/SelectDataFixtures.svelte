<script lang="ts">
  import { untrack } from 'svelte';
  import SelectDataCase from './SelectDataCase.svelte';
  import { selectDataFixtureSamples as selectDataSamples } from './select-data-additive-cases';
  let selected = $state(selectDataSamples[0].id);
  let sample = $derived(selectDataSamples.find(item => item.id === selected)!);
</script>

<section id="select-data-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">
    Select data sample
    <select bind:value={selected}>
      {#each selectDataSamples as item}<option value={item.id}>{item.id}</option>{/each}
    </select>
  </label>
  {#key selected}
    {@const current = untrack(() => sample)}
    <SelectDataCase sample={current} groupAttributes={current.scenario === 'group-attribute-probe'} />
  {/key}
</section>
