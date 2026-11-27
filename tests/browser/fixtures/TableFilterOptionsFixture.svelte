<script lang="ts">
  // Drives out reference menus and wood through the public Table, including Server Render.
  import {
    ConfigProvider, enUS, Table, type TableChange, type TableColumn, type TableFilterOption,
    type TableFilterValue
  } from '@woodger/antd';

  interface Row { key: number; name: string; value: TableFilterValue; group: string; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'menu-search' }: { profileId?: string; } = $props();
  const apple = { text: 'Apple', value: 'apple', id: 1 };
  const banana = { text: 'Banana', value: 'banana', id: 2 };
  const pear = { text: 'Pear', value: 'pear', id: 3 };
  const tea = { text: 'Tea', value: 'tea', id: 4 };
  const flat = [apple, banana, pear, tea];
  const records: Row[] = [
    { key: 0, name: 'Alpha', value: 'apple', group: 'produce' },
    { key: 1, name: 'Beta', value: 'banana', group: 'produce' },
    { key: 2, name: 'Gamma', value: 'pear', group: 'produce' },
    { key: 3, name: 'Delta', value: 'tea', group: 'drinks' }
  ];
  const typedRecords: Row[] = [
    { key: 0, name: 'Number', value: 0, group: 'typed' },
    { key: 1, name: 'Text', value: '0', group: 'typed' },
    { key: 2, name: 'Boolean', value: false, group: 'typed' }
  ];
  const typedOptions: TableFilterOption[] = [{
    text: 'Mixed', value: 'typed', children: [
      { text: 'Numeric zero', value: 0 }, { text: 'Text zero', value: '0' },
      { text: 'False', value: false }
    ]
  }];
  let changed = $state(false);
  let changes = $state.raw<unknown[]>([]);
  let submissions = $state(0);
  const dataSource = $derived(profileId === 'tree-types' ? typedRecords : records);
  const columns: TableColumn<Row>[] = $derived(getColumns(profileId, changed));

  /** Retains the parent's options when replacing one child. */
  function getGroups(updated: boolean): TableFilterOption[] {
    return [
      { text: 'Produce', value: 'produce', children: updated ? [banana] : [apple, banana] },
      { text: 'Drinks', value: 'drinks', children: [tea] },
      pear
    ];
  }

  /** Configures the search interface and selection state for a single run. */
  function getColumns(profile: string, updated: boolean): TableColumn<Row>[] {
    const column: TableColumn<Row> = {
      key: 'category',
      title: 'Category',
      dataIndex: 'value',
      filters: profile === 'menu-search' || profile === 'menu-custom' ? flat : getGroups(updated),
      onFilter: (value, row) => value === row.value || value === row.group
    };
    if (profile.startsWith('tree') || profile === 'owner-updates') {
      column.filterMode = 'tree';
    }
    if (profile === 'tree-single') {
      column.filterMultiple = false;
    }
    if (profile === 'tree-cascade') {
      column.defaultFilteredValue = ['apple'];
    }
    if (profile.endsWith('-search')) {
      column.filterSearch = true;
    }
    if (profile === 'menu-custom') {
      column.filterSearch = (input, option) => input === 'id2' && 'id' in option && option.id === 2;
    }
    if (profile === 'tree-custom') {
      column.filterSearch = (input, option) => input === ' ID2 ' && option.value === 'banana';
    }
    if (profile === 'tree-types') {
      column.filters = typedOptions;
      column.defaultFilteredValue = [false];
    }
    return [column, { key: 'name', title: 'Name', dataIndex: 'name' }];
  }

  /** Fixes accepted filters and processed strings before pagination. */
  function noteChange(change: TableChange<Row>) {
    changes = [...changes, { filters: change.filters, rows: change.currentDataSource.map(row => row.key) }];
  }

  /** Distinguishes sending an external form from filter confirmation. */
  function submit(event: SubmitEvent) {
    event.preventDefault();
    submissions += 1;
  }
</script>

<section id="table-filter-options-fixture" style="width:520px">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <form onsubmit={submit}>
      <Table {columns} {dataSource} pagination={false} onChange={noteChange} />
      <button type="submit">Submit outer form</button>
    </form>
  </ConfigProvider>
  <button type="button" onclick={() => { changed = true; }}>Change filter options</button>
  <output data-filter-options-changes>{JSON.stringify(changes)}</output>
  <output data-filter-options-submissions>{submissions}</output>
</section>
