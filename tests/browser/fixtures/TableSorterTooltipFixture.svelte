<script lang="ts">
  // Connects local and general prompt settings via public Table.
  import {
    ConfigProvider, Table, enUS, type TableChange, type TableColumn, type TableSorterTooltipProps
  } from '@woodger/antd';
  import source from './ant-design-table-sorter-tooltip-reference.json' with { type: 'json' };

  interface Row { key: number; score: number; }
  interface SourceTooltip {
    target?: string;
    trigger?: string;
    placement?: string;
    title?: string | number;
    arrow?: boolean;
    open?: boolean;
    mouseEnterDelay?: number;
    classNames?: { root: string; };
    styles?: { root: { borderTopWidth: string; }; };
  }
  interface Profile {
    id: string;
    table?: boolean | SourceTooltip;
    column?: boolean | SourceTooltip;
    owner?: boolean;
    filter?: boolean;
    trackEvents?: boolean;
  }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile'),
    lifecycle = query.has('lifecycle'),
    customPrefix = query.has('prefix')
  }: { profileId?: string | null; lifecycle?: boolean; customPrefix?: boolean; } = $props();

  const profile: Profile = $derived(
    source.cases.find(item => item.profile.id === profileId)?.profile ?? source.cases[0].profile
  );
  const locale = {
    ...enUS, table: {
      ...enUS.table, sortAscending: 'Ascending', sortDescending: 'Descending', cancelSort: 'Clear'
    }
  };
  const dataSource = [{ key: 0, score: 2 }, { key: 1, score: 1 }];
  let popupOwner = $state<HTMLDivElement>();
  let events = $state.raw<unknown[][]>([]);
  let target = $state<'profile' | 'icon' | 'off'>('profile');
  let loading = $state(false);
  const trace = $derived(profile.trackEvents || lifecycle);
  const tableTooltip = $derived.by(() => {
    if (target === 'off') {
      return false;
    }
    if (target === 'icon') {
      return { target: 'sorter-icon', onOpenChange: recordOpen } satisfies TableSorterTooltipProps;
    }
    if (customPrefix) {
      return { prefixCls: 'custom-sort-tip', title: 'Prefixed hint' };
    }
    const settings = tooltipSettings(profile.table);
    return lifecycle && settings === undefined ? { onOpenChange: recordOpen } : settings;
  });
  const columns: TableColumn<Row>[] = $derived([{
    key: 'score',
    title: 'Score',
    dataIndex: 'score',
    sorter: (left, right) => left.score - right.score,
    showSorterTooltip: tooltipSettings(profile.column, profile.owner),
    filters: profile.filter ? [{ text: 'One', value: 1 }] : undefined,
    onFilter: profile.filter ? (value, row) => value === row.score : undefined
  }]);

  /** The requested portal belongs to the fixed container of the stand. */
  function getPopupContainer() {
    if (!popupOwner) {
      throw new Error('Missing sorter tooltip owner');
    }
    return popupOwner;
  }

  /** Translates CSS and the string values of the original run in props Svelte. */
  function tooltipSettings(
    value: boolean | SourceTooltip | undefined, owner = false
  ): boolean | TableSorterTooltipProps | undefined {
    if (typeof value !== 'object') {
      return value;
    }

    const { target, trigger, placement, styles, ...options } = value;
    if (target !== undefined && target !== 'sorter-icon' && target !== 'full-header') {
      throw new Error(`Unexpected sorter tooltip target ${target}`);
    }
    if (trigger !== undefined && trigger !== 'focus' && trigger !== 'click') {
      throw new Error(`Unexpected sorter tooltip trigger ${trigger}`);
    }
    if (placement !== undefined && placement !== 'bottom') {
      throw new Error(`Unexpected sorter tooltip placement ${placement}`);
    }

    return {
      ...options, target, trigger, placement,
      styles: styles ? { root: `border-top-width:${styles.root.borderTopWidth}` } : undefined,
      getPopupContainer: owner ? getPopupContainer : undefined,
      onOpenChange: trace ? recordOpen : undefined
    };
  }

  /** Saves queries Tooltip in the same journal as sorting events. */
  function recordOpen(open: boolean) {
    if (trace) {
      events = [...events, ['tooltip', open]];
    }
  }

  /** Fixes the direction after the click on the sorted header. */
  function recordSort(change: TableChange<Row>) {
    if (trace) {
      events = [...events, ['sort', change.sorter?.order ?? null]];
    }
  }
</script>

<section data-table-sorter-tooltip-fixture style={'margin:115px 65px;'
  + 'width:450px'}>
  <ConfigProvider {locale} prefixCls={customPrefix ? 'sample' : undefined}
    theme={{ token: { motion: false } }}>
    <Table {columns} {dataSource} {loading} pagination={false} showSorterTooltip={tableTooltip}
      prefixCls={customPrefix ? 'sample-grid' : undefined} onChange={recordSort} />
  </ConfigProvider>
  <div id="popup-owner" bind:this={popupOwner}></div>
  <output data-sorter-tooltip-events>{JSON.stringify(events)}</output>
  {#if lifecycle}
    <button type="button" onclick={() => { target = 'icon'; }}>Use icon</button>
    <button type="button" onclick={() => { target = 'off'; }}>Disable hint</button>
    <button type="button" onclick={() => { target = 'profile'; }}>Reset hint</button>
    <button type="button" onclick={() => { loading = !loading; }}>Toggle loading</button>
  {/if}
</section>
