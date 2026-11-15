<script lang="ts">
  import TreeSelectAlignCase from './TreeSelectAlignCase.svelte';
  import { treeSelectAlignSamples } from './tree-select-align-cases';
  import { treeSelectAlignActivationSamples } from './tree-select-align-activation-cases';
  const samples = [...treeSelectAlignSamples, ...treeSelectAlignActivationSamples];
  let selected = $state(samples[0].id);
  let sample = $derived(samples.find(sample => sample.id === selected)!);
</script>

<label style="position:fixed;left:0;top:0;font:14px Arial;z-index:1">
  TreeSelect alignment sample
  <select bind:value={selected}>{#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}</select>
</label>
{#key selected}<TreeSelectAlignCase {sample} />{/key}
<div style="position:absolute;left:0;top:0;height:1600px;width:1px" aria-hidden="true"></div>

<style>
  :global(body) { margin:0;min-height:1600px; }
</style>
