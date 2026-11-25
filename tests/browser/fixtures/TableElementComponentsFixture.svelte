<script lang="ts">
  // Помечает границы заменённых элементов, передавая штатные attrs и ref.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type TableColumn, type TableComponents,
    type TableElementRenderInfo, type TableRef, type TableSummaryConfig
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-element-components-reference.json';

  interface Row { key: number; value: string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'single',
    editor = query.has('editor'),
    stringTag = query.has('string-tag')
  }: { profileId?: string; editor?: boolean; stringTag?: boolean; } = $props();
  const profile = untrack(() => {
    const sample = source.cases.find(({ profile }) => profile.id === profileId);
    return sample?.profile ?? source.cases[0].profile;
  });
  const rows: Row[] = Array.from({ length: profile.count }, (_, key) => ({
    key, value: `Row ${key}`
  }));
  const columns = $derived<TableColumn<Row>[]>([
    {
      title: 'Name', key: 'value', dataIndex: 'value', width: 170, rowScope: 'row',
      onCell: record => ({ 'data-probe-data': `value-${record.key}` }),
      onHeaderCell: () => ({ 'data-probe-data': 'header-name' }),
      sorter: (left, right) => right.key - left.key, showSorterTooltip: false
    },
    {
      title: 'ID', key: 'key', dataIndex: 'key', width: 120,
      onCell: record => ({ 'data-probe-data': `key-${record.key}` }),
      render: editor && stringTag ? stringEditor : undefined
    }
  ]);
  let table = $state<TableRef>();
  let root = $state<HTMLDivElement>();
  let events = $state.raw<unknown[][]>([]);
  let compact = $state(false);
  let useAlternateRow = $state(false);
  const components = $derived<TableComponents<Row>>({
    table: rootTable,
    header: { table: headerTable, wrapper: headerWrapper, row: headerRow, cell: headerCell },
    body: {
      wrapper: bodyWrapper,
      row: useAlternateRow ? alternateRow : bodyRow,
      cell: stringTag ? 'th' : bodyCell
    }
  });
  const summary: TableSummaryConfig<Row> | undefined = profile.fixed || profile.sticky
    ? { fixed: 'bottom', render: summaryRows } : undefined;

  /** Привязывает публичный DOM row callback к конкретной записи. */
  function noteRow(record: Row, index: number) {
    return {
      'data-probe-data': index,
      onclick: () => { events = [...events, ['row', record.key]]; }
    };
  }
</script>

{#snippet stringEditor(row: Row)}
  {#if row.key === 0}<input aria-label="Row editor" value="Initial draft" />{:else}{row.key}{/if}
{/snippet}

{#snippet rootTable({ attributes, children, ref }: TableElementRenderInfo<'table'>)}
  <table {...attributes} data-probe-slot="table" {@attach ref}>{@render children()}</table>
{/snippet}

{#snippet headerTable({ attributes, children, ref }: TableElementRenderInfo<'table'>)}
  <table {...attributes} data-probe-slot="header.table" {@attach ref}>{@render children()}</table>
{/snippet}

{#snippet headerWrapper({ attributes, children, ref }: TableElementRenderInfo<'thead'>)}
  <thead {...attributes} data-probe-slot="header.wrapper" {@attach ref}>{@render children()}</thead>
{/snippet}

{#snippet headerRow({ attributes, children, ref }: TableElementRenderInfo<'tr'>)}
  <tr {...attributes} data-probe-slot="header.row" {@attach ref}>{@render children()}</tr>
{/snippet}

{#snippet headerCell({ attributes, children, ref }: TableElementRenderInfo<'th'>)}
  <th {...attributes} data-probe-slot="header.cell" {@attach ref}>{@render children()}</th>
{/snippet}

{#snippet bodyWrapper({ attributes, children, ref }: TableElementRenderInfo<'tbody'>)}
  <tbody {...attributes} data-probe-slot="body.wrapper" {@attach ref}>{@render children()}</tbody>
{/snippet}

{#snippet bodyRow({ attributes, children, ref }: TableElementRenderInfo<'tr'>)}
  <tr {...attributes} data-probe-slot="body.row" {@attach ref}>{@render children()}</tr>
{/snippet}

{#snippet alternateRow({ attributes, children, ref }: TableElementRenderInfo<'tr'>)}
  <tr {...attributes} data-probe-slot="body.row" data-alternate-row style:height="84px" {@attach ref}>
    {@render children()}
  </tr>
{/snippet}

{#snippet bodyCell({ tag, attributes, children, ref }: TableElementRenderInfo<'td' | 'th'>)}
  {#if tag === 'th'}
    <th {...attributes} data-probe-slot="body.cell" {@attach ref}>
      {@render children()}
      {#if editor && attributes['data-probe-data'] === 'value-0'}
        <input aria-label="Row editor" value="Initial draft" />
      {/if}
    </th>
  {:else}
    <td {...attributes} data-probe-slot="body.cell" {@attach ref}>{@render children()}</td>
  {/if}
{/snippet}

{#snippet summaryRows()}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={2}>Sum</Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

<section data-table-elements-fixture data-root-part={root?.dataset.antTablePart}>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table dataSource={rows} {columns} {components} {summary} bind:this={table}
      bind:nativeElement={root} pagination={false} showHeader={!profile.hideHeader}
      scroll={profile.fixed ? { x: profile.width ?? 360, y: compact ? 70 : 128 } : undefined}
      virtual={profile.virtual} sticky={profile.sticky} onRow={noteRow}
      onHeaderRow={(_columns, index) => ({ 'data-probe-data': `heading-${index}` })}
      onChange={({ action }) => { events = [...events, [action]]; }} />
  </ConfigProvider>
  <button type="button" onclick={() => table?.scrollTo({ index: 32, align: 'start' })}>
    Scroll to 32
  </button>
  <button type="button" onclick={() => { useAlternateRow = true; }}>Replace renderer</button>
  <button type="button" onclick={() => { compact = true; }}>Resize viewport</button>
  <output data-table-element-events>{JSON.stringify(events)}</output>
</section>

<style>
  section { width: 420px; }
  input { max-width: 100%; }
</style>
