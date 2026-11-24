// Преобразует варианты фильтра в пункты Menu и узлы Tree. Ключи представления
// отделены от значений фильтра, в том числе для 0, '0' и false.
import type { MenuItemType } from './menu.types';
import type { TableFilterOption } from './table.types';

export interface TableFilterNode {
  key: string;
  title: string;
  option: TableFilterOption;
  children?: TableFilterNode[];
}

/** Обходит ветви и листья в порядке объявления, включая значения самих ветвей. */
export function* walkTableFilterOptions(
  options: readonly TableFilterOption[]
): Generator<TableFilterOption> {
  for (const option of options) {
    yield option;
    if (option.children) {
      yield* walkTableFilterOptions(option.children);
    }
  }
}

/** Запоминает структуру, значения и подписи открытого списка, включая пустые ветви. */
export function snapshotTableFilterOptions(options: readonly TableFilterOption[]) {
  return Array.from(walkTableFilterOptions(options), option => ({
    value: option.value,
    text: option.text,
    children: option.children?.length
  }));
}

/** Связывает узлы интерфейса с исходными вариантами. Ключи строятся по пути внутри колонки. */
export function getTableFilterNodes(
  options: readonly TableFilterOption[], parentKey = ''
): TableFilterNode[] {
  return options.map((option, index) => {
    const key = `${parentKey}/${index}`;
    const children = option.children ? getTableFilterNodes(option.children, key) : undefined;
    return { key, title: option.text, option, children };
  });
}

/** Обходит подготовленные узлы в том же порядке, в котором Table принимает варианты. */
export function* walkTableFilterNodes(
  nodes: readonly TableFilterNode[]
): Generator<TableFilterNode> {
  for (const node of nodes) {
    yield node;
    if (node.children) {
      yield* walkTableFilterNodes(node.children);
    }
  }
}

/** При поиске сохраняет заголовки групп, скрывая неподходящие листья. */
export function getTableFilterMenu(
  nodes: readonly TableFilterNode[],
  matches: (option: TableFilterOption) => boolean,
  popupClassName: string
): MenuItemType[] {
  return nodes.map(node => {
    if (node.children) {
      return {
        key: node.key,
        label: node.title,
        popupClassName,
        children: getTableFilterMenu(node.children, matches, popupClassName)
      };
    }

    return matches(node.option) ? { key: node.key, label: node.title } : null;
  });
}
