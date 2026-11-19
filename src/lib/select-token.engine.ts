// Разбирает текстовые разделители Select и сопоставляет полученные слова с допустимыми
// значениями.
import type { SelectTokenSeparators } from './select.types';
import type { SelectDataFields, SelectDataMaps, SelectDataValue } from './select-data.types';

/** @rc-component/select 1.10.1; MIT, см. vendor/LICENSE.rc-select. */
// Возвращает null, когда исходный текст не разделён. end ограничивает только завершённый
// результат.
export function splitSelectTokens(text: string, separators?: SelectTokenSeparators, end?: number) {
  if (typeof separators === 'function') {
    const words = separators(text);
    return Array.isArray(words) && words.length && !(words.length === 1 && words[0] === text)
      ? words.slice(0, end) : null;
  }
  if (!separators?.length) {
    return null;
  }
  const tokens = separators;
  let matched = false;

  // Применяет оставшиеся разделители к каждому фрагменту и убирает пустые токены.
  function split(value: string, index: number): string[] {
    const token = tokens[index];
    if (!token) {
      return [value];
    }
    const parts = value.split(token);
    if (parts.length > 1) matched = true;
    return parts.flatMap(part => split(part, index + 1)).filter(Boolean);
  }

  const words = split(text, 0);
  return matched ? words.slice(0, end) : null;
}

/** Multiple разрешает label/явные search fields, tags создаёт строки; disabled не добавляются. */
export function resolveSelectTokenOptions<Value extends SelectDataValue, Data extends object>(
  maps: SelectDataMaps<Value, Data>,
  words: readonly string[],
  tags: boolean,
  fields: SelectDataFields
): { value: Value | string; data: Data | undefined }[] {
  return words.flatMap(word => {
    const option = tags ? maps.valueOptions.get(word as Value) : maps.nativeLabelOptions.get(word);
    if (option && Reflect.get(option, 'disabled')) {
      return [];
    }
    const value: unknown = tags ? option || word.trim() ? word : undefined
      : option && Reflect.get(option, fields.value);
    if (typeof value !== 'string' && typeof value !== 'number') {
      return [];
    }
    return [{ value: value as Value | string, data: maps.valueOptions.get(value as Value) }];
  });
}
