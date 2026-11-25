<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Table, type RenderEmptyContent, type TableColumn, type TableColumnsType,
    type TableKey, type TableRowSelection
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-heading-content-reference.json';

  interface Row { key: string; label: string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'array' }: { profileId?: string; } = $props();
  const live = untrack(() => profileId === 'live');
  const profile = untrack(() => {
    const id = live ? 'array' : profileId;
    return source.cases.find(entry => entry.profile.id === id)?.profile ?? source.cases[0].profile;
  });
  const dataSource: readonly Row[] = [{ key: 'b', label: 'Beta' }, { key: 'a', label: 'Alpha' }];
  const emptyLabel: RenderEmptyContent = [false, [null, undefined]];
  let titleText = $state('Data');
  let captionText = $state('Caption');
  let empty = $state(false);
  let inspections = $state(0);
  let commandEvents = $state.raw<['command', TableKey[]][]>([]);

  const rowSelection: TableRowSelection<Row> = {
    type: profile.radio ? 'radio' : 'checkbox',
    hideSelectAll: profile.hidden,
    columnTitle: profile.renderer ? selectionRenderer : label(selectionMark),
    selections: profile.command ? [{
      key: 'custom', text: ['Batch ', 0, ' ', commandMark], onSelect: noteCommand
    }] : undefined
  };
  const columns = $derived.by<TableColumnsType<Row>>(() => {
    const interactiveTitle = empty ? emptyLabel : [dataMark, [' ', 0, ' '], inspectAction];
    const leaf: TableColumn<Row> = {
      key: 'data',
      dataIndex: 'label',
      title: live ? interactiveTitle : label(dataMark),
      ellipsis: true,
      sorter: (left, right) => left.label.localeCompare(right.label),
      filters: live ? [{ text: 'Alpha', value: 'a' }] : undefined,
      onFilter: (value, row) => row.key === value
    };
    const column = profile.group ? { key: 'group', title: label(groupMark), children: [leaf] } : leaf;
    return [Table.SELECTION_COLUMN, Table.EXPAND_COLUMN, column];
  });
  const caption = $derived(live && empty ? emptyLabel : label(captionMark));

  /** Передаёт в Table содержимое из соответствующего профиля Ant Design. */
  function label(mark: Snippet): RenderEmptyContent {
    switch (profile.type) {
      case 'zero': return 0;
      case 'number': return 42;
      case 'empty': return '';
      case 'false': return false;
      case 'true': return true;
      case 'null': return null;
      case 'empty-array': return [];
      case 'array': return [mark, [' ', 0, false, null]];
      default: return undefined;
    }
  }

  /** Записывает вызовы пользовательской команды вместе с ключами текущей страницы. */
  function noteCommand(keys: TableKey[]) {
    commandEvents = [...commandEvents, ['command', keys]];
  }

  /** Меняет текст внутри прежних snippets. */
  function rename() {
    titleText = 'Updated title';
    captionText = 'Updated caption';
  }
</script>

{#snippet captionMark()}<strong data-probe-title="Caption">{captionText}</strong>{/snippet}
{#snippet selectionMark()}<strong data-probe-title="Selection">Selection</strong>{/snippet}
{#snippet expandMark()}<strong data-probe-title="Expand">Expand</strong>{/snippet}
{#snippet dataMark()}<strong data-probe-title="Data">{titleText}</strong>{/snippet}
{#snippet groupMark()}<strong data-probe-title="Group">Group</strong>{/snippet}
{#snippet commandMark()}<strong data-probe-title="command">Apply</strong>{/snippet}
{#snippet details(row: Row)}<div>{row.label}</div>{/snippet}
{#snippet selectionRenderer(origin: Snippet | undefined)}
  <span data-probe-title="selection-renderer">{origin ? 'Selection with control'
    : 'Selection without control'}{#if origin}{@render origin()}{/if}</span>
{/snippet}
{#snippet inspectAction()}
  <button type="button" onclick={() => { inspections += 1; }}>Inspect</button>
{/snippet}

<section id="table-heading-content-fixture">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} {caption} {rowSelection}
      expandable={{ columnTitle: label(expandMark), expandedRowRender: details }}
      pagination={false} showSorterTooltip={false}
      locale={{
        label: 'Report',
        selectAll: 'Select page',
        selectionMenu: 'Selection actions',
        expandColumn: 'Expand column',
        filterTitle: 'Filter'
      }} />
  </ConfigProvider>

  {#if live}
    <button type="button" onclick={rename}>Rename headings</button>
    <button type="button" onclick={() => { empty = true; }}>Empty headings</button>
    <output data-inspections>{inspections}</output>
  {/if}
  <output data-heading-events>{JSON.stringify(commandEvents)}</output>
</section>
