<script lang="ts">
  // Starts the same data and column settings through the public package Svelte.
  import {
    ConfigProvider, enUS, Table, type TableColumn, type TableColumnsType, type TableDataIndex,
    type TableLayout
  } from '@woodger/antd';
  import source from './ant-design-table-column-layout-reference.json' with { type: 'json' };

  interface Row {
    key: number;
    name: string;
    score: number;
    team: string;
    'person.name': string;
    person: { name: string; total: number; active: boolean; empty: string; } | null;
    items: { name: string; }[];
    0: string;
    '': string;
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'ellipsis', editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  const profile = $derived(source.cases.find(sample => sample.profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  let hidden = $state(false);
  let clipName = $state(true);
  let layoutOverride = $state<TableLayout>();
  let layout = $derived(layoutOverride
    ?? (profile.layout === 'auto' || profile.layout === 'fixed' ? profile.layout : undefined));
  const columns = $derived<TableColumnsType<Row>>(profile.id === 'paths'
    ? pathColumns() : sizedColumns());
  const dataSource = $derived(makeRows());

  /** An empty container in the middle of the path and the false values remain discernible. */
  function makeRows(): Row[] {
    if (profile.empty) return [];

    const count = profile.virtual ? 32 : 2;
    return Array.from({ length: count }, (_, key) => ({
      key,
      name: profile.clip ? `${source.long}-${key}` : `Row ${key}`,
      score: key,
      team: profile.clip ? `Team-${source.long}-${key}` : `Team ${key}`,
      'person.name': `Literal ${key}`,
      person: key === 0 ? { name: 'Nested person', total: 0, active: false, empty: '' } : null,
      items: key === 0 ? [{ name: 'Array item' }] : [],
      0: `Numeric key ${key}`,
      '': `Empty key ${key}`
    }));
  }

  /** Transmits typed keys and readonly paths from the table holder. */
  function pathColumns(): TableColumn<Row>[] {
    const entries: readonly (readonly [string, TableDataIndex<Row>])[] = [
      ['literal', 'person.name'],
      ['nested', ['person', 'name']],
      ['array', ['items', 0, 'name']],
      ['zero', ['person', 'total']],
      ['flag', ['person', 'active']],
      ['empty', ['person', 'empty']],
      ['number', 0],
      ['raw', ['person', 'active']],
      ['root', []],
      ['empty-key', '']
    ];
    return entries.map(([key, dataIndex]) => ({
      key, title: key, dataIndex, width: 125, className: `fixture-col-${key}`,
      render: key === 'raw' || key === 'root' ? rawValue : undefined
    }));
  }

  /** Saves the keys when changing ellipsis, layout and visibility. */
  function sizedColumns(): TableColumn<Row>[] {
    const clipAll = profile.clip && profile.id !== 'hidden-ellipsis';
    return [
      {
        key: 'name', title: profile.clip ? source.longTitle : 'Name', dataIndex: 'name',
        width: 96, minWidth: profile.min, ellipsis: profile.clip && clipName,
        fixed: profile.pin ? 'start' : undefined, className: 'fixture-col-name', hidden,
        align: profile.align ? 'start' : undefined,
        sorter: profile.sort ? (left, right) => right.key - left.key : undefined,
        render: editor ? nameEditor : undefined
      },
      {
        key: 'score', title: profile.clip ? `Score-${source.longTitle}` : 'Score',
        dataIndex: 'score', width: 82, className: 'fixture-col-score',
        ellipsis: clipAll ? { showTitle: false } : undefined,
        onHeaderCell: () => ({ title: '' }), align: profile.align ? 'end' : undefined
      },
      {
        key: 'team', title: 'Team', dataIndex: 'team', width: 148,
        className: 'fixture-col-team', ellipsis: clipAll ? {} : undefined,
        onCell: row => row.key === 0 && profile.id === 'ellipsis' ? { title: 'Manual title' } : {},
        align: profile.align ? 'justify' : undefined
      }
    ];
  }
</script>

{#snippet rawValue(record: Row, index: number, value: unknown)}
  {index}:{record.key}:{value === record ? 'same record' : String(value)}
{/snippet}

{#snippet nameEditor(row: Row)}
  {#if row.key === 0}
    <input aria-label="Column editor" value="Initial text" style={'max-width:100%;'
      + 'width:70px'} />
  {:else}
    {row.name}
  {/if}
{/snippet}

<section id="table-column-layout-fixture" style="width:384px">
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ cssVar: {}, token: { motion: false } }}
  >
    <Table {columns} {dataSource} pagination={false} showHeader={!profile.headerless}
      size="small" virtual={profile.virtual} sticky={profile.sticky}
      tableLayout={layout} prefixCls={profile.prefix}
      scroll={profile.id === 'paths' ? { x: 1250 }
        : profile.x !== undefined || profile.y !== undefined
          ? { x: profile.x, y: profile.y } : undefined}
    />
  </ConfigProvider>
  {#if profile.id === 'hidden-ellipsis'}
    <button type="button" onclick={() => { hidden = true; }}>Hide ellipsis column</button>
    <button type="button" onclick={() => { hidden = false; }}>Show ellipsis column</button>
  {/if}
  {#if editor}
    <button type="button" onclick={() => { clipName = !clipName; }}>Toggle ellipsis</button>
    <button type="button" onclick={() => { layoutOverride = 'auto'; }}>Use auto layout</button>
  {/if}
</section>
