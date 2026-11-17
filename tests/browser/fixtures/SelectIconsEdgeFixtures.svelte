<script lang="ts">
  import SelectIconsEdgeCase from './SelectIconsEdgeCase.svelte';
  const samples = [
    { id: 'tags-search-false', control: 'select', mode: 'tags' as const, showSearch: false },
    { id: 'tags-closed-enter', control: 'select', mode: 'tags' as const, query: 'Draft', rejectOpen: true, key: 'Enter' },
    { id: 'select-hook-prevent', control: 'select', prevent: true, key: 'ArrowDown' },
    { id: 'autocomplete-hook-prevent', control: 'autocomplete', initialOpen: true, prevent: true, key: 'ArrowDown' },
    { id: 'select-open-hook-stop', control: 'select', initialOpen: true, key: 'ArrowDown', stop: true },
    { id: 'autocomplete-open-hook-stop', control: 'autocomplete', initialOpen: true, key: 'ArrowDown', stop: true },
    { id: 'tags-closed-hook-stop', control: 'select', mode: 'tags' as const, query: 'Draft', rejectOpen: true, key: 'Enter', stop: true },
    { id: 'select-menu-mouse', control: 'select', initialOpen: true, menu: true },
    { id: 'autocomplete-menu-mouse', control: 'autocomplete', initialOpen: true, menu: true },
    { id: 'clear-old-cap', control: 'select', mode: 'multiple' as const, initialOpen: true, query: 'query', maxCount: 1, clear: true }
  ];
  let selected = $state(samples[0].id);
</script>

<section id="select-icons-edge-fixture">
  <label>Icon edge sample <select bind:value={selected}>
    {#each samples as sample}<option value={sample.id}>{sample.id}</option>{/each}
  </select></label>
  {#each samples.filter(sample => sample.id === selected) as sample (sample.id)}
    <SelectIconsEdgeCase {sample} />
  {/each}
</section>
