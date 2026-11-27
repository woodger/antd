<script lang="ts">
  // Repeats the inputs and action login of independent Ant Design profiles.
  import type { Snippet } from 'svelte';
  import {
    ConfigProvider, enUS, Table,
    type TableColumn, type TableColumnsType, type TableKey, type TableRef, type TableRowSelection
  } from '@woodger/antd';
  import source from './ant-design-table-service-columns-reference.json' with { type: 'json' };

  interface Row { key: number; name: string; team: string; state: string; children?: Row[]; }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'placed', layout = query.has('layout')
  }: { profileId?: string; layout?: boolean; } = $props();
  const profile = $derived(source.cases.find(sample => sample.profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  const markers = $state({ select: Table.SELECTION_COLUMN, expand: Table.EXPAND_COLUMN });
  const dataSource = $derived(createData(profile.virtual ? 30 : 3, !!profile.tree));
  const columns = $derived<TableColumnsType<Row>>(profile.order.map(resolveColumn));
  let table = $state<TableRef>();
  let events = $state.raw<unknown[][]>([]);
  let unpin = $state(false);
  let showHeader = $state(true);

  const rowSelection = $derived<TableRowSelection<Row> | false>(profile.select === false ? false : {
    type: profile.radio ? 'radio' : 'checkbox',
    columnWidth: 72,
    fixed: unpin ? false : undefined,
    hideSelectAll: profile.hideTitle,
    selections: profile.menu,
    columnTitle: profile.title === 'wrap' ? wrappedTitle
      : profile.title === 'text' ? 'Choose' : undefined,
    renderCell: profile.render ? wrappedCell : undefined,
    getTitleCheckboxProps: () => ({ 'aria-label': 'Choose page' }),
    getCheckboxProps: row => ({ 'aria-label': `Choose ${row.key}` }),
    onSelect: (row, checked) => record('select', row.key, checked),
    onChange: (keys, rows, { type }) => record('change', type, keys, rows.map(row => row.key)),
    onCell: selectionCell
  });

  /** The tree adds a separate index among neighbors for renderCell. */
  function createData(count: number, tree: boolean): Row[] {
    const records: Row[] = Array.from({ length: count }, (_, key) => ({
      key, name: `Name ${key}`, team: `Team ${key}`, state: `State ${key}`
    }));
    if (tree) {
      records[0].children = [{ key: 3, name: 'Child 3', team: 'Child team', state: 'Child state' }];
    }
    return records;
  }

  /** Transmits service markers from a reactive container along with data columns. */
  function resolveColumn(id: string): TableColumn<Row> {
    switch (id) {
      case '$select':
        return markers.select;
      case '$expand':
        return markers.expand;
      case 'name':
        return {
          key: 'selection', title: 'Name', dataIndex: 'name', width: 148,
          className: 'fixture-col-name'
        };
      case 'team':
        return {
          key: 'expand', title: 'Team', dataIndex: 'team', width: 142,
          className: 'fixture-col-team',
          onCell: profile.span ? (_, index) => index === 2 ? { colSpan: 0 } : {} : undefined
        };
      case 'state':
        return {
          key: 'state', title: 'State', dataIndex: 'state', width: 132,
          className: 'fixture-col-state', fixed: profile.pin === 'end' ? 'end' : undefined
        };
      case 'group':
        return {
          key: 'group', title: 'People', className: 'fixture-col-group',
          fixed: profile.pinGroup ? 'start' : undefined,
          children: [resolveColumn('name'), resolveColumn('team')]
        };
      default:
        throw new Error(`Unknown service column fixture field ${id}`);
    }
  }

  /** Changes spans only at the first three rows, saving the logical index of the table. */
  function selectionCell(row: Row, index: number) {
    return {
      'data-choice': `${row.key}:${index}`,
      onclick: () => record('cell', row.key, index),
      onmouseenter: layout ? () => record('enter', row.key, index) : undefined,
      ...(profile.span && index === 0 ? { rowSpan: 2 } : {}),
      ...(profile.span && index === 1 ? { rowSpan: 0 } : {}),
      ...(profile.span && index === 2 ? { colSpan: 2 } : {})
    };
  }

  /** Adds the accepted events to the observed journal without reference to Svelte internals. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** Scrolls through a public ref, including a return to a string with a span. */
  function scrollTo(key: TableKey) {
    table?.scrollTo({ key, align: 'start' });
  }
</script>

{#snippet wrappedTitle(origin: Snippet | undefined)}
  <span data-title={origin ? 'control' : 'none'}>{#if origin}{@render origin()}Page{:else}Radio{/if}</span>
{/snippet}

{#snippet wrappedCell(checked: boolean, row: Row, index: number, origin: Snippet)}
  {@const state = `${row.key}:${index}:${Number(checked)}`}
  <span data-render={state}>{#if profile.render === 'replace'}Option {state}{:else}{@render origin()}{/if}</span>
{/snippet}

{#snippet detailsTitle()}<span data-detail-title="custom">Details</span>{/snippet}

{#snippet details(row: Row)}<div data-detail={row.key}>Details {row.key}</div>{/snippet}

{#snippet totals()}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={2}>People totals</Table.Summary.Cell>
      <Table.Summary.Cell index={2}>Details total</Table.Summary.Cell>
      <Table.Summary.Cell index={3} colSpan={2}>Selection total</Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

<section id="table-service-columns-fixture" style="width:450px">
  <ConfigProvider direction={profile.rtl ? 'rtl' : 'ltr'} locale={enUS}
    theme={{ cssVar: {}, token: { motion: false } }}
  >
    <Table bind:this={table} {dataSource} {columns} {rowSelection} {showHeader}
      size="small" pagination={false} rowHoverable={!layout}
      virtual={profile.virtual} scroll={profile.x
        ? { x: profile.x, y: profile.virtual ? 136 : undefined } : undefined}
      summary={layout ? totals : undefined}
      expandable={profile.details || profile.tree ? {
        columnTitle: detailsTitle,
        columnWidth: 64,
        fixed: profile.expandFixed === 'end' ? 'end' : undefined,
        showExpandColumn: !profile.hideExpand,
        expandedRowRender: profile.details ? details : undefined,
        onExpand: (expanded, row) => record('expand', expanded, row.key)
      } : undefined}
    />
  </ConfigProvider>
  {#if profile.virtual}
    <button type="button" onclick={() => scrollTo(12)}>Scroll to row 12</button>
    <button type="button" onclick={() => scrollTo(0)}>Scroll to row 0</button>
  {/if}
  {#if layout}
    <button type="button" onclick={() => { unpin = !unpin; }}>Toggle selection pin</button>
    <button type="button" onclick={() => { showHeader = !showHeader; }}>Toggle header</button>
  {/if}
  <output id="table-service-column-events">{JSON.stringify(events)}</output>
</section>
