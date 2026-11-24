<script lang="ts">
  import {
    ConfigProvider, enUS, Table,
    type TableColumn, type TableRef, type TableScrollConfig, type TableSticky
  } from '@woodger/antd';
  import reference from './ant-design-table-summary-reference.json' with { type: 'json' };

  interface Row {
    key: number;
    name: string;
    rank: number;
    status: string;
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'current-page',
    editor = false
  }: { profileId?: string; editor?: boolean; } = $props();

  const profile = $derived(reference.cases.find(entry => entry.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  const withServices = query.has('services');
  const extraColumns = withServices ? 2 : 0;
  const filterEven = query.has('filter');
  const theme = {
    token: { motion: false },
    components: query.has('bar-theme')
      ? { Table: { stickyScrollBarBg: '#0c2238', stickyScrollBarBorderRadius: 4 } }
      : undefined
  };
  const data = $derived(Array.from({ length: query.has('empty') ? 0 : profile.count }, (_, key) => ({
    key, name: `Row ${key}`, rank: profile.count - key, status: `Status ${key}`
  })));
  const columns: TableColumn<Row>[] = [
    { key: 'name', dataIndex: 'name', title: 'Name', width: 120, fixed: 'start' },
    {
      key: 'rank',
      dataIndex: 'rank',
      title: 'Rank',
      width: 360,
      sorter: (left, right) => left.rank - right.rank,
      ...(filterEven ? {
        filters: [{ text: 'Even', value: true }],
        onFilter: (_value, row) => row.key % 2 === 0
      } : {})
    },
    { key: 'status', dataIndex: 'status', title: 'Status', width: 180, fixed: 'end' }
  ];

  let table = $state<TableRef>();
  let owner = $state<HTMLDivElement>();
  let enabled = $state(true);
  const sticky = $derived<TableSticky | undefined>(profile.sticky && enabled ? {
    offsetHeader: 34,
    offsetSummary: Number(query.get('summary-offset')),
    offsetScroll: 15,
    getContainer: profile.container ? () => owner : undefined
  } : undefined);
  const targets = $derived(profile.actions.flatMap<TableScrollConfig>(action => {
    if (!('scroll' in action) || !action.scroll) {
      return [];
    }

    const { key, align } = action.scroll;
    return [{ key, align: align === 'start' ? 'start' : 'end' }];
  }));
</script>

{#snippet summaryRows(page: readonly Row[])}
  {@const keys = page.map(row => row.key)}
  {@const total = page.reduce((sum, row) => sum + row.rank, 0)}
  <Table.Summary>
    <Table.Summary.Row data-summary-keys={JSON.stringify(keys)}>
      {#if withServices}
        <Table.Summary.Cell index={0} colSpan={2}>Controls</Table.Summary.Cell>
      {/if}
      <Table.Summary.Cell index={extraColumns} data-summary-label>Total</Table.Summary.Cell>
      <Table.Summary.Cell index={extraColumns + 1} align="right">
        {total}
        {#if editor}
          <input aria-label="Summary draft" value="Initial draft" style="max-width:80px" />
        {/if}
      </Table.Summary.Cell>
      <Table.Summary.Cell index={extraColumns + 2}>{page.length}</Table.Summary.Cell>
    </Table.Summary.Row>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={extraColumns + 2}>Page</Table.Summary.Cell>
      <Table.Summary.Cell index={extraColumns + 2}>{keys.at(-1) ?? '-'}</Table.Summary.Cell>
    </Table.Summary.Row>
    {#if query.has('tall')}
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={3}>
          <div style="height:240px">Long summary</div>
          <button type="button">Last summary control</button>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    {/if}
  </Table.Summary>
{/snippet}

{#snippet details(row: Row)}Details {row.key}{/snippet}

{#snippet sample()}
  <div class="summary-table">
    <ConfigProvider locale={enUS} {theme} direction={profile.rtl ? 'rtl' : 'ltr'}>
      <Table
        bind:this={table}
        dataSource={data}
        {columns}
        size="small"
        prefixCls={query.get('prefix') ?? undefined}
        summary={profile.fixed
          ? { fixed: profile.fixed === 'top' ? 'top' : true, render: summaryRows }
          : summaryRows}
        {sticky}
        showHeader={!profile.headerless}
        virtual={profile.virtual}
        pagination={profile.pageSize ? { showSizeChanger: false } : false}
        defaultPageSize={profile.pageSize}
        scroll={profile.x ? { x: profile.x, y: profile.y } : undefined}
        filters={filterEven ? { rank: [true] } : undefined}
        rowSelection={withServices ? { fixed: true } : false}
        expandable={withServices ? { fixed: true, columnWidth: 40, expandedRowRender: details }
          : undefined}
      />
    </ConfigProvider>
  </div>
{/snippet}

<section id="table-summary-fixture">
  {#if profile.container}
    <div id="summary-owner" bind:this={owner}>{@render sample()}</div>
  {:else}
    {@render sample()}
  {/if}
  <div class="summary-controls">
    {#each targets as target, index}
      <button type="button" data-testid={`summary-scroll-${index}`}
        onclick={() => table?.scrollTo(target)}>Scroll to {target.key}</button>
    {/each}
    {#if profile.sticky}
      <button type="button" aria-pressed={enabled} onclick={() => { enabled = !enabled; }}>
        Sticky
      </button>
    {/if}
  </div>
</section>

<style>
  #table-summary-fixture {
    display: flow-root;
    min-height: 1800px;
    padding-inline: 8px;
  }

  #summary-owner {
    width: 600px;
    height: 350px;
    margin-block-start: 8px;
    overflow: auto;
  }

  .summary-table {
    width: 440px;
    margin-block-start: 170px;
  }

  .summary-controls {
    position: fixed;
    inset-block-start: 0;
    inset-inline-end: 0;
  }
</style>
