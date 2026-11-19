const open = index => ({ type: 'input-open', index });
const control = value => ({ type: 'owner-control', value });
const key = value => ({ type: 'input-key', value });
const escape = (index = 0) => ({ type: 'input-escape', index });
const cell = title => ({ type: 'cell-click', title });
const preset = label => ({ type: 'preset-click', label });

export const samples = ['single', 'range'].map(kind => {
  const range = kind === 'range';
  const sample = {
    id: kind + '-quarter', kind, picker: 'quarter',
    initialStart: '2024-01-31T16:37:59.456',
    initialEnd: '2024-11-20T09:12:34.567',
    minDate: '2024-02-15T18:30:20.500',
    maxDate: '2025-10-05T09:12:34.567',
    presetA: '2024-05-20T16:37:59.456',
    presetB: '2024-04-10T08:23:45.678',
    witnessStart: '2024-05-20T16:37:59.456',
    witnessEnd: '2024-04-10T08:23:45.678',
    blocked: { year: 2024, firstMonth: 6, lastMonth: 8 },
    locale: { lang: {
      fieldQuarterFormat: 'YYYY/[Q]Q',
      cellQuarterFormat: '[Quarter ]Q',
      quarterPlaceholder: 'Choose authored quarter',
      rangeQuarterPlaceholder: ['Authored start quarter', 'Authored end quarter']
    } }
  };
  sample.actions = [
    open(0), { type: 'header-promote' },
    { type: 'upper-cell-click', value: '2024' }, cell('2024-Q2'),
    ...(range ? [open(1), cell('2024-Q1'), escape()] : []),
    control('need-confirm-true'), open(0), cell('2024-Q3'), escape(),
    open(0), cell('2024-Q3'), { type: 'confirm-click' },
    ...(range ? [open(1), cell('2024-Q4'), { type: 'confirm-click' }, escape()] : []),
    control('need-confirm-false'), open(0),
    { type: 'input-type', index: 0, value: '2025-Q2' }, key('Enter'),
    ...(range ? [open(1), { type: 'input-type', index: 1, value: '2025-Q3' }, key('Enter')] : []),
    open(0), key('ArrowDown'), escape(),
    control('limits-on'), open(0), cell('2024-Q3'), cell('2024-Q1'), open(range ? 1 : 0),
    { type: 'header-next' }, cell('2025-Q4'), escape(),
    control('block-last'), open(0), cell('2024-Q3'), escape(),
    control('locale'), control('limits-off'),
    ...(range ? [control('order-false')] : []), open(0), preset('Hidden A'), open(0),
    ...(range ? [control('order-true'), preset('Hidden A')] : [preset('Hidden B')]), escape(),
    ...(range ? [control('same-period-disabled'), open(1), cell('2024/Q2'), escape(1)] : [])
  ];
  return sample;
});

export const counts = {
  owners: samples.length,
  actions: samples.reduce((sum, sample) => sum + sample.actions.length, 0),
  initialAndSettledPoints: samples.reduce((sum, sample) => sum + sample.actions.length + 1, 0),
  declaredEscapeReadsAfter1000: samples.reduce((sum, sample) => sum
    + sample.actions.filter(action => action.type === 'input-escape').length, 0),
  wholeUnmounts: samples.length,
  initialClosedSSRSerializations: samples.length * 2
};
