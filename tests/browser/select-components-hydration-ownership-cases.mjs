export const ownershipControls = [
  { id: 'select-multiple-input', control: 'select', initialTag: 'input', replacementTag: 'textarea' },
  { id: 'ac-textarea', control: 'autocomplete', initialTag: 'textarea', replacementTag: 'input' }
];
export const ownershipEnvironments = [
  { id: 'independent-document-roots', kind: 'document', owners: ['A', 'B'], hydrationOrder: ['B', 'A'] },
  { id: 'open-shadow-target', kind: 'shadow-open', owners: ['B'], hydrationOrder: ['B'] },
  { id: 'closed-shadow-target', kind: 'shadow-closed', owners: ['B'], hydrationOrder: ['B'] }
];
export const ownershipPrehydrateStates = [
  { id: 'clean-focused', dirty: false },
  { id: 'dirty-focused-backward', dirty: true, value: 'Draft before hydration', selection: [2, 8, 'backward'] }
];
export const ownershipActions = [
  { type: 'controlled-query', value: 'b' },
  { type: 'real-keyboard-replace', text: 'Owned B' },
  { type: 'outside-focus' },
  { type: 'intrinsic-tag-replacement' },
  { type: 'target-dispose', lateMilliseconds: 1000 }
];
export const ownershipGeometry = { viewport: { width: 1300, height: 900 } };
export const ownershipScenarios = ownershipControls.flatMap(control => ownershipEnvironments.flatMap(environment =>
  ownershipPrehydrateStates.map(prehydrate => ({ id: [control.id, environment.id, prehydrate.id].join('/'),
    control, environment, prehydrate, actions: ownershipActions }))));
export function ownershipOwnerSample(scenario, ownerKey) {
  if (!scenario.environment.owners.includes(ownerKey)) throw Error('Owner does not belong to this scenario');
  return { scenarioId: scenario.id, ownerKey, controlKey: scenario.control.id, control: scenario.control.control,
    initialTag: scenario.control.initialTag, replacementTag: scenario.control.replacementTag,
    publicId: 'uid-' + scenario.control.id + '-' + ownerKey,
    initialQuery: 'a', initialValue: scenario.control.control === 'select' ? ['a'] : 'a',
    frame: { position: 'absolute', left: ownerKey === 'A' ? 80 : 520, top: 160, width: 280,
      fontFamily: 'initial', fontSize: 16, lineHeight: 'normal' },
    editorStyle: { width: ownerKey === 'A' ? 91 : 133, fontSize: ownerKey === 'A' ? 17 : 23 } };
}
