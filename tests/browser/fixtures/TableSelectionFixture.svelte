<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, enUS, Table,
    type TableColumn, type TableKey, type TableRowSelectMethod, type TableRowSelection
  } from '@woodger/antd';
  import reference from './ant-design-table-selection-reference.json' with { type: 'json' };

  interface Row {
    key: number;
    name: string;
    rev: number;
    locked?: boolean;
    children?: Row[];
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'radio' }: { profileId?: string; } = $props();
  const profile = $derived(reference.cases.find(item => item.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  let owner = $state<TableKey[]>(untrack(() => [...(profile.keys ?? [])]));
  let accepts = $state(untrack(() => !profile.reject));
  let hidden = $state(false);
  let version = $state(0);
  let events = $state.raw<unknown[][]>([]);
  let enabled = $state(true);

  const columns: TableColumn<Row>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'rev', title: 'Revision', dataIndex: 'rev' }
  ];
  const data = $derived(createRows(version));
  const decorations = query.has('attributes');
  const virtual = query.has('virtual');
  const rowSelection = $derived<TableRowSelection<Row>>({
    ...(profile.controlled ? { selectedRowKeys: owner } : { defaultSelectedRowKeys: profile.keys }),
    type: profile.radio ? 'radio' : 'checkbox',
    checkStrictly: !profile.linked,
    preserveSelectedRowKeys: profile.preserve,
    hideSelectAll: hidden,
    selections: profile.menu === 'custom' ? [
      Table.SELECTION_INVERT,
      { key: 'custom', text: 'Record enabled keys', onSelect: keys => record('command', keys) },
      Table.SELECTION_NONE
    ] : profile.menu === true,
    ...(decorations ? { columnWidth: 84, align: 'right', fixed: 'start' } : {}),
    getCheckboxProps: row => ({
      disabled: row.locked,
      'aria-label': `Choose ${row.key}`,
      ...(profile.named ? { name: 'table-choice' } : {}),
      ...(decorations ? { name: `target-${row.key}`, value: row.key, title: row.name } : {})
    }),
    getTitleCheckboxProps: () => ({
      'aria-label': 'Choose page',
      disabled: profile.titleOwnDisabled ? false : undefined,
      onChange: event => record('title', event.target.checked, event.nativeEvent.type)
    }),
    onSelect(row, checked, rows, event) {
      record('select', row.key, checked, records(rows), event.type,
        'shiftKey' in event && Boolean(event.shiftKey));
    },
    onChange: change
  });

  /** Возвращает прочитанную версию каждой записи для сверки кэша предыдущих страниц. */
  function records(rows: Row[]) {
    return rows.map(row => [row.key, row.rev]);
  }

  /** Публикует журнал в том же порядке, что обработчики исходного приложения. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** Меняет данные теми же наборами, что рендер исходного профиля. */
  function createRows(rev: number): Row[] {
    const keys = rev === 1 ? [10, 11, 12] : [0, 1, 2, 3, 4, 5, 6, 7];
    return keys.map(key => ({
      key, rev, name: `Row ${key}`, locked: profile.locked?.includes(key) ?? false,
      children: profile.linked && key === 0 ? [{ key: 8, rev, name: 'Child 8' }] : undefined
    }));
  }

  /** Управляемый профиль может отклонить изменение, сохраняя прежний input. */
  function change(keys: TableKey[], rows: Row[], { type }: { type: TableRowSelectMethod; }) {
    record('change', type, keys, records(rows));
    if (profile.controlled && accepts) {
      owner = keys;
    }
    if (query.has('swap') && version === 0 && keys.includes(0)) {
      version = 1;
    }
  }
</script>

<section id="table-selection-fixture" style="width:600px">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table
      dataSource={data}
      {columns}
      {virtual}
      scroll={virtual ? { x: 640, y: 146 } : undefined}
      size="small"
      rowSelection={enabled && rowSelection}
      expandable={profile.linked ? { defaultExpandAllRows: true } : undefined}
      pagination={profile.pageSize ? { showSizeChanger: false } : false}
      defaultPageSize={profile.pageSize}
    />
  </ConfigProvider>
  <button type="button" data-testid="selection-accept" onclick={() => { accepts = true; }}>
    Accept changes
  </button>
  <button type="button" data-testid="selection-clear" onclick={() => { owner = []; }}>
    Clear controlled keys
  </button>
  <button type="button" data-testid="selection-hide" onclick={() => { hidden = !hidden; }}>
    Toggle header selection
  </button>
  <button type="button" data-testid="selection-enable" onclick={() => { enabled = !enabled; }}>
    Toggle selection
  </button>
  {#each [1, 2] as next}
    <button type="button" data-testid={`selection-data-${next}`} onclick={() => { version = next; }}>
      Load revision {next}
    </button>
  {/each}
  <output id="table-selection-events">{JSON.stringify(events)}</output>
</section>
