<script lang="ts">
  import { untrack } from 'svelte';
  import SelectSurfaceContextCase from './SelectSurfaceContextCase.svelte';
  import { selectSurfaceContextSamples } from '../select-surface-context-cases';
  let selected = $state(selectSurfaceContextSamples[0].id);
  let sample = $derived(selectSurfaceContextSamples.find(sample => sample.id === selected)!);
  let mounted = $state(true);
</script>

<section id="select-surface-context-fixture">
  <label style={'position:fixed;'
    + 'left:0;'
    + 'top:0;'
    + 'z-index:1'}>Select surface context sample
    <select bind:value={selected} onchange={() => { mounted = true; }}>
      {#each selectSurfaceContextSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#if mounted}{#key selected}<SelectSurfaceContextCase sample={untrack(() => sample)} />{/key}{/if}
  <button type="button" data-surface-context-unmount style={'position:fixed;'
    + 'left:16px;'
    + 'top:120px'}
    onclick={() => { mounted = false; }}>Unmount context</button>
</section>
