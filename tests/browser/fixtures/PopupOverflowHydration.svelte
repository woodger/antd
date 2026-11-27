<script lang="ts">
  import PopupOverflowCase from './PopupOverflowCase.svelte';
  import type { PopupOverflowSample } from './popup-overflow-cases';
  let { sample }: { sample: PopupOverflowSample } = $props();
  let fixture = $state<ReturnType<typeof PopupOverflowCase>>();
  export function fixtureApi() { return fixture; }
</script>

<section data-overflow-hydration>
  <form data-overflow-form><PopupOverflowCase {sample} named bind:this={fixture} /></form>
  <input aria-label="Overflow outside draft" style={'position:fixed;'
    + 'left:16px;'
    + 'bottom:16px'} />
</section>
