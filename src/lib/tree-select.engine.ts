// Готовит индекс узлов, расчёт checked, фильтрацию и подписи TreeSelect.
// Исходные узлы сохраняются отдельно от TreeDataNode для пользовательских callbacks.
import { buildTreeEntities, conductTreeCheck, treeCheckDisabled } from './tree.engine';
import type { TreeBasicDataNode, TreeDataNode, TreeKey } from './tree.types';
import { treeSelectChildren, treeSelectFields, treeSelectNodeLabel, treeSelectNodeValue } from './tree-select-data.engine';
import type {
  TreeSelectNode,
  TreeSelectRawValue,
  TreeSelectValue,
  TreeSelectLabel,
  TreeSelectLabeledValue,
  TreeSelectStrategy,
  TreeSelectSearchConfig,
  TreeSelectFieldNames
} from './tree-select.types';
// rc-tree-select 1.16.1; MIT, vendor/LICENSE.rc-tree-select.
export const TREE_SELECT_SHOW_ALL = 'SHOW_ALL';
export const TREE_SELECT_SHOW_PARENT = 'SHOW_PARENT';
export const TREE_SELECT_SHOW_CHILD = 'SHOW_CHILD';

// Индексирует значения и адаптирует узлы к контракту Tree, сохраняя их порядок.
export function treeSelectIndex<Data extends object>(
  nodes: readonly Data[],
  fieldNames?: TreeSelectFieldNames,
  renderers?: Required<Pick<TreeBasicDataNode, 'icon' | 'switcherIcon'>>
) {
  const fields = treeSelectFields(fieldNames);
  const values = new Map<TreeSelectRawValue, Data>();
  const data = nodes.map(indexNode);
  const tree = buildTreeEntities(data);
  return { ...tree, data, values, fields };

  // Регистрирует родителя раньше потомков, не меняя исходную запись.
  function indexNode(node: Data): TreeDataNode {
    const value = treeSelectNodeValue(node, fields);
    const children = treeSelectChildren(node, fields);
    const className = (Reflect.get(node, 'class') ?? Reflect.get(node, 'className')) as string | undefined;
    values.set(value, node);

    return {
      ...node,
      ...(className !== undefined ? { class: className } : {}),
      ...(renderers && Reflect.get(node, 'icon') ? { icon: renderers.icon } : {}),
      ...(renderers && Reflect.get(node, 'switcherIcon') ? { switcherIcon: renderers.switcherIcon } : {}),
      key: value,
      title: treeSelectNodeLabel(node, fields),
      children: Reflect.get(node, fields.children) ? children.map(indexNode) : undefined
    };
  }
}
export type TreeSelectIndex<Data extends object = TreeSelectNode> = ReturnType<typeof treeSelectIndex<Data>>;

// Сохраняет переданный label и halfChecked при копировании объекта значения.
export function treeSelectLabeled(value: TreeSelectValue): TreeSelectLabeledValue[] {
  const values = value === undefined || value === null
    ? []
    : Array.isArray(value) ? value : [value];
  return values.map(item => typeof item === 'object' ? { ...item } : { value: item });
}
// Дополняет ручной выбор результатом conduction и сохраняет отсутствующие ключи.
export function treeSelectChecks(
  items: readonly TreeSelectLabeledValue[],
  conduction: boolean,
  index: TreeSelectIndex<object>
) {
  const raw = items.filter(item => !item.halfChecked).map(item => item.value);
  if (!conduction) {
    return {
      checked: raw,
      halfChecked: items.filter(item => item.halfChecked).map(item => item.value)
    };
  }
  const checked = conductTreeCheck(raw, index);
  const missing = raw.filter(value => !index.values.has(value));
  return {
    checked: [...new Set([...missing, ...checked.checked])] as TreeSelectRawValue[],
    halfChecked: checked.halfChecked as TreeSelectRawValue[]
  };
}
// Скрывает теги по стратегии показа. Список checked остаётся прежним.
export function treeSelectStrategy(
  values: readonly TreeSelectRawValue[],
  strategy: TreeSelectStrategy,
  index: TreeSelectIndex<object>
): TreeSelectRawValue[] {
  const selected = new Set<TreeKey>(values);
  return values.filter(key => {
    const entry = index.entities.get(String(key));
    if (!entry) {
      return true;
    }
    if (strategy === 'SHOW_CHILD') {
      return !entry.children.some(child => selected.has(child.key))
        || !entry.children.every(
          child => treeCheckDisabled(child.node) || selected.has(child.key)
        );
    }
    if (strategy === 'SHOW_PARENT') {
      return !entry.parent
        || treeCheckDisabled(entry.node)
        || treeCheckDisabled(
          entry.parent.node
        )
        || !selected.has(
          entry.parent.key
        );
    }
    return true;
  });
}
// Дополняет подписи выбранных значений текущим узлом или предыдущим снимком.
export function treeSelectLabels<Data extends object>(
  items: readonly TreeSelectLabeledValue[],
  index: TreeSelectIndex<Data>,
  labelProp?: string,
  previous: readonly TreeSelectLabeledValue[] = items,
  renderLabel?: (node: Data, fallback: TreeSelectLabel) => TreeSelectLabel
): TreeSelectLabeledValue[] {
  return items.map(createLabel);

  // Приоритет переданного label сохраняется для пустой строки и числового 0.
  function createLabel(item: TreeSelectLabeledValue): TreeSelectLabeledValue {
    const node = index.values.get(item.value);
    let label = item.label;
    if (label == null) {
      if (node) {
        label = treeSelectNodeLabel(node, index.fields, labelProp);
      }
      else {
        const previousItem = previous.find(old => old.value === item.value);
        label = previousItem?.label;
      }
    }

    return {
      label: node && renderLabel ? renderLabel(node, label) : label,
      value: item.value,
      halfChecked: item.halfChecked,
      disabled: node ? Reflect.get(node, 'disabled') as boolean | undefined : undefined
    };
  }
}

// Сохраняет ветку целиком, если фильтр принимает её родителя.
export function filterTreeSelect<Data extends object>(
  nodes: readonly Data[],
  search: string,
  config: TreeSelectSearchConfig<Data>,
  fieldNames?: TreeSelectFieldNames
): readonly Data[] {
  if (!search || config.filterTreeNode === false) {
    return nodes;
  }
  const filter = typeof config.filterTreeNode === 'function'
    ? config.filterTreeNode
    : (text: string, node: Data) => String(Reflect.get(node, config.treeNodeFilterProp
      ?? 'value')).toUpperCase().includes(
        text.toUpperCase()
      );
  const fields = treeSelectFields(fieldNames);
  // Копирует только отображаемые узлы и заменяет их список детей отфильтрованной версией.
  function visit(list: readonly Data[], keepAll = false): Data[] {
    return list.flatMap(node => {
      const match = keepAll || filter(search, { ...node });
      const children = visit(treeSelectChildren(node, fields), match);
      return match || children.length ? [{ ...node, isLeaf: undefined, [fields.children]: children }] : [];
    });
  }
  return visit(nodes);
}
// Вычисляет новый набор checked, оставляя отсутствующие в дереве значения в начале.
export function toggleTreeSelect(
  value: TreeSelectRawValue,
  selected: boolean,
  items: readonly TreeSelectLabeledValue[],
  checks: ReturnType<typeof treeSelectChecks>,
  conduction: boolean,
  index: TreeSelectIndex<object>
): TreeSelectRawValue[] {
  const raw = selected
    ? [...items.filter(item => !item.halfChecked).map(item => item.value), value]
    : checks.checked.filter(item => item !== value);
  if (!conduction) {
    return raw;
  }
  const missing = raw.filter(item => !index.values.has(item));
  const known = raw.filter(item => index.values.has(item));
  const result = selected
    ? conductTreeCheck(known, index)
    : conductTreeCheck(known, index, checks.halfChecked);
  return [...missing, ...result.checked as TreeSelectRawValue[]];
}
