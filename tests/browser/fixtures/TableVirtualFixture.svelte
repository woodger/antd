<script lang="ts">
  // Performs the same actions as Source profiles, through public methods and events Table.
  import {
    ConfigProvider, enUS, Table,
    type TableColumn, type TableExpandable, type TableKey, type TableRef,
    type TableScrollConfig
  } from '@woodger/antd';
  import reference from './ant-design-table-virtual-reference.json' with { type: 'json' };

  interface Row {
    key: TableKey;
    name: string;
    rank: number;
    end: string;
    children?: Row[];
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'fixed',
    editor = query.has('editor'),
    captioned = query.has('caption')
  }: { profileId?: string; editor?: boolean; captioned?: boolean; } = $props();
  const profile = $derived(reference.cases.find(entry => entry.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  let table = $state<TableRef>();
  let root = $state<HTMLDivElement>();
  let changes = $state.raw<unknown[][]>([]);
  let scrollCount = $state(0);
  let detailHeight = $state(101);
  let virtual = $state(true);
  let dataSource = $derived(createRows(profile.count, profile.tree));

  /** Uses the keys and the order of records from the original run rc-table. */
  function createRows(count: number, tree?: boolean) {
    return Array.from({ length: count }, (_, key): Row => {
      const row: Row = { key, rank: count - key, name: `Row ${key}`, end: `End ${key}` };
      if (tree && key === 0) {
        row.children = Array.from({ length: 20 }, (_, index) => ({
          key: `child-${index}`, rank: index, name: `Child ${index}`, end: `End child ${index}`
        }));
      }
      return row;
    });
  }

  let columns = $derived<TableColumn<Row>[]>([
    {
      key: 'name', title: 'Name', dataIndex: 'name', fixed: 'start', className: 'lead',
      width: profile.percentage ? '25%' : 140, render: nameCell
    },
    {
      key: 'rank', title: 'Rank', dataIndex: 'rank', className: 'rank',
      width: profile.percentage ? undefined : 540, sorter: (a, b) => a.rank - b.rank
    },
    {
      key: 'end', title: 'End', dataIndex: 'end', fixed: 'end', className: 'end',
      width: profile.percentage ? 100 : 160
    }
  ]);
  let expandable = $derived<TableExpandable<Row> | undefined>(profile.detail
    ? { columnWidth: 46, expandedRowRender: details }
    : profile.tree ? { defaultExpandedRowKeys: [0] } : undefined);

  /** Transmits the table the settings object the same as it came from the profile. */
  function scrollTo(target: TableScrollConfig) {
    table?.scrollTo(target);
  }
</script>

{#snippet nameCell(row: Row, index: number)}
  <span data-index={index}>{row.name}</span>
  {#if editor && row.key === 0}
    <input aria-label="Virtual draft" value="Initial draft" style="max-width:100%" />
  {/if}
{/snippet}

{#snippet details(row: Row)}
  <div data-detail={row.key} style:height={`${detailHeight}px`}>Details {row.key}</div>
{/snippet}

<section id="table-virtual-fixture" data-root-ref={root?.dataset.antTablePart}
  data-scroll-count={scrollCount} style="width:450px"
>
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ cssVar: {}, token: { motion: false }, components: {
      Table: { selectionColumnWidth: 40 }
    } }}
  >
    <Table bind:this={table} bind:nativeElement={root} {columns} {dataSource} {expandable} {virtual}
      size="small" showHeader={!profile.headerless} caption={captioned ? 'Virtual table' : undefined}
      scroll={profile.y === undefined ? undefined : {
        x: profile.x, y: profile.y, scrollToFirstRowOnChange: profile.keepScroll ? false : undefined
      }}
      defaultPageSize={profile.pageSize}
      pagination={profile.pageSize ? { showSizeChanger: false } : false}
      rowClassName={(_row, index, depth) => `user-row-${index}-${depth}`}
      rowSelection={!!profile.tree}
      onSelectionChange={keys => { changes = [...changes,
        ['selection', keys.length, keys.includes('child-19')]]; }}
      onChange={({ action }) => { changes = [...changes, [action]]; }}
      onScroll={() => { scrollCount++; }}
    />
  </ConfigProvider>

  {#each profile.actions as action, index}
    {#if action.scroll}
      {@const target = action.scroll as TableScrollConfig}
      <button type="button" data-testid={`scroll-${index}`} onclick={() => scrollTo(target)}>
        Scroll {index}
      </button>
    {/if}
  {/each}
  {#if editor}
    <button type="button" onclick={() => { virtual = !virtual; }}>Toggle virtual</button>
  {/if}
  {#if profile.detail}
    <button type="button" onclick={() => { detailHeight += 80; }}>Resize details</button>
  {/if}
  <output id="virtual-table-changes">{JSON.stringify(changes)}</output>
</section>
