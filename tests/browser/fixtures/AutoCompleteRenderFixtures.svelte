<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import AutoCompleteRenderCase from './AutoCompleteRenderCase.svelte';
  import { autocompleteRenderSamples } from '../autocomplete-render-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof AutoCompleteRenderCase>['capture']>;
  let selected = $state(autocompleteRenderSamples[0].id);
  let sample = $derived(autocompleteRenderSamples.find(sample => sample.id === selected)!);
  let mounted = $state(true);
  let capture = $derived.by(() => { void selected; return {} as Capture; });
</script>
<section>
  <label id="autocomplete-render-fixture" style="position:fixed;left:0;top:0;z-index:1">AutoComplete render sample<select bind:value={selected} onchange={() => { mounted = true; }}>
    {#each autocompleteRenderSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<AutoCompleteRenderCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-ac-render-fixture-command {@attach node => {
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => { mounted = false; } });
    node.addEventListener('acrendercapture', reading);
    return () => node.removeEventListener('acrendercapture', reading);
  }}></div>
</section>
