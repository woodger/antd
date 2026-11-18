import { selectTagCloseHandleSamples } from './select-components-tag-close-handles-cases.mjs';
const original = selectTagCloseHandleSamples[1];
/** Ordinary caller override only; the frozen public Source factory is reused unchanged. */
export const cachedOptionSamples = [{ ...original,
  id: 'select-close-handles-cached-option', mode: 'multiple',
  replacementOptions: original.replacementOptions.filter(option => option.value === 'b'), retentionSetup: null,
  actions: [
    { id: 'replace-options', type: 'options', phase: 'updated' },
    { id: 'invoke-latest-cached-a', type: 'invoke', from: 'latest', value: 'a', reason: 'latest-supplied-callback-after-option-removed-from-current-options' }
  ]
}];
