<script lang="ts">
  import { untrack } from 'svelte';
  import PopupWidthCase from './PopupWidthCase.svelte';
  import { popupWidthSamples, popupWidthHistorySamples } from './popup-width-cases';
  const samples = [...popupWidthSamples, ...popupWidthHistorySamples];
  let selected = $state(samples[0].id);
  let sample = $derived(samples.find(sample => sample.id === selected)!);
</script>

<label style="position:fixed;left:0;top:0;z-index:1">
  Popup width sample
  <select bind:value={selected}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select>
</label>
{#key selected}
  {@const currentSample = untrack(() => sample)}
  <PopupWidthCase sample={currentSample} />
{/key}
