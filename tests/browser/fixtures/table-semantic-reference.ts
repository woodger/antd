import type source from './ant-design-table-semantic-reference.json';

type SourceState = (typeof source.cases)[number]['states'][number]['state'];
type SourceNode = SourceState['semantic'][number];

/** In the original images, Table places Pagination in an intermediate flex-container. */
function isTablePager({ tag, classes }: SourceNode) {
  return tag === 'ul' && classes.some(value => value.endsWith('-pager'));
}

/** Takes into account the native cells of the virtual body in Svelte. */
function nativeTag(tag: string, classes: readonly string[], profile: string) {
  if (tag === 'div' && profile === 'virtual') {
    if (classes.some(value => value.endsWith('-body-row'))) {
      return 'tr';
    }
    if (classes.some(value => value.endsWith('-body-cell'))) {
      return 'td';
    }
  }

  return tag;
}

/** Saves the agreed class from onHeaderRow before semantic layers. */
function withCallerHeaderClass(classes: string[], profile: string) {
  const layered = profile === 'layers' || profile === 'reactive';
  return layered && classes.some(value => value.endsWith('-header-row'))
    ? ['observed-caller-header-row', ...classes] : classes;
}

/** Projects the semantic context of React into elements of a native table. */
export function expectedTableSemantics(profile: string, state: SourceState) {
  const semantic = state.semantic.map(node => {
    if (isTablePager(node)) {
      return { ...node, tag: 'nav' };
    }

    return {
      ...node,
      tag: nativeTag(node.tag, node.classes, profile),
      classes: withCallerHeaderClass(node.classes, profile),
      parent: withCallerHeaderClass(node.parent, profile)
    };
  });

  return { ...state, semantic };
}
