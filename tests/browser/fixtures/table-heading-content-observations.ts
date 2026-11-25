import type source from './ant-design-table-heading-content-reference.json';

type HeadingCase = (typeof source.cases)[number];

/** У Table только числа и строки создают неявный title на th с ellipsis. */
export function expectedTableHeadingContent(
  profile: HeadingCase['profile'],
  state: HeadingCase['initial']
) {
  if (profile.type === 'zero' || profile.type === 'number' || profile.type === 'empty') {
    return state;
  }

  const headers = state.headers.map(header => ({ ...header, title: null }));
  return { ...state, headers };
}
