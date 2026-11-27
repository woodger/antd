<script lang="ts">
  // Сопоставляет атрибуты контейнера, таблиц и их подписей до и после обновления.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type TableBodyRenderInfo, type TableColumn, type TableElementRenderInfo,
    type TableProps, type TableSummaryConfig
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-dom-attributes-reference.json';

  interface Row { key: number; value: string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'ordinary',
    editor = query.has('editor')
  }: { profileId?: string; editor?: boolean; } = $props();
  const profile = untrack(() =>
    (source.cases.find(sample => sample.profile.id === profileId) ?? source.cases[0]).profile);
  const records: Row[] = profile.empty ? [] : Array.from({ length: 10 }, (_, key) => ({
    key, value: 'Value ' + key
  }));
  const columns = $derived<TableColumn<Row>[]>([{
    key: 'value', title: 'Value', dataIndex: 'value', width: 250,
    render: editor ? cellEditor : undefined
  }]);
  const scroll = profile.scrollX || profile.scrollY
    ? { x: 250, y: profile.scrollY ? 120 : undefined } : undefined;
  const summary: TableSummaryConfig<Row> | undefined = profile.summary
    ? { fixed: 'bottom', render: summaryRows } : undefined;
  const components = profile.header ? { header: { table: headerTable } }
    : profile.customBody ? { body: customBody } : undefined;
  let nativeRoot = $state<HTMLDivElement>();
  let updated = $state(false);
  let captionOverride = $state<string | null>();
  const attributes = $derived(readAttributes(updated));
  const caption = $derived(captionOverride === undefined
    ? readCaption(profile.caption) : captionOverride);

  /** Повторяет смену переданных props, включая снятие части атрибутов. */
  function readAttributes(changed: boolean): Partial<TableProps<Row>> {
    const data = changed ? {
      id: 'updated-owner', 'data-probe-count': 1, 'data-probe-flag': true
    } : {
      id: 'report-owner', 'data-probe-owner': 'owner', 'data-probe-count': 0,
      'data-probe-flag': false, 'data-probe-empty': ''
    };
    if (profile.noAria) {
      return data;
    }

    const aria: Partial<TableProps<Row>> = changed ? {
      'aria-label': 'Updated table', 'aria-describedby': 'replacement-description',
      'aria-rowcount': 14, 'aria-busy': true
    } : {
      'aria-label': 'Report table', 'aria-labelledby': 'report-heading',
      'aria-describedby': 'report-description', 'aria-rowcount': 77, 'aria-colcount': 1,
      'aria-busy': false, 'aria-live': 'polite', role: 'grid'
    };
    return { ...data, ...aria };
  }

  /** Использует готовый snippet для вложенной разметки вместо строки HTML. */
  function readCaption(kind: string): TableProps<Row>['caption'] {
    switch (kind) {
      case 'rich': return richCaption;
      case 'zero': return 0;
      case 'empty': return '';
      case 'false': return false;
      case 'null': return null;
      default: return 'Plain report';
    }
  }
</script>

{#snippet richCaption()}
  <strong data-probe-caption="rich">{updated ? 'Updated caption' : 'Report caption'}</strong>
{/snippet}

{#snippet cellEditor(row: Row)}
  {#if row.key === 0}<input aria-label="Row draft" defaultValue={row.value} />{:else}{row.value}{/if}
{/snippet}

{#snippet headerTable({ attributes, children, ref }: TableElementRenderInfo<'table'>)}
  <table {...attributes} data-probe-header="" {@attach ref}>{@render children()}</table>
{/snippet}

{#snippet customBody(_rows: readonly Row[], info: TableBodyRenderInfo)}
  <div data-probe-custom-body="" style={'overflow:auto;'
    + 'max-height:120px'}
    {@attach node => info.ref(node)} onscroll={info.onScroll}>Custom report</div>
{/snippet}

{#snippet summaryRows()}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>Summary</Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

<section id="table-dom-attributes-fixture" data-native-root={nativeRoot?.dataset.antTablePart}>
  <h2 id="report-heading">Report heading</h2>
  <p id="report-description">Detailed report</p>
  <p id="replacement-description">Replacement details</p>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Table {...attributes} dataSource={records} {columns} {components} {scroll} {summary} {caption}
      prefixCls={profile.prefix} showHeader={!profile.headerless} sticky={profile.sticky}
      virtual={profile.virtual} pagination={false} bind:nativeElement={nativeRoot} />
  </ConfigProvider>
  <button type="button" onclick={() => { updated = true; }}>Update attributes</button>
  <button type="button" onclick={() => { captionOverride = 'Plain switch'; }}>Use plain caption</button>
  <button type="button" onclick={() => { captionOverride = null; }}>Remove caption</button>
</section>

<style>
  section { width: 400px; }
  input { max-width: 100%; }
  strong[data-probe-caption] {
    display: block;
    padding-block-end: 16px;
  }
</style>
