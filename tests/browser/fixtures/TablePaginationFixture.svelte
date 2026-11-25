<script module lang="ts">
  // Профили воспроизводят публичные входы React и отдельный контракт bind:current/pageSize.
  import {
    ConfigProvider, Table, enUS, type ComponentSize, type TableChange, type TableColumn,
    type TablePaginationConfig, type TablePaginationPlacement, type TableProps
  } from '@woodger/antd';

  interface Profile {
    placement?: readonly TablePaginationPlacement[];
    tableSize?: ComponentSize;
    pagerSize?: ComponentSize;
    providerSize?: ComponentSize;
    direction?: 'rtl';
    sharedPrefix?: string;
    tablePrefix?: string;
    pagerPrefix?: string;
    defaultCurrent?: number;
    count?: number;
    total?: number;
    controlled?: 'accept' | 'reject';
    replaceOnPage?: boolean;
    showSizeChanger?: boolean;
    hideOnSinglePage?: boolean;
    simple?: boolean;
    quick?: boolean;
    filter?: boolean;
    disabled?: boolean;
    native?: boolean;
  }

  const profiles: Record<string, Profile> = {
    default: {},
    'top-start': { placement: ['topStart'] },
    'top-center': { placement: ['topCenter'], tableSize: 'medium' },
    'top-end': { placement: ['topEnd'], tableSize: 'large', providerSize: 'small' },
    'bottom-start': { placement: ['bottomStart'] },
    'bottom-center': { placement: ['bottomCenter'], tableSize: 'small', pagerSize: 'large' },
    'bottom-end': { placement: ['bottomEnd'] },
    'dual-rtl': {
      placement: ['bottomStart', 'topEnd'], direction: 'rtl',
      sharedPrefix: 'suite', tablePrefix: 'ledger', pagerPrefix: 'pagebook'
    },
    priority: {
      placement: ['topCenter', 'topEnd', 'none', 'bottomStart', 'bottomCenter'], defaultCurrent: 2
    },
    none: { placement: ['none'], defaultCurrent: 2 },
    'empty-placement': { placement: [], defaultCurrent: 3 },
    disabled: { disabled: true },
    zero: { count: 0 },
    'hide-single': { placement: ['topStart', 'bottomEnd'], count: 2, hideOnSinglePage: true },
    'shared-size': {
      placement: ['topStart', 'bottomEnd'], defaultCurrent: 5, showSizeChanger: true
    },
    'control-reject': {
      placement: ['topStart', 'bottomEnd'], defaultCurrent: 3,
      showSizeChanger: true, controlled: 'reject'
    },
    'control-accept': {
      placement: ['topStart', 'bottomEnd'], defaultCurrent: 3,
      showSizeChanger: true, controlled: 'accept'
    },
    'replace-on-page': {
      placement: ['topStart', 'bottomEnd'], defaultCurrent: 2, replaceOnPage: true
    },
    external: {
      placement: ['topStart', 'bottomEnd'], count: 2, total: 42, defaultCurrent: 4
    },
    'external-slice': { placement: ['topStart'], count: 7, total: 42, defaultCurrent: 2 },
    simple: { placement: ['topCenter', 'bottomCenter'], simple: true, defaultCurrent: 2 },
    'simple-reject': {
      placement: ['topStart', 'bottomEnd'], simple: true, defaultCurrent: 2, controlled: 'reject'
    },
    'filter-reset': { placement: ['topStart', 'bottomEnd'], filter: true, defaultCurrent: 3 },
    live: { placement: ['topStart', 'bottomEnd'], defaultCurrent: 2, quick: true },
    'native-bound-server': {
      placement: ['topStart', 'bottomEnd'], native: true, controlled: 'reject',
      count: 3, total: 90, defaultCurrent: 2, showSizeChanger: true
    }
  };

  interface Row { key: number; name: string; }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  let { profileId = new URLSearchParams(globalThis.location?.search).get('profile') ?? 'default' }:
    { profileId?: string; } = $props();
  const profile = untrack(() => profiles[profileId] ?? profiles.default);
  const useEditor = untrack(() => profileId === 'live');
  let placement = $state.raw(profile.placement);
  let count = $state(profile.count ?? 10);
  let pagerCurrent = $state(profile.defaultCurrent ?? 1);
  let pagerPageSize = $state(2);
  let rootCurrent = $state(4);
  let rootPageSize = $state(3);
  let rootTotal = $state(12);
  let events = $state.raw<unknown[][]>([]);
  const dataSource = $derived(Array.from({ length: count }, (_, key) => ({
    key, name: 'Record ' + key
  })));
  const column: TableColumn<Row> = {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    render: useEditor ? editor : undefined,
    filters: profile.filter ? [{ text: 'Odd', value: 'odd' }] : undefined,
    onFilter: profile.filter ? (value, row) => value === 'odd' && row.key % 2 === 1 : undefined
  };
  const pagination: TablePaginationConfig | false = $derived(profile.disabled ? false : {
    placement,
    defaultPageSize: 2,
    defaultCurrent: profile.defaultCurrent,
    ...(profile.controlled ? { current: pagerCurrent, pageSize: pagerPageSize } : {}),
    total: profile.total,
    prefixCls: profile.pagerPrefix,
    size: profile.pagerSize,
    simple: profile.simple,
    pageSizeOptions: [2, 4, 8],
    showSizeChanger: Boolean(profile.showSizeChanger),
    showQuickJumper: profile.quick,
    hideOnSinglePage: profile.hideOnSinglePage,
    showTotal,
    class: 'observed-pager-class',
    'aria-label': 'Table pages',
    classNames: { root: 'observed-pager-root' },
    styles: ({ props }) => ({
      root: '--observed-page-size:' + props.pageSize + ';--observed-pager-layer:pagination'
    }),
    onChange: readPagerRequest,
    onShowSizeChange: (previous, size) => {
      events = [...events, ['size', previous, size]];
    }
  });
  const tableProps: TableProps<Row> = $derived({
    columns: [column],
    dataSource,
    size: profile.tableSize,
    prefixCls: profile.tablePrefix,
    pagination,
    title,
    footer,
    classNames: { pagination: { root: 'observed-table-pager' } },
    styles: { pagination: { root: '--observed-pager-layer:table' } },
    onChange: readTableRequest
  });

  /** Владелец управляемого профиля принимает запрос, только если включено подтверждение. */
  function readPagerRequest(page: number, size: number) {
    events = [...events, ['page', page, size]];
    if (profile.replaceOnPage) {
      count = 3;
    }
    if (profile.controlled === 'accept') {
      pagerCurrent = page;
      pagerPageSize = size;
    }
  }

  /** Пишет публичный payload вместе с данными до разбиения на страницы. */
  function readTableRequest(change: TableChange<Row>) {
    const { action, pagination, currentDataSource } = change;
    events = [...events, [
      'table', action, pagination.current, pagination.pageSize, currentDataSource.map(row => row.key),
      ...(profile.replaceOnPage ? [pagination.total] : [])
    ]];
  }
</script>

{#snippet title(rows: readonly Row[])}Title {rows.length}{/snippet}
{#snippet footer(rows: readonly Row[])}Footer {rows.length}{/snippet}
{#snippet showTotal(total: number, [start, end]: [number, number])}{total} / {start}-{end}{/snippet}
{#snippet editor(row: Row)}
  <input aria-label={'Editor ' + row.key} defaultValue={row.name} />
{/snippet}

<section id="table-pagination-fixture" style="width:720px">
  <ConfigProvider direction={profile.direction} prefixCls={profile.sharedPrefix}
    componentSize={profile.providerSize} locale={enUS} theme={{ token: { motion: false } }}>
    {#if profile.native}
      <Table {...tableProps} mode="server" total={rootTotal}
        bind:current={rootCurrent} bind:pageSize={rootPageSize} />
      <output aria-label="Bound owner">{rootCurrent} / {rootPageSize}</output>
      <button type="button" onclick={() => { rootTotal = 0; }}>Clear total</button>
    {:else}
      <Table {...tableProps} />
    {/if}
  </ConfigProvider>
  <output aria-label="Pagination events" id="pagination-events">{JSON.stringify(events)}</output>
  <button type="button" onclick={() => { count = 3; }}>Trim rows</button>
  <button type="button" onclick={() => { count = profile.count ?? 10; }}>Restore rows</button>
  <button type="button" onclick={() => { placement = ['topCenter', 'bottomEnd']; }}>
    Center top
  </button>
  <button type="button" onclick={() => { placement = ['bottomEnd']; }}>Hide top</button>
  <button type="button" onclick={() => { placement = []; }}>Hide all</button>
  <button type="button" onclick={() => { placement = profile.placement; }}>
    Restore placement
  </button>
</section>
