<script lang="ts">
  // Фиксирует размещение слотов и приоритет CSS на публичной таблице и Pagination.
  import {
    ConfigProvider, enUS, Table, type TableClassNameSlots, type TableColumn, type TableConfig,
    type TablePaginationConfig, type TableProps, type TableSemanticSlots
  } from '@woodger/antd';

  interface Row { key: number; name: string; amount: number; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'plain' }: { profileId?: string; } = $props();
  let updated = $state(false);
  const records: Row[] = Array.from({ length: 6 }, (_, key) => ({
    key, name: `Row ${key}`, amount: key % 4
  }));
  const layered = $derived(profileId === 'layers' || profileId === 'reactive');
  const shorthand = $derived(profileId === 'shorthand');
  const useProvider = $derived(layered || shorthand || profileId === 'provider-only');
  const useLocal = $derived(profileId !== 'provider-only');
  const empty = $derived(profileId === 'empty' || profileId === 'virtual-empty');
  const virtual = $derived(profileId.startsWith('virtual'));
  const fixed = $derived(profileId === 'fixed' || profileId === 'virtual');
  const dataSource = $derived(empty ? [] : records);
  const columns = $derived(makeColumns());
  const provider: TableConfig = $derived({
    class: 'observed-provider-class',
    style: '--observed-slot:provider-inline',
    classNames: shorthand ? { ...slotClasses('provider'), body: 'observed-provider-body' }
      : slotClasses('provider'),
    styles: slotStyles('provider')
  });
  const pagination: TablePaginationConfig = {
    showSizeChanger: false,
    classNames: ({ props }) => ({
      root: props.pageSize === 3 ? 'observed-page-owner-root' : 'observed-page-size-mismatch',
      item: 'observed-page-owner-item'
    }),
    styles: ({ props }) => ({
      root: `--observed-slot:page-owner-root;--pager-owner-size:${props.pageSize}`,
      item: '--observed-slot:page-owner-item'
    })
  };
  const expandable = $derived(profileId === 'services' ? {
    defaultExpandedRowKeys: [0], expandedRowRender: details
  } : undefined);

  /** Помечает каждую область, в том числе wrapper таблицы и корень Pagination. */
  function slotClasses(layer: string): TableSemanticSlots {
    const prefix = `observed-${layer}-`;
    return {
      root: `${prefix}root`, section: `${prefix}section`,
      title: `${prefix}title`, footer: `${prefix}footer`, content: `${prefix}content`,
      header: { wrapper: `${prefix}header`, row: `${prefix}header-row`, cell: `${prefix}header-cell` },
      body: { wrapper: `${prefix}body`, row: `${prefix}body-row`, cell: `${prefix}body-cell` },
      pagination: { root: `${prefix}pager`, item: `${prefix}page` }
    };
  }

  /** Два CSS-свойства отличают замену слота от слияния его стилей. */
  function slotStyles(layer: string): TableSemanticSlots {
    /** Оставляет уникальное свойство провайдера для проверки наследования. */
    function style(slot: string) {
      const value = `--observed-slot:${layer}-${slot}`;
      return layer === 'provider' ? `${value};--observed-provider-slot:${slot}` : value;
    }

    return {
      root: style('root'), section: style('section'), title: style('title'), footer: style('footer'),
      content: `${style('content')};max-height:240px;scroll-padding-top:7px`,
      header: { wrapper: style('header'), row: style('header-row'), cell: style('header-cell') },
      body: { wrapper: style('body'), row: style('body-row'), cell: style('body-cell') },
      pagination: { root: style('pager'), item: style('page') }
    };
  }

  /** Отражает размер, полученный из props таблицы. */
  function localClasses({ props }: { props: TableProps<Row>; }): TableClassNameSlots {
    const classes = slotClasses(updated ? 'updated' : 'local');
    const root = `${classes.root} observed-size-${props.size ?? 'unset'}`;
    if (shorthand) {
      return {
        ...classes, root, header: 'observed-local-header', body: 'observed-local-body',
        pagination: 'observed-local-pager'
      };
    }

    return { ...classes, root };
  }

  /** Пропущенный вложенный слот наследуется, явно заданный undefined очищается. */
  function localStyles({ props }: { props: TableProps<Row>; }) {
    const styles = slotStyles(props.bordered ? 'updated' : 'local');
    if (shorthand) {
      return {
        ...styles,
        header: { row: styles.header?.row, cell: styles.header?.cell },
        body: { ...styles.body, wrapper: undefined }
      };
    }

    return styles;
  }

  /** Сохраняет атрибуты конкретной колонки, поверх которых кладётся общий стиль. */
  function makeColumns(): TableColumn<Row>[] {
    const name: TableColumn<Row> = {
      key: 'name', title: 'Name', dataIndex: 'name', width: 140,
      fixed: fixed ? 'start' : undefined,
      onHeaderCell: layered ? () => ({
        class: 'observed-caller-head', style: '--observed-slot:caller-head'
      }) : undefined,
      onCell: layered ? () => ({
        class: 'observed-caller-cell', style: '--observed-slot:caller-cell'
      }) : undefined,
      render: profileId === 'reactive' ? editor : undefined
    };
    if (profileId === 'filter-popup') {
      name.filters = [{ text: 'First', value: 0 }];
      name.onFilter = (value, row) => value === row.key;
      name.filterDropdownProps = { rootClassName: 'observed-filter-popup' };
    }

    return [name, { key: 'amount', title: 'Amount', dataIndex: 'amount', width: 180 }];
  }

  /** Добавляет собственное свойство строки и значение для проверки приоритета. */
  function onHeaderRow() {
    return {
      class: 'observed-caller-header-row',
      style: '--observed-slot:caller-header-row;--caller-header-row:kept'
    };
  }
</script>

{#snippet title(page: readonly Row[])}Title {page.length}{/snippet}
{#snippet footer(page: readonly Row[])}Footer {page.length}{/snippet}
{#snippet details(row: Row)}Details {row.key}{/snippet}
{#snippet editor(row: Row)}
  <input aria-label={`Name ${row.key}`} defaultValue={row.name} />
{/snippet}

<section id="table-semantic-fixture" style="width:520px">
  <ConfigProvider componentSize="small" table={useProvider ? provider : undefined}
    locale={enUS} theme={{ token: { motion: false } }}>
    <Table
      {columns} {dataSource} {title} {footer} {expandable} pageSize={3}
      pagination={empty ? false : pagination}
      rowSelection={profileId === 'services' ? {} : false}
      showHeader={profileId !== 'no-header'}
      {virtual}
      scroll={fixed || profileId === 'virtual-empty' ? { x: 650, y: 100 } : undefined}
      size={updated ? 'large' : undefined} bordered={updated}
      classNames={useLocal ? localClasses : undefined} styles={useLocal ? localStyles : undefined}
      class={layered ? 'observed-owner-class' : undefined}
      style={layered ? '--observed-slot:owner-inline' : undefined}
      rootClassName={layered || profileId === 'filter-popup' ? 'observed-root-class' : undefined}
      rowClassName={layered ? 'observed-caller-row' : undefined}
      onRow={layered ? () => ({
        class: 'observed-caller-row-attr', style: '--observed-slot:caller-row'
      }) : undefined}
      onHeaderRow={layered ? onHeaderRow : undefined}
    />
  </ConfigProvider>
  <button type="button" onclick={() => { updated = true; }}>Update semantics</button>
  <button type="button" onclick={() => { updated = false; }}>Restore semantics</button>
  <button type="button">Outside</button>
</section>
