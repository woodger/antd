<script lang="ts">
  import { untrack } from 'svelte';
  import Case from './SelectComponentsResponsiveTagPrefixCase.svelte';
  import { selectCustomTagPrefixSamples } from '../select-components-responsive-tag-prefix-cases.mjs';
  import type { SelectCustomTagPrefixCapture } from '../select-components-responsive-tag-prefix-metrics.mjs';
  let selected = $state(selectCustomTagPrefixSamples[0].id), mounted = $state(true);
  let sample = $derived(selectCustomTagPrefixSamples.find(sample => sample.id === selected)!);
  let capture = $derived.by(() => {
    void selected;
    return {} as SelectCustomTagPrefixCapture;
  });
</script>
<section id="select-components-responsive-tag-prefix-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Responsive custom tag/prefix sample<select bind:value={selected} onchange={() => {
    mounted = true;
  }}>
    {#each selectCustomTagPrefixSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<Case sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-select-components-fixture-command {@attach element => {
    const captured = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => {
        mounted = false;
      } });
    element.addEventListener('selectcomponentscapture', captured);
    return () => element.removeEventListener('selectcomponentscapture', captured);
  }}></div>
</section>
<style>#select-components-responsive-tag-prefix-fixture { min-height:1px; } :global(body) { margin:0; min-width:2200px; min-height:1800px; }</style>
