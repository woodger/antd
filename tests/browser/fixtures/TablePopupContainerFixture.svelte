<script lang="ts">
  // Configures individual DOM-containers to distinguish the owners of each panel.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type TableChange, type TableColumn, type TableFilterDropdownProps,
    type TableFilters, type TableFilterValue, type TableKey
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-popup-container-reference.json';

  interface Row { key: number; name: string; }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'default',
    peer = query.has('peer')
  }: {
    profileId?: string;
    peer?: boolean;
  } = $props();
  const profile = untrack(() => {
    const sample = source.cases.find(sample => sample.spec.id === profileId);
    return sample?.spec ?? source.cases[0].spec;
  });
  const rows: Row[] = [{ key: 1, name: 'Red' }, { key: 2, name: 'Green' }];
  const hosts = ['provider', 'table', 'column', 'tooltip', 'updated', 'peer'];
  const calls = new Set<string>();
  const columns = [createColumn()];
  const providerContainer = profile.provider ? resolveIn('provider') : undefined;
  const peerContainer = resolveIn('peer');
  let target = $state(profile.table);
  const tableContainer = $derived(target ? resolveIn(target) : undefined);
  let appliedFilters = $state<TableFilters>();
  let committedFilters = $state.raw<TableFilterValue[][]>([]);
  let selections = $state.raw<TableKey[][]>([]);

  /** Adds only those column options that are present in the original profile. */
  function createColumn(): TableColumn<Row> {
    const column: TableColumn<Row> = { key: 'name', title: 'Name', dataIndex: 'name' };
    if (profile.kind === 'sorter') {
      column.sorter = (left, right) => left.key - right.key;
      column.showSorterTooltip = {
        mouseEnterDelay: 0,
        mouseLeaveDelay: 0,
        getPopupContainer: profile.sorter ? resolveIn('tooltip') : undefined
      };
    }
    else if (profile.kind !== 'selection') {
      const choices = rows.map(row => ({ text: row.name, value: row.key }));
      column.filters = profile.grouped
        ? [{ text: 'Colors', value: 'all', children: choices }] : choices;
      column.onFilter = (value, row) => row.key === value;
      column.onHeaderCell = () => ({ 'data-popup-host': 'header' });
      if (profile.column) {
        column.filterDropdownProps = {
          getPopupContainer: profile.column === 'undefined' ? undefined : resolveIn(profile.column),
          forceRender: profile.custom
        };
      }
      if (profile.custom) {
        column.filterDropdown = editor;
      }
    }
    return column;
  }

  /** Defines the role of the transferred element without the assumptions about its HTML-tage. */
  function triggerRole(trigger: HTMLElement) {
    if (trigger.closest('[data-ant-table-filter-part="trigger"]')) return 'filter';
    if (trigger.closest('[data-ant-menu-submenu-title]')) return 'submenu';
    if (trigger.closest('.ant-table-selection-extra')) return 'selection';
    if (trigger.closest('.ant-table-column-sorters, .ant-table-column-has-sorters')) return 'sorter';
    return 'unknown';
  }

  /** Writes down the role of a trigger and looking for a container in his document after mount. */
  function resolveIn(layer: string) {
    return function resolvePopup(trigger?: HTMLElement) {
      if (typeof window === 'undefined') {
        throw new Error('The resolver received an SSR reference');
      }
      if (!trigger) {
        throw new Error('Missing popup trigger');
      }

      const document = trigger.ownerDocument;
      calls.add(`${layer}:${triggerRole(trigger)}`);
      const evidence = document.querySelector<HTMLElement>('[data-popup-resolvers]');
      if (evidence) {
        evidence.dataset.popupResolvers = JSON.stringify([...calls].sort());
      }

      const host = layer === 'header' ? trigger.closest('th')
        : document.querySelector<HTMLElement>(`[data-popup-host="${layer}"]`);
      if (!host) {
        throw new Error(`Missing popup host: ${layer}`);
      }
      return host;
    };
  }

  /** Records the applied criterion, discarding the changes of sorting and the page. */
  function noteFilter(change: TableChange<Row>) {
    if (change.action === 'filter') {
      committedFilters = [...committedFilters, change.filters?.name ?? []];
    }
  }

  /** Saves a set of keys after each selection command. */
  function noteSelection(keys: TableKey[]) {
    selections = [...selections, keys];
  }
</script>

{#snippet editor({ selectedKeys, setSelectedKeys, confirm }: TableFilterDropdownProps)}
  <div data-custom-filter>
    <input aria-label="Editor" value="Seed" />
    <button type="button" onclick={() => setSelectedKeys([2])}>Choose Green</button>
    <button type="button" onclick={() => confirm()}>Apply</button>
    <output>{selectedKeys.join(',')}</output>
  </div>
{/snippet}

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}
  getPopupContainer={providerContainer}>
  <div data-table-popup-container>
    {#each hosts as host (host)}
      <div data-popup-host={host}></div>
    {/each}
    <button type="button" onclick={() => { target = 'updated'; }}>Move popup</button>
    <button type="button" onclick={() => { target = undefined; }}>Remove override</button>
    <button type="button" onclick={() => { appliedFilters = { name: [1] }; }}>
      Replace applied filter
    </button>
    <div data-popup-main>
      <Table dataSource={rows} {columns} pagination={false} getPopupContainer={tableContainer}
        rowSelection={profile.kind === 'selection' ? { selections: true } : undefined}
        filters={appliedFilters} onChange={noteFilter} onSelectionChange={noteSelection} />
    </div>
    {#if peer}
      <div data-popup-peer>
        <Table dataSource={rows} {columns} pagination={false} getPopupContainer={peerContainer} />
      </div>
    {/if}
    <output data-popup-resolvers="[]"></output>
    <output data-popup-filters>{JSON.stringify(committedFilters)}</output>
    <output data-popup-keys>{JSON.stringify(selections)}</output>
  </div>
</ConfigProvider>
