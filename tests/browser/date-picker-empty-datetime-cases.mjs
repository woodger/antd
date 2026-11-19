export const authoring = {
  defaultPickerValue: '2024-06-13T18:30:20.500',
  defaultOpenValue: '2000-01-01T09:12:34.567',
  format: 'HH:mm:ss.SSS',
  clock: { format: 'HH:mm:ss.SSS', hourStep: 3, minuteStep: 3, secondStep: 2,
    millisecondStep: 567, showHour: true, showMinute: true, showSecond: true,
    showMillisecond: true, use12Hours: false, hideDisabledOptions: false }
};

export const actions = [
  { type: 'input-open' },
  { type: 'date-hover', value: '2024-06-18' },
  { type: 'hour-hover', value: 12 },
  { type: 'date-click', value: '2024-06-18' },
  { type: 'input-escape' },
  { type: 'template-button' },
  { type: 'input-open' },
  { type: 'date-hover', value: '2024-06-18' },
  { type: 'hour-hover', value: 12 },
  { type: 'hour-click', value: 12 },
  { type: 'input-escape' }
];
export const samples = ['single', 'range'].map(owner => ({ id: owner, ...authoring, actions }));
export const counts = { owners: 2, actions: 22, initialAndSettledPoints: 24,
  inputEscapeCloses: 4, wholeUnmounts: 2 };
