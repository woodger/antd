<script lang="ts">
  // The owner's conditions are specified by the inputs of independent profiles Table.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, enUS, Table, type TableColumn, type TableExpandable, type TableKey
  } from '@woodger/antd';
  import reference from './ant-design-table-tree-reference.json' with { type: 'json' };

  interface Row {
    key: TableKey;
    name: string;
    rank: number;
    group: string;
    disabled?: boolean;
    children?: readonly Row[];
    items?: readonly Row[];
  }
  type Branch = [TableKey, Branch[] | null];

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'automatic', editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  let profile = $derived(reference.cases.find(entry => entry.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  let expandedKeys = $state.raw<TableKey[] | undefined>(untrack(() => profile.initials));
  let acceptExpansion = $state(false);
  let disabled = $state(false);
  let events = $state.raw<unknown[][]>([]);
  let childrenColumnName = $derived<'items' | 'children'>(profile.named ? 'items' : 'children');
  let dataSource: readonly Row[] = $derived(profile.named
    ? renameChildren(reference.rows) : reference.rows);

  // Forms the entrance of the second profile with the same keys and other field of descendants.
  function renameChildren(rows: readonly Row[]): Row[] {
    return rows.map(({ children, ...row }) => children
      ? { ...row, items: renameChildren(children) } : row);
  }

  // Saves branches in a custom callback to check the processing before partitioning.
  function project(rows: readonly Row[]): Branch[] {
    return rows.map(row => {
      const children = row[childrenColumnName];
      return [row.key, children ? project(children) : null];
    });
  }

  // Verifies object links in the selection list after sorting and filtering.
  function isOriginal(record: Row, rows = dataSource): boolean {
    return rows.some(row => {
      const children = row[childrenColumnName];
      return row === record || !!children && isOriginal(record, children);
    });
  }

  /** Remembers the order of user events without changing the input records. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  let expandable = $derived<TableExpandable<Row> | undefined>(profile.automatic ? undefined : {
    childrenColumnName,
    expandedRowKeys: profile.controlled ? expandedKeys : undefined,
    defaultExpandedRowKeys: profile.controlled ? undefined : profile.initials,
    defaultExpandAllRows: profile.defaultAll,
    indentSize: profile.indent,
    expandRowByClick: profile.rowClick,
    showExpandColumn: !profile.hide,
    rowExpandable: profile.named ? () => false : undefined,
    onExpand: (open, row) => record('expand', open, row.key),
    onExpandedRowsChange: keys => {
      record('keys', keys);
      if (profile.controlled && acceptExpansion) {
        expandedKeys = keys;
      }
    }
  });
  const columns: TableColumn<Row>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name', render: nameCell },
    { key: 'rank', title: 'Rank', dataIndex: 'rank', sorter: (a, b) => a.rank - b.rank },
    {
      key: 'group', title: 'Group', dataIndex: 'group',
      filters: [{ text: 'Keep', value: 'keep' }, { text: 'Drop', value: 'drop' }],
      onFilter: (value, row) => row.group === value
    }
  ];
</script>

{#snippet nameCell(row: Row, index: number)}
  <span data-name data-render-index={index}>{row.name}</span>
  {#if editor && row.key === 'branch'}
    <input aria-label="Branch draft" name="branchDraft" value="Initial draft" />
  {/if}
{/snippet}

<section id="table-tree-fixture">
  {#if profile.controlled}
    <button id="accept" onclick={() => { acceptExpansion = true; }}>Accept expansion</button>
  {/if}
  {#if editor}
    <button id="disable-table" onclick={() => { disabled = !disabled; }}>Toggle disabled</button>
  {/if}
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ cssVar: {}, token: { motion: false } }}>
    <Table
      {dataSource}
      {columns}
      {expandable}
      {disabled}
      prefixCls={profile.prefix}
      defaultPageSize={profile.pageSize}
      pagination={profile.pageSize ? { showSizeChanger: false } : false}
      rowSelection={profile.selection ? {
        checkStrictly: !profile.linked, getCheckboxProps: row => ({ disabled: row.disabled })
      } : false}
      rowClassName={(row, index, indent) => `row-${row.key}-${index}-${indent}`}
      onChange={change => record(change.action, project(change.currentDataSource))}
      onSelectionChange={(keys, records, info) =>
        record('selection', keys, records.map(row => [row.key, isOriginal(row)]), info.type)}
    >
      {#snippet title(page)}<output id="page-data">{JSON.stringify(project(page))}</output>{/snippet}
    </Table>
  </ConfigProvider>
  <output id="tree-events">{JSON.stringify(events)}</output>
</section>
