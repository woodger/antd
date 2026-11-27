import type source from './ant-design-table-locale-reference.json';

type State = (typeof source.cases)[number]['states'][number]['state'];

/** Native opening buttons add a string key. Native hides an empty cell when loading. */
export function expectedTableLocale(profile: string, state: State) {
  const expand = state.expand.map(item => ({
    ...item,
    label: item.label + ' ' + item.key
  }));
  const empty = profile === 'loading-empty' && state.loading
    ? { text: '', preset: false, rich: false, draft: null } : state.empty;

  return { ...state, expand, empty };
}
