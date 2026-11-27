/** Ordinary public inputs, fixed before Original measurement. */
export const autocompleteRenderGeometry = { viewport: { width: 1200, height: 900 }, root: { left: 300, top: 200, width: 280 } };
export const autocompleteRenderSamples = [
  { id: 'autocomplete-render-flat', dataset: 'flat', renderer: 'rich', labelRenderer: 'rich', initialValue: 'a', filter: false },
  { id: 'autocomplete-render-groups', dataset: 'mapped', renderer: 'rich', labelRenderer: 'rich', initialValue: '', filter: true },
  { id: 'autocomplete-render-falsy', dataset: 'falsy', renderer: 'falsy', labelRenderer: 'omitted', initialValue: '', filter: false },
  { id: 'autocomplete-render-label', dataset: 'flat', renderer: 'omitted', labelRenderer: 'rich', initialValue: 'a', filter: false },
  { id: 'autocomplete-render-child-input', dataset: 'flat', renderer: 'rich', labelRenderer: 'rich', initialValue: 'a', filter: false, input: 'input', componentInput: 'textarea' },
  { id: 'autocomplete-render-child-textarea', dataset: 'flat', renderer: 'rich', labelRenderer: 'rich', initialValue: '', filter: false, input: 'textarea' },
  { id: 'autocomplete-render-virtual', dataset: 'virtual', renderer: 'rich', labelRenderer: 'rich', initialValue: '', filter: false, virtual: true },
];
export function autocompleteRenderActions(sample) {
  if (sample.dataset === 'mapped') return [
    { type: 'click' }, { type: 'fill', text: 'be' }, { type: 'fill', text: '' },
    { type: 'props', set: { revision: 1 } }, { type: 'press', key: 'ArrowDown' },
    { type: 'press', key: 'ArrowDown' }, { type: 'press', key: 'Enter' }, { type: 'click' }, { type: 'outside' },
  ];
  if (sample.dataset === 'falsy') return [
    { type: 'click' }, { type: 'props', set: { renderer: 'scalar' } },
    { type: 'props', set: { renderer: 'ownundefined' } }, { type: 'props', set: { renderer: 'omitted' } },
    { type: 'props', set: { renderer: 'falsy' } }, { type: 'outside' },
  ];
  if (sample.id === 'autocomplete-render-label') return [
    { type: 'props', set: { revision: 1 } }, { type: 'value', value: 'ghost' },
    { type: 'props', set: { labelRenderer: 'zero' } }, { type: 'props', set: { labelRenderer: 'null' } },
    { type: 'props', set: { labelRenderer: 'ownundefined' } }, { type: 'value', value: '' },
    { type: 'props', set: { labelRenderer: 'rich' } }, { type: 'click' }, { type: 'outside' },
  ];
  if (sample.dataset === 'virtual') return [
    { type: 'click' }, { type: 'scroll', top: 640 }, { type: 'scroll', top: 1920 },
    { type: 'outside' }, { type: 'props', set: { renderer: 'array', revision: 1 } },
    { type: 'click' }, { type: 'scroll', top: 0 }, { type: 'outside' },
  ];
  if (sample.input) return [
    { type: 'click' }, { type: 'fill', text: 'draft' }, { type: 'press', key: 'ArrowDown' },
    { type: 'press', key: 'ArrowDown' }, { type: 'press', key: 'Enter' },
    { type: 'props', set: { renderer: 'array', revision: 1 } }, { type: 'click' },
    { type: 'props', set: { renderer: 'omitted' } }, { type: 'outside' },
  ];
  return [
    { type: 'click' }, { type: 'fill', text: 'be' }, { type: 'press', key: 'ArrowDown' },
    { type: 'press', key: 'ArrowDown' }, { type: 'press', key: 'Enter' },
    { type: 'props', set: { renderer: 'array', revision: 1 } }, { type: 'click' },
    { type: 'props', set: { renderer: 'null' } }, { type: 'props', set: { renderer: 'omitted' } }, { type: 'outside' },
  ];
}
export const autocompleteRenderSSRStates = [ { name: 'closed', open: false }, { name: 'open', open: true } ];
