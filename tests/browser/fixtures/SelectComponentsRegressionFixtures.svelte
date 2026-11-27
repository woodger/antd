<script lang="ts">
  import SelectComponentsRegressionCase from './SelectComponentsRegressionCase.svelte';
  const samples = ['select-input', 'ac-input', 'select-root', 'ac-root', 'root-backspace-closed',
    'root-backspace-open', 'input-backspace-closed', 'input-backspace-open', 'default-blur'];
  let selected = $state(samples[0]);
</script>

<section id="select-components-regression-fixture">
  <label>Component regression sample <select bind:value={selected}>
    {#each samples as sample}<option value={sample}>{sample}</option>{/each}
  </select></label>
  {#key selected}<SelectComponentsRegressionCase sample={selected} />{/key}
</section>
