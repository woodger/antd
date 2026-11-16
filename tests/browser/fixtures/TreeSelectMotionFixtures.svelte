<script lang="ts">
  import { untrack } from 'svelte';
  import TreeSelectMotionCase from './TreeSelectMotionCase.svelte';
  import { treeSelectMotionSamples } from './tree-select-motion-cases';
  import { treeSelectMotionRootSwapSamples } from './tree-select-motion-root-swap-cases';
  const samples = [...treeSelectMotionSamples, ...treeSelectMotionRootSwapSamples];
  let selected = $state(samples[0].id);
  let sample = $derived(samples.find(sample => sample.id === selected)!);
</script>

<label style="position:fixed;left:0;top:0;font:14px Arial;z-index:1">
  TreeSelect motion sample
  <select bind:value={selected}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select>
</label>
{#key selected}
  {@const current = untrack(() => sample)}
  <TreeSelectMotionCase sample={current} />
{/key}
<div style="position:absolute;left:0;top:0;height:1600px;width:1px" aria-hidden="true"></div>

<style>
  :global(body) { margin:0;min-height:1600px; }
</style>
