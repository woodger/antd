// Disassembles text dividers Select and compares the received words with the permissible values.
import type { SelectTokenSeparators } from './select.types';
import type { SelectDataFields, SelectDataMaps, SelectDataValue } from './select-data.types';

/** @rc-component/select 1.10.1; MIT, see vendor/LICENSE.rc-select. */
// Returns null, when the original text is not separated. end limits only the completed result.
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

  // Applies the remaining dividers to each fragment and removes empty tokens.
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

/** Multiple allows label/obvious search fields, tags creates strings; disabled are not added. */
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
