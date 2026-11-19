<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectIconsCase from './SelectIconsCase.svelte';
  import { selectIconSamples } from '../select-icons-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof SelectIconsCase>['capture']>;
  let selected = $state(selectIconSamples[0].id), mounted = $state(true);
  let sample = $derived(selectIconSamples.find(sample => sample.id === selected)!);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
</script>
<section id="select-icons-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select icon sample<select bind:value={selected} onchange={() => {
    mounted = true;
  }}>
    {#each selectIconSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}{@const current = sample}<SelectIconsCase sample={untrack(() => current)} {capture} />{/key}{/if}
  <div hidden data-select-icons-fixture-command {@attach element => {
    const captured = (event: Event) => Object.assign((event as CustomEvent).detail,
      { read: capture.read, readRefs: capture.readRefs, update: capture.update, dispose: () => {
        mounted = false;
      } });
    element.addEventListener('selecticonscapture', captured); return () => element.removeEventListener('selecticonscapture', captured);
  }}></div>
</section>

<style>#select-icons-fixture { min-height: 1px; } :global(body) { margin: 0; min-width: 2200px; min-height: 1800px; }</style>
