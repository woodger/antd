export const samples = ['single', 'range'].map(kind => {
  const range = kind === 'range';
  return {
    id: kind + '-date-week-prefix', kind, picker: 'date', initialLocale: 'us',
    initialShowWeek: true,
    initialStart: '2020-12-31T16:37:59.456',
    initialEnd: '2021-01-15T09:12:34.567',
    blocked: { year: 2021, month: 0, day: 2 },
    localeGB: { lang: { locale: 'en_GB', placeholder: 'Authored date',
      rangePlaceholder: ['Authored start date', 'Authored end date'] } },
    actions: [
      { type: 'input-open', index: 0 },
      { type: 'week-number-hover', contains: '2021-01-01', panel: 0 },
      { type: 'owner-control', value: 'hide-week-numbers' },
      { type: 'cell-click', title: '2021-01-03', panel: 0 },
      { type: 'owner-control', value: 'show-week-numbers' },
      { type: 'owner-control', value: 'locale-gb' },
      { type: 'input-open', index: range ? 1 : 0 },
      { type: 'week-number-hover', contains: '2021-01-01', panel: 0 },
      { type: 'week-number-click', contains: '2021-01-01', panel: 0 },
      { type: 'input-escape', index: range ? 1 : 0 }
    ]
  };
});
export const counts = { owners: 2, actions: 20, initialAndSettledPoints: 22,
  declaredEscapeReadsAfter1000: 2, wholeUnmounts: 2,
  initialClosedSSRSerializations: 4 };
