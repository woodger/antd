// Synchronizes the values and keys of rows FormList. When you move or delete, the former key
// remains associated with its string.
interface FormListKeys {
  keys: number[];
  nextKey: number;
}

type FormListAction =
  | { type: 'add'; value?: unknown; index?: number }
  | { type: 'remove'; index: number | readonly number[] }
  | { type: 'move'; from: number; to: number };

// Highlights new keys only to completed positions without a key. Saves the link to the state when
// the keys are enough.
export function syncFormListKeys(state: FormListKeys, values: readonly unknown[]): FormListKeys {
  let keys = state.keys;
  let nextKey = state.nextKey;

  values.forEach((_, index) => {
    if (keys[index] === undefined) {
      if (keys === state.keys) keys = state.keys.slice();
      keys[index] = nextKey++;
    }
  });

  return keys === state.keys ? state : { keys, nextKey };
}

/** Transfer key management from rc-form 1.8.6 List: external replacement retains the keys on the indexes. */
export function changeFormList(
  values: readonly unknown[],
  state: FormListKeys,
  action: FormListAction
): { values: unknown[]; state: FormListKeys } | undefined {
  if (action.type === 'add') {
    const index = action.index;
    const insert = index !== undefined && index >= 0 && index <= values.length;
    const nextValues = insert
      ? [...values.slice(0, index), action.value, ...values.slice(index)]
      : [...values, action.value];
    const nextKeys = insert
      ? [...state.keys.slice(0, index), state.nextKey, ...state.keys.slice(index)]
      : [...state.keys, state.nextKey];

    return {
      values: nextValues,
      state: { keys: nextKeys, nextKey: state.nextKey + 1 }
    };
  }

  if (action.type === 'remove') {
    const removed = new Set(Array.isArray(action.index) ? action.index : [action.index]);
    if (!removed.size) {
      return;
    }

    return {
      values: values.filter((_, index) => !removed.has(index)),
      state: {
        keys: state.keys.filter((_, index) => !removed.has(index)),
        nextKey: state.nextKey
      }
    };
  }

  const { from, to } = action;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to
    || from < 0 || to < 0 || from >= values.length || to >= values.length) {
    return;
  }

  const movedValues = [...values];
  const movedKeys = [...state.keys];
  const [movedValue] = movedValues.splice(from, 1);
  movedValues.splice(to, 0, movedValue);

  const [movedKey] = movedKeys.splice(from, 1);
  movedKeys.splice(to, 0, movedKey);

  return { values: movedValues, state: { keys: movedKeys, nextKey: state.nextKey } };
}
