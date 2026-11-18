export const sourceScripts = [
  '.upstream/artifacts/react-18.3.1/umd/react.production.min.js',
  '.upstream/artifacts/react-dom-18.3.1/umd/react-dom.production.min.js',
  'node_modules/dayjs/dayjs.min.js',
  '.upstream/artifacts/antd-6.6.8/dist/antd.js'
];

const common = {
  value: '2024-06-13T16:30:00.000',
  pickerValue: '2024-06-13T16:30:00.000',
  nextPickerValue: '2024-06-13T17:30:00.000',
  defaultOpenValue: '2024-06-13T16:30:00.000',
  nextDefaultOpenValue: '2024-06-13T17:30:00.000',
  format: 'YYYY-MM-DD hh:mm:ss A',
  showTime: { format: 'hh:mm:ss A', use12Hours: true,
    hourStep: 1, minuteStep: 15, secondStep: 10, showNow: false, changeOnScroll: false },
  viewport: { width: 1280, height: 900 }
};

export const samples = [
  {
    id: 'selected-time-template-and-picker-control',
    ...common,
    portal: false,
    actions: [
      { type: 'input-open' },
      { type: 'wheel-to-top', column: 'hour', deltaY: -1000 },
      { type: 'wheel-to-top', column: 'meridiem', deltaY: -1000 },
      { type: 'owner-template', value: 'nextDefaultOpenValue' },
      { type: 'owner-template', value: 'defaultOpenValue' },
      { type: 'wheel-to-top', column: 'hour', deltaY: -1000 },
      { type: 'owner-open', value: false },
      { type: 'owner-picker', value: 'nextPickerValue' },
      { type: 'owner-open', value: true },
      { type: 'owner-open', value: false },
      { type: 'owner-template', value: 'nextDefaultOpenValue' },
      { type: 'owner-open', value: true }
    ]
  },
  {
    id: 'selected-time-portal-target-and-callback-control',
    ...common,
    portal: true,
    actions: [
      { type: 'input-open' },
      { type: 'wheel-to-top', column: 'hour', deltaY: -1000 },
      { type: 'wheel-to-top', column: 'meridiem', deltaY: -1000 },
      { type: 'owner-getter', value: 'same-target-new-callback' },
      { type: 'owner-getter', value: 'different-target-new-callback' }
    ]
  }
];

export const counts = {
  owners: samples.length,
  actions: samples.reduce((sum, sample) => sum + sample.actions.length, 0),
  logicalPoints: samples.reduce((sum, sample) => sum + sample.actions.length + 1, 0),
  authoredCloseActions: 2,
  trustedWheelActions: 5
};
