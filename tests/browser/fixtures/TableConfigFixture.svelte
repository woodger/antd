<script lang="ts">
  // Проверяет прокрутку и идентификацию строк при изменениях настроек провайдера.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type TableColumn, type TableConfig, type TableRef,
    type TableRowKey, type TableScrollOptions
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-config-reference.json';

  interface Row { rank: number; key: string; id: string; local: string; name: string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'baseline',
    editor = query.has('editor'),
    virtual = query.has('virtual')
  }: { profileId?: string; editor?: boolean; virtual?: boolean; } = $props();
  const sample = untrack(() => source.cases.find(({ profile }) => profile.id === profileId)
    ?? source.cases[0]);
  const { profile } = sample;
  const records: readonly Row[] = Array.from({ length: 26 }, (_, rank) => ({
    rank, key: `default-${rank}`, id: `provider-${rank}`, local: `local-${rank}`, name: `Row ${rank}`
  }));
  const columns = $derived<TableColumn<Row>[]>([
    {
      key: 'name', title: 'Name', dataIndex: 'name', width: profile.wide ? 440 : 260,
      minWidth: profile.wide ? 440 : undefined,
      showSorterTooltip: false,
      sorter: (left, right) => right.rank - left.rank, render: editor ? draft : undefined
    },
    { key: 'rank', title: 'ID', dataIndex: 'rank', width: 160,
      minWidth: profile.wide ? 160 : undefined }
  ]);
  const target = sample.states[0].state.keys[20];
  const rowKey: TableRowKey<Row> | undefined = profile.rowKey === 'function' ? computedKey
    : profile.rowKey === 'local' ? 'local' : undefined;
  const size = profile.size === 'large' ? 'large' : undefined;
  let table = $state<TableRef>();
  let events = $state.raw<string[]>([]);
  let providerConfig = $state.raw<TableConfig | undefined>(initialConfig());
  let scroll = $state.raw<TableScrollOptions | undefined>(readScroll(profile.scroll));

  /** Возвращает ключ, которого нет ни в одном поле записи. */
  function computedKey(record: Row) {
    return `computed-${record.rank}`;
  }

  /** Считанные из JSON значения сохраняют пустой объект scroll. */
  function readScroll(value?: {
    x?: number | string | boolean; y?: number | string; scrollToFirstRowOnChange?: boolean;
  }): TableScrollOptions | undefined {
    return value && { ...value, x: value.x === false ? undefined : value.x };
  }

  /** Варианты провайдера используют один набор строк и колонок. */
  function initialConfig(): TableConfig | undefined {
    if (!profile.provider) {
      return undefined;
    }

    return {
      rowKey: profile.provider === 'function' ? computedKey : 'id',
      scroll: readScroll(profile.providerScroll)
        ?? { x: 560, y: 110, scrollToFirstRowOnChange: false }
    };
  }
</script>

{#snippet draft(record: Row)}
  <input aria-label={'Editor ' + record.rank} defaultValue={record.name} />
{/snippet}

{#snippet content()}
  <Table dataSource={records} {columns} {rowKey} {scroll} {size} {virtual} pagination={false}
    bind:this={table} onChange={({ action }) => { events = [...events, action]; }} />
{/snippet}

<section id="table-config-fixture">
  <ConfigProvider table={providerConfig} locale={enUS} componentSize="large"
    direction={profile.rtl ? 'rtl' : undefined} theme={{ token: { motion: false } }}>
    {#if profile.nested}
      <ConfigProvider componentSize="small"
        table={profile.nested === 'replace' ? { class: 'override-table' } : undefined}>
        {@render content()}
      </ConfigProvider>
    {:else}
      {@render content()}
    {/if}
  </ConfigProvider>
  <button type="button" onclick={() => table?.scrollTo({ key: target, align: 'start' })}>
    Scroll by inherited key
  </button>
  {#if editor}
    <button type="button" onclick={() => {
      providerConfig = { ...providerConfig, scroll: { x: 640, y: 150 } };
    }}>Resize from provider</button>
    <button type="button" onclick={() => { scroll = {}; }}>Set local scroll</button>
    <button type="button" onclick={() => { scroll = undefined; }}>Inherit scroll</button>
    <button type="button" onclick={() => { providerConfig = { ...providerConfig, rowKey: 'local' }; }}>
      Change provider key
    </button>
  {/if}
  <output aria-label="Table config events">{JSON.stringify(events)}</output>
</section>

<style>
  section { width: 420px; }
  input { max-width: 100%; }
</style>
