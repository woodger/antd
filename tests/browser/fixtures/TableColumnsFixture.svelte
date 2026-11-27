<script lang="ts">
  // Applies saved profiles of UMD through public Svelte API and records events.
  import {
    ConfigProvider, enUS, Table,
    type GridBreakpoint, type TableColumnGroupType, type TableColumnType, type TableColumnsType,
    type TableFixed, type TableKey, type TableRef, type TableScrollConfig
  } from '@woodger/antd';
  import reference from './ant-design-table-columns-reference.json' with { type: 'json' };

  interface Row { key: number; name: string; rank: number; kind: string; state: string; }
  interface SourceColumn {
    key: string;
    title: string;
    dataIndex?: string;
    width?: number;
    fixed?: boolean | string;
    responsive?: readonly string[];
    sort?: boolean;
    filter?: boolean;
    children?: readonly SourceColumn[];
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'nested', editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  const profile = $derived(reference.cases.find(item => item.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  let table = $state<TableRef>();
  let hidden = $state.raw<string[]>([]);
  let events = $state.raw<unknown[][]>([]);
  let dataSource = $derived(Array.from({ length: profile.count }, (_, key): Row => ({
    key, name: `Row ${key}`, rank: profile.count - key,
    kind: key % 2 === 0 ? 'even' : 'odd', state: key % 2 === 0 ? 'Open' : 'Closed'
  })));
  let columns = $derived<TableColumnsType<Row>>(profile.columns.map(buildColumn));
  let filters = $derived(profile.id === 'responsive' ? { kind: ['even'] } : undefined);

  /** Reflects an unexpected field key in the saved profile. */
  function readField(value: string | undefined): keyof Row | undefined {
    switch (value) {
      case undefined:
      case 'key':
      case 'name':
      case 'rank':
      case 'kind':
      case 'state':
        return value;
      default:
        throw new Error(`Unknown fixture field ${value}`);
    }
  }

  /** Verifies a string of JSON before being transferred to a typed responsive. */
  function readBreakpoint(value: string): GridBreakpoint {
    switch (value) {
      case 'xs':
      case 'sm':
      case 'md':
      case 'lg':
      case 'xl':
      case 'xxl':
      case 'xxxl':
        return value;
      default:
        throw new Error(`Unknown fixture breakpoint ${value}`);
    }
  }

  /** Allows only the values of consolidation from a public contract. */
  function readFixed(value: boolean | string | undefined): TableFixed | undefined {
    if (value === undefined || typeof value === 'boolean' || value === 'start' || value === 'end') {
      return value;
    }

    throw new Error(`Unknown fixture position ${value}`);
  }

  /** Retains the differences between groups and leaves when translating the input parameters of the standard. */
  function buildColumn(item: SourceColumn): TableColumnType<Row> {
    const { key, title, dataIndex, width, fixed, responsive, sort, filter, children } = item;
    const column: TableColumnType<Row> = {
      key, title, width,
      className: `fixture-column-${key}`, hidden: hidden.includes(key),
      fixed: readFixed(fixed),
      responsive: responsive?.map(readBreakpoint),
      sorter: sort ? (first, second) => first.rank - second.rank : undefined,
      ...(filter ? {
        filters: [{ text: 'Even', value: 'even' }, { text: 'Odd', value: 'odd' }],
        onFilter: (value, row) => row.kind === value
      } : {})
    };
    if (children) {
      const group: TableColumnGroupType<Row> = { ...column, children: children.map(buildColumn) };
      return group;
    }

    return { ...column, dataIndex: readField(dataIndex),
      render: editor && key === 'name' ? nameEditor : undefined };
  }

  /** Records events in its entirety, preserving the order between actions. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** The public ref scrolls to the same key as the Source scenario. */
  function scrollTo(key: TableKey) {
    const target: TableScrollConfig = { key, align: 'start' };
    table?.scrollTo(target);
  }
</script>

{#snippet details(row: Row)}
  <div data-detail={row.key}>Details {row.key}</div>
{/snippet}

{#snippet nameEditor(row: Row)}
  {#if row.key === 0 || row.key === 4}
    <input aria-label={`Draft ${row.key}`} value="Initial draft" style="max-width:100%" />
  {:else}
    {row.name}
  {/if}
{/snippet}

<section id="table-columns-fixture" style="width:480px">
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ cssVar: {}, token: { motion: false,
      ...(profile.screenMD ? { screenMD: profile.screenMD } : {})
    } }}
  >
    <Table bind:this={table} {dataSource} {columns} {filters} size="small" bordered
      showHeader={!profile.headerless}
      virtual={profile.virtual} scroll={profile.x ? { x: profile.x, y: profile.y } : undefined}
      pagination={false} rowSelection={profile.select}
      sorter={profile.id === 'responsive' ? { columnKey: 'rank', order: 'ascend' } : undefined}
      onSelectionChange={keys => record('selection', keys)}
      expandable={profile.details ? {
        columnWidth: 46, expandedRowRender: details,
        onExpand: (expanded, row) => record('expand', expanded, row.key)
      } : undefined}
      onChange={({ action, sorter, filters, currentDataSource }) => record(
        action, sorter ? [sorter.columnKey, sorter.order] : null,
        filters ?? {}, currentDataSource.map(row => row.key)
      )}
    />
  </ConfigProvider>
  {#each profile.actions as action, index}
    {#if 'hide' in action && action.hide}
      {@const next = action.hide}
      <button type="button" data-testid={`hide-columns-${index}`} onclick={() => { hidden = next; }}>
        Hide columns {index}
      </button>
    {/if}
    {#if 'scroll' in action && action.scroll}
      {@const key = action.scroll.key}
      <button type="button" data-testid={`scroll-columns-${index}`} onclick={() => scrollTo(key)}>
        Scroll to {key}
      </button>
    {/if}
  {/each}
  <output id="table-columns-events">{JSON.stringify(events)}</output>
</section>
