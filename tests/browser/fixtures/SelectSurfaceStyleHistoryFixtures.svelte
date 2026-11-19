<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectSurfaceStyleHistoryCase from './SelectSurfaceStyleHistoryCase.svelte';
  import { selectSurfaceStyleHistorySamples } from './select-surface-style-history-cases';
  type Capture = NonNullable<ComponentProps<typeof SelectSurfaceStyleHistoryCase>['capture']>;
  let selected = $state<string>(selectSurfaceStyleHistorySamples[0].id);
  let sample = $derived(selectSurfaceStyleHistorySamples.find(sample => sample.id === selected)!);
  let mounted = $state(true);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>

<section id="select-surface-style-history-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select surface style history sample
    <select bind:value={selected} onchange={() => { mounted = true; }}>
      {#each selectSurfaceStyleHistorySamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#if mounted}{#key selected}<SelectSurfaceStyleHistoryCase sample={untrack(() => sample)} {capture} />{/key}{/if}
  <div hidden data-surface-fixture-command {@attach node => {
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, dispose: () => { mounted = false; } });
    node.addEventListener('surfacecapture', reading);
    return () => node.removeEventListener('surfacecapture', reading);
  }}></div>
</section>
