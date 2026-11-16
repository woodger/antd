import { isDeepStrictEqual } from 'node:util';
import { selectVirtualData, type SelectVirtualAction } from './fixtures/select-virtual-cases';
import {
  selectVirtualReference, selectVirtualNativeCases, selectVirtualBlurNativeBaseline,
  selectVirtualQueryNativeBaseline, selectVirtualQueryCaretNativeBaseline, type SelectVirtualView
} from './select-virtual-reference';

function connectedBlurEvents(view: SelectVirtualView, id: string, action: SelectVirtualAction | undefined) {
  if (id !== 'select-focus-ref' && id !== 'auto-complete-focus-ref') return null;
  const source = selectVirtualReference.cases.find(entry => entry.id === id)!;
  const blurIndex = source.steps.findIndex(step => step.action.type === 'ref' && step.action.method === 'blur');
  const currentIndex = source.steps.findIndex(step => isDeepStrictEqual(step.action, action)
    && isDeepStrictEqual(step.view.events, view.events));
  if (currentIndex < 0) throw Error(`${id}: original Source focus ledger/action guard changed`);
  if (currentIndex < blurIndex) return null;
  const before = source.steps[blurIndex - 1].view.events;
  const prefix = [...before, ['blur'], ['open', false]];
  const proof = selectVirtualBlurNativeBaseline.cases.find(entry => entry.id === id)!;
  if (!isDeepStrictEqual(source.steps[blurIndex].view.events, prefix)
    || !isDeepStrictEqual(view.events.slice(0, prefix.length), prefix)
    || !isDeepStrictEqual(proof.synchronous.after.slice(-2), [['open', false], ['blur']]))
    throw Error(`${id}: connected blur proof or complete Source prefix changed`);
  // Reorder the one proven synchronous Native pair; all preceding/following events stay verbatim.
  return [...before, ['open', false], ['blur'], ...view.events.slice(prefix.length)];
}

function retainedQueryView(view: SelectVirtualView, id: string, action: SelectVirtualAction | undefined) {
  if (id === 'select-live-props') {
    const source = selectVirtualNativeCases.find(entry => entry.id === id)!;
    const closeIndex = source.steps.findIndex(step => step.action.type === 'open' && !step.action.value);
    const index = source.steps.findIndex(step => isDeepStrictEqual(step.action, action)
      && isDeepStrictEqual(step.view.events, view.events));
    if (index < 0) throw Error('Select live Source action/full-ledger guard changed');
    if (index < closeIndex) return null;
    const before = source.steps[closeIndex - 1].view;
    const proof = selectVirtualQueryCaretNativeBaseline.cases[0];
    if (before.query !== 'Kept query' || before.editor?.value !== 'Kept query'
      || !isDeepStrictEqual(source.steps[closeIndex].view.events, before.events)
      || !isDeepStrictEqual(view.events.slice(0, before.events.length), before.events)
      || !view.editor || view.model !== null || view.query !== 'Kept query' || view.editor.value !== 'Kept query'
      || !isDeepStrictEqual(view.editor.caret, [1, 5]) || proof.trace[1].query !== 'Kept query')
      throw Error('Select retained-query Source prefix or historical proof changed');
    const editorProof = proof.trace[view.editor.expanded === 'true' ? 2 : 1].editor;
    // The whole Source owner already supplies the actual query and every callback unchanged.
    return { ...view, editor: { ...view.editor, value: editorProof.value, caret: [...editorProof.caret] } };
  }
  if (id === 'select-ref-closed' && view.query === '09' && view.editor?.expanded === 'false') {
    const source = selectVirtualNativeCases.find(entry => entry.id === id)!;
    const index = source.steps.findIndex(step => isDeepStrictEqual(step.action, action)
      && isDeepStrictEqual(step.view.events, view.events) && step.view.query === '09');
    const proof = selectVirtualQueryNativeBaseline.cases.find(entry => entry.id === 'select-controlled-query-09')!;
    if ((index !== 20 && index !== 21) || view.editor.value !== '09'
      || !isDeepStrictEqual(view.editor.caret, [2, 2])
      || !isDeepStrictEqual(proof.trace[4].editor, { value: '', caret: [0, 0], focused: true }))
      throw Error('Select closed-owner query Source action/ledger or historical editor proof changed');
    return { ...view, editor: { ...view.editor, value: '', caret: [0, 0] } };
  }
  return null;
}

/** Frozen Source views with proven Native editor, operative ARIA and connected-blur contracts. */
export function selectVirtualNativeView(view: SelectVirtualView, id: string,
  phase: 'initial' | 'step' | 'hydrated-initial' = 'step', action?: SelectVirtualAction): SelectVirtualView {
  if (phase === 'step') {
    const events = connectedBlurEvents(view, id, action);
    if (events) return { ...view, events };
    const queryView = retainedQueryView(view, id, action);
    if (queryView) return queryView;
  }
  const editor = view.editor;
  if (editor?.expanded === 'true' && editor.controls
    && editor.activeDescendant === `${editor.controls}_-1`) {
    const lastActive: unknown = view.events.findLast((entry: unknown) => Array.isArray(entry) && entry[0] === 'active');
    const options = view.popup?.viewport.aria.flatMap(listbox => listbox.options) ?? [];
    // Actual Source emits a dangling index -1 after reporting no active option.
    // Native retains its existing policy of exposing only an operative ARIA link.
    if (Array.isArray(lastActive) && lastActive.length === 2 && lastActive[1] === null
      && !options.some(option => option.id === editor.activeDescendant))
      return { ...view, editor: { ...editor, activeDescendant: null } };
  }
  if (id === 'select-selected-open' && view.editor?.expanded === 'false') {
    const option = selectVirtualData().find(option => option.value === view.model);
    if (!option || view.model !== 'v-060' || view.query !== '' || view.editor.value !== ''
      || view.editor.caret.some(value => value !== 0)) throw Error('Closed selected Source editor guard changed');
    const caret = phase === 'hydrated-initial' ? 0 : option.label.length;
    return { ...view, editor: { ...view.editor, value: option.label, caret: [caret, caret] } };
  }
  // Hydration preserves the server-created editor's caret before any click/focus action.
  if (phase === 'hydrated-initial' && id === 'auto-complete-selected-open') {
    if (!view.editor || view.model !== 'v-060' || view.query !== 'v-060' || view.editor.value !== 'v-060'
      || view.editor.caret.some(value => value !== 5)) throw Error('Selected AC Source initial editor guard changed');
    return { ...view, editor: { ...view.editor, caret: [0, 0] } };
  }
  return view;
}

/** Each Native active-descendant attribute must resolve to one actual logical option. */
export function readSelectVirtualAriaIntegrity() {
  const refs: { editor?: HTMLInputElement | HTMLTextAreaElement } = {};
  document.querySelector('[data-select-virtual-command]')!
    .dispatchEvent(new CustomEvent('virtualrefs', { detail: refs }));
  const id = refs.editor!.getAttribute('aria-activedescendant');
  if (id === null) return true;
  const roots: (Document | ShadowRoot)[] = [document];
  for (const host of document.querySelectorAll('[data-select-virtual-shadow]'))
    if (host.shadowRoot) roots.push(host.shadowRoot);
  const targets = roots.map(root => root.getElementById(id)).filter(node => node != null);
  return targets.length === 1 && targets[0]!.getAttribute('role') === 'option';
}
