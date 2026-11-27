<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, enUS, Menu, Table, type RenderEmptyContent, type TableChange, type TableColumn,
    type TableFilterDropdownOptions, type TableFilterDropdownProps, type TableFilterOption
  } from '@woodger/antd';

  import source from './ant-design-table-filter-static-content-reference.json';

  interface Row { key: string; value: string; }
  interface Change { filters: TableChange<Row>['filters']; rows: string[]; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'builtin' }: { profileId?: string; } = $props();
  const profile = untrack(() => source.cases.find(entry => entry.profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  const live = untrack(() => profileId === 'live');
  const transition = untrack(() => profileId === 'transition');
  const dataSource: readonly Row[] = [{ key: 'b', value: 'Beta' }, { key: 'a', value: 'Alpha' }];
  const choices: readonly TableFilterOption[] = [{ text: 'Alpha only', value: 'Alpha' }];
  const livePanel = [draftEditor, [menuOptions]];
  let custom = $state(false);
  let iconText = $state('Icon');
  let panelText = $state('Panel note');
  let menuKeys = $state.raw<readonly string[]>([]);
  let openEvents = $state.raw<boolean[]>([]);
  let changes = $state.raw<Change[]>([]);
  const panel = $derived.by(() => {
    if (live) {
      return livePanel;
    }
    if (transition) {
      return custom ? staticContent('array', panelMark) : 0;
    }

    return profile.panel === 'renderer' ? customRenderer : staticContent(profile.panel, panelMark);
  });
  const icon = profile.icon === 'renderer' ? activeIcon
    : staticContent(live ? 'array' : profile.icon, iconMark);
  const dropdown: TableFilterDropdownOptions = {
    autoFocus: live || transition, forceRender: live, onOpenChange: noteOpen
  };
  const columns = $derived<TableColumn<Row>[]>([{
    key: 'value',
    title: 'Value',
    dataIndex: 'value',
    filters: profile.standalone ? undefined : choices,
    filtered: profile.active,
    filteredValue: profile.controlled,
    onFilter: profile.standalone ? undefined : (value, row) => row.value === value,
    filterMultiple: false,
    filterIcon: icon,
    filterDropdown: panel,
    filterDropdownProps: dropdown,
    filterOnClose: live || transition
  }]);

  /** Collects static profile content with the same numbers and markup as React. */
  function staticContent(kind: string | undefined, mark: Snippet): Exclude<RenderEmptyContent, Snippet> {
    switch (kind) {
      case 'zero': return 0;
      case 'number': return 42;
      case 'empty': return '';
      case 'null': return null;
      case 'false': return false;
      case 'true': return true;
      case 'string': return 'Panel note';
      case 'empty-array': return [];
      case 'array': return [mark, [' ', 0]];
      default: return undefined;
    }
  }

  /** Memories the requests for visibility from a full-time trigger. */
  function noteOpen(open: boolean) {
    openEvents = [...openEvents, open];
  }

  /** It only fixes the use of the filter and the requested strings. */
  function noteChange(change: TableChange<Row>) {
    changes = [...changes, {
      filters: change.filters, rows: change.currentDataSource.map(row => row.key)
    }];
  }

  /** Changes the text to previous snippets, saving open controls. */
  function renameContent() {
    iconText = 'Updated icon';
    panelText = 'Updated panel';
  }
</script>

{#snippet iconMark()}<strong data-probe-node="Icon">{iconText}</strong>{/snippet}
{#snippet panelMark()}<strong data-probe-node="Panel">Panel</strong>{/snippet}
{#snippet activeIcon(active: boolean)}<strong data-probe-node="Icon">{String(active)}</strong>{/snippet}
{#snippet customRenderer(info: TableFilterDropdownProps)}
  <strong data-probe-node="Panel">Selected {info.selectedKeys.join(' ')}</strong>
{/snippet}
{#snippet draftEditor()}
  <p>{panelText}</p>
  <input aria-label="Panel draft" />
{/snippet}
{#snippet menuOptions()}
  <Menu items={[{ key: 'pick', label: 'Pick local' }]}
    onSelect={event => { menuKeys = event.selectedKeys; }} />
{/snippet}

<section id="table-filter-static-content-fixture">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} locale={{ filterTitle: 'Filter', filterConfirm: 'OK' }}
      pagination={false} onChange={noteChange} />
  </ConfigProvider>
  <button type="button">Outside</button>
  {#if live}
    <button type="button" onclick={renameContent}>Rename content</button>
    <output data-menu-keys>{JSON.stringify(menuKeys)}</output>
  {/if}
  {#if transition}
    <button type="button" onclick={() => { custom = true; }}>Use static panel</button>
    <button type="button" onclick={() => { custom = false; }}>Use option list</button>
  {/if}
  <output data-open-events>{JSON.stringify(openEvents)}</output>
  <output data-filter-changes>{JSON.stringify(changes)}</output>
</section>
