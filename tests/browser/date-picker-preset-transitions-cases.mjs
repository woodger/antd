const step = (type, value) => value === undefined ? { type } : { type, value };
const open = () => step('open');
const preset = () => step('preset-click', 'candidate');
const ownerClose = () => step('owner-open', false);
const ownerOpen = () => step('owner-open', true);
const leave = () => step('leave');
const timeHover = (unit, value) => ({ type: 'time-hover', unit, value });
const base = {
  initialValue: '2024-06-10T00:00:00.000',
  format: 'YYYY-MM-DD',
  preview: 'omitted',
  rejectChange: false,
  pickerOwner: 'omitted',
  prefixCls: null
};
const formatActions = [
  open(), preset(), ownerClose(), ownerOpen(), step('format', 'DD/MM/YYYY'),
  ownerClose(), step('format', 'YYYY-MM-DD'), ownerOpen(), step('input-focus'),
  step('input-escape'), ownerOpen()
];
const navigationActions = [
  open(), preset(), ownerClose(), ownerOpen(), step('input-focus'),
  step('input-escape'), ownerOpen()
];
const timeBase = {
  ...base,
  initialValue: '2024-06-10T08:00:00.000',
  defaultPickerValue: '2024-06-01T00:00:00.000',
  format: 'YYYY-MM-DD HH:mm:ss.SSS',
  needConfirm: true,
  showTime: {
    format: 'HH:mm:ss.SSS',
    hourStep: 2,
    minuteStep: 15,
    secondStep: 10,
    millisecondStep: 100,
    showMillisecond: true
  },
  preset: { label: 'Exact off-grid timestamp', value: '2024-06-13T16:37:59.456' }
};

export const datePickerPresetTransitionSamples = [
  {
    ...base,
    id: 'format-rejected-calendar',
    defaultPickerValue: '2024-06-01T00:00:00.000',
    rejectChange: true,
    preset: { label: 'Rejected June 12', value: '2024-06-12T00:00:00.000' },
    actions: formatActions
  },
  {
    ...base,
    id: 'format-disabled-calendar',
    disabledDay: '2024-06-15',
    preset: { label: 'Disabled June 15', value: '2024-06-15T00:00:00.000' },
    actions: formatActions
  },
  {
    ...base,
    id: 'navigation-omitted-default',
    disabledDay: '2024-07-15',
    preset: { label: 'Disabled July 15', value: '2024-07-15T00:00:00.000' },
    actions: navigationActions
  },
  {
    ...base,
    id: 'navigation-explicit-default',
    defaultPickerValue: '2024-06-01T00:00:00.000',
    disabledDay: '2024-07-15',
    preset: { label: 'Disabled July 15', value: '2024-07-15T00:00:00.000' },
    actions: navigationActions
  },
  ...['reject', 'accept'].map(pickerOwner => ({
    ...base,
    id: 'navigation-controlled-picker-' + pickerOwner,
    pickerOwner,
    initialPickerValue: '2024-06-01T00:00:00.000',
    disabledDay: '2024-07-15',
    preset: { label: 'Disabled July 15', value: '2024-07-15T00:00:00.000' },
    actions: navigationActions
  })),
  {
    ...base,
    id: 'navigation-minimum-clamp',
    minDate: '2024-05-05T00:00:00.000',
    preset: { label: 'Before minimum April 15', value: '2024-04-15T00:00:00.000' },
    actions: navigationActions
  },
  {
    ...base,
    id: 'navigation-maximum-clamp',
    maxDate: '2024-07-05T00:00:00.000',
    preset: { label: 'After maximum August 15', value: '2024-08-15T00:00:00.000' },
    actions: navigationActions
  },
  {
    ...timeBase,
    id: 'datetime-time-units',
    actions: [
      open(), preset(), ownerOpen(), timeHover('hour', 18), leave(),
      timeHover('minute', 30), leave(), timeHover('second', 20), leave(),
      timeHover('millisecond', 700), leave(), ownerClose(), ownerOpen()
    ]
  },
  {
    ...timeBase,
    id: 'datetime-disabled-meridiem',
    format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    showTime: { ...timeBase.showTime, format: 'hh:mm:ss.SSS A', use12Hours: true },
    disabledHours: [...Array.from({ length: 12 }, (_, index) => index), 18],
    actions: [
      open(), preset(), ownerOpen(), timeHover('hour', 18), leave(),
      timeHover('meridiem', 'am'), leave(), timeHover('meridiem', 'pm'), leave(),
      ownerClose(), ownerOpen()
    ]
  },
  {
    ...timeBase,
    id: 'datetime-preview-switch',
    preview: false,
    actions: [
      open(), preset(), ownerOpen(), timeHover('hour', 18), leave(),
      step('preview', 'hover'), timeHover('minute', 30), step('preview', false),
      leave(), ownerClose(), ownerOpen(), step('preview', 'hover'),
      timeHover('millisecond', 700), leave(), step('input-focus'), step('input-escape')
    ]
  },
  {
    ...base,
    id: 'date-only-hover-precision',
    initialValue: '2024-06-10T08:23:45.678',
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
    alternateFormat: 'DD/MM/YYYY HH:mm:ss.SSS',
    showTime: false,
    actions: [
      open(), step('cell-hover', '2024-06-18'),
      step('format', 'DD/MM/YYYY HH:mm:ss.SSS'), leave(), ownerClose(), ownerOpen(),
      step('cell-hover', '2024-06-18'), leave(), step('input-focus'),
      step('input-escape'), ownerOpen()
    ]
  },
  {
    ...base,
    id: 'date-only-hover-dynamic-minimum',
    updatedMinDate: '2024-06-19T00:00:00.000',
    actions: [
      open(), step('cell-hover', '2024-06-18'),
      step('min-date', '2024-06-19T00:00:00.000'), leave(), ownerClose(), ownerOpen(),
      step('cell-hover', '2024-06-20'), leave()
    ]
  }
];

export const datePickerPresetGeometry = {
  viewport: { width: 1280, height: 900 },
  root: { left: 240, top: 160, width: 420 }
};

export const datePickerPresetTransitionCounts = {
  owners: datePickerPresetTransitionSamples.length,
  actions: datePickerPresetTransitionSamples.reduce((count, sample) => count + sample.actions.length, 0),
  logicalPoints: datePickerPresetTransitionSamples.reduce(
    (count, sample) => count + 1 + sample.actions.length, 0
  )
};
