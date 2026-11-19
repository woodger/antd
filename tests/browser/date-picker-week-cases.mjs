const open = index => ({ type: 'input-open', index });
const control = value => ({ type: 'owner-control', value });
const key = value => ({ type: 'input-key', value });
const escape = (index = 0) => ({ type: 'input-escape', index });
const cell = (title, panel = 0) => ({ type: 'cell-click', title, panel });
const weekNumber = (contains, panel = 0) => ({ type: 'week-number-click', contains, panel });
const preset = label => ({ type: 'preset-click', label });

export const samples = ['single', 'range'].map(kind => {
  const range = kind === 'range';
  const sample = {
    id: kind + '-week', kind, picker: 'week', initialLocale: 'us',
    initialStart: '2020-12-31T16:37:59.456',
    initialEnd: '2021-01-15T09:12:34.567',
    minDate: '2020-12-30T18:30:20.500',
    maxDate: '2021-01-05T09:12:34.567',
    presetA: '2021-01-03T16:37:59.456',
    presetB: '2020-12-28T08:23:45.678',
    witnessStart: '2021-01-03T16:37:59.456',
    witnessEnd: '2020-12-28T08:23:45.678',
    blocked: { year: 2021, month: 0, day: 1 },
    localeGB: { lang: {
      locale: 'en_GB',
      weekPlaceholder: 'Choose authored week',
      rangeWeekPlaceholder: ['Authored start week', 'Authored end week']
    } }
  };
  sample.actions = [
    open(0), { type: 'header-promote', mode: 'year' },
    { type: 'upper-cell-click', title: '2020' },
    { type: 'upper-cell-click', title: '2020-12' }, cell('2021-01-01'),
    ...(range ? [open(1), cell('2021-01-08', 1), escape()] : []),
    open(0), weekNumber('2021-01-01'),
    ...(range ? [open(1), cell('2021-01-08', 1), escape()] : []),
    open(0), { type: 'input-type', index: 0, value: '2021-2nd' }, key('Enter'),
    ...(range ? [open(1), { type: 'input-type', index: 1, value: '2021-3rd' }, key('Enter')] : []),
    escape(), control('locale-gb'), open(0),
    { type: 'cell-hover', title: '2021-01-01', panel: 0 }, { type: 'pointer-leave' },
    weekNumber('2021-01-01'),
    ...(range ? [open(1), cell('2021-01-08', 1), escape()] : []),
    control('need-confirm-true'), open(0), cell('2020-12-31'), escape(),
    open(0), cell('2020-12-31'), { type: 'confirm-click' },
    ...(range ? [open(1), cell('2021-01-08', 1), { type: 'confirm-click' }, escape()] : []),
    control('need-confirm-false'), open(0),
    { type: 'input-type', index: 0, value: '2020-53rd' }, key('Enter'),
    ...(range ? [open(1), { type: 'input-type', index: 1, value: '2021-1st' }, key('Enter')] : []),
    open(0), key('ArrowDown'), escape(),
    control('limits-on'), open(0), cell('2021-01-01'), weekNumber('2021-01-01'),
    open(range ? 1 : 0), cell('2021-01-08', range ? 1 : 0), open(0),
    { type: 'header-next-month' }, escape(), control('limits-off'),
    control('hide-week-numbers'), open(0), cell('2021-01-01'), escape(),
    control('default-week-numbers'),
    ...(range ? [control('order-false')] : []), open(0), preset('Hidden A'), open(0),
    ...(range ? [control('order-true'), preset('Hidden A')] : [preset('Hidden B')]), escape(),
    ...(range ? [control('same-week-disabled'), open(1), cell('2020-12-28'), escape(1)] : [])
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
  initialClosedSSRSerializations: samples.length * 2 * 2
};
