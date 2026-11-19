import reference from './fixtures/ant-design-popup-overflow-reference.json' with { type: 'json' };
import type { PopupOverflowAction } from './fixtures/popup-overflow-cases';
import type { readPopupOverflow } from './popup-overflow-metrics';

type View = ReturnType<typeof readPopupOverflow>['view'];
const select = reference.cases.find(entry => entry.id === 'select-live-cache')!;
const closeIndex = select.steps.findIndex(step => step.action.type === 'open'
  && 'value' in step.action && step.action.value === false);
const preCloseEvents = select.steps[closeIndex - 1].view.events;

/**
 * Existing controlled Select policy: owners clear their own query; close does not call onSearch.
 * Exact 1fb CSR replay pins retained "Kept query", closed caret0 and reopened caret10.
 * Only the two owner open actions use this boundary. Source data and every geometry field stay raw.
 */
export function popupOverflowNativeView(view: View, id: string, action?: PopupOverflowAction) {
  if (id !== 'select-live-cache' || action?.type !== 'open') {
    return view;
  }
  if (view.query !== '' || view.editor?.value !== ''
    || JSON.stringify(view.editor.caret) !== '[0,0]'
    || JSON.stringify(view.events) !== JSON.stringify([...preCloseEvents, ['search', '']])) {
    throw Error('The frozen Source controlled-close observation changed');
  }
  return { ...view, query: 'Kept query', events: preCloseEvents,
    editor: { ...view.editor, value: action.value ? 'Kept query' : '',
      caret: action.value ? [10, 10] : [0, 0] } };
}
