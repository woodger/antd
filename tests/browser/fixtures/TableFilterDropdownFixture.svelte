<script lang="ts">
  // Собирает встроенную и пользовательскую панели через публичные свойства колонки.
  import type { Snippet } from 'svelte';
  import {
    ConfigProvider, enUS, Menu, Table, type TableChange, type TableColumn,
    type TableFilterDropdownProps, type TableFilterOption, type TableFilterValue
  } from '@woodger/antd';

  interface Row { key: number; score: TableFilterValue; }

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'custom' }: { profileId?: string; } = $props();
  const records: Row[] = [{ key: 0, score: 2 }, { key: 1, score: 1 }, { key: 2, score: 4 }];
  const typedRecords: Row[] = [
    { key: 0, score: 0 }, { key: 1, score: '0' }, { key: 2, score: false }
  ];
  const choices: TableFilterOption[] = [
    { text: 'Even score', value: 'even' }, { text: 'Odd score', value: 'odd' }
  ];
  let ownerOpen = $state(false);
  let ownerValues = $state<readonly TableFilterValue[] | null>(['even']);
  let popupHost = $state<HTMLDivElement>();
  let changes = $state.raw<unknown[]>([]);
  const columns = $derived(getColumns(profileId));
  const dataSource = $derived(profileId === 'custom-typed' ? typedRecords : records);

  /** Возвращает контейнер только для локального Dropdown этой колонки. */
  function getPopupContainer(trigger: HTMLElement) {
    return popupHost ?? trigger.ownerDocument.body;
  }

  /** Задаёт вариант управления по эталонному сценарию. */
  function getColumns(profile: string): TableColumn<Row>[] {
    const column: TableColumn<Row> = {
      key: 'score',
      title: 'Score',
      dataIndex: 'score',
      filters: choices,
      filterMultiple: false,
      onFilter: (value, row) => (Number(row.score) % 2 === 0 ? 'even' : 'odd') === value,
      filterIcon: icon,
      filterDropdownProps: { onOpenChange: noteOpen }
    };

    if (profile.startsWith('builtin')) {
      column.filterOnClose = profile !== 'builtin-cancel';
    }
    if (profile.startsWith('custom')) {
      column.filterDropdown = custom;
    }
    if (profile === 'custom-owner') {
      column.filterDropdownProps = { onOpenChange: noteOpen, open: ownerOpen };
    }
    if (profile.startsWith('custom-reset')) {
      column.defaultFilteredValue = ['even'];
      column.filterResetToDefaultFilteredValue = true;
    }
    if (profile === 'custom-no-options' || profile === 'custom-remote') {
      delete column.filters;
    }
    if (profile === 'custom-remote') {
      delete column.onFilter;
    }
    if (profile === 'custom-hover') {
      column.filterDropdownProps = {
        onOpenChange: noteOpen, trigger: ['hover'], placement: 'topRight', popupRender: wrap
      };
    }
    if (profile === 'custom-typed') {
      column.onFilter = (value, row) => value === row.score;
    }
    if (profile === 'custom-values') {
      column.filteredValue = ownerValues;
    }
    if (profile === 'custom-container') {
      column.filterDropdownProps = {
        onOpenChange: noteOpen, prefixCls: 'filter-surface', rootClassName: 'filter-hosted',
        autoFocus: true, getPopupContainer
      };
    }
    if (profile === 'custom-force') {
      column.defaultFilteredValue = ['even'];
      column.filterDropdownProps = { onOpenChange: noteOpen, forceRender: true };
    }
    if (profile === 'custom-destroy' || profile === 'custom-retain') {
      column.filterDropdownProps = {
        onOpenChange: noteOpen, destroyOnHidden: profile === 'custom-destroy'
      };
    }
    if (profile === 'static') {
      column.filterDropdown = note;
    }
    return [column];
  }

  /** Записывает запрос на открытие рядом с событиями фильтрации. */
  function noteOpen(open: boolean) {
    changes = [...changes, { open }];
  }

  /** Записывает критерии и строки, переданные из публичного onChange. */
  function noteChange(event: TableChange<Row>) {
    changes = [
      ...changes, { filters: event.filters, rows: event.currentDataSource.map(row => row.key) }
    ];
  }
</script>

{#snippet icon(filtered: boolean)}
  <span data-filter-icon={filtered ? 'active' : 'idle'}></span>
{/snippet}

{#snippet custom(info: TableFilterDropdownProps)}
  <div
    data-custom-panel
    data-custom-prefix={info.prefixCls}
    data-custom-keys={JSON.stringify(info.selectedKeys)}
    data-custom-options={JSON.stringify(info.filters?.map(option => option.value) ?? null)}
    data-custom-visible={String(info.visible)}
  >
    <button type="button" onclick={() => info.setSelectedKeys(['even'])}>Even score</button>
    <button type="button" onclick={() => info.setSelectedKeys(['odd'])}>Odd score</button>
    <button type="button" onclick={() => info.confirm()}>Apply custom</button>
    <button type="button" onclick={() => info.confirm({ closeDropdown: false })}>Apply and keep</button>
    <button type="button" onclick={() => info.clearFilters({ confirm: true })}>Reset and keep</button>
    <button type="button" onclick={() => info.clearFilters({ confirm: true, closeDropdown: true })}
    >Reset and close</button>
    {#if profileId === 'custom-menu'}
      <Menu items={[{ key: 'even', label: 'Even command' }, { key: 'odd', label: 'Odd command' }]}
        selectedKeys={info.selectedKeys.map(String)}
        onSelect={event => info.setSelectedKeys(event.selectedKeys)} />
    {/if}
    <button type="button" onclick={info.close}>Dismiss custom</button>
    {#if profileId === 'custom-typed'}
      <button type="button" onclick={() => info.setSelectedKeys([false, 0])}>Typed criteria</button>
    {/if}
    {#if profileId === 'custom-destroy' || profileId === 'custom-retain'}
      <input aria-label="Panel draft" />
    {/if}
  </div>
{/snippet}

{#snippet note()}<p data-filter-note>Filter note</p>{/snippet}

{#snippet wrap(origin: Snippet)}
  <div data-custom-wrap>{@render origin()}</div>
{/snippet}

<section id="table-filter-dropdown-fixture" style={'width:520px;'
  + 'margin-top:180px'}>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} pagination={false} onChange={noteChange}
      dropdownPrefixCls={profileId === 'custom-container' ? 'choices' : undefined}
      mode={profileId === 'custom-remote' ? 'server' : 'client'} />
  </ConfigProvider>
  <div bind:this={popupHost} data-custom-popup-host></div>
  <button type="button">Outside</button>
  <button type="button" onclick={() => { ownerOpen = true; }}>Owner open</button>
  <button type="button" onclick={() => { ownerOpen = false; }}>Owner close</button>
  <button type="button" onclick={() => { ownerValues = ['odd']; }}>Owner values</button>
  <output data-filter-dropdown-changes>{JSON.stringify(changes)}</output>
</section>
