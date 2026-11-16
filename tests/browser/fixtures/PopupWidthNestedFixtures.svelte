<script lang="ts">
  import { untrack } from 'svelte';
  import PopupWidthNestedCase from './PopupWidthNestedCase.svelte';
  import { popupWidthNestedSamples } from './popup-width-cases';
  let selected = $state(popupWidthNestedSamples[0].id);
  let sample = $derived(popupWidthNestedSamples.find(sample => sample.id === selected)!);
</script>

<section id="popup-width-nested-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">
    Popup width nested sample
    <select bind:value={selected}>
      {#each popupWidthNestedSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#key selected}
    {@const currentSample = untrack(() => sample)}
    <PopupWidthNestedCase sample={currentSample} />
  {/key}
</section>
