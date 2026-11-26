// Упорядочивает варианты Mentions и вычисляет текстовые изменения вокруг каретки.
import type { MentionsConfig, MentionsEntity, MentionsOption } from './mentions.types';

export function getMentionMeasure(text: string, prefixes: readonly string[]) {
  return prefixes.reduce((last, prefix) => {
    const location = text.lastIndexOf(prefix);
    return location > last.location ? { location, prefix } : last;
  }, { location: -1, prefix: '' });
}
export function validateMentionSearch(text: string, split = ' ') {
  return !split || !text.includes(split);
}
/** Пустое значение участвует в поиске так же, как отсутствующее. */
export function filterMentionOption(text: string, option: MentionsOption) {
  const value = option.value ?? '';
  return value.toLowerCase().includes(text.toLowerCase());
}

interface MentionMenuRow {
  option: MentionsOption;
  menuKey: string;
  domKey: string;
}

/** Сохраняет исходный ключ выбора и даёт каждому повтору собственный ключ Svelte. */
export function buildMentionMenuRows(options: readonly MentionsOption[]): MentionMenuRow[] {
  const occurrences = new Map<string, number>();
  const rows: MentionMenuRow[] = [];
  for (const option of options) {
    const menuKey = String(option.key ?? option.value);
    const occurrence = occurrences.get(menuKey) ?? 0;
    occurrences.set(menuKey, occurrence + 1);
    rows.push({ option, menuKey, domKey: `${menuKey}:${occurrence}` });
  }
  return rows;
}

export function replaceMention(
  text: string,
  { location, prefix, target, selectionStart, split }: {
    location: number;
    prefix: string;
    target: string;
    selectionStart: number;
    split: string;
  }
) {
  let before = text.slice(0, location);
  if (before[before.length - split.length] === split)
    before = before.slice(0, before.length - split.length);
  if (before)
    before += split;

  let rest = text.slice(selectionStart);
  const overlap = target.slice(selectionStart - location - prefix.length);
  if (rest[0] && rest[0] !== split) {
    for (let index = 0; index < overlap.length; index++) {
      if ((rest[index] ?? '').toLowerCase() !== (overlap[index] ?? '').toLowerCase()) {
        rest = rest.slice(index);
        break;
      }
      if (index === overlap.length - 1)
        rest = rest.slice(overlap.length);
    }
  }
  if (rest.slice(0, split.length) === split)
    rest = rest.slice(split.length);
  const head = `${before}${prefix}${target}${split}`;
  return { text: head + rest, selection: head.length };
}

export function getMentions(value = '', {
  prefix = '@',
  split = ' '
}: MentionsConfig = {}): MentionsEntity[] {
  const prefixes = typeof prefix === 'string' ? [prefix] : prefix;
  return value.split(split).flatMap(part => {
    const token = prefixes.find(item => part.startsWith(item));
    const text = token === undefined ? '' : part.slice(token.length);
    return token !== undefined && text ? [{ prefix: token, value: text }] : [];
  });
}
