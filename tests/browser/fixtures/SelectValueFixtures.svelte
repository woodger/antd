<script lang="ts">
  import { untrack } from 'svelte';
  import SelectValueCase from './SelectValueCase.svelte';
  import { selectValueSamples } from './select-value-cases';
  import { selectValueLiveSamples } from './select-value-live-cases';
  const samples = [...selectValueSamples, ...selectValueLiveSamples];
  const required = typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('required');
  let selected = $state(selectValueSamples[0].id);
  let sample = $derived(samples.find(entry => entry.id === selected)!);
</script>

<section id="select-value-fixture">
  <label style="position:fixed;left:0;top:0;z-index:1">
    Select value sample
    <select bind:value={selected}>
      {#each samples as entry}<option value={entry.id}>{entry.id}</option>{/each}
    </select>
  </label>
  {#key selected}
    {@const current = untrack(() => sample)}
    {#if required}<form data-select-value-native-form><SelectValueCase sample={current} required name="value-selection" /></form>
    {:else}<SelectValueCase sample={current} />{/if}
  {/key}
</section>
