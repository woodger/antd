<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import SelectSurfaceOmissionCase from './SelectSurfaceOmissionCase.svelte';
  import SelectSurfaceInputWidthOwnCase from './SelectSurfaceInputWidthOwnCase.svelte';
  import { selectSurfaceOmissionNativeSamples } from './select-surface-omission-native-cases';
  import { inputWidthOwnSamples } from '../select-surface-input-width-own-cases.mjs';
  type Capture = NonNullable<ComponentProps<typeof SelectSurfaceOmissionCase>['capture']>;
  type WidthCapture = NonNullable<ComponentProps<typeof SelectSurfaceInputWidthOwnCase>['capture']>;
  const minimumWidthSample = {
    id: 'select-surface-input-width-own-native-minimum',
    initialWidthKind: 'omitted' as const
  };
  const samples = [...selectSurfaceOmissionNativeSamples, ...inputWidthOwnSamples, minimumWidthSample];
  let selected = $state<string>(selectSurfaceOmissionNativeSamples[0].id);
  let sample = $derived(samples.find(sample => sample.id === selected)!);
  let mounted = $state(true);
  let capture = $derived.by(() => {
    void selected;
    return {} as Capture;
  });
  let widthCapture = $derived.by(() => {
    void selected;
    return {} as WidthCapture;
  });
</script>

<section id="select-surface-omission-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">Select surface omission sample
    <select bind:value={selected} onchange={() => { mounted = true; }}>
      {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  {#if mounted}{#key selected}{#if 'initialWidthKind' in sample}{@const activeSample = sample}<SelectSurfaceInputWidthOwnCase
      sample={untrack(() => activeSample)} capture={widthCapture}
      withoutTheme={activeSample.id === minimumWidthSample.id} initialQuery={activeSample.id === minimumWidthSample.id ? '' : undefined} />{:else}{@const activeSample = sample}<SelectSurfaceOmissionCase
      sample={untrack(() => activeSample)} {capture} />{/if}{/key}{/if}
  <div hidden data-surface-fixture-command {@attach node => {
    const reading = (event: Event) => {
      const active = 'initialWidthKind' in sample ? widthCapture : capture;
      Object.assign((event as CustomEvent).detail, { read: active.read, readRefs: active.readRefs,
        setAction: 'initialWidthKind' in sample ? undefined : capture.setAction, dispose: () => { mounted = false; } });
    };
    node.addEventListener('surfacecapture', reading);
    return () => node.removeEventListener('surfacecapture', reading);
  }}></div>
</section>
