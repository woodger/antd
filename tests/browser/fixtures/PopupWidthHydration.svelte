<script lang="ts">
  import PopupWidthCase from './PopupWidthCase.svelte';
  import type { PopupWidthSample } from './popup-width-cases';
  let { sample }: { sample: PopupWidthSample } = $props();
  let fixture = $state<ReturnType<typeof PopupWidthCase>>();
  export function fixtureApi() { return fixture; }
</script>

<section data-width-hydration>
  <form data-width-form><PopupWidthCase {sample} named bind:this={fixture} /></form>
  <input aria-label="Width outside draft" style={'position:fixed;'
    + 'left:16px;'
    + 'bottom:16px'} />
</section>
