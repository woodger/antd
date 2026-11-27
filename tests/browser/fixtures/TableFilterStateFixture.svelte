<script lang="ts">
  // Compares the owner's status, displayed strings and queries of public Table.
  import {
    ConfigProvider, enUS, Table, type TableChange, type TableColumn, type TableFilters,
    type TableProps
  } from '@woodger/antd';

  interface Row { key: number; name: string; score: number; region: string; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'controlled' }: { profileId?: string; } = $props();
  const dataSource: Row[] = [
    { key: 0, name: 'Alpha', score: 2, region: 'a' },
    { key: 1, name: 'Beta', score: 1, region: 'b' },
    { key: 2, name: 'Gamma', score: 4, region: 'b' }
  ];
  const even = ['even'] as const;
  const odd = ['odd'] as const;
  const score: TableColumn<Row> = {
    key: 'score', title: 'Score', dataIndex: 'score', filterMultiple: false,
    filters: [{ text: 'Even', value: 'even' }, { text: 'Odd', value: 'odd' }],
    onFilter: (value, row) => (row.score % 2 === 0 ? 'even' : 'odd') === value
  };
  const region: TableColumn<Row> = { key: 'region', title: 'Region', dataIndex: 'region' };
  const regionFilter: TableColumn<Row> = {
    ...region,
    filterMultiple: false,
    filters: [{ text: 'Region B', value: 'b' }],
    onFilter: (value, row) => value === row.region
  };
  const name: TableColumn<Row> = { key: 'name', title: 'Name', dataIndex: 'name' };
  let phase = $state(0);
  let changes = $state.raw<unknown[]>([]);
  let owner = $state.raw<TableFilters>({ score: [], region: ['b'], retired: ['kept'] });
  const columns = $derived(getColumns(profileId, phase));
  const tableProps: TableProps<Row> = $derived({
    columns, dataSource, pagination: false, onChange: noteChange,
    mode: profileId === 'server' ? 'server' : 'client',
    defaultFilters: profileId === 'table-defaults' ? { score: odd } : undefined
  });

  /** Applies the owner's step without remounting the table. */
  function update() {
    phase += 1;
  }

  /** Returns columns with the same keys when changing initial and controlled properties. */
  function getColumns(profile: string, step: number): readonly TableColumn<Row>[] {
    switch (profile) {
      case 'initial':
        return [{ ...score, defaultFilteredValue: step === 0 ? even : odd }, region, name];
      case 'controlled':
        return [{ ...score, filteredValue: [even, odd, null, undefined][step] }, region, name];
      case 'null':
        return [{
          ...score, defaultFilteredValue: even, filteredValue: step === 0 ? null : odd
        }, region, name];
      case 'forced':
        return [{ ...score, filtered: step === 0 }, region, name];
      case 'reset':
        return [{
          ...score, defaultFilteredValue: even, filterResetToDefaultFilteredValue: true
        }, region, name];
      case 'mixed':
        return [
          { ...score, filteredValue: even },
          { ...regionFilter, defaultFilteredValue: ['b'] },
          name
        ];
      case 'enter-control':
        return [{ ...score, filteredValue: step ? even : undefined }, regionFilter, name];
      case 'hidden':
        return [{ ...score, hidden: step === 0, defaultFilteredValue: even }, region, name];
      case 'responsive':
        return [{ ...score, responsive: ['lg'], defaultFilteredValue: even }, region, name];
      case 'root-owner':
        return [{ ...score, filteredValue: [even, null, undefined][step] }, regionFilter, name];
      case 'table-defaults':
        return [{ ...score, defaultFilteredValue: even }, region, name];
      case 'server':
        return [{ ...score, filteredValue: even, onFilter: undefined }, region, name];
      default:
        throw new Error(`Unknown Table filter state profile ${profile}`);
    }
  }

  /** Fix the filtering query along with a sample for onChange. */
  function noteChange(change: TableChange<Row>) {
    changes = [...changes, {
      action: change.action,
      filters: change.filters ?? {},
      rows: change.currentDataSource.map(row => row.key)
    }];
  }
</script>

<section id="table-filter-state-fixture" style="width:520px">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    {#if profileId === 'root-owner'}
      <Table {...tableProps} bind:filters={owner} />
      <output data-filter-state-owner>{JSON.stringify(owner)}</output>
    {:else}
      <Table {...tableProps} />
    {/if}
  </ConfigProvider>
  <button type="button" onclick={update}>Update</button>
  <output data-filter-state-changes>{JSON.stringify(changes)}</output>
</section>
