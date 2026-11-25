// Преобразует варианты фильтра в пункты Menu и узлы Tree. Ключи представления
// отделены от значений фильтра, в том числе для 0, '0' и false.
import type { MenuItemType } from './menu.types';
import type { TableFilterOption } from './table.types';

export interface TableFilterNode {
  key: string;
  title: TableFilterOption['text'];
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

/** Запоминает все позиции вложенных массивов и сохраняет ссылки на snippets. */
function snapshotLabel(text: TableFilterOption['text']): TableFilterOption['text'] {
  return Array.isArray(text) ? Array.from(text, snapshotLabel) : text;
}

/** Запоминает структуру, значения и подписи открытого списка, включая пустые ветви. */
export function snapshotTableFilterOptions(options: readonly TableFilterOption[]) {
  return Array.from(walkTableFilterOptions(options), option => ({
    value: option.value,
    text: snapshotLabel(option.text),
    children: option.children?.length
  }));
}

/** Сравнивает содержимое массива подписи без вызова вложенных snippets. */
function sameLabel(left: TableFilterOption['text'], right: TableFilterOption['text']): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return Object.is(left, right);
  }

  return left.length === right.length && left.every((child, index) => sameLabel(child, right[index]));
}

type OptionSnapshot = ReturnType<typeof snapshotTableFilterOptions>;

/** Проверяет, подходят ли открытой панели текущие значения, подписи и глубина списка. */
export function areTableFilterOptionsEqual(current: OptionSnapshot, opened: OptionSnapshot) {
  return current.length === opened.length && current.every((item, index) => {
    const previous = opened[index];
    return Object.is(item.value, previous.value)
      && sameLabel(item.text, previous.text)
      && item.children === previous.children;
  });
}

/** Встроенный поиск сравнивает только текстовые и числовые подписи Source. */
export function matchesTableFilterText(text: TableFilterOption['text'], query: string) {
  if (typeof text !== 'string' && typeof text !== 'number') {
    return false;
  }

  return String(text).toLowerCase().includes(query);
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
