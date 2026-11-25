<script lang="ts">
  // Сравнивает заголовки листьев и групп с эталоном по публичным аргументам snippet.
  import {
    ConfigProvider, enUS, Table, type TableChange, type TableColumn, type TableColumnTitleProps,
    type TableSorterTooltipProps
  } from '@woodger/antd';

  interface Row { key: number; score: number; rank: number; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'state' }: { profileId?: string; } = $props();
  const records: Row[] = [
    { key: 0, score: 4, rank: 2 },
    { key: 1, score: 1, rank: 1 },
    { key: 2, score: 2, rank: 2 },
    { key: 3, score: 3, rank: 1 }
  ];
  let owner = $state(false);
  let renamed = $state(false);
  let detailRequests = $state(0);
  let headingClicks = $state(0);
  let changes = $state.raw<unknown[]>([]);
  const columns = $derived(makeColumns(profileId, owner));
  const defaults = $derived(profileId === 'empty-title' ? { title: rankTitle } : undefined);
  const tooltip: false | TableSorterTooltipProps = $derived(
    ['tooltip', 'tooltip-icon', 'interactive'].includes(profileId)
      ? { target: profileId === 'tooltip-icon' ? 'sorter-icon' : 'full-header', mouseEnterDelay: 0 }
      : false
  );

  /** Помечает ячейку для проверки текущего title и aria-sort. */
  function heading(column: TableColumn<Row>) {
    return { 'data-observed-header': column.key };
  }

  /** Задаёт колонки с теми же значениями сортировок и фильтров, что в эталоне. */
  function makeColumns(profile: string, controlled: boolean): TableColumn<Row>[] {
    const score: TableColumn<Row> = {
      key: 'score', dataIndex: 'score', title: scoreTitle, onHeaderCell: heading
    };
    const rank: TableColumn<Row> = {
      key: 'rank', dataIndex: 'rank', title: rankTitle, onHeaderCell: heading
    };

    if (profile !== 'plain' && profile !== 'ellipsis') {
      score.sorter = (left, right) => left.score - right.score;
    }
    if (['state', 'groups', 'controlled', 'filter-native', 'filter-dropdown', 'tooltip',
      'tooltip-icon'].includes(profile)) {
      score.filters = [{ text: 'Even score', value: 0 }, { text: 'Odd score', value: 1 }];
      score.filterMultiple = false;
      score.onFilter = (value, row) => row.score % 2 === value;
    }

    if (profile === 'multiple') {
      score.sorter = { compare: (left, right) => left.score - right.score, multiple: 1 };
      rank.sorter = { compare: (left, right) => left.rank - right.rank, multiple: 5 };
      score.defaultSortOrder = 'ascend';
    }
    if (profile === 'controlled') {
      score.sortOrder = controlled ? 'descend' : null;
      score.filteredValue = controlled ? [1] : null;
    }
    if (profile === 'filter-dropdown') {
      score.filterDropdownProps = {};
    }
    if (profile === 'interactive') {
      score.onHeaderCell = column => ({
        ...heading(column), 'aria-label': 'Score with details',
        onclick: () => { headingClicks += 1; }
      });
    }

    if (profile === 'groups') {
      return [{ key: 'group', title: groupTitle, children: [score, rank], onHeaderCell: heading }];
    }
    if (profile === 'ellipsis') {
      return [
        { key: 'markup', dataIndex: 'score', title: markupTitle, ellipsis: true, onHeaderCell: heading },
        { key: 'text', dataIndex: 'score', title: 'Text title', ellipsis: true, onHeaderCell: heading,
          sorter: (left, right) => left.score - right.score },
        { key: 'absent', dataIndex: 'rank', onHeaderCell: heading,
          sorter: (left, right) => left.rank - right.rank },
        { key: 'numeric', dataIndex: 'rank', title: 0, ellipsis: true, onHeaderCell: heading }
      ];
    }
    if (profile === 'empty-title') {
      return [
        { key: 'inherited', dataIndex: 'rank', onHeaderCell: heading },
        { key: 'null', dataIndex: 'score', title: null, onHeaderCell: heading },
        { key: 'boolean', dataIndex: 'rank', title: false, onHeaderCell: heading },
        { key: 'empty', dataIndex: 'rank', title: emptyTitle, ellipsis: true,
          sorter: (left, right) => left.rank - right.rank,
          onHeaderCell: column => ({ ...heading(column), title: 'Explicit title' }) }
      ];
    }

    return [score, rank];
  }

  /** Показывает текущий порядок критериев без записи в состояние таблицы. */
  function describeTitle(info: TableColumnTitleProps<Row>) {
    const sortColumns = info.sortColumns.map(({ column, order }) => ({ key: column.key, order }));
    return JSON.stringify({ sortColumns, filters: info.filters });
  }

  /** Отделяет запрос владельцу из события от контекста применённой сортировки. */
  function noteChange(change: TableChange<Row>) {
    const sorters = change.sorters ?? (change.sorter ? [change.sorter] : []);
    const sorted = sorters.map(({ columnKey, order }) => ({ key: columnKey, order }));
    changes = [...changes, {
      action: change.action, filters: change.filters ?? {}, sorted,
      rows: change.currentDataSource.map(row => row.key)
    }];
  }
</script>

{#snippet scoreTitle(info: TableColumnTitleProps<Row>)}
  <span data-title-sample={describeTitle(info)}>{renamed ? 'Updated score' : 'Score'}</span>
  {#if profileId === 'interactive'}
    <button type="button" onclick={() => { detailRequests += 1; }}>Details</button>
    <input aria-label="Header note" />
  {/if}
{/snippet}

{#snippet rankTitle(info: TableColumnTitleProps<Row>)}
  <span data-title-sample={describeTitle(info)}>Rank</span>
{/snippet}

{#snippet groupTitle(info: TableColumnTitleProps<Row>)}
  <span data-title-sample={describeTitle(info)}>Group</span>
{/snippet}

{#snippet markupTitle(info: TableColumnTitleProps<Row>)}
  <span data-title-sample={describeTitle(info)}>Markup</span>
{/snippet}

{#snippet emptyTitle()}{/snippet}

<section id="table-column-title-fixture" style="width:680px">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} column={defaults} dataSource={records} pagination={false} showSorterTooltip={tooltip}
      onChange={noteChange} />
  </ConfigProvider>
  <button type="button" onclick={() => { owner = true; }}>Owner update</button>
  <button type="button" onclick={() => { owner = false; }}>Owner reset</button>
  <button type="button" onclick={() => { renamed = true; }}>Rename heading</button>
  <output data-title-changes>{JSON.stringify(changes)}</output>
  <output data-detail-requests>{detailRequests}</output>
  <output data-heading-clicks>{headingClicks}</output>
</section>
