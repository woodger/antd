<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectComponentsCase from './SelectComponentsCase.svelte';
  import { selectComponentSamples } from '../select-icons-cases.mjs';
  import { selectComponentSamples as flowSamples } from '../select-components-flow-cases.mjs';
  import type { SelectComponentsSample } from '../select-components-flow-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof SelectComponentsCase>['capture']>;
  const samples: SelectComponentsSample[] = [...selectComponentSamples, ...flowSamples];
  let selected = $state(samples[0].id), mounted = $state(true);
  let sample = $derived(samples.find(s => s.id === selected)!);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>
<section id="select-components-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select components sample<select bind:value={selected} onchange={() => { mounted = true; }}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<SelectComponentsCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-select-components-fixture-command {@attach element => {
    const captured = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => { mounted = false; } });
    element.addEventListener('selectcomponentscapture', captured);
    return () => element.removeEventListener('selectcomponentscapture', captured);
  }}></div>
</section>
<style>#select-components-fixture { min-height: 1px; } :global(body) { margin: 0; min-width: 2200px; min-height: 1800px; }</style>
