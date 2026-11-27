<script lang="ts">
  // Observes the accepted parameters of the contents separately from the current attributes of the cell.
  import { tick } from 'svelte';
  import { ConfigProvider, Table, type TableColumn, type TableRef } from '@woodger/antd';

  interface Row { key: string; value: string; revision: number; }
  type Comparison = [key: string, next: string, previous: string];

  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profile = query.get('profile') ?? 'ordinary',
    editor = query.has('editor')
  }: { profile?: string; editor?: boolean; } = $props();
  const actions = [
    'reject', 'reject-again', 'move', 'new-renderer', 'accept', 'content-only', 'ungate',
    'gate', 'new-key', 'local-state', 'leave', 'return', 'no-title', 'empty-title'
  ] as const;
  type Action = typeof actions[number];

  let records = $state.raw(initialRows());
  let table = $state<TableRef>();
  let gated = $state(true);
  let useSecondRenderer = $state(false);
  let editorVersion = $state(0);
  let titleMode = $state<'automatic' | 'none' | 'empty'>('automatic');
  let lastClick = $state('');
  let comparisons = $state.raw<Comparison[]>([]);
  let pending: Comparison[] = [];
  let completed = $state<Action>();
  const virtual = $derived(profile !== 'ordinary');
  const columns = $derived<TableColumn<Row>[]>([
    {
      key: 'custom', title: 'custom', dataIndex: 'value', width: 120,
      render: useSecondRenderer ? second : first,
      shouldCellUpdate: gated ? allow : undefined,
      onCell: (row, index) => ({
        'data-probe-content': `custom/${row.value}/${index}`,
        onclick: () => { lastClick = row.value; }
      })
    },
    {
      key: 'plain', title: 'plain', dataIndex: 'value', width: 120,
      shouldCellUpdate: gated ? allow : undefined,
      ellipsis: titleMode === 'none' ? { showTitle: false } : true,
      onCell: (row, index) => ({
        'data-probe-content': `plain/${row.value}/${index}`,
        title: titleMode === 'empty' ? '' : undefined
      })
    }
  ]);

  /** Add strings to check the output of the first line from the virtual window. */
  function initialRows(): Row[] {
    const result = [
      { key: 'a', value: 'A0', revision: 0 },
      { key: 'b', value: 'B0', revision: 0 }
    ];
    if (profile === 'virtual-window') {
      for (let index = 2; index < 64; index++) {
        result.push({ key: `row-${index}`, value: `Value ${index}`, revision: 0 });
      }
    }
    return result;
  }

  /** Remembrances pairs transmitted to predicate, without changing the reactive state of the table. */
  function allow(record: Row, previous: Row) {
    pending.push([record.key, record.value, previous.value]);
    return record.revision !== previous.revision;
  }

  /** Replaces the first record, leaving the other identity lines. */
  function replaceA(value: string, revision?: number, key = 'a') {
    records = records.map(row => row.key === 'a'
      ? { key, value, revision: revision ?? row.revision } : row);
  }

  /** Publishes the pairs after the Table update so that the test can see the result of one action. */
  async function run(action: Action) {
    pending = [];
    switch (action) {
      case 'reject': replaceA('A1'); break;
      case 'reject-again': replaceA('A2'); break;
      case 'move': records = [...records].reverse(); break;
      case 'new-renderer': useSecondRenderer = true; break;
      case 'accept': replaceA('A3', 1); break;
      case 'content-only': replaceA('A4'); break;
      case 'ungate': gated = false; break;
      case 'gate': gated = true; break;
      case 'new-key': replaceA('A5', undefined, 'next'); break;
      case 'local-state': editorVersion += 1; break;
      case 'leave': table?.scrollTo({ key: 'row-32', align: 'start' }); break;
      case 'return': table?.scrollTo({ key: 'a', align: 'start' }); break;
      case 'no-title': titleMode = 'none'; break;
      case 'empty-title': titleMode = 'empty'; break;
    }

    await tick();
    comparisons = pending;
    completed = action;
  }
</script>

{#snippet first(row: Row, index: number, value?: unknown)}
  first/{String(value)}/{index}{#if editor && row.key === 'a'}
    <input aria-label="Cell editor" defaultValue={row.value} />
    <span data-local-version>{editorVersion}</span>
  {/if}
{/snippet}

{#snippet second(_row: Row, index: number, value?: unknown)}
  second/{String(value)}/{index}
{/snippet}

<section id="table-cell-update-fixture">
  <ConfigProvider theme={{ token: { motion: false } }}>
    <Table dataSource={records} {columns} {virtual} pagination={false} bind:this={table}
      scroll={virtual ? { x: 240, y: 160 } : undefined} />
  </ConfigProvider>
  {#each actions as action (action)}
    <button type="button" onclick={() => run(action)}>{action}</button>
  {/each}
  <output aria-label="Compared records" data-action={completed}>{JSON.stringify(comparisons)}</output>
  <output aria-label="Clicked record">{lastClick}</output>
</section>

<style>
  section { width: 400px; }
  input { max-width: 100%; }
</style>
