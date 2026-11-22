<script lang="ts">
  import type { TreeSelectRef } from '@woodger/antd-svelte';
  import TreeSelectCheckableCase from './TreeSelectCheckableCase.svelte';
  import type { TreeSelectCheckableAction, TreeSelectCheckableSample } from './tree-select-checkable-cases';
  let { sample }: { sample: TreeSelectCheckableSample } = $props();
  interface Fixture {
    update(action: TreeSelectCheckableAction): void;
    readRefs(): { root?: HTMLElement; editor?: HTMLInputElement; control?: TreeSelectRef };
    readEvents(): unknown[][];
    readIgnored(): { renderCalls: number; iteratorCalls: number; thenReads: number };
  }
  let fixture = $state<Fixture>();
  export function fixtureApi() { return fixture; }
</script>

<section data-checkable-hydration>
  <TreeSelectCheckableCase {sample} formName="checked" bind:this={fixture} />
  <input aria-label="Checkable outside draft" style="position:fixed;left:16px;bottom:16px" />
</section>
