<script lang="ts">
  // Использует один renderer для нативной прокрутки и handle внешнего виртуализатора.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, enUS, Table, type TableBodyRenderInfo, type TableBodyScrollHandle,
    type TableChange, type TableColumn, type TableKey, type TableRef, type TableScrollConfig,
    type TableSummaryConfig
  } from '@woodger/antd';
  import source from './ant-design-table-custom-body-reference.json';

  interface Row { key: number; name: string; rank: number; }
  interface ScrollRequest { target: TableScrollConfig; receiver: boolean; }
  type Owner = 'dom' | 'proxy' | 'standard';
  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'dom' }: { profileId?: string; } = $props();
  const profile = untrack(() => {
    const sample = source.cases.find(entry => entry.profile.id === profileId);
    return sample?.profile ?? source.cases[0].profile;
  });
  const dataSource: Row[] = Array.from({ length: profile.count ?? 20 }, (_, key) => ({
    key, rank: 21 - key, name: `Row ${key}`
  }));
  const columns: TableColumn<Row>[] = [
    { key: 'name', dataIndex: 'name', title: 'Name', width: 120, fixed: 'start' },
    {
      key: 'rank', dataIndex: 'rank', title: 'Rank', width: profile.selection ? 492 : 540,
      sorter: (left, right) => left.rank - right.rank, showSorterTooltip: false
    }
  ];
  const summary: TableSummaryConfig<Row> | undefined = profile.summary ? {
    fixed: profile.summary === 'top' || profile.summary === 'bottom' ? profile.summary : undefined,
    render: summaryRows
  } : undefined;
  const scroll = { x: 660, y: profile.y, scrollToFirstRowOnChange: profile.keep ? false : undefined };
  let owner = $state<Owner>(profile.proxy ? 'proxy' : 'dom');
  const components = $derived(owner === 'standard' ? undefined : { body: renderBody });
  let table = $state<TableRef>();
  let nativeRoot = $state<HTMLDivElement>();
  let callbackCount = $state(0);
  let requests = $state.raw<ScrollRequest[]>([]);
  let selections = $state.raw<TableKey[][]>([]);
  let changes = $state.raw<[TableChange<Row>['action'], number][]>([]);
  let notifyBodyScroll: TableBodyRenderInfo['onScroll'] | undefined;

  /** Сохраняет receiver и исходный запрос Table, затем вычисляет позицию сам. */
  function createHandle(node: HTMLElement, readPage: () => readonly Row[]): TableBodyScrollHandle {
    return {
      get scrollLeft() { return node.scrollLeft; },
      set scrollLeft(value) { node.scrollLeft = value; },
      scrollTo(target) {
        requests = [...requests, { target, receiver: this.scrollLeft === node.scrollLeft }];
        if (target.top !== undefined) {
          node.scrollTop = target.top;
          return;
        }

        const rowIndex = readPage().findIndex(row => row.key === target.key);
        if (rowIndex >= 0) {
          node.scrollTop = rowIndex * 30 + (target.offset ?? 0);
        }
      }
    };
  }

  /** Регистрирует владельца прокрутки на время работы DOM attachment. */
  function connectBody(node: HTMLElement, info: TableBodyRenderInfo, readPage: () => readonly Row[]) {
    const target = owner === 'proxy' ? createHandle(node, readPage) : node;
    const disconnect = info.ref(target);
    notifyBodyScroll = info.onScroll;
    return () => {
      disconnect();
      notifyBodyScroll = undefined;
    };
  }

  /** Сохраняет применённую страницу вместе с причиной изменения. */
  function noteChange({ action, pagination }: TableChange<Row>) {
    changes = [...changes, [action, pagination.current]];
  }

  /** Записывает результат команды в шапке на всей странице данных. */
  function noteSelection(keys: TableKey[]) {
    selections = [...selections, keys];
  }
</script>

{#snippet summaryRows()}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={profile.selection ? 3 : 2}>
        <strong data-probe-summary>Summary</strong>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

{#snippet renderBody(data: readonly Row[], info: TableBodyRenderInfo)}
  <div role="region" aria-label="Custom rows" data-probe-body
    data-scrollbar={info.scrollbarSize} data-gutter={profile.gutter ? '' : undefined}
    {@attach node => connectBody(node, info, () => data)}
    onscroll={info.onScroll} class="custom-scrollport">
    <div style="width:660px">
      <input aria-label="Editor" value="Draft"
        style={'position:absolute;'
          + 'inset-inline-end:4px;'
          + 'top:2px'} />
      {#each data as row (row.key)}
        <div data-row-key={row.key} style={'height:30px;'
          + 'line-height:30px'}>{row.name}</div>
      {/each}
    </div>
  </div>
{/snippet}

<section data-custom-body-fixture data-root-part={nativeRoot?.dataset.antTablePart}>
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} {components} {summary} {scroll} sticky={profile.sticky}
      virtual={profile.virtual} showHeader={!profile.headerless}
      rowSelection={profile.selection ? { columnWidth: 48 } : undefined}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      bind:this={table} bind:nativeElement={nativeRoot}
      onChange={noteChange} onSelectionChange={noteSelection}
      onScroll={() => { callbackCount++; }} />
  </ConfigProvider>

  {#each profile.actions as [action, value], index}
    {#if action === 'scroll'}
      {@const target = value as TableScrollConfig}
      <button type="button" data-testid={`scroll-${index}`}
        onclick={() => table?.scrollTo(target)}>Scroll {index}</button>
    {:else if action === 'signal' && typeof value === 'number'}
      <button type="button" data-testid={`signal-${index}`}
        onclick={() => notifyBodyScroll?.({ scrollLeft: value })}>Sync {index}</button>
    {/if}
  {/each}
  <button type="button" onclick={() => { owner = 'proxy'; }}>Use proxy</button>
  <button type="button" onclick={() => { owner = 'standard'; }}>Use standard body</button>
  <button type="button" onclick={() => table?.scrollTo({ top: 43 })}>Scroll to 43</button>
  <output data-probe-requests>{JSON.stringify(requests)}</output>
  <output data-probe-keys>{JSON.stringify(selections)}</output>
  <output data-probe-changes>{JSON.stringify(changes)}</output>
  <output data-probe-callbacks>{callbackCount}</output>
</section>

<style>
  section {
    width: 430px;
    position: relative;
  }
  .custom-scrollport {
    height: 135px;
    overflow: auto;
  }
  .custom-scrollport[data-gutter]::-webkit-scrollbar {
    width: 12px;
    height: 9px;
  }
</style>
