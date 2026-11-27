<script lang="ts">
  import { untrack } from 'svelte';
  import PopupOverflowCase from './PopupOverflowCase.svelte';
  import { popupOverflowAllSamples } from './popup-overflow-placement-cases';
  let selected = $state(popupOverflowAllSamples[0].id);
  let sample = $derived(popupOverflowAllSamples.find(sample => sample.id === selected)!);
</script>

<label style={'position:fixed;'
  + 'left:0;'
  + 'top:0;'
  + 'z-index:1'}>
  Popup overflow sample
  <select bind:value={selected}>
    {#each popupOverflowAllSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select>
</label>
{#key selected}
  {@const currentSample = untrack(() => sample)}
  <PopupOverflowCase sample={currentSample} />
{/key}
