<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import AutoCompleteRenderLabelTitleCase from './AutoCompleteRenderLabelTitleCase.svelte';
  import { labelTitleSamples } from '../autocomplete-render-label-title-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof AutoCompleteRenderLabelTitleCase>['capture']>;
  let selected = $state(labelTitleSamples[0].id);
  let sample = $derived(labelTitleSamples.find(s => s.id === selected)!);
  let mounted = $state(true);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>
<section>
  <label id="autocomplete-render-label-title-fixture" style="position:fixed;left:0;top:0;z-index:1">AutoComplete label title sample<select bind:value={selected} onchange={() => {
    mounted = true;
  }}>
    {#each labelTitleSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<AutoCompleteRenderLabelTitleCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-label-title-fixture-command {@attach node => {
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => {
        mounted = false;
      } });
    node.addEventListener('labeltitlecapture', reading); return () => node.removeEventListener('labeltitlecapture', reading);
  }}></div>
</section>
