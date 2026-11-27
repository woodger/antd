// Store the choice and Shift support regardless of the mounted lines. The cache is updated to the
// owner's keys and preserves only the records required by the selection events.
import { untrack } from 'svelte';
import { changeTableSelection, getTableSelection } from './table.engine';
import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './table-selection.constants';
import { flattenTableRows, getTableLinkedSelection, type TableRow } from './table-tree.engine';
import type {
  TableKey, TableProps, TableRowSelectMethod, TableRowSelection,
  TableSelectionControlProps, TableSelectionItem, TableSelectionPreset
} from './table.types';

interface SelectionInputs<Row extends object> {
  enabled: () => boolean;
  disabled: () => boolean;
  options: () => TableRowSelection<Row> | undefined;
  rootKeys: () => readonly TableKey[] | undefined;
  rootDefaults: () => readonly TableKey[] | undefined;
  setRootKeys: (keys: TableKey[]) => void;
  rootChange: () => TableProps<Row>['onSelectionChange'];
  page: () => readonly TableRow<Row>[];
  data: () => readonly TableRow<Row>[];
  records: () => readonly TableRow<Row>[];
}

type Command = TableSelectionPreset | TableSelectionItem;
const presets = [SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE] as const;

/** Restores selected records with the priority of up-to-date data. */
function keepRecords<Row extends object>(
  keys: readonly TableKey[],
  live: ReadonlyMap<TableKey, TableRow<Row>>,
  previous: ReadonlyMap<TableKey, TableRow<Row>>
) {
  const records = new Map<TableKey, TableRow<Row>>();
  for (const key of keys) {
    const row = live.get(key) ?? previous.get(key);
    if (row) records.set(key, row);
  }
  return records;
}

/** Collecting payload in the order of keys. The missing record does not form an empty element. */
function selectionResult<Row extends object>(
  requested: readonly TableKey[],
  records: ReadonlyMap<TableKey, TableRow<Row>>,
  prune: boolean
) {
  const keys: TableKey[] = [];
  const rows: Row[] = [];
  for (const key of requested) {
    const row = records.get(key);
    if (row || !prune) keys.push(key);
    if (row) rows.push(row.record);
  }
  return { keys, rows };
}

/** Shift chooses the entire range if at least one line is still free. */
function toggleRange(
  keys: readonly TableKey[],
  page: readonly TableKey[],
  anchor: number,
  index: number
) {
  const first = Math.min(anchor, index);
  const end = Math.max(anchor, index) + 1;
  const range = page.slice(first, end);
  const selected = new Set(keys);
  const checked = range.some(key => !selected.has(key));
  return changeTableSelection(keys, range, checked);
}

/** Adds saved branches to the mark tree, prioritizing current data. */
function withRememberedBranches<Row extends object>(
  roots: readonly TableRow<Row>[], remembered: ReadonlyMap<TableKey, TableRow<Row>>
) {
  if (!remembered.size) {
    return roots;
  }

  const live = new Set(flattenTableRows(roots).map(({ row }) => row.key));
  const candidates = [...remembered.values()].filter(row => !live.has(row.key));
  if (!candidates.length) {
    return roots;
  }

  const descendants = new Set<TableKey>();

  /** The saved line, which has an ancestor in the cache, remains in its branch. */
  function markDescendants(row: TableRow<Row>) {
    for (const child of row.children ?? []) {
      if (live.has(child.key) || descendants.has(child.key)) continue;
      descendants.add(child.key);
      markDescendants(child);
    }
  }
  candidates.forEach(markDescendants);

  /** Passes the intersections of branches and duplicates from different data shots. */
  function collect(row: TableRow<Row>): TableRow<Row> | undefined {
    if (live.has(row.key)) {
      return undefined;
    }

    live.add(row.key);
    if (!row.children) {
      return row;
    }

    const children = row.children.flatMap(child => {
      const branch = collect(child);
      return branch ? [branch] : [];
    });
    return { ...row, children };
  }

  const restored: TableRow<Row>[] = [...roots];
  for (const row of candidates) {
    if (descendants.has(row.key)) continue;
    const branch = collect(row);
    if (branch) restored.push(branch);
  }
  // Shots of different pages can contain feedback after moving the line.
  for (const row of candidates) {
    const branch = collect(row);
    if (branch) restored.push(branch);
  }
  return restored;
}

/** Coordinates the selection of the current page, controlled status, and menu commands. */
export function createTableSelection<Row extends object>(input: SelectionInputs<Row>) {
  const options = $derived(input.options());
  const nested = $derived(
    options?.onChange !== undefined || options?.onSelect !== undefined
    || options?.preserveSelectedRowKeys !== undefined
    || options?.defaultSelectedRowKeys !== undefined || options?.selectedRowKeys !== undefined
  );
  const radio = $derived(options?.type === 'radio');
  const hideHeader = $derived(radio || options?.hideSelectAll === true);
  const commands = $derived(
    hideHeader ? undefined : options?.selections === true ? presets : options?.selections || undefined
  );
  let internal = $state.raw(untrack(() => [
    ...(input.options()?.defaultSelectedRowKeys ?? input.rootDefaults() ?? [])
  ]));
  const ownerKeys = $derived(options?.selectedRowKeys ?? input.rootKeys() ?? internal);
  const liveRecords = $derived(new Map(input.records().map(row => [row.key, row])));
  let remembered = $state.raw(new Map<TableKey, TableRow<Row>>());
  let rangeAnchor: number | undefined;
  let nestedWasEnabled = false;

  const page = $derived(input.enabled() ? flattenTableRows(input.page()) : []);
  const pageProps = $derived(new Map(page.map(({ row }) => [
    row.key, options?.getCheckboxProps?.(row.record) ?? {}
  ])));
  const available = $derived(page.filter(({ row }) => !pageProps.get(row.key)?.disabled)
    .map(({ row }) => row.key));
  const linked = $derived.by(() => {
    if (options?.checkStrictly !== false) {
      return undefined;
    }

    const data = input.data();
    const roots = options.preserveSelectedRowKeys ? withRememberedBranches(data, remembered) : data;
    return getTableLinkedSelection(roots, ownerKeys, isDisabled);
  });
  const keys = $derived.by(() => {
    const all = linked?.keys ?? ownerKeys;
    return radio ? all.slice(0, 1) : all;
  });
  const checked = $derived(new Set(keys));
  const title = $derived(!radio ? options?.getTitleCheckboxProps?.() : undefined);
  const header = $derived.by(() => {
    const state = getTableSelection(available, keys);
    const disabled = title?.disabled ?? state.disabled;
    if (!state.disabled || !page.length || (!nested && !title)) {
      return { ...state, disabled };
    }

    const all = page.every(({ row }) => checked.has(row.key));
    const some = !all && page.some(({ row }) => checked.has(row.key));
    return { all, some, disabled };
  });

  $effect.pre(() => {
    if (!input.enabled() && nestedWasEnabled) {
      internal = [];
      rangeAnchor = undefined;
    }
    nestedWasEnabled = input.enabled() && nested;

    const previous = untrack(() => remembered);
    if (options?.preserveSelectedRowKeys) {
      remembered = keepRecords(ownerKeys, liveRecords, previous);
    }
    else if (previous.size) {
      remembered = new Map();
    }
  });

  /** The page uses the same props as the controls, off-page reads the original line. */
  function isDisabled(row: TableRow<Row>) {
    const props = pageProps.get(row.key) ?? options?.getCheckboxProps?.(row.record);
    return Boolean(props?.disabled);
  }

  /** Publishes onSelect before changing keys and onChange after it. */
  function announce(
    requested: readonly TableKey[],
    type: TableRowSelectMethod,
    single?: { row: TableRow<Row>; checked: boolean; event: Event; }
  ) {
    const config = options;
    const preserve = config?.preserveSelectedRowKeys === true;
    const live = liveRecords;
    const owned = ownerKeys;
    const entries = preserve ? keepRecords(requested, live, remembered) : live;
    const result = selectionResult(requested, entries, nested && !preserve);
    const rootChange = input.rootChange();
    const rootOwned = input.rootKeys() !== undefined;

    if (single) {
      const row = live.get(single.row.key) ?? single.row;
      config?.onSelect?.(row.record, single.checked, [...result.rows], single.event);
    }

    if (preserve) {
      // Accepting the key and replacing the page can occur in one onChange.
      remembered = keepRecords([...owned, ...result.keys], live, remembered);
    }
    internal = result.keys;
    if (config?.selectedRowKeys === undefined && (!nested || rootOwned)) {
      input.setRootKeys(result.keys);
    }

    config?.onChange?.([...result.keys], [...result.rows], { type });
    const rootType = type === 'single' || type === 'multiple' ? 'single' : 'all';
    rootChange?.([...result.keys], result.rows, { type: rootType });
  }

  /** Applies a single action. Radio retains one checked option. */
  function toggleRow(row: TableRow<Row>, event: Event) {
    if (input.disabled() || isDisabled(row)) {
      return;
    }

    const wasChecked = checked.has(row.key);
    if (radio) {
      if (!wasChecked) {
        announce([row.key], 'single', { row, checked: true, event });
      }
      return;
    }

    const index = available.indexOf(row.key);
    const shifted = 'shiftKey' in event && event.shiftKey;
    if (shifted && !linked && index >= 0 && available.some(key => checked.has(key))) {
      const next = toggleRange(keys, available, rangeAnchor ?? index, index);
      announce(next, 'multiple');
    }
    else {
      const next = linked?.toggle(row.key, !wasChecked)
        ?? changeTableSelection(keys, [row.key], !wasChecked);
      announce(next, 'single', { row, checked: !wasChecked, event });
    }

    rangeAnchor = wasChecked || index < 0 ? undefined : index;
  }

  /** Title checkbox changes the available lines of only the current page. */
  function togglePage(next: boolean) {
    if (input.disabled() || header.disabled || radio) {
      return;
    }

    const selected = changeTableSelection(keys, available, next);
    announce(selected, 'all');
    rangeAnchor = undefined;
  }

  /** Selects the available lines of the processed set and preserves already marked disabled. */
  function selectAllData() {
    const selected = [];
    for (const { row } of flattenTableRows(input.data())) {
      if (!isDisabled(row) || checked.has(row.key)) selected.push(row.key);
    }
    announce(selected, 'all');
  }

  /** Inverts the available page marks in its current order. */
  function invertPage() {
    const selected = new Set(keys);
    for (const key of available) {
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
    }
    announce([...selected], 'invert');
  }

  /** Puts disabled strings outside of the clearing, including saved records. */
  function clearSelection() {
    const selected = keys.filter(key => {
      const row = liveRecords.get(key)
        ?? (options?.preserveSelectedRowKeys ? remembered.get(key) : undefined);
      return row && isDisabled(row);
    });
    announce(selected, 'none');
  }

  /** Performs the command and resets the Shift support even at the user point. */
  function runCommand(command: Command) {
    if (input.disabled() || hideHeader) {
      return;
    }

    if (command === SELECTION_ALL) selectAllData();
    else if (command === SELECTION_INVERT) invertPage();
    else if (command === SELECTION_NONE) clearSelection();
    else command.onSelect?.([...available]);

    rangeAnchor = undefined;
  }

  /** Returns the same control settings from which the availability of the page is calculated. */
  function control(key: TableKey): TableSelectionControlProps | undefined {
    return pageProps.get(key);
  }

  /** Checkbox tree has a mixed state is determined by the marks of the descendants. */
  function indeterminate(key: TableKey, tree: boolean) {
    const half = linked?.half.has(key) ?? false;
    return tree ? half : control(key)?.indeterminate ?? half;
  }

  return {
    get checked() { return checked; },
    get radio() { return radio; },
    get hideHeader() { return hideHeader; },
    get commands() { return commands; },
    get header() { return header; },
    get title() { return title; },
    toggleRow,
    togglePage,
    runCommand,
    control,
    indeterminate
  };
}
