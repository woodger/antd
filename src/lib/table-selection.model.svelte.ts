// Хранит выбор и Shift-опору независимо от смонтированных строк. Кэш обновляется
// по ключам владельца и сохраняет только записи, необходимые событиям выбора.
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

/** Восстанавливает выбранные записи с приоритетом актуальных данных. */
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

/** Собирает payload в порядке ключей. Отсутствующий record не образует пустой элемент. */
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

/** Shift выбирает весь диапазон, если хотя бы одна строка ещё свободна. */
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

/** Добавляет сохранённые ветки к дереву отметок, отдавая приоритет текущим данным. */
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

  /** Сохранённая строка, у которой есть предок в кэше, остаётся в его ветке. */
  function markDescendants(row: TableRow<Row>) {
    for (const child of row.children ?? []) {
      if (live.has(child.key) || descendants.has(child.key)) continue;
      descendants.add(child.key);
      markDescendants(child);
    }
  }
  candidates.forEach(markDescendants);

  /** Пропускает пересечения веток и дубликаты из разных снимков данных. */
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
  // Снимки разных страниц могут содержать обратные связи после перемещения строки.
  for (const row of candidates) {
    const branch = collect(row);
    if (branch) restored.push(branch);
  }
  return restored;
}

/** Координирует выбор текущей страницы, контролируемое состояние и команды меню. */
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

  /** На странице использует те же props, что контролы, вне страницы читает исходную строку. */
  function isDisabled(row: TableRow<Row>) {
    const props = pageProps.get(row.key) ?? options?.getCheckboxProps?.(row.record);
    return Boolean(props?.disabled);
  }

  /** Публикует onSelect перед изменением ключей и onChange после него. */
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
      // Принятие ключа и замена страницы могут произойти в одном onChange.
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

  /** Применяет одно действие. Radio оставляет единственную отметку. */
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

  /** Заголовочный checkbox изменяет доступные строки только текущей страницы. */
  function togglePage(next: boolean) {
    if (input.disabled() || header.disabled || radio) {
      return;
    }

    const selected = changeTableSelection(keys, available, next);
    announce(selected, 'all');
    rangeAnchor = undefined;
  }

  /** Выбирает доступные строки обработанного набора и сохраняет уже отмеченные disabled. */
  function selectAllData() {
    const selected = [];
    for (const { row } of flattenTableRows(input.data())) {
      if (!isDisabled(row) || checked.has(row.key)) selected.push(row.key);
    }
    announce(selected, 'all');
  }

  /** Инвертирует доступные отметки страницы в её текущем порядке. */
  function invertPage() {
    const selected = new Set(keys);
    for (const key of available) {
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
    }
    announce([...selected], 'invert');
  }

  /** Ставит disabled-строки вне действия очистки, включая сохранённые записи. */
  function clearSelection() {
    const selected = keys.filter(key => {
      const row = liveRecords.get(key)
        ?? (options?.preserveSelectedRowKeys ? remembered.get(key) : undefined);
      return row && isDisabled(row);
    });
    announce(selected, 'none');
  }

  /** Выполняет команду и сбрасывает Shift-опору даже у пользовательского пункта. */
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

  /** Возвращает те же настройки контрола, из которых рассчитана доступность страницы. */
  function control(key: TableKey): TableSelectionControlProps | undefined {
    return pageProps.get(key);
  }

  /** У Checkbox дерева смешанное состояние определяется отметками потомков. */
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
