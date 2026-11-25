import type source from './ant-design-table-config-reference.json';

type Case = (typeof source.cases)[number];
type State = Case['states'][number]['state'];

/** Сопоставляет расположение той же сетки в одном нативном scrollport. */
export function expectedTableConfig(state: State) {
  const { keys, maxHeight, size, tableLayout, tableOverride, rtl, events, header } = state;
  const { width } = state;
  return {
    keys, maxHeight, size, tableLayout, tableOverride, rtl, events, header,
    width: width === 'auto' ? 'auto' : '',
    minWidth: width === 'auto' ? '100%' : width
  };
}

/** Обычная таблица сохраняет позицию до явного scrollToFirstRowOnChange. */
export function expectedTableConfigScroll(sample: Case, index: number) {
  const { action, state } = sample.states[index];
  if (sample.profile.id === 'local-scroll-y' && action === 'sort') {
    return sample.states[index - 1].state.scroll;
  }

  return state.scroll;
}
