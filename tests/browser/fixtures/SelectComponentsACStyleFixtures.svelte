<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectComponentsACStyleCase from './SelectComponentsACStyleCase.svelte';
  import { selectComponentSamples } from '../select-components-ac-style-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof SelectComponentsACStyleCase>['capture']>;
  const samples = selectComponentSamples;
  let selected = $state(samples[0].id), mounted = $state(true);
  let sample = $derived(samples.find(s => s.id === selected)!);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>
<section id="select-components-ac-style-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select component AC style sample<select bind:value={selected} onchange={() => {
    mounted = true;
  }}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<SelectComponentsACStyleCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-select-components-fixture-command {@attach element => {
    const captured = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, readNativeBlurChecks: capture.readNativeBlurChecks,
        update: capture.update, dispose: () => { mounted = false; } });
    element.addEventListener('selectcomponentscapture', captured);
    return () => element.removeEventListener('selectcomponentscapture', captured);
  }}></div>
</section>
<style>#select-components-ac-style-fixture { min-height: 1px; } :global(body) { margin: 0; min-width: 2200px; min-height: 1800px; }</style>
