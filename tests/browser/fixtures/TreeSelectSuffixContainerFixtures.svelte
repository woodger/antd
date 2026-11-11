<script lang="ts">
  import type { TreeSelectRef } from 'antd-svelte';
  import TreeSelectSuffixLayoutCase from './TreeSelectSuffixLayoutCase.svelte';
  import { treeSelectSuffixContainerSamples } from './tree-select-suffix-container-cases';
  interface Fixture {
    readRefs(): { root: HTMLDivElement | undefined;
      input: HTMLInputElement | HTMLTextAreaElement | undefined; control: TreeSelectRef | undefined; };
  }
  let selected = $state(treeSelectSuffixContainerSamples[0].id);
  let sample = $derived(treeSelectSuffixContainerSamples.find(sample => sample.id === selected)!);
  let fixture = $state<Fixture>();
  let refs = $derived(fixture?.readRefs());
  function popupContainer(trigger: HTMLElement) {
    return trigger.closest<HTMLElement>('[data-suffix-layout-case]')!;
  }
</script>

<section id="tree-select-suffix-container-fixture">
  <label>TreeSelect suffix container sample<select bind:value={selected}>
    {#each treeSelectSuffixContainerSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  <div data-suffix-container-scroller style="width:900px;height:420px;overflow:auto;position:relative">
    <div style="min-width:1400px;min-height:1000px">
      {#key selected}<TreeSelectSuffixLayoutCase {sample} {popupContainer} bind:this={fixture} />{/key}
    </div>
  </div>
  <output hidden data-suffix-container-refs>{JSON.stringify({
    rootIsPublicRef: Boolean(refs?.root && refs.root.closest('[data-suffix-layout-case]')?.querySelector('.ant-select') === refs.root)
  })}</output>
</section>

<style>
  #tree-select-suffix-container-fixture :global([data-suffix-layout-case]) {
    position: relative;
    top: var(--source-host-top, 0px);
    left: var(--source-host-left, 0px);
  }
</style>
