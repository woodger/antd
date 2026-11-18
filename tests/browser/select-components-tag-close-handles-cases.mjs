const options = phase => [
  { key: 'option-a', value: 'a', label: phase === 'initial' ? 'Alpha old' : 'Alpha updated', marker: phase + '-a' },
  { key: 'option-locked', value: 'locked', label: phase === 'initial' ? 'Locked old' : 'Locked updated', disabled: true, marker: phase + '-locked' },
  { key: 'option-b', value: 'b', label: phase === 'initial' ? 'Beta old' : 'Beta updated', marker: phase + '-b' }
];
export const selectTagCloseHandleSamples = [
  { id: 'select-close-handles-nonclosable', mode: 'multiple', initialModel: ['a', 'locked', 'b'],
    initialOptions: options('initial'), replacementOptions: options('updated'), retentionSetup: null,
    actions: [
      { id: 'latest-locked', type: 'invoke', from: 'latest', value: 'locked', reason: 'option-disabled-nonclosable-supplied-callback' },
      { id: 'reset-before-disable', type: 'model', value: ['a', 'locked', 'b'] },
      { id: 'disable-root', type: 'disabled', value: true },
      { id: 'disabled-latest-a', type: 'invoke', from: 'latest', value: 'a', reason: 'root-disabled-nonclosable-supplied-callback' },
      { id: 'enable-reset', type: 'enable-reset', value: ['a', 'locked', 'b'] },
      { id: 'enabled-latest-a', type: 'invoke', from: 'latest', value: 'a', reason: 'enabled-latest-callback-control' }
    ] },
  { id: 'select-close-handles-retained', mode: 'tags', initialModel: ['a', 'b'],
    initialOptions: options('initial'), replacementOptions: options('updated'),
    retentionSetup: { id: 'retain-initial-a', type: 'retain', from: 'latest', value: 'a', slot: 'initial-a', reason: 'retain-latest-public-callback-after-initial-settle' },
    actions: [
      { id: 'replace-options', type: 'options', phase: 'updated' },
      { id: 'invoke-initial-a', type: 'invoke', from: 'retained', slot: 'initial-a', value: 'a', reason: 'retained-initial-after-options-replacement' },
      { id: 'invoke-save-latest-a', type: 'invoke', from: 'latest', value: 'a', saveAs: 'invoked-a', reason: 'invoke-latest-and-retain-that-exact-function' },
      { id: 'replay-after-remove', type: 'invoke', from: 'retained', slot: 'invoked-a', value: 'a', reason: 'replay-same-function-after-removal' },
      { id: 'readd-model', type: 'model', value: ['a', 'b'] },
      { id: 'replay-after-readd', type: 'invoke', from: 'retained', slot: 'invoked-a', value: 'a', reason: 'replay-same-function-after-controlled-readd' }
    ] }
];
export const selectTagCloseHandleGeometry = { viewport: { width: 1200, height: 800 }, root: { left: 240, top: 160, width: 440 },
  tag: { width: 92, height: 24 }, actions: { left: 16, top: 16 } };
