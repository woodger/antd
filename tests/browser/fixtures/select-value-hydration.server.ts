import { render } from 'svelte/server';
import SelectValueCase from './SelectValueCase.svelte';
import { selectValueSamples } from './select-value-cases';

export function renderSelectValue(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw Error('Select value hydration must start with DOM-free server rendering');
  }
  const sample = selectValueSamples.find(sample => sample.id === id);
  if (!sample) {
    throw Error(`Unknown Select value sample: ${id}`);
  }
  const rendered = render(SelectValueCase, {
    props: { sample, name: 'value-selection' }, idPrefix: 'select-value-hydration'
  });
  return { head: rendered.head, domFree: true,
    body: '<section data-select-value-hydration><form data-select-value-form>'
      + `<div data-select-value-hydration-target>${rendered.body}</div></form>`
      + '<input aria-label="Value outside draft" style="position:fixed;'
      + 'left:16px;'
      + 'bottom:16px" /></section>' };
}
