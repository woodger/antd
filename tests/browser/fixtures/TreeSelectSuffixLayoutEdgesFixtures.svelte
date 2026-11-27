<script lang="ts">
  import { treeSelectSuffixLayoutEdgeSamples } from './tree-select-suffix-layout-edge-cases';
  import TreeSelectSuffixLayoutEdgeCase from './TreeSelectSuffixLayoutEdgeCase.svelte';
  let selected = $state(treeSelectSuffixLayoutEdgeSamples[0].id);
  let sample = $derived(treeSelectSuffixLayoutEdgeSamples.find(sample => sample.id === selected)!);
</script>

<label style={'position:fixed;'
  + 'left:0;'
  + 'top:0;'
  + 'font:14px Arial'}>
  TreeSelect suffix edge sample
  <select bind:value={selected}>
    {#each treeSelectSuffixLayoutEdgeSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select>
</label>
{#key selected}<TreeSelectSuffixLayoutEdgeCase {sample} />{/key}
