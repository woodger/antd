<script lang="ts">
  // Повторяет открытые настройки и действия Source; editor добавляет проверку hydration.
  import {
    ConfigProvider, enUS, Table, type TableCellProps, type TableColumn,
    type TableRef, type TableScrollConfig
  } from '@woodger/antd';
  import reference from './ant-design-table-spans-reference.json' with { type: 'json' };

  interface Row {
    key: number;
    group: string;
    name: string;
    status: string;
    children?: Row[];
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'normal', editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  const profile = $derived(reference.cases.find(sample => sample.profile.id === profileId)?.profile
    ?? reference.cases[0].profile);
  let events = $state.raw<unknown[][]>([]);
  let table = $state<TableRef>();
  let dataSource = $derived(buildRows(profile.count, !!profile.tree));
  let columns = $derived<TableColumn<Row>[]>([
    {
      key: 'group', dataIndex: 'group', title: 'Group', className: 'fixture-group',
      width: 105, fixed: profile.virtual ? 'start' : undefined, rowScope: 'row',
      onCell: groupProps, onHeaderCell: column => ({ 'data-header-key': column.key }),
      render: groupCell
    },
    {
      key: 'name', dataIndex: 'name', title: 'Name and status', className: 'fixture-name',
      colSpan: 2, width: 200,
      sorter: (left, right) => right.key - left.key,
      onHeaderCell: profile.overrides ? column => ({
        colSpan: 1, 'data-header-key': column.key, class: 'custom-heading', style: 'text-align:right'
      }) : undefined,
      onCell: (_row, index) => ({
        colSpan: profile.rectangle ? 0 : !profile.multi && index === 3 ? 2 : 1,
        'data-callback-index': index
      })
    },
    {
      key: 'status', dataIndex: 'status', title: 'Status', className: 'fixture-status',
      colSpan: 0, width: 155,
      onHeaderCell: profile.overrides ? column => ({
        colSpan: 1, 'data-header-key': column.key
      }) : undefined,
      onCell: (_row, index) => ({
        colSpan: !profile.rectangle && !profile.multi && index === 3 ? 0 : 1,
        rowSpan: profile.multi ? (index % 3 === 0 ? 3 : 0) : 1,
        'data-callback-index': index
      })
    }
  ]);

  /** Все профили используют записи с теми же ключами и порядком, что UMD. */
  function buildRows(count: number, tree: boolean) {
    const rows = Array.from({ length: count }, (_, key): Row => ({
      key, group: `Group ${key}`, name: `Row ${key}`, status: `Status ${key}`
    }));
    if (tree) {
      rows[0].children = [100, 101, 102].map(key => ({
        key, group: `Child ${key}`, name: `Name ${key}`, status: `Status ${key}`
      }));
    }
    return rows;
  }

  /** Проверяет span, пользовательский класс, индекс и всплытие события из renderer. */
  function groupProps(row: Row, index: number): TableCellProps {
    let rowSpan = 1;
    if (profile.virtual) {
      rowSpan = row.key % 8 === 0 ? (row.key === 56 ? 40 : 8) : 0;
    }
    else if (!profile.tree && index < 3) {
      rowSpan = index === 0 ? 3 : 0;
    }
    return {
      rowSpan, 'data-callback-index': index, class: 'custom-owner',
      colSpan: profile.rectangle ? (rowSpan > 1 ? 2 : 0) : undefined,
      onclick: () => record('cell', row.key)
    };
  }

  /** Запоминает пользовательские события в порядке доставки. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** Передаёт сериализованную команду в публичный scrollTo. */
  function scrollTo(target: { top?: number; key?: number; index?: number; align?: string; }) {
    const { top, key, index, align } = target;
    const position: TableScrollConfig = { top, key, index,
      align: align === 'start' || align === 'end' ? align : undefined };
    table?.scrollTo(position);
  }
</script>

{#snippet groupCell(row: Row, index: number)}
  <button type="button" data-pick-key={row.key} data-render-index={index}
    onclick={() => record('pick', row.key)}>{row.group}</button>
  {#if editor && row.key === 0}
    <input aria-label="Merged draft" value="Initial draft" style="max-width:100%" />
  {/if}
{/snippet}

{#snippet details(row: Row)}
  <div data-detail={row.key} style="height:72px">Detail {row.key}</div>
{/snippet}

<section id="table-spans-fixture" style="width:340px">
  <ConfigProvider locale={enUS} direction={profile.rtl ? 'rtl' : 'ltr'}
    theme={{ cssVar: {}, token: { motion: false } }}
  >
    <Table bind:this={table} {columns} {dataSource} size="small" pagination={false}
      virtual={profile.virtual} scroll={profile.virtual ? { x: 460, y: 156 } : undefined}
      expandable={profile.tree ? {
        defaultExpandedRowKeys: [0],
        onExpand: (open, row) => record('expand', row.key, open)
      } : profile.details ? {
        columnWidth: 45, expandedRowRender: details,
        onExpand: (open, row) => record('expand', row.key, open)
      } : undefined}
    />
  </ConfigProvider>
  {#each profile.actions as action, index}
    {#if 'scroll' in action && action.scroll}
      {@const target = action.scroll}
      <button type="button" data-testid={`spans-scroll-${index}`} onclick={() => scrollTo(target)}>
        Scroll {index}
      </button>
    {/if}
  {/each}
  <output id="table-spans-events">{JSON.stringify(events)}</output>
</section>
