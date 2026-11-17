<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectSurfaceEdgeNativeCase from './SelectSurfaceEdgeNativeCase.svelte';
  import { selectSurfaceEdgeSamples } from './select-surface-edge-cases';
  let selected = $state(selectSurfaceEdgeSamples[0].id);
  let sample = $derived(selectSurfaceEdgeSamples.find(entry => entry.id === selected)!);
  type Capture = NonNullable<ComponentProps<typeof SelectSurfaceEdgeNativeCase>['capture']>;
  let active = $state(true);
  let capture = $derived.by(() => { void selected; return {} as Capture; });
</script>

<section id="select-surface-edge-native-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select surface edge sample
    <select bind:value={selected} onchange={() => { active = true; }}>
      {#each selectSurfaceEdgeSamples as entry}<option value={entry.id}>{entry.id}</option>{/each}
    </select>
  </label>
  {#if active}{#key selected}<SelectSurfaceEdgeNativeCase sample={untrack(() => sample)} {capture} />{/key}{/if}
  <div data-surface-fixture-command hidden {@attach node => {
    const capturing = (event: Event) => Object.assign((event as CustomEvent).detail, {
      read: capture.read, readRefs: capture.readRefs, dispose: () => { active = false; }
    });
    node.addEventListener('surfacecapture', capturing);
    return () => node.removeEventListener('surfacecapture', capturing);
  }}></div>
</section>
