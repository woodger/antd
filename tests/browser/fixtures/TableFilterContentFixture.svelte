<script lang="ts">
  // Observes labels separately from the selected values, queries and events Table.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type RenderEmptyContent, type TableChange, type TableColumn,
    type TableFilterOption, type TableFilters
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-filter-content-reference.json';

  interface Row { key: string; value: string; }
  interface Search { query: string; node: boolean; type: string | null; }
  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'menu' }: { profileId?: string; } = $props();
  const profile = untrack(() => source.cases.find(({ profile }) => profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  let snippetText = $state('Rich label');
  const arraySuffix = $state<RenderEmptyContent[]>(['rray label']);
  const options = [
    { text: 'Plain label', value: 'plain' },
    { text: 0, value: 'zero' },
    { text: 120, value: 'number' },
    { text: richLabel, value: 'rich' },
    { text: [arrayPrefix, arraySuffix], value: 'array' },
    { text: false, value: 'false' },
    { text: null, value: 'null' },
    { text: undefined, value: 'undefined' }
  ] satisfies readonly TableFilterOption[];
  const filters: readonly TableFilterOption[] = profile.nested ? [{
    text: [groupPrefix, ' label'], value: 'group', children: options
  }] : options;
  const dataSource: readonly Row[] = options.map(({ value }) => ({ key: value, value }));
  const columns: TableColumn<Row>[] = [{
    key: 'value', title: 'Value', dataIndex: 'value', filters, filterMultiple: !profile.single,
    filterMode: profile.mode === 'tree' ? 'tree' : 'menu',
    filterSearch: profile.customSearch ? searchLabels : true,
    onFilter: (value, row) => value === row.value
  }];
  const observed = new Set<string>();
  let searches = $state.raw<Search[]>([]);
  let changes = $state.raw<{
    filters: TableFilters; action: TableChange<Row>['action']; rows: string[];
  }[]>([]);

  /** Publishes the query after computing Table and preserves the original label link. */
  function noteSearch(query: string, text: TableFilterOption['text']) {
    const node = text === richLabel;
    const entry = JSON.stringify({ query, node, type: node ? 'strong' : null });
    if (observed.has(entry)) {
      return;
    }

    observed.add(entry);
    queueMicrotask(() => {
      searches = [...observed].sort().map(entry => JSON.parse(entry));
    });
  }

  /** Looks for a rich label only through the user rule. */
  function searchLabels(query: string, option: TableFilterOption) {
    if (option.value === 'rich') {
      noteSearch(query, option.text);
    }

    const needle = query.trim().toLowerCase();
    if (needle === 'rich') {
      return option.value === 'rich';
    }
    const { text } = option;
    return (typeof text === 'string' || typeof text === 'number')
      && String(text).toLowerCase().includes(needle);
  }

  /** Writes a confirmed criterion and processed strings. */
  function noteChange(change: TableChange<Row>) {
    changes = [...changes, {
      filters: change.filters ?? {}, action: change.action,
      rows: change.currentDataSource.map(({ key }) => key)
    }];
  }
</script>

{#snippet richLabel()}<strong data-probe-label="node">{snippetText}</strong>{/snippet}
{#snippet arrayPrefix()}<i data-probe-label="array">A</i>{/snippet}
{#snippet groupPrefix()}<em data-probe-label="branch">Group</em>{/snippet}

<section id="table-filter-content-fixture">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} pagination={false} onChange={noteChange} />
  </ConfigProvider>
  <button type="button" onclick={() => { snippetText = 'Updated label'; }}>Update snippet text</button>
  <button type="button" onclick={() => { delete arraySuffix[0]; }}>Remove array text</button>
  <output data-probe-searches>{JSON.stringify(searches)}</output>
  <output data-probe-changes>{JSON.stringify(changes)}</output>
</section>

<style>
  section { width: 400px; }
</style>
