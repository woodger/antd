<script lang="ts">
  import TreeSelectSuffixLayoutCase from './TreeSelectSuffixLayoutCase.svelte';
  import { treeSelectSuffixLayoutSamples } from './tree-select-suffix-layout-cases';
  let selected = $state(treeSelectSuffixLayoutSamples[0].id);
  let sample = $derived(treeSelectSuffixLayoutSamples.find(sample => sample.id === selected)!);
</script>
<section id="tree-select-suffix-layout-fixture">
  <label>TreeSelect suffix layout sample<select bind:value={selected}>
    {#each treeSelectSuffixLayoutSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#key selected}<TreeSelectSuffixLayoutCase {sample} />{/key}
</section>
