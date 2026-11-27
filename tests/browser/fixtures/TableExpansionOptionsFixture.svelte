<script lang="ts">
  // Uses public disclosure settings for the same sequences as Source UMD.
  import type { Snippet } from 'svelte';
  import {
    ConfigProvider, enUS, Table,
    type TableColumn, type TableExpandable, type TableExpandIconInfo, type TableKey, type TableRef
  } from '@woodger/antd';
  import source from './ant-design-table-expansion-options-reference.json' with { type: 'json' };

  interface Row { key: number; name: string; children?: Row[]; }

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'forced',
    wrapped = query.has('wrapped')
  }: { profileId?: string; wrapped?: boolean; } = $props();
  const profile = $derived(source.cases.find(sample => sample.profile.id === profileId)?.profile
    ?? source.cases[0].profile);
  const records = $derived(makeRows(profile.virtual ? 36 : 3, !!profile.tree));
  const name: TableColumn<Row> = {
    key: 'name', title: 'Name', dataIndex: 'name', className: 'fixture-name'
  };
  const columns = $derived<TableColumn<Row>[]>(profile.selection
    ? [name, Table.SELECTION_COLUMN] : [name]);
  let keys = $state.raw<TableKey[]>();
  let accepted = $state(false);
  let locked = $state(false);
  let disabled = $state(false);
  let provider = $state('provider');
  let events = $state.raw<unknown[][]>([]);
  let table = $state<TableRef>();

  const options = $derived<TableExpandable<Row>>({
    expandedRowKeys: profile.reject ? keys ?? profile.keys ?? [] : undefined,
    defaultExpandedRowKeys: profile.reject ? undefined : profile.keys,
    forceRender: profile.force,
    expandedRowClassName: profile.stringClass ? 'fixture-expanded-plain' : detailClass,
    expandedRowRender: profile.tree ? undefined : details,
    expandIcon: wrapped ? withOrigin : profile.icon ? localIcon : undefined,
    expandRowByClick: profile.byClick,
    showExpandColumn: !profile.hideIcon,
    rowExpandable: row => row.key !== 1 && !(locked && row.key === 0),
    onExpand: (expanded, row) => record('expand', expanded, row.key),
    onExpandedRowsChange: changeKeys
  });

  /** Creates data for a flat and three-level tree. */
  function makeRows(count: number, tree: boolean): Row[] {
    const rows: Row[] = Array.from({ length: count }, (_, key) => ({ key, name: `Name ${key}` }));
    if (tree) {
      rows[0].children = [{ key: 101, name: 'Nested 101',
        children: [{ key: 102, name: 'Nested 102' }] }];
    }
    return rows;
  }

  /** Denotes the real index and the depth in the class of the part or nested record. */
  function detailClass(row: Row, index: number, depth: number) {
    return `fixture-expanded-${row.key}-${index}-${depth}`;
  }

  /** Adds events in their order without reinterpreting the keys. */
  function record(...event: unknown[]) {
    events = [...events, event];
  }

  /** The managed profile transmits Table keys when the owner receives the request. */
  function changeKeys(next: TableKey[]) {
    record('keys', next);
    if (accepted) keys = next;
  }

  /** The general provider can be used with tables of different schemes. */
  function namedRecord(record: object): record is Pick<Row, 'key' | 'name'> {
    return 'key' in record && typeof record.key === 'number'
      && 'name' in record && typeof record.name === 'string';
  }

  /** Uses a package ref to check the care and return of the virtual string. */
  function scrollTo(key: TableKey) {
    table?.scrollTo({ key, align: 'start' });
  }
</script>

{#snippet iconButton(info: TableExpandIconInfo, key: number, name: string, owner: string)}
  {@const state = [owner, info.prefixCls, key, Number(info.expanded), Number(info.expandable)]}
  <button type="button" data-icon-state={state.join(':')} aria-label={`Toggle ${key}`}
    aria-expanded={info.expanded} aria-controls={info.ariaControls}
    disabled={info.disabled} onclick={info.onExpand}>{name}</button>
{/snippet}

{#snippet localIcon(info: TableExpandIconInfo<Row>)}
  {@render iconButton(info, info.record.key, info.record.name, 'local')}
{/snippet}

{#snippet providerIcon(info: TableExpandIconInfo, origin: Snippet)}
  {#if namedRecord(info.record)}
    {@render iconButton(info, info.record.key, info.record.name, provider)}
  {:else}
    {@render origin()}
  {/if}
{/snippet}

{#snippet withOrigin(info: TableExpandIconInfo<Row>, origin: Snippet)}
  <span data-origin={info.record.key}>{@render origin()}</span>
{/snippet}

{#snippet details(row: Row, index: number, depth: number, expanded: boolean)}
  <div data-detail-key={row.key} data-detail-state={`${index}:${depth}:${Number(expanded)}`}>
    <input aria-label={`Draft ${row.key}`} value={`Draft ${row.key}`} />
  </div>
{/snippet}

<section id="table-expansion-options-fixture" style="width:500px">
  <ConfigProvider direction={profile.rtl ? 'rtl' : 'ltr'} locale={enUS}
    table={profile.provider ? { expandable: { expandIcon: providerIcon } } : undefined}
    theme={{ cssVar: {}, token: { motion: false } }}
  >
    <ConfigProvider table={profile.reset ? {} : undefined}>
      <Table bind:this={table} dataSource={records} {columns} {disabled}
        pagination={false} size="small" rowSelection={profile.selection}
        prefixCls={profile.customPrefix ? 'fixture-table' : undefined}
        virtual={profile.virtual} scroll={profile.virtual ? { x: 420, y: 156 } : undefined}
        expandable={options}
      />
    </ConfigProvider>
  </ConfigProvider>
  {#if profile.reject}
    <button type="button" onclick={() => { accepted = true; }}>Accept expansion</button>
    <button type="button" onclick={() => { locked = true; }}>Lock row</button>
    <button type="button" onclick={() => { locked = false; }}>Unlock row</button>
  {/if}
  {#if profile.provider}
    <button type="button" onclick={() => { provider = 'provider2'; }}>Change provider</button>
  {/if}
  {#if profile.virtual}
    <button type="button" onclick={() => scrollTo(20)}>Scroll to 20</button>
    <button type="button" onclick={() => scrollTo(0)}>Scroll to 0</button>
  {/if}
  {#if wrapped}
    <button type="button" onclick={() => { disabled = !disabled; }}>Toggle disabled</button>
  {/if}
  <output id="table-expansion-options-events">{JSON.stringify(events)}</output>
</section>
