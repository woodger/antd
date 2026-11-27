<script lang="ts">
  import { treeSelectInertApiSamples } from './tree-select-inert-api-cases';
  import TreeSelectInertApiCase from './TreeSelectInertApiCase.svelte';
  let selected = $state(treeSelectInertApiSamples[0].id);
  let sample = $derived(treeSelectInertApiSamples.find(sample => sample.id === selected)!);
</script>
<label style={'position:fixed;'
  + 'top:0;'
  + 'left:0;'
  + 'font:14px Arial'}>
  TreeSelect inherited API sample
  <select bind:value={selected}>{#each treeSelectInertApiSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}</select>
</label>
{#key selected}<TreeSelectInertApiCase {sample} />{/key}
