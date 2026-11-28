<script lang="ts">
  import ThemeZeroRuntimeScope, { type ZeroRuntimeScenario } from './ThemeZeroRuntimeScope.svelte';

  const scenarios: { label: string; scenario: ZeroRuntimeScenario;
    initialZeroRuntime?: boolean; overrideNested?: boolean; }[] = [
    { label: 'Prebuilt CSS', scenario: 'prebuilt' },
    { label: 'Custom prefix with zero runtime', scenario: 'custom' },
    { label: 'Custom prefix with runtime styles', scenario: 'custom', initialZeroRuntime: false },
    { label: 'Inherited zero runtime', scenario: 'nested' },
    { label: 'Nested runtime styles', scenario: 'nested', overrideNested: true },
    { label: 'Live zero runtime', scenario: 'live' },
    { label: 'Renamed prefixes', scenario: 'rename' },
    { label: 'Prebuilt responsive CSS', scenario: 'layout' },
    { label: 'Generated responsive CSS', scenario: 'layout', initialZeroRuntime: false },
    { label: 'Prebuilt Dropdown motion', scenario: 'dropdown' }
  ];
  let selected = $state(0);
</script>

<div data-testid="theme-zero-runtime-fixture">
  <label>
    Zero-runtime scenario
    <select bind:value={selected}>
      {#each scenarios as { label }, index (label)}
        <option value={index}>{label}</option>
      {/each}
    </select>
  </label>

  {#key selected}
    <ThemeZeroRuntimeScope {...scenarios[selected]} />
  {/key}
</div>
