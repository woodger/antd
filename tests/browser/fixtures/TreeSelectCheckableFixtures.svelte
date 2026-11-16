<script lang="ts">
  import { untrack } from 'svelte';
  import TreeSelectCheckableCase from './TreeSelectCheckableCase.svelte';
  import { treeSelectCheckableSamples } from './tree-select-checkable-cases';
  let selected = $state(treeSelectCheckableSamples[0].id);
  let sample = $derived(treeSelectCheckableSamples.find(sample => sample.id === selected)!);
</script>

<label style="position:fixed;left:0;top:0;z-index:1">
  TreeSelect checkable sample
  <select bind:value={selected}>
    {#each treeSelectCheckableSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select>
</label>
{#key selected}
  {@const currentSample = untrack(() => sample)}
  <TreeSelectCheckableCase sample={currentSample} />
{/key}

<style>:global(body) { margin:0; }</style>
