<script lang="ts">
  // Наблюдает разрешённый ключ в DOM, привязках и событиях сортировки и фильтра.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type TableChange, type TableColumnDefaults, type TableColumnInput,
    type TableDataIndex, type TableFilters, type TableSorter
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-column-key-reference.json';

  interface Row { key: string; label: string; metrics: { rank: number; }; 0: string; '': string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'literal-field',
    virtual = query.has('virtual'),
    editor = query.has('editor')
  }: { profileId?: string; virtual?: boolean; editor?: boolean; } = $props();
  const profile = untrack(() => source.cases
    .find(({ profile }) => profile.id === profileId && profile.virtual === virtual)?.profile
    ?? source.cases[0].profile);
  const records: readonly Row[] = [
    { key: 'a', label: 'Zulu', metrics: { rank: 3 }, 0: 'Z', '': 'ZA' },
    { key: 'b', label: 'Alpha', metrics: { rank: 1 }, 0: 'A', '': 'AB' },
    { key: 'c', label: 'Bravo', metrics: { rank: 2 }, 0: 'B', '': 'BC' }
  ];
  const dataIndex = readIndex(profile.dataIndex);
  const shared: TableColumnDefaults<Row> | undefined = profile.shared && {
    key: profile.shared.key, dataIndex: readIndex(profile.shared.dataIndex)
  };
  const effectiveIndex = dataIndex ?? shared?.dataIndex;
  const rendersRecord = effectiveIndex === undefined
    || Array.isArray(effectiveIndex) && !effectiveIndex.length;
  let hidePeer = $state(false);
  let sorter = $state<TableSorter | null>();
  let filters = $state.raw<TableFilters>();
  let changes = $state.raw<{
    action: TableChange<Row>['action']; filters: TableFilters; sorter: TableSorter | null;
    rows: string[];
  }[]>([]);
  const columns = $derived(buildColumns(editor, hidePeer));

  /** Читает поля закреплённого стенда, включая нулевое и пустое имя свойства. */
  function readIndex(
    index: string | number | (string | number)[] | undefined
  ): TableDataIndex<Row> | undefined {
    if (Array.isArray(index) || index === 'label' || index === '' || index === 0) {
      return index;
    }
    if (index !== undefined) {
      throw new Error('Unknown column key profile field');
    }
    return index;
  }

  /** Сравнивает записи по полю исходного профиля. */
  function readValue(record: Row) {
    if (Array.isArray(effectiveIndex)) {
      return rendersRecord ? record.label : record.metrics.rank;
    }
    return effectiveIndex === 0 || effectiveIndex === '' ? record[effectiveIndex] : record.label;
  }

  /** Добавляет видимого соседа, группу или скрытое определение по данным Source. */
  function buildColumns(editable: boolean, hidden: boolean): readonly TableColumnInput<Row>[] {
    const target: TableColumnInput<Row> = {
      key: profile.key, title: 'Probe column', dataIndex,
      showSorterTooltip: false,
      sorter: (left, right) => String(readValue(left)).localeCompare(String(readValue(right)), 'en'),
      render: editable ? draft : rendersRecord ? label : undefined,
      filters: [{ text: 'Keep record A', value: 'a' }],
      onFilter: (value, record) => record.key === value,
      onHeaderCell: column => ({ 'data-probe-title': 'column', 'data-probe-key': column.key }),
      onCell: () => ({ 'data-probe-cell': 'column' })
    };
    if (profile.group) {
      return [
        { key: 'identity', title: 'Identity', dataIndex: 'key' },
        ...(profile.hiddenBefore ? [{ key: 'hidden', hidden: true }] : []),
        { title: 'Group', children: [target] }
      ];
    }
    if (profile.collision) {
      return [target, {
        key: profile.collision === 'explicit' ? 'label' : undefined,
        title: 'Peer column', dataIndex: 'label', sorter: target.sorter,
        showSorterTooltip: false, hidden,
        onHeaderCell: column => ({ 'data-probe-title': 'peer', 'data-probe-key': column.key })
      }];
    }
    return [target];
  }

  /** Записывает публичное событие отдельно от текущей строки DOM. */
  function recordChange(change: TableChange<Row>) {
    changes = [...changes, {
      action: change.action, filters: change.filters ?? {}, sorter: change.sorter,
      rows: change.currentDataSource.map(record => record.key)
    }];
  }

  /** Применяет внешние настройки к выведенному ключу вложенного поля. */
  function applyOwnerState() {
    sorter = { columnKey: 'metrics.rank', order: 'descend' };
    filters = { 'metrics.rank': ['a'] };
  }
</script>

{#snippet label(record: Row)}{record.label}{/snippet}

{#snippet draft(record: Row)}
  {#if record.key === 'a'}<input aria-label="Cell draft" defaultValue={record.label} />{:else}{record.label}{/if}
{/snippet}

<section id="table-column-keys-fixture">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} column={shared} dataSource={records} {virtual} pagination={false}
      scroll={virtual ? { x: 450, y: 180 } : undefined}
      bind:sorter bind:filters onChange={recordChange} />
  </ConfigProvider>
  <button type="button" onclick={() => { hidePeer = !hidePeer; }}>Toggle peer</button>
  <button type="button" onclick={applyOwnerState}>Set bound sort and filter</button>
  <output data-probe-events>{JSON.stringify(changes)}</output>
  <output data-probe-sorter>{JSON.stringify(sorter ?? null)}</output>
  <output data-probe-filters>{JSON.stringify(filters ?? {})}</output>
</section>

<style>
  section { width: 520px; }
  input { max-width: 100%; }
</style>
