<script lang="ts">
  import type { TreeSelectRef } from '@woodger/antd-svelte';
  import TreeSelectAlignCase from './TreeSelectAlignCase.svelte';
  import type { TreeSelectAlignAction, TreeSelectAlignSample } from './tree-select-align-cases';
  let { sample }: { sample: TreeSelectAlignSample } = $props();
  interface Fixture {
    update(action: TreeSelectAlignAction): void;
    readRefs(): { root: HTMLDivElement | HTMLButtonElement | HTMLSpanElement | undefined;
      editor: HTMLInputElement | undefined; control: TreeSelectRef | undefined; getterArguments: HTMLElement[];
      shadow: ShadowRoot | undefined };
    readEvents(): unknown[][];
  }
  let fixture = $state<Fixture>();
  export function fixtureApi() { return fixture; }
</script>

<section data-align-hydration>
  <TreeSelectAlignCase {sample} bind:this={fixture} />
  <input aria-label="Align outside draft" style="position:fixed;left:16px;bottom:16px" />
</section>
