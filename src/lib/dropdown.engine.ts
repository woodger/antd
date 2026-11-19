// Определяет доступные команды, порядок клавиатуры и текстовый поиск Dropdown.
// Источник порядка — входные items. Разделители и disabled исключаются из навигации.
import type { DropdownItem, DropdownMenuItem } from './dropdown.types';

// Первый пункт с данным ключом остаётся в списке рендеринга.
export function normalizeDropdownItems(items: readonly DropdownItem[]): DropdownItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
}

// Отбирает пункты, к которым можно перевести фокус и применить действие.
export function getDropdownCommands(items: readonly DropdownItem[]): DropdownMenuItem[] {
  return items.filter((item): item is DropdownMenuItem => item.type !== 'divider'
    && !item.disabled);
}

// При удалении активной команды начинает с первой доступной.
export function getDropdownActiveKey(items: readonly DropdownItem[], key: string | null): string | null {
  const commands = getDropdownCommands(items);
  const current = commands.find((item) => item.key === key);

  return current?.key ?? commands[0]?.key ?? null;
}

// Навигация стрелками циклична. Без текущей команды направление выбирает край списка.
export function getDropdownNavigationKey(
  items: readonly DropdownItem[],
  current: string | null,
  direction: 'next' | 'previous' | 'first' | 'last'
): string | null {
  const commands = getDropdownCommands(items);
  if (!commands.length) {
    return null;
  }
  if (direction === 'first') {
    return commands[0].key;
  }
  if (direction === 'last') {
    return commands[commands.length - 1].key;
  }

  const index = commands.findIndex((item) => item.key === current);
  if (index === -1) {
    const edge = direction === 'next' ? 0 : commands.length - 1;
    return commands[edge].key;
  }

  const step = direction === 'next' ? 1 : -1;
  const nextIndex = (index + step + commands.length) % commands.length;
  return commands[nextIndex].key;
}

// Одиночная буква ищет после текущего пункта, чтобы повторный ввод перебирал совпадения.
export function getDropdownMatch(
  commands: readonly { key: string; text: string; }[],
  current: string | null,
  query: string
): string | null {
  const search = query.trim().toLocaleLowerCase();
  if (!search || !commands.length) {
    return null;
  }

  const currentIndex = commands.findIndex((item) => item.key === current);
  const start = currentIndex < 0 ? 0 : currentIndex + (Array.from(search).length === 1 ? 1 : 0);

  for (let offset = 0; offset < commands.length; offset++) {
    const item = commands[(start + offset) % commands.length];
    if (item.text.trim().toLocaleLowerCase().startsWith(search)) {
      return item.key;
    }
  }
  return null;
}
