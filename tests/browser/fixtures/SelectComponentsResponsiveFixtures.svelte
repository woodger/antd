<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectComponentsResponsiveCase from './SelectComponentsResponsiveCase.svelte';
  import { selectComponentSamples } from '../select-components-responsive-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof SelectComponentsResponsiveCase>['capture']>;
  const samples = selectComponentSamples;
  let selected = $state(samples[0].id), mounted = $state(true);
  let sample = $derived(samples.find(s => s.id === selected)!);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>
<section id="select-components-responsive-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select component responsive sample<select bind:value={selected} onchange={() => { mounted = true; }}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<SelectComponentsResponsiveCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-select-components-fixture-command {@attach element => {
    const captured = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => { mounted = false; } });
    element.addEventListener('selectcomponentscapture', captured);
    return () => element.removeEventListener('selectcomponentscapture', captured);
  }}></div>
</section>
<style>#select-components-responsive-fixture { min-height: 1px; } :global(body) { margin: 0; min-width: 2200px; min-height: 1800px; }</style>
