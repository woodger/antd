// Lays out Transfer's records on the keys, prepares the display and computes new selection sets.
import type {
  TransferDirection, TransferKey, TransferRenderedItem, TransferRenderResult
} from './transfer.types';
import { getPaginationItems } from '../pagination.engine';

// Receives only supported keys and reports no rowKey for the rest of the records.
export function transferKey(record: object): TransferKey {
  if ('key' in record && ['string', 'number', 'bigint'].includes(typeof record.key)) {
    return record.key as TransferKey;
  }

  throw new TypeError('Transfer records require a string, number or bigint key, or rowKey.');
}

// Uses the flag of the recording itself to exclude from the portable elements.
export function transferDisabled(record: object): boolean {
  return 'disabled' in record && Boolean(record.disabled);
}

// Keeps the original order of the left list and the order targetKeys on the right.
export function transferData<RecordType extends object>(
  dataSource: readonly RecordType[],
  targetKeys: readonly TransferKey[],
  rowKey?: (record: RecordType) => TransferKey
): { all: RecordType[]; left: RecordType[]; right: RecordType[]; } {
  const all = dataSource.map(record => rowKey ? { ...record, key: rowKey(record) } : record);
  const targets = new Map(targetKeys.map((key, index) => [key, index]));
  const left: RecordType[] = [];
  const right: (RecordType | undefined)[] = Array.from({ length: targetKeys.length });

  for (const record of all) {
    const key = transferKey(record);
    const targetIndex = targets.get(key);

    if (targetIndex === undefined) {
      left.push(record);
    }
    else {
      right[targetIndex] = record;
    }
  }

  return { all, left, right: right.filter((record): record is RecordType => record !== undefined) };
}

// Reserves only the selected keys relating to the transferred party.
export function transferSelection(
  selectedKeys: readonly TransferKey[],
  records: readonly object[]
): TransferKey[] {
  const keys = new Set(records.map(transferKey));
  return selectedKeys.filter(key => keys.has(key));
}

// Prepares independent values for display and search with a priority of filterOption.
export function transferRender<RecordType extends object>(
  records: readonly RecordType[],
  render?: (record: RecordType) => TransferRenderResult<RecordType>,
  search = '',
  filterOption?: (value: string, record: RecordType, direction: TransferDirection) => boolean,
  direction: TransferDirection = 'left'
): TransferRenderedItem<RecordType>[] {
  const result: TransferRenderedItem<RecordType>[] = [];

  for (const item of records) {
    const { renderedEl, renderedText } = renderRecord(item);
    if (!search || (filterOption
      ? filterOption(search, item, direction)
      : renderedText.includes(search))) {
      result.push({ item, renderedEl, renderedText });
    }
  }

  return result;

  // Saves the distinction between the displayed label and the search string.
  function renderRecord(item: RecordType) {
    const rendered = render?.(item) ?? null;
    if (typeof rendered === 'object' && rendered !== null) {
      return { renderedEl: rendered.label, renderedText: rendered.value };
    }

    const title = 'title' in item ? item.title : undefined;
    const key = transferKey(item);
    const searchText = [rendered, title, key].find(
      value => typeof value === 'string' || typeof value === 'number'
    );
    const renderedText = searchText === undefined ? '' : String(searchText);
    return { renderedEl: rendered, renderedText };
  }
}

// Passes moveKeys in selection order and skips disabled entries.
export function transferMove(
  targetKeys: readonly TransferKey[],
  selectedKeys: readonly TransferKey[],
  records: readonly object[],
  direction: TransferDirection
): { targetKeys: TransferKey[]; moveKeys: TransferKey[]; } {
  const disabled = new Map(records.map(item => [transferKey(item), transferDisabled(item)]));
  const moveKeys = selectedKeys.filter(key => !disabled.get(key));
  const moved = new Set(moveKeys);

  return {
    targetKeys: direction === 'right'
      ? [...moveKeys, ...targetKeys]
      : targetKeys.filter(key => !moved.has(key)),
    moveKeys
  };
}

// Replaces, adds or removes evenly transferred keys.
export function transferSelectAll(
  selected: readonly TransferKey[],
  keys: readonly TransferKey[],
  checked: boolean | 'replace'
): TransferKey[] {
  if (checked === 'replace') {
    return [...keys];
  }
  if (checked) {
    return [...new Set([...selected, ...keys])];
  }

  const removed = new Set(keys);
  return selected.filter(key => !removed.has(key));
}

/** The range changes the action to delete only if all the modified strings are allocated. */
export function transferSelectRange(
  selected: readonly TransferKey[],
  keys: readonly TransferKey[],
  previous: number | null,
  current: number
): { selected: TransferKey[]; anchor: number | null; } {
  const start = Math.min(previous ?? current, current);
  const end = Math.max(previous ?? current, current);
  const range = keys.slice(start, end + 1);
  const next = new Set(selected);
  const add = range.some(key => !next.has(key));

  for (const key of range) {
    if (add) {
      next.add(key);
    }
    else {
      next.delete(key);
    }
  }

  return { selected: [...next], anchor: add ? end : null };
}

/** rc-pagination 1.4.0, MIT (vendor/LICENSE.rc-pagination); borders showLessItems reserved. */
export function transferPaginationItems(
  current: number,
  count: number,
  less: boolean
): (number | 'jump-prev' | 'jump-next')[] {
  return getPaginationItems({ current, pageCount: count }, less);
}
