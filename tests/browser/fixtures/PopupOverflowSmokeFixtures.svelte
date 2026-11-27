<script lang="ts">
  import { untrack } from 'svelte';
  import PopupOverflowSmokeCase from './PopupOverflowSmokeCase.svelte';
  import { popupOverflowSmokeSamples } from './popup-overflow-cases';
  import { popupOverflowNestedLayoutSamples } from './popup-overflow-nested-layout-cases';
  const samples = popupOverflowSmokeSamples.map(sample =>
    popupOverflowNestedLayoutSamples.find(counterpart => counterpart.id === sample.id) ?? sample);
  let selected = $state(samples[0].id);
  let sample = $derived(samples.find(sample => sample.id === selected)!);
</script>

<section id="popup-overflow-smoke-fixture">
  <label style={'position:fixed;'
    + 'left:0;'
    + 'top:0;'
    + 'z-index:1'}>
    Popup overflow smoke sample
    <select bind:value={selected}>
      {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#key selected}
    {@const currentSample = untrack(() => sample)}
    <PopupOverflowSmokeCase sample={currentSample} />
  {/key}
</section>
