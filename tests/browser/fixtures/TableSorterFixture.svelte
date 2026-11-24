<script lang="ts">
  // Сравнивает публичные настройки сортировки, видимые строки и запросы владельцу.
  import {
    ConfigProvider, Table, enUS, type TableChange, type TableColumn, type TableSortCompare,
    type TableSortOrder
  } from '@woodger/antd';
  import source from './ant-design-table-sorter-reference.json' with { type: 'json' };

  interface Row {
    key: number;
    bucket: string;
    score: number;
    items?: readonly Row[];
  }
  type ColumnKey = 'bucket' | 'id' | 'score';
  interface Setting {
    order?: string | null;
    initial?: string | null;
    directions?: readonly (string | null)[];
    priority?: number;
    remote?: boolean;
    responsive?: boolean;
    icon?: boolean;
    orderSensitive?: boolean;
  }
  interface Profile {
    id: string;
    directions?: readonly (string | null)[];
    options?: Partial<Record<ColumnKey, Setting>>;
    updated?: Partial<Record<ColumnKey, Setting>>;
    tree?: boolean;
    remote?: boolean;
  }

  let { profileId = new URLSearchParams(globalThis.location?.search).get('profile') }:
    { profileId?: string | null; } = $props();
  const profile: Profile = $derived(source.cases.find(item => item.profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  let changed = $state(false);
  let events = $state.raw<unknown[]>([]);
  const options = $derived((changed ? profile.updated : profile.options) ?? {});
  const columns = $derived(buildColumns(options));
  const data: readonly Row[] = $derived(profile.tree
    ? [{ ...source.rows[0], items: source.children }, ...source.rows.slice(1)] : source.rows);

  /** Проверяет направления из записи прогона перед передачей в типизированный Table. */
  function readOrder(value: string | null): TableSortOrder | null {
    if (value === null || value === 'ascend' || value === 'descend') {
      return value;
    }
    throw new Error(`Unknown direction ${value}`);
  }

  /** Серверная сортировка передаёт критерии владельцу даже при заданном compare. */
  function forbidComparison(): never {
    throw new Error('Table compared remote records');
  }

  /** Собирает колонки в том же порядке, что исходный React-прогон. */
  function buildColumns(settings: Partial<Record<ColumnKey, Setting>>): TableColumn<Row>[] {
    const definitions: [ColumnKey, string, keyof Row, TableSortCompare<Row>][] = [
      ['bucket', 'Bucket', 'bucket', (left, right) => left.bucket.localeCompare(right.bucket)],
      ['id', 'Id', 'key', (left, right) => left.key - right.key],
      ['score', 'Score', 'score', (left, right, order) => {
        if (settings.score?.orderSensitive && order === 'descend') {
          return left.key - right.key;
        }
        return left.score - right.score;
      }]
    ];

    return definitions.map(([key, title, dataIndex, compare]) => {
      const setting = settings[key] ?? {};
      const sorter = setting.priority === undefined ? compare : {
        multiple: setting.priority,
        compare: setting.remote ? (profile.remote ? forbidComparison : undefined) : compare
      };
      const { order, initial, directions } = setting;

      return {
        key, title, dataIndex, sorter, className: `fixture-col-${key}`,
        ...(order !== undefined ? { sortOrder: readOrder(order) } : {}),
        ...(initial !== undefined ? { defaultSortOrder: readOrder(initial) } : {}),
        sortDirections: directions?.map(readOrder),
        responsive: setting.responsive ? ['lg'] : undefined,
        sortIcon: setting.icon ? icon : undefined
      };
    });
  }

  /** Читает порядок вложенных записей в текущем наборе данных события. */
  function keysOf(rows: readonly Row[]): number[] {
    return rows.flatMap(row => [row.key, ...keysOf(row.items ?? [])]);
  }

  /** Проецирует скалярный контракт и список критериев на формат эталона. */
  function recordChange(change: TableChange<Row>) {
    const sorters = change.sorters ?? (change.sorter ? [change.sorter] : []);
    events = [...events, {
      action: change.action,
      sorters,
      rows: keysOf(change.currentDataSource)
    }];
  }
</script>

{#snippet icon({ sortOrder }: { sortOrder: TableSortOrder | null; })}
  <span data-sort-icon={sortOrder ?? 'none'}>•</span>
{/snippet}

<section data-table-sorter-fixture>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} dataSource={data} size="small" pagination={false}
      mode={profile.remote ? 'server' : 'client'} sortDirections={profile.directions?.map(readOrder)}
      expandable={profile.tree ? { childrenColumnName: 'items', defaultExpandAllRows: true }
        : undefined}
      onChange={recordChange} />
  </ConfigProvider>
  {#if profile.updated}
    <button type="button" onclick={() => { changed = true; }}>Update</button>
  {/if}
  <output data-sort-events>{JSON.stringify(events)}</output>
</section>
