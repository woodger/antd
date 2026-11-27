const open = index => ({ type: 'input-open', index });
const control = value => ({ type: 'owner-control', value });
const key = value => ({ type: 'input-key', value });
const escape = (index = 0) => ({ type: 'input-escape', index });
const cell = title => ({ type: 'cell-click', title });
const preset = label => ({ type: 'preset-click', label });

export const samples = ['single', 'range'].flatMap(kind => ['month', 'year'].map(picker => {
  const range = kind === 'range';
  const month = picker === 'month';
  const terminal = month ? '2024-02' : '2025';
  const confirmStart = month ? '2024-03' : '2026';
  const confirmEnd = month ? '2024-04' : '2027';
  const sample = {
    id: kind + '-' + picker, kind, picker,
    initialStart: month ? '2024-01-31T16:37:59.456' : '2024-02-29T16:37:59.456',
    initialEnd: month ? '2024-08-20T09:12:34.567' : '2026-11-20T09:12:34.567',
    minDate: month ? '2024-02-15T18:30:20.500' : '2022-06-15T18:30:20.500',
    maxDate: month ? '2025-10-05T09:12:34.567' : '2027-03-02T09:12:34.567',
    presetA: month ? '2024-05-20T16:37:59.456' : '2024-11-20T16:37:59.456',
    presetB: month ? '2024-05-10T08:23:45.678' : '2024-02-10T08:23:45.678',
    witnessStart: month ? '2024-05-20T16:37:59.456' : '2024-11-20T16:37:59.456',
    witnessEnd: month ? '2024-05-10T08:23:45.678' : '2024-02-10T08:23:45.678',
    blocked: month ? { year: 2024, month: 6 } : { year: 2026 },
    locale: { lang: month
      ? { fieldMonthFormat: 'YYYY/MM', monthPlaceholder: 'Choose authored month',
        rangeMonthPlaceholder: ['Authored start month', 'Authored end month'] }
      : { fieldYearFormat: '[Y ]YYYY', yearPlaceholder: 'Choose authored year',
        rangeYearPlaceholder: ['Authored start year', 'Authored end year'] } }
  };
  sample.actions = [
    open(0), { type: 'header-promote' },
    { type: 'upper-cell-click', value: month ? '2024' : '2020-2029' }, cell(terminal),
    ...(range ? [open(1), cell(month ? '2024-01' : '2023'), escape()] : []),
    control('need-confirm-true'), open(0), cell(confirmStart), escape(),
    open(0), cell(confirmStart), { type: 'confirm-click' },
    ...(range ? [open(1), cell(confirmEnd), { type: 'confirm-click' }, escape()] : []),
    control('need-confirm-false'), open(0),
    { type: 'input-type', index: 0, value: month ? '2024-05' : '2028' }, key('Enter'),
    ...(range ? [open(1), { type: 'input-type', index: 1,
      value: month ? '2024-06' : '2029' }, key('Enter')] : []),
    open(0), key('ArrowDown'), escape(),
    control('limits-on'), open(0), cell(month ? '2024-07' : '2026'),
    cell(month ? '2024-02' : '2022'), open(range ? 1 : 0),
    { type: 'header-next' }, escape(), control('locale'), control('limits-off'),
    ...(range ? [control('order-false')] : []), open(0), preset('Hidden A'), open(0),
    ...(range ? [control('order-true'), preset('Hidden A')] : [preset('Hidden B')]), escape(),
    ...(range ? [control('same-period-disabled'), open(1),
      cell(month ? '2024/05' : 'Y 2024'), escape(1)] : [])
  ];
  return sample;
}));

export const counts = {
  owners: samples.length,
  actions: samples.reduce((sum, sample) => sum + sample.actions.length, 0),
  initialAndSettledPoints: samples.reduce((sum, sample) => sum + sample.actions.length + 1, 0),
  declaredEscapeReadsAfter1000: samples.reduce((sum, sample) => sum
    + sample.actions.filter(action => action.type === 'input-escape').length, 0),
  wholeUnmounts: samples.length,
  initialClosedSSRSerializations: samples.length * 2
};
