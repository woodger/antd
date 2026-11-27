<script lang="ts">
  // Compares the native attributes of strings and events with independent measurements of UMD.
  import {
    ConfigProvider, enUS, Table, type TableColumn, type TableExpandable, type TableKey,
    type TableRef, type TableRowProps
  } from '@woodger/antd';
  import source from './ant-design-table-row-attributes-reference.json' with { type: 'json' };

  interface Row { key: number; name: string; rank: number; children?: Row[]; }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'flat', editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  const profile = $derived(source.cases.find(item => item.profile.id === profileId)?.profile
    ?? source.cases[0].profile);

  let revision = $state(0);
  let hideLeaf = $state(false);
  let hideGroup = $state(false);
  let showHeader = $state(true);
  let enableHooks = $state(true);
  let events = $state.raw<unknown[][]>([]);
  let table = $state<TableRef>();
  const records = $derived(makeRows());
  const columns = $derived(makeColumns());
  const expandable = $derived<TableExpandable<Row> | undefined>(profile.tree || profile.details
    ? {
      expandRowByClick: true,
      defaultExpandedRowKeys: profile.expanded ? [0, 100] : undefined,
      expandedRowRender: profile.details ? details : undefined,
      rowExpandable: row => row.key !== 1,
      onExpand: (expanded, row) => record('expand', row.key, expanded),
      onExpandedRowsChange: keys => record('keys', keys)
    } : undefined);

  /** Creates the same set or server page with source keys. */
  function makeRows(): Row[] {
    if (profile.empty) return [];

    const count = profile.virtual ? 36 : profile.paging ? 6 : profile.server ? 2 : 3;
    const rows: Row[] = Array.from({ length: count }, (_, index) => {
      const key = profile.server ? index + 10 : index;
      return { key, name: `Name ${key}`, rank: key };
    });
    if (profile.tree) {
      rows[0].children = [{
        key: 100, name: 'Nested 100', rank: 100,
        children: [{ key: 101, name: 'Nested 101', rank: 101 }]
      }];
    }
    return rows;
  }

  /** Preparing the original tree. Visibility filtration is performed by Table. */
  function makeColumns(): TableColumn<Row>[] {
    const name: TableColumn<Row> = {
      key: 'name', title: 'Name', dataIndex: 'name', className: 'fixture-name', width: 180,
      hidden: !!profile.allHidden, render: editor ? nameEditor : undefined,
      onCell: profile.spans ? row => row.key === 0 ? { rowSpan: 2 }
        : row.key === 1 ? { rowSpan: 0 } : {} : undefined
    };
    const rank: TableColumn<Row> = {
      key: 'rank', title: 'Rank', dataIndex: 'rank', className: 'fixture-rank', width: 160,
      hidden: hideLeaf || !!profile.allHidden
    };
    if (!profile.group) return [name, rank];

    return [
      { key: 'person', title: 'Person', children: [name, rank], hidden: hideGroup,
        fixed: profile.fixed, responsive: profile.responsive ? ['md'] : undefined,
        className: 'fixture-person' },
      Table.SELECTION_COLUMN,
      { key: 'tail', title: 'Tail', dataIndex: 'rank', className: 'fixture-tail', width: 150 }
    ];
  }

  /** Denotes groups with visible children and the real positions of the service columns. */
  function columnNames(columns: readonly TableColumn<Row>[]): string[] {
    return columns.map(column => {
      const className = column.className ?? '';
      if (className.includes('-selection-column')) return '$select';
      if (className.includes('-row-expand-icon-cell')) return '$expand';
      if (!column.key) return '$anonymous';
      const children = column.children;
      return children?.length ? `${column.key}(${columnNames(children).join(',')})` : column.key;
    });
  }

  /** Maintains the order of events and the exact currentTarget on the boundary of the line. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** Ties each handler to the received index and current revision. */
  function configureRow(row: Row, index: number): TableRowProps {
    const current = revision;
    const recordEvent = (kind: string, event: Event & { currentTarget: HTMLTableRowElement; }) =>
      record(kind, row.key, index, current, event.currentTarget.id, event.defaultPrevented);

    return {
      id: `body-${row.key}`, 'data-row-key': `caller-${row.key}`,
      'data-row-attrs': `${index}:${current}`, 'aria-label': `Body ${row.key}`, tabindex: 0,
      class: `fixture-row-${current}`, style: `--fixture-row-color: color-${current}`,
      onclick: event => recordEvent('row', event),
      ondblclick: event => recordEvent('double', event),
      oncontextmenu: event => {
        event.preventDefault();
        recordEvent('context', event);
      },
      onkeydown: event => recordEvent(event.key, event),
      onmouseenter: event => {
        if (profile.id === 'flat' && row.key === 0) {
          event.currentTarget.dataset.entered = 'true';
        }
      },
      onmouseleave: event => {
        if (row.key === 0) delete event.currentTarget.dataset.entered;
      }
    };
  }

  /** Records a list of definitions of exactly the level to which tr is attached. */
  function configureHeader(columns: readonly TableColumn<Row>[], index: number): TableRowProps {
    const signature = columnNames(columns).join('|');
    const current = revision;
    return {
      id: `head-${index}`, 'data-head-attrs': `${index}:${current}:${signature}`,
      'aria-label': `Header ${index}`, tabindex: 0,
      class: `fixture-head-${current}`, style: `--fixture-head-color: head-${current}`,
      onclick: event => record('head', index, current, signature, event.currentTarget.id),
      onkeydown: event => record(event.key, index, current, signature, event.currentTarget.id)
    };
  }

  /** Scrolls the current visible page on the key through public ref. */
  function scrollTo(key: TableKey) {
    table?.scrollTo({ key, align: 'start' });
  }
</script>

{#snippet nameEditor(row: Row)}
  {#if row.key === 0}
    <input aria-label="Row editor" value="Initial draft" />
  {:else}
    {row.name}
  {/if}
{/snippet}

{#snippet details(row: Row)}
  <p data-detail={row.key}>Details {row.key}</p>
{/snippet}

<section id="table-row-attributes-fixture" style="width:520px">
  <ConfigProvider direction={profile.rtl ? 'rtl' : 'ltr'} locale={enUS}
    theme={{ cssVar: {}, token: { motion: false } }}
  >
    <Table bind:this={table} {columns} dataSource={records} {showHeader} {expandable}
      onRow={enableHooks ? configureRow : undefined}
      onHeaderRow={enableHooks ? configureHeader : undefined}
      rowClassName="fixture-base" rowHoverable={false} size="small"
      rowSelection={profile.selection} sticky={profile.fixed} virtual={profile.virtual}
      scroll={profile.virtual ? { x: 460, y: 152 }
        : profile.fixed ? { x: 580, y: 132 } : undefined}
      mode={profile.server ? 'server' : 'client'} total={profile.server ? 80 : undefined}
      defaultCurrent={profile.server ? 4 : 1} defaultPageSize={2}
      pagination={profile.paging || profile.server ? { showSizeChanger: false } : false}
    />
  </ConfigProvider>
  <button type="button" onclick={() => { revision = 1; }}>Update row attributes</button>
  <button type="button" onclick={() => { hideLeaf = true; }}>Hide leaf</button>
  <button type="button" onclick={() => { hideGroup = true; }}>Hide group</button>
  <button type="button" onclick={() => { showHeader = !showHeader; }}>Toggle header</button>
  {#if editor}
    <button type="button" onclick={() => { enableHooks = false; }}>Remove row hooks</button>
  {/if}
  {#if profile.virtual}
    <button type="button" onclick={() => scrollTo(20)}>Scroll to 20</button>
    <button type="button" onclick={() => scrollTo(0)}>Scroll to 0</button>
  {/if}
  <output id="table-row-attributes-events">{JSON.stringify(events)}</output>
</section>
