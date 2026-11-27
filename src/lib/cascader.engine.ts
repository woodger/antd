// Builds the Cascader index and selection. A full path identifies a node. Values missing from
// current options are stored separately from checked. Based on rc-cascader 1.22.0 under MIT. See
// vendor/LICENSE.rc-cascader.
import type {
  CascaderContent,
  CascaderFieldNames,
  CascaderOption,
  CascaderPath,
  CascaderRawValue,
  CascaderSearchConfig,
  CascaderSlots,
  CascaderStrategy
} from './cascader.types';
import { buildTreeEntities, conductTreeCheck } from './tree.engine';
import type { TreeDataNode } from './tree.types';

export const CASCADER_SHOW_PARENT = 'SHOW_PARENT';
export const CASCADER_SHOW_CHILD = 'SHOW_CHILD';

/** undefined uses the Ant icon. An allowClear object is passed to rc-select without inheritance. */
export function cascaderClearIcon(
  allowClear: boolean | { clearIcon?: CascaderContent; },
  context: CascaderContent | undefined
): CascaderContent | undefined {
  if (allowClear && typeof allowClear === 'object') {
    return allowClear.clearIcon || '×';
  }
  return context === undefined ? undefined : context || '×';
}

// Resolves each field name independently. Missing or empty names use defaults.
export function cascaderFields(fields?: CascaderFieldNames): Required<CascaderFieldNames> {
  return {
    label: fields?.label || 'label',
    value: fields?.value || 'value',
    children: fields?.children || 'children'
  };
}

// Serializes a full path to a check tree key using the rc-cascader separator.
export function cascaderPathKey(path: CascaderPath): string {
  return path.join('__RC_CASCADER_SPLIT__');
}

// Normalizes a single path and a list of paths for traversal. An empty selection yields an empty list.
export function cascaderRawValues(
  value: CascaderPath | readonly CascaderPath[] | undefined
): CascaderPath[] {
  if (!value?.length) {
    return [];
  }
  return Array.isArray(value[0]) ? [...value] as CascaderPath[] : [value as CascaderPath];
}

// Reads children from the field configured by the caller.
export function cascaderChildren<OptionType extends CascaderOption>(
  option: OptionType,
  fields: Required<CascaderFieldNames>
): readonly OptionType[] | undefined {
  return option[fields.children] as readonly OptionType[] | undefined;
}

// Gives explicit isLeaf precedence over the presence of children, including lazy loading.
export function cascaderLeaf(
  option: CascaderOption,
  fields: Required<CascaderFieldNames>
): boolean {
  return option.isLeaf ?? !cascaderChildren(option, fields)?.length;
}

// Resolves the node at each path level. After a missing branch, subsequent levels remain undefined.
export function cascaderPathOptions<OptionType extends CascaderOption>(
  path: CascaderPath,
  options: readonly OptionType[],
  fields: Required<CascaderFieldNames>
): (OptionType | undefined)[] {
  let list: readonly OptionType[] | undefined = options;
  return path.map(value => {
    const option: OptionType | undefined = list?.find(option => option[fields.value] === value);
    list = option ? cascaderChildren(option, fields) : undefined;
    return option;
  });
}

// Builds the path index and check tree in one traversal using identical keys in both.
export function cascaderIndex<OptionType extends CascaderOption>(
  options: readonly OptionType[],
  fields: Required<CascaderFieldNames>
) {
  const paths = new Map<string, { path: CascaderRawValue[]; options: OptionType[]; }>();
  // Registers the path before visiting descendants and copies node selection flags into the check tree.
  function walk(list: readonly OptionType[], parents: OptionType[]): TreeDataNode[] {
    return list.map(option => {
      const nodes = [...parents, option];
      const path = nodes.map(node => node[fields.value] as CascaderRawValue);
      const key = cascaderPathKey(path);
      paths.set(key, { path, options: nodes });
      return {
        key,
        disabled: option.disabled,
        disableCheckbox: option.disableCheckbox,
        checkable: option.checkable as boolean | undefined,
        children: walk(cascaderChildren(option, fields) ?? [], nodes)
      };
    });
  }
  const tree = buildTreeEntities(walk(options, []));
  return { paths, tree };
}

export type CascaderIndex = ReturnType<typeof cascaderIndex>;

// Separates paths absent from options and runs conduction only for multiple selection.
export function cascaderChecks(
  paths: readonly CascaderPath[],
  multiple: boolean,
  options: readonly CascaderOption[],
  fields: Required<CascaderFieldNames>,
  index: CascaderIndex
) {
  const missing: CascaderPath[] = [];
  const existing: string[] = [];
  for (const path of paths) {
    if (cascaderPathOptions(path, options, fields).every(Boolean)) {
      existing.push(cascaderPathKey(path));
    }
    else {
      missing.push(path);
    }
  }
  const checks = multiple && paths.length
    ? conductTreeCheck(existing, index.tree)
    : { checked: existing, halfChecked: [] };
  return { checked: checks.checked.map(String), half: checks.halfChecked.map(String), missing };
}

// Filters checked by ancestry, honoring SHOW_CHILD and disabled boundaries.
export function cascaderStrategy(
  checked: readonly string[],
  strategy: CascaderStrategy,
  index: CascaderIndex
): string[] {
  const keys = new Set(checked);
  return checked.filter(key => {
    const entry = index.tree.entities.get(key);
    if (!entry || entry.node.disabled) {
      return true;
    }
    if (strategy === CASCADER_SHOW_CHILD) {
      return !entry.children.some(child => Boolean(child.key) && keys.has(String(child.key)));
    }
    return !entry.parent || entry.parent.node.disabled || !keys.has(String(entry.parent.key));
  });
}

// Converts tree checked state to paths using only the selected display strategy.
export function cascaderCheckedPaths(
  checked: readonly string[],
  strategy: CascaderStrategy,
  index: CascaderIndex
): CascaderPath[] {
  const visibleKeys = cascaderStrategy(checked, strategy, index);
  return visibleKeys.map(readPath);

  // Rule 2: Valid checked values come from the same index as paths. Preserve the original entry
  // access if this input contract is violated.
  function readPath(key: string): CascaderPath {
    const entry = index.paths.get(key);
    return entry!.path;
  }
}

// Recalculates conduction after selection or removes a path that was already missing.
export function toggleCascader(
  path: CascaderPath,
  checks: ReturnType<typeof cascaderChecks>,
  strategy: CascaderStrategy,
  index: CascaderIndex
): CascaderPath[] {
  const key = cascaderPathKey(path);
  const checked = checks.checked.includes(key);
  if (!checked && checks.missing.some(path => cascaderPathKey(path) === key)) {
    return [
      ...checks.missing.filter(path => cascaderPathKey(path) !== key),
      ...cascaderCheckedPaths(checks.checked, strategy, index)
    ];
  }

  const keys = checked ? checks.checked.filter(value => value !== key) : [...checks.checked, key];
  const next = conductTreeCheck(keys, index.tree, checked ? checks.half : undefined);
  const checkedKeys = next.checked.map(String);
  return [...checks.missing, ...cascaderCheckedPaths(checkedKeys, strategy, index)];
}

// Prepares selected path labels. Missing nodes use the original value, and snippets are retained
// as-is.
export function cascaderDisplay<OptionType extends CascaderOption>(
  paths: readonly CascaderPath[],
  options: readonly OptionType[],
  fields: Required<CascaderFieldNames>,
  multiple: boolean
) {
  return paths.map(path => {
    const nodes = cascaderPathOptions(path, options, fields);
    const labels = nodes.map(
      (node, index) => (node?.[fields.label] ?? path[index]) as CascaderContent
    );
    const shown = multiple ? labels.slice(-1) : labels;
    const text = shown.every(label => typeof label === 'string' || typeof label === 'number')
      ? shown.join(' / ')
      : undefined;
    return {
      key: cascaderPathKey(path),
      path,
      options: nodes,
      labels,
      shown,
      text,
      disabled: Boolean(nodes.at(-1)?.disabled)
    };
  });
}

export interface CascaderRow<OptionType extends CascaderOption = CascaderOption> {
  key: string;
  path: CascaderRawValue[];
  options: OptionType[];
  option: OptionType;
  disabled: boolean;
  leaf: boolean;
}

// Builds search rows in option traversal order. With sort, applies the limit after sorting.
export function searchCascader<OptionType extends CascaderOption>(
  search: string,
  options: readonly OptionType[],
  fields: Required<CascaderFieldNames>,
  config: CascaderSearchConfig<OptionType>,
  includeParents: boolean
): CascaderRow<OptionType>[] {
  if (!search) {
    return [];
  }
  const limit = config.limit ?? 50;
  const rows: CascaderRow<OptionType>[] = [];
  // The default filter matches labels case-insensitively.
  const filter = config.filter ?? ((text: string, path: OptionType[]) => path.some(
    option => {
      const label = option[fields.label];
      // A Snippet corresponds to an opaque ReactNode, without inspecting the render function's source.
      const value = typeof label === 'function' ? '[object Object]' : String(label);
      return value.toLowerCase().includes(text.toLowerCase());
    }
  ));
  // Traverses branches with inherited disabled state. Without sorting, traversal can stop as soon
  // as it reaches the limit.
  function walk(list: readonly OptionType[], parents: OptionType[], parentDisabled: boolean) {
    for (const option of list) {
      if (!config.sort && limit !== false && limit > 0 && rows.length >= limit) {
        return;
      }
      const pathOptions = [...parents, option];
      const children = cascaderChildren(option, fields);
      const disabled = parentDisabled || Boolean(option.disabled);
      if ((!children?.length || includeParents)
        && filter(search, pathOptions, { label: fields.label })) {
        const path = pathOptions.map(node => node[fields.value] as CascaderRawValue);
        rows.push({
          key: cascaderPathKey(path),
          path,
          options: pathOptions,
          option,
          disabled,
          leaf: option.isLeaf ?? true
        });
      }
      if (children) walk(children, pathOptions, disabled);
    }
  }
  walk(options, [], false);
  if (config.sort) {
    // Rule 2: Each comparison reads sort from the original config.
    rows.sort((first, second) => config.sort!(first.options, second.options, search, fields));
  }
  return limit !== false && limit > 0 ? rows.slice(0, limit) : rows;
}

// Builds successive columns along the active path through the end of the existing branch.
export function cascaderColumns<OptionType extends CascaderOption>(
  options: readonly OptionType[],
  active: CascaderPath,
  fields: Required<CascaderFieldNames>
): CascaderRow<OptionType>[][] {
  const columns: CascaderRow<OptionType>[][] = [];
  let nodes: OptionType[] = [];
  let list = options;
  for (let depth = 0; list.length; depth++) {
    const rows = list.map(option => {
      const pathOptions = [...nodes, option];
      const path = pathOptions.map(node => node[fields.value] as CascaderRawValue);
      return {
        key: cascaderPathKey(path),
        path,
        options: pathOptions,
        option,
        disabled: Boolean(option.disabled),
        leaf: cascaderLeaf(option, fields)
      };
    });
    columns.push(rows);
    if (depth >= active.length) break;
    const row = rows.find(row => row.option[fields.value] === active[depth]);
    if (!row) break;
    nodes = row.options;
    list = cascaderChildren(row.option, fields) ?? [];
  }
  return columns;
}

/** rc-cascader keyboard handling uses one search column. Arrow keys skip disabled items. */
export function navigateCascader(
  columns: readonly (readonly CascaderRow[])[],
  active: CascaderPath,
  key: string,
  rtl: boolean,
  searchKey?: string | null
): { path?: CascaderRawValue[]; searchKey?: string; close?: boolean; } {
  const searching = searchKey !== undefined;
  let depth = 0;
  let selected: CascaderRow | undefined;
  if (searching) {
    selected = columns[0]?.find(row => row.key === searchKey);
  }
  else {
    for (let position = 0; position < active.length; position++) {
      const row = columns[position]?.find(row => row.path[position] === active[position]);
      if (!row) break;
      selected = row;
      depth = position;
    }
  }
  const rows = columns[depth] ?? [];
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    const offset = key === 'ArrowDown' ? 1 : -1;
    let position = selected ? rows.indexOf(selected) : offset < 0 ? rows.length : -1;
    for (let count = 0; count < rows.length; count++) {
      position = (position + offset + rows.length) % rows.length;
      const row = rows[position];
      if (!row.disabled) {
        return searching ? { searchKey: row.key } : { path: row.path };
      }
    }
  }
  if (!searching) {
    const previous = key === 'Backspace' || key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (previous) {
      return selected && selected.path.length > 1
        ? { path: selected.path.slice(0, -1) }
        : { close: true };
    }
    if (key === (rtl ? 'ArrowLeft' : 'ArrowRight') && selected) {
      const child = columns[depth + 1]?.find(row => !row.disabled);
      if (child) {
        return { path: child.path };
      }
    }
  }
  return {};
}

// Marks non-overlapping matches while preserving the original label text and case.
export function cascaderHighlight(label: string | number, search: string) {
  const text = String(label);
  if (!search) {
    return [{ text, match: false }];
  }
  const lower = text.toLowerCase();
  const term = search.toLowerCase();
  const parts: { text: string; match: boolean; }[] = [];
  let position = 0;
  for (;;) {
    const next = lower.indexOf(term, position);
    if (next < 0) break;
    parts.push({ text: text.slice(position, next), match: false });
    parts.push({ text: text.slice(next, next + term.length), match: true });
    position = next + term.length;
  }
  parts.push({ text: text.slice(position), match: false });
  return parts;
}

// Merges class or style layers separately for each control and popup part.
export function mergeCascaderSlots(
  values: (CascaderSlots<string> | undefined)[],
  separator: string
) {
  // Joins nonempty layers in input order and omits an empty result.
  const join = (parts: (string | undefined)[]) =>
    parts.filter(Boolean).join(separator) || undefined;
  // Normalizes the popup string shorthand to the root slot value.
  const popup = (value: CascaderSlots<string> | undefined) =>
    typeof value?.popup === 'string' ? { root: value.popup } : value?.popup;
  return {
    root: join(values.map(value => value?.root)),
    prefix: join(values.map(value => value?.prefix)),
    suffix: join(values.map(value => value?.suffix)),
    input: join(values.map(value => value?.input)),
    placeholder: join(values.map(value => value?.placeholder)),
    content: join(values.map(value => value?.content)),
    item: join(values.map(value => value?.item)),
    itemContent: join(values.map(value => value?.itemContent)),
    itemRemove: join(values.map(value => value?.itemRemove)),
    popup: {
      root: join(values.map(value => popup(value)?.root)),
      list: join(values.map(value => popup(value)?.list)),
      listItem: join(values.map(value => popup(value)?.listItem))
    }
  };
}
