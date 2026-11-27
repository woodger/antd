const configurations = [
  { id: 'single-date-mask', kind: 'single', family: 'date',
    plainFormat: 'YYYY-MM-DD', maskFormat: 'YYYY-MM-DD',
    plainText: '2021-01-18', maskDigits: '20210120' },
  { id: 'single-datetime-mask', kind: 'single', family: 'datetime',
    plainFormat: 'YYYY-MM-DD HH:mm', maskFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    plainText: '2021-01-18 18:19', maskDigits: '20240229111213345' },
  { id: 'range-date-mask', kind: 'range', family: 'date',
    plainFormat: 'YYYY-MM-DD', maskFormat: 'YYYY-MM-DD',
    plainText: '2021-01-18', maskDigits: '20210120' },
  { id: 'single-time-mask', kind: 'single', family: 'time',
    plainFormat: 'HH:mm', maskFormat: 'HH:mm:ss.SSS',
    plainText: '18:19', maskDigits: '202122345' },
  { id: 'range-time-mask', kind: 'range', family: 'time',
    plainFormat: 'HH:mm', maskFormat: 'HH:mm:ss.SSS',
    plainText: '18:19', maskDigits: '202122345' }
];
const keyForCharacter = character => character === ' ' ? 'Space' : character;
export const samples = configurations.map(configuration => {
  const end = configuration.kind === 'range' ? 1 : 0;
  return { ...configuration,
    initialFormatProfile: 'string',
    initialStart: '2020-12-31T16:37:59.456',
    initialEnd: '2021-01-15T19:41:23.789',
    actions: [
      { type: 'input-open', index: 0 },
      { type: 'input-key', key: 'Enter', purpose: 'pristine-string' },
      { type: 'owner-control', value: 'format-object' },
      { type: 'input-open', index: end },
      { type: 'input-key', key: 'Enter', purpose: 'pristine-object' },
      { type: 'input-type', index: end, text: configuration.plainText,
        keys: ['Control+A', ...configuration.plainText].map(keyForCharacter) },
      { type: 'input-key', key: 'Enter', purpose: 'typed-object' },
      { type: 'owner-control', value: 'restore-authored-value' },
      { type: 'owner-control', value: 'format-mask' },
      { type: 'input-open', index: 0 },
      { type: 'input-key', key: 'Enter', purpose: 'pristine-mask' },
      { type: 'mask-edit', index: end, anchor: 'text-start',
        keys: ['ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'Delete', ...configuration.maskDigits] },
      { type: 'input-key', key: 'Enter', purpose: 'typed-mask' },
      { type: 'incomplete-enter', index: end, anchor: 'text-start', keys: ['Backspace', 'Enter'] },
      { type: 'input-escape', index: end }
    ] };
});
/** Exact authored public interaction commands, not picker outcomes. */
export function expandAction(action) {
  const pointer = index => [
    { type: 'mouse-move-input', index, anchor: action.anchor ?? 'center' },
    { type: 'mouse-down', button: 'left' },
    { type: 'mouse-up', button: 'left' }
  ];
  if (action.type === 'owner-control') return [{ type: 'owner-control-click', value: action.value }];
  if (action.type === 'input-key') return [{ type: 'key-press', key: action.key }];
  if (action.type === 'input-open') return pointer(action.index);
  const keys = action.type === 'input-escape' ? ['Escape'] : action.keys;
  return [...pointer(action.index), ...keys.map(key => ({ type: 'key-press', key }))];
}
const commands = samples.flatMap(sample => sample.actions.flatMap(expandAction));
const commandCount = type => commands.filter(command => command.type === type).length;
export const counts = {
  owners: 5, authoredMacroActions: 75, initialAndMacroSettledPoints: 80,
  explicitSubsteps: commands.length,
  keyboardPressCalls: commandCount('key-press'),
  inputMouseMoves: commandCount('mouse-move-input'),
  inputMouseDowns: commandCount('mouse-down'), inputMouseUps: commandCount('mouse-up'),
  authoredDOMControlClicks: commandCount('owner-control-click'),
  declaredEscapeReadsAfter1000: 5, wholeUnmounts: 5,
  retainedFullPhasePoints: commands.length * 3 + 75 * 3 + 5 + 5 + 5 * 3,
  macroAfterCallReferencesToChildSnapshot: 75,
  distinctRetainedFullReads: commands.length * 3 + 75 * 2 + 5 + 5 + 5 * 3,
  initialClosedSSRProfiles: 15, initialClosedSSRSerializations: 30
};
export const storage = {
  macroAndLifecycleUIPartsPerCSR: 5 + 75 + 5 + 5 * 3,
  substepUIPartsPerCSR: commands.length,
  rawPointPartsPerCSR: 5 + 75 + 5 + 5 * 3 + commands.length,
  producerPartsPerCSR: 5 + 75 + 5 + 5 * 3 + commands.length + 5,
  totalPartsPerCSR: (5 + 75 + 5 + 5 * 3 + commands.length) * 2 + 5,
  serializerPartsPerSSR: 30,
  originalPartsAcrossFourRuns: ((5 + 75 + 5 + 5 * 3 + commands.length) * 2 + 5) * 2 + 60
};
