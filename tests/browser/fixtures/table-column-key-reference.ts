import type source from './ant-design-table-column-key-reference.json';

export type TableColumnKeySample = (typeof source.cases)[number];
type Phase = 'ssr' | 'initial' | 'sorted' | 'filtered';

const positionalProfiles = new Set([
  'numeric-field', 'empty-field', 'position', 'position-after-hidden'
]);

/** Распознаёт профили с позиционным ключом листа внутри группы. */
export function usesPositionalKey(sample: TableColumnKeySample) {
  return positionalProfiles.has(sample.profile.id);
}

/** Читает ключ активного фильтра Source и учитывает два задокументированных конфликта. */
export function expectedColumnKey(sample: TableColumnKeySample) {
  if (sample.profile.hiddenBefore) {
    return '2-0';
  }
  if (sample.profile.collision === 'explicit') {
    return 'label_next';
  }

  const active = Object.entries(sample.filtered.changes[1].filters)
    .find(([, values]) => values?.length);
  if (!active) {
    throw new Error('Source profile has no active filter');
  }
  return active[0];
}

/** Сохраняет буквальное чтение пустого свойства, принятое в Svelte Table. */
function cellText(sample: TableColumnKeySample, rowKey: string, text: string | null) {
  if (sample.profile.id !== 'empty-field') {
    return text;
  }

  const values: Record<string, string> = { a: 'ZA', b: 'AB', c: 'BC' };
  return values[rowKey];
}

/** Переносит снимок Source в публичную форму состояния Svelte. */
export function expectedColumnState(sample: TableColumnKeySample, phase: Phase) {
  const snapshot = sample[phase];
  const columnKey = expectedColumnKey(sample);
  const textByKey = new Map(sample.ssr.rows.map(([key, text]) => [key, text]));
  const hiddenSort = phase === 'sorted' && sample.profile.hiddenBefore;
  const positionalFilter = phase === 'filtered' && usesPositionalKey(sample);
  let ordered = snapshot.rows.map(([key]) => key);
  // Source сообщает результат позиционного критерия в onChange, сохраняя старый DOM.
  if (hiddenSort || positionalFilter) {
    const latest = snapshot.changes.at(-1);
    if (!latest) {
      throw new Error('Missing Source change for a positional column');
    }
    ordered = latest.rows;
  }

  const applied = phase === 'sorted' || phase === 'filtered';
  const changes = snapshot.changes.map(event => {
    const values = Object.values(event.filters).find(filter => filter?.length);
    const order = sample.profile.hiddenBefore
      ? sample.sorted.changes[0].sorter.order : event.sorter.order;
    return {
      action: event.action,
      filters: values ? { [columnKey]: values } : {},
      sorter: order ? { columnKey, order } : null,
      rows: event.rows
    };
  });

  return {
    key: columnKey,
    peerKey: sample.profile.collision === 'explicit' ? 'label'
      : sample.profile.collision === 'inferred' ? 'label_next' : null,
    sort: applied && sample.profile.hiddenBefore ? 'ascending' : snapshot.sort,
    peerSort: null,
    rows: ordered.map(key => [key, cellText(sample, key, textByKey.get(key) ?? null)]),
    changes
  };
}
