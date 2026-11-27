<script lang="ts">
  import type { TreeSelectRef } from '@woodger/antd';
  import TreeSelectSuffixLayoutCase from './TreeSelectSuffixLayoutCase.svelte';
  import type { TreeSelectSuffixLayoutSample } from './tree-select-suffix-layout-cases';
  let { sample }: { sample: TreeSelectSuffixLayoutSample } = $props();
  interface Fixture {
    readRefs(): { root: HTMLDivElement | undefined;
      input: HTMLInputElement | HTMLTextAreaElement | undefined; control: TreeSelectRef | undefined; };
    focus(options?: FocusOptions): void;
    blur(): void;
  }
  let fixture = $state<Fixture>();
  export function fixtureApi() { return fixture; }
</script>

<section data-suffix-layout-hydration>
  <form aria-label="Suffix layout hydration values"><TreeSelectSuffixLayoutCase {sample} bind:this={fixture} /></form>
  <input aria-label="Suffix layout outside draft" />
</section>
