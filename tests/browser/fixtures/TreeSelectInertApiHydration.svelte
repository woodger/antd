<script lang="ts">
  import type { TreeSelectRef } from 'antd-svelte';
  import TreeSelectInertApiCase from './TreeSelectInertApiCase.svelte';
  import type { TreeSelectInertApiMode, TreeSelectInertApiSample } from './tree-select-inert-api-cases';
  let { sample }: { sample: TreeSelectInertApiSample } = $props();
  interface Fixture {
    update(mode: TreeSelectInertApiMode): void;
    readRefs(): { root: HTMLDivElement | HTMLButtonElement | undefined;
      editor: HTMLInputElement | undefined; control: TreeSelectRef | undefined; };
    readEvents(): unknown[][];
  }
  let fixture = $state<Fixture>();
  export function fixtureApi() { return fixture; }
</script>

<section data-inert-api-hydration>
  <TreeSelectInertApiCase {sample} initialMode={sample.ssrMode} bind:this={fixture} />
  <input aria-label="Inert API outside draft" />
</section>
