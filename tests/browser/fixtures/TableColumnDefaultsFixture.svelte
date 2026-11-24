<script lang="ts">
  // Передаёт один набор свойств через публичный column и фиксирует события таблицы.
  import {
    ConfigProvider, enUS, Table, type TableChange, type TableColumn, type TableColumnDefaults,
    type TableColumnsType
  } from '@woodger/antd';

  interface Row {
    key: number;
    name: string;
    score: number;
    nested: { value: number; };
  }

  interface Scenario {
    columns: TableColumnsType<Row>;
    defaults: TableColumnDefaults<Row>;
    update?: TableColumnDefaults<Row>;
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'inheritance', editor = false
  }: { profileId?: string; editor?: boolean; } = $props();
  let changed = $state(false);
  let changes = $state.raw<unknown[]>([]);
  const scenario = $derived(getScenario(profileId));
  const column = $derived.by(() => {
    const current = changed ? scenario.update ?? scenario.defaults : scenario.defaults;
    return editor ? { ...current, render: editValue } : current;
  });
  const services = $derived(profileId === 'services');
  const dataSource: Row[] = [
    { key: 0, name: 'Alpha', score: 2, nested: { value: 27 } },
    { key: 1, name: 'Beta', score: 1, nested: { value: 15 } }
  ];

  /** Собирает входы из профиля React, включая явные переопределения и их отсутствие. */
  function getScenario(profile: string): Scenario {
    const name: TableColumn<Row> = { key: 'a', title: 'Name', dataIndex: 'name' };
    const score: TableColumn<Row> = { key: 'b', title: 'Score', dataIndex: 'score' };
    const defaults = {
      align: 'center', width: 110, className: 'shared-default', ellipsis: true
    } satisfies TableColumnDefaults<Row>;

    switch (profile) {
      case 'groups':
        return {
          columns: [{
            key: 'group', title: 'Group', align: 'left',
            children: [name, { ...score, align: 'right' }]
          }],
          defaults,
          update: { ...defaults, align: 'end', className: 'updated-default' }
        };
      case 'services':
        return { columns: [Table.SELECTION_COLUMN, name, Table.EXPAND_COLUMN, score], defaults };
      case 'callbacks':
        return {
          columns: [name, {
            ...score,
            onCell: () => ({ 'data-owner': 'body-local' }),
            onHeaderCell: () => ({ 'data-owner': 'head-local' })
          }],
          defaults: {
            ...defaults,
            onCell: () => ({ 'data-owner': 'shared' }),
            onHeaderCell: () => ({ 'data-owner': 'shared' })
          }
        };
      case 'data-path':
        return {
          columns: [{ key: 'a', title: 'Default path' }, score],
          defaults: { ...defaults, dataIndex: ['nested', 'value'], render: showValue }
        };
      case 'sorting':
      case 'initial-sort':
        return {
          columns: [{ ...name, sortOrder: undefined }, { ...score, sorter: false }],
          defaults: {
            ...defaults, sorter: compareScore, sortDirections: ['ascend'], showSorterTooltip: false,
            defaultSortOrder: profile === 'initial-sort' ? 'ascend' : undefined
          }
        };
      case 'controlled-sort':
        return {
          columns: [{ ...name, sortOrder: null }, { ...score, sortOrder: undefined }],
          defaults: { ...defaults, sorter: compareScore, sortOrder: 'descend',
            showSorterTooltip: false },
          update: { ...defaults, sorter: compareScore, sortOrder: 'ascend',
            showSorterTooltip: false }
        };
      case 'filtering':
        return {
          columns: [name, { ...score, filters: [{ text: 'Odd score', value: 'odd' }] }],
          defaults: {
            ...defaults, filters: [{ text: 'Even score', value: 'even' }], filterMultiple: false,
            onFilter: (value, row) => (row.score % 2 === 0 ? 'even' : 'odd') === value
          }
        };
      case 'hidden':
        return {
          columns: [name, { ...score, hidden: false }],
          defaults: { ...defaults, hidden: true },
          update: defaults
        };
      case 'responsive':
        return {
          columns: [name, { ...score, responsive: [] }],
          defaults: { ...defaults, responsive: ['lg'] }
        };
      default:
        return {
          columns: [
            name,
            {
              ...score, align: undefined, width: undefined, className: undefined, ellipsis: undefined
            },
            { ...score, key: 'c', title: 'Override', align: 'right', width: 0, className: '',
              ellipsis: false }
          ],
          defaults
        };
    }
  }

  /** Сравнивает записи по общему числовому полю. */
  function compareScore(left: Row, right: Row) {
    return left.score - right.score;
  }

  /** Сопоставляет событие с активными критериями и порядком данных React. */
  function noteChange(change: TableChange<Row>) {
    changes = [...changes, {
      action: change.action,
      filters: change.filters ?? {},
      sorter: change.sorter,
      rows: change.currentDataSource.map(row => row.key)
    }];
  }
</script>

{#snippet showValue(record: Row, index: number, value: unknown)}
  {String(value)}:{record.key}:{index}
{/snippet}

{#snippet editValue(record: Row, _index: number, value: unknown)}
  {#if record.key === 0 && value === record.name}
    <input aria-label="Column editor" defaultValue={record.name} />
  {:else}
    {String(value ?? '')}
  {/if}
{/snippet}

{#snippet details()}Details{/snippet}

<section id="table-column-defaults-fixture" style="width:520px">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table columns={scenario.columns} {column} {dataSource} pagination={false}
      rowSelection={services ? { columnWidth: 32 } : false}
      expandable={services ? { columnWidth: 40, expandedRowRender: details } : undefined}
      onChange={noteChange} />
  </ConfigProvider>
  <button type="button" onclick={() => { changed = true; }}>Update defaults</button>
  <output data-column-defaults-changes>{JSON.stringify(changes)}</output>
</section>
