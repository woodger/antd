import reference from './fixtures/ant-design-popup-width-reference.json' with { type: 'json' };
import type { PopupWidthAction } from './fixtures/popup-width-cases';
import type { readPopupWidth } from './popup-width-metrics';

type View = ReturnType<typeof readPopupWidth>['view'];
const controlledSelect = new Map(['select-live-global', 'select-live-local'].map(id => {
  const entry = reference.cases.find(entry => entry.id === id)!;
  const close = entry.steps.findIndex(step => step.action.type === 'open'
    && 'value' in step.action && step.action.value === false);
  return [id, entry.steps[close - 1].view] as const;
}));

/**
 * The existing controlled Select owner retains its query and receives no onSearch on close.
 * The exact 1fb CSR baseline pins Kept query, closed caret0 and reopened caret10.
 * Fresh Source width traces keep the complete clearing callback ledger below; only these
 * two live cases' final owner close/reopen views use the established Native boundary.
 */
export function popupWidthNativeView(view: View, id: string, action?: PopupWidthAction) {
  const before = controlledSelect.get(id);
  if (!before || action?.type !== 'open') {
    return view;
  }
  if (before.query !== 'Kept query' || before.editor?.value !== 'Kept query'
    || JSON.stringify(before.editor.caret) !== '[1,5]'
    || view.query !== '' || view.editor?.value !== ''
    || JSON.stringify(view.editor.caret) !== '[0,0]'
    || JSON.stringify(view.events) !== JSON.stringify([...before.events, ['search', '']])) {
    throw Error('The frozen Source controlled-width-close observation changed');
  }
  return { ...view, query: 'Kept query', events: before.events,
    editor: { ...view.editor, value: action.value ? 'Kept query' : '',
      caret: action.value ? [10, 10] : [0, 0] } };
}
