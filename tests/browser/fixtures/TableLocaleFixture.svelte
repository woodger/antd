<script lang="ts">
  // Профиль берёт входные данные из прогона React. Подписи читает сам DOM-тест.
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Table, type AntDesignLocale, type RenderEmptyComponent, type RenderEmptyContent,
    type TableColumn, type TableLocaleOverrides
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-locale-reference.json';

  interface Row { key: number; name: string; }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'body-provider',
    useEmpty = query.has('native-empty'),
    peer = query.has('peer'),
    observed
  }: {
    profileId?: string;
    useEmpty?: boolean;
    peer?: boolean;
    observed?: RenderEmptyComponent[];
  } = $props();
  const profile = untrack(() =>
    source.cases.find(sample => sample.profile.id === profileId)?.profile ?? source.cases[0].profile
  );
  const rows: Row[] = [{ key: 1, name: 'Green' }, { key: 2, name: 'Red' }];
  const column = makeColumn();
  const columns = [column];
  const provider: AntDesignLocale = {
    ...enUS,
    Table: { ...dictionary('Provider'), emptyText: 'Unused provider table text' },
    Empty: { description: 'Provider empty description' }
  };
  let updated = $state(false);
  let loading = $state(Boolean(profile.loading));
  let selected = $state<number[]>([]);
  const layer = $derived(updated ? 'Updated' : 'Local');
  const locale = $derived(readLocale(layer));

  /** Задаёт отдельные маркеры для подписи каждого элемента. */
  function dictionary(owner: string) {
    return {
      filterTitle: owner + ' filter', filterConfirm: owner + ' apply',
      filterReset: owner + ' reset', filterEmptyText: owner + ' options empty',
      filterCheckAll: owner + ' check all', filterSearchPlaceholder: owner + ' search',
      selectAll: owner + ' page selection', selectionAll: owner + ' dataset',
      selectInvert: owner + ' invert', selectNone: owner + ' clear selection',
      sortTitle: owner + ' sort title', triggerAsc: owner + ' ascending',
      triggerDesc: owner + ' descending', cancelSort: owner + ' clear sort',
      expand: owner + ' expand', collapse: owner + ' collapse'
    };
  }

  /** Создаёт колонку для панели, которая измеряется в данном профиле. */
  function makeColumn(): TableColumn<Row> {
    const column: TableColumn<Row> = { key: 'name', title: 'Name', dataIndex: 'name' };
    if (profile.kind === 'empty' || profile.kind === 'tree') {
      column.filters = profile.kind === 'tree'
        ? rows.map(row => ({ text: row.name, value: row.key })) : [];
      column.filterMode = profile.kind === 'tree' ? 'tree' : 'menu';
      column.filterSearch = true;
      column.onFilter = (value, row) => row.key === value;
    }
    if (profile.kind === 'sort') {
      column.sorter = (left, right) => left.key - right.key;
      column.showSorterTooltip = { mouseEnterDelay: 0, mouseLeaveDelay: 0 };
    }

    return column;
  }

  /** Передаёт пустые значения без подстановки и сохраняет identity редактора. */
  function content(value: string, text: string, rich: Snippet): RenderEmptyContent {
    switch (value) {
      case 'text': return text;
      case 'zero': return 0;
      case 'empty': return '';
      case 'null': return null;
      case 'false': return false;
      case 'empty-array': return [];
      case 'array': return [rich, [0, false]];
      case 'snippet': return emptyEditor;
      default: return undefined;
    }
  }

  /** Перекрывает provider частично или явно задаёт локальные значения с тем же словарём. */
  function readLocale(owner: string): TableLocaleOverrides | undefined {
    const local = dictionary(owner);
    if (profile.local === 'partial') {
      return { filterConfirm: local.filterConfirm };
    }

    const result: TableLocaleOverrides = profile.local ? {
      ...local, filterApply: 'Native apply alias', sortAscending: 'Native ascending alias',
      expandRow: 'Native expand alias'
    } : {};
    if (profile.local && profile.local !== 'all') {
      const labels = {
        filterConfirm: applyRich, filterReset: resetRich, filterEmptyText: emptyFilterRich,
        filterCheckAll: checkAllRich, selectionAll: allRich, selectInvert: invertRich,
        selectNone: noneRich
      };
      for (const field of ['filterConfirm', 'filterReset', 'filterEmptyText', 'filterCheckAll',
        'selectionAll', 'selectInvert', 'selectNone'] as const) {
        result[field] = content(profile.local, local[field], labels[field]);
      }
    }
    if (profile.empty) {
      result.emptyText = content(profile.empty, owner + ' empty body', emptyBodyRich);
    }

    return profile.local || profile.empty ? result : undefined;
  }

  /** Сохраняет имя потребителя для проверки приоритетов в SSR. */
  function sharedEmpty(name?: RenderEmptyComponent) {
    if (name !== undefined) {
      observed?.push(name);
    }
    if (!profile.renderer) {
      return undefined;
    }

    const rich = name === 'Table.filter' ? sharedFilterRich : sharedTableRich;
    return content(profile.renderer, 'Shared ' + name, rich);
  }
</script>

{#snippet marked(text: string)}<em data-locale-rich>{text}</em>{/snippet}
{#snippet emptyBodyRich()}{@render marked(layer + ' empty body')}{/snippet}
{#snippet emptyFilterRich()}{@render marked(layer + ' options empty')}{/snippet}
{#snippet applyRich()}{@render marked(layer + ' apply')}{/snippet}
{#snippet resetRich()}{@render marked(layer + ' reset')}{/snippet}
{#snippet checkAllRich()}{@render marked(layer + ' check all')}{/snippet}
{#snippet allRich()}{@render marked(layer + ' dataset')}{/snippet}
{#snippet invertRich()}{@render marked(layer + ' invert')}{/snippet}
{#snippet noneRich()}{@render marked(layer + ' clear selection')}{/snippet}
{#snippet sharedFilterRich()}{@render marked('Shared Table.filter')}{/snippet}
{#snippet sharedTableRich()}{@render marked('Shared Table')}{/snippet}
{#snippet emptyEditor()}<input aria-label="Empty editor" defaultValue="Draft initial" />{/snippet}
{#snippet nativeEmpty()}<span>Own empty snippet</span>{/snippet}
{#snippet details(row: Row)}Details {row.key}{/snippet}

<ConfigProvider locale={provider} theme={{ token: { motion: false } }}
  renderEmpty={profile.renderer ? sharedEmpty : undefined}>
  <section id="table-locale-fixture" style="width:640px">
    <Table dataSource={profile.kind ? rows : []} {columns} {locale} {loading}
      empty={useEmpty ? nativeEmpty : undefined}
      pagination={false}
      rowSelection={profile.kind === 'controls' ? {
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        onChange: keys => { selected = keys.filter(key => typeof key === 'number'); }
      } : false}
      expandable={profile.kind === 'controls' ? { expandedRowRender: details } : undefined} />
    <button type="button" onclick={() => { updated = !updated; }}>Change table locale</button>
    <button type="button" onclick={() => { loading = false; }}>Finish loading</button>
    <output aria-label="Selected rows">{JSON.stringify(selected)}</output>
  </section>
  {#if peer}
    <section id="table-locale-peer">
      <Table dataSource={[]} {columns} pagination={false} />
    </section>
  {/if}
</ConfigProvider>
