import type source from './ant-design-table-semantic-reference.json';

type SourceState = (typeof source.cases)[number]['states'][number]['state'];
type SourceNode = SourceState['semantic'][number];

/** В исходных снимках Table размещает Pagination в промежуточном flex-контейнере. */
function isTablePager({ tag, classes }: SourceNode) {
  return tag === 'ul' && classes.some(value => value.endsWith('-pager'));
}

/** Учитывает нативные ячейки виртуального тела в Svelte. */
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

/** Сохраняет согласованный class из onHeaderRow перед semantic слоями. */
function withCallerHeaderClass(classes: string[], profile: string) {
  const layered = profile === 'layers' || profile === 'reactive';
  return layered && classes.some(value => value.endsWith('-header-row'))
    ? ['observed-caller-header-row', ...classes] : classes;
}

/** Проецирует семантический контекст React на элементы нативной таблицы. */
export function expectedTableSemantics(profile: string, state: SourceState) {
  const root = state.semantic[0];
  const semantic = state.semantic.map(node => {
    if (isTablePager(node)) {
      return { ...node, tag: 'nav', parent: root.classes };
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
