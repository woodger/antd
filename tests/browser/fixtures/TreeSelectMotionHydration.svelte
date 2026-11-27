<script lang="ts">
  import type { TreeSelectRef } from '@woodger/antd';
  import TreeSelectMotionCase from './TreeSelectMotionCase.svelte';
  import type { TreeSelectMotionAction, TreeSelectMotionSample } from './tree-select-motion-cases';
  let { sample }: { sample: TreeSelectMotionSample } = $props();
  interface Fixture {
    update(action: TreeSelectMotionAction): void;
    readRefs(): {
      root: HTMLElement | undefined;
      editor: HTMLInputElement | undefined;
      control: TreeSelectRef | undefined;
      getterArguments: HTMLElement[];
      shadow: ShadowRoot | undefined;
    };
    readEvents(): unknown[][];
  }
  let fixture = $state<Fixture>();
  export function fixtureApi() {
    return fixture;
  }
</script>

<section data-motion-hydration>
  <TreeSelectMotionCase {sample} bind:this={fixture} />
  <input aria-label="Motion outside draft" style={'position:fixed;'
    + 'left:16px;'
    + 'bottom:16px'} />
</section>
