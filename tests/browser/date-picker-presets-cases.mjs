const action = (type, value) => value === undefined ? { type } : { type, value };
const open = () => action('open'), leave = () => action('leave'), escape = () => action('escape');
const hover = id => action('preset-hover', id), click = id => action('preset-click', id), cell = day => action('cell-hover', day);
const base = { initialValue: '2024-06-10T00:00:00.000', defaultPickerValue: '2024-06-01T00:00:00.000',
  format: 'YYYY-MM-DD', preview: 'omitted', prefixCls: null, rejectChange: false, showTime: null, needConfirm: null };
const lazyDates = ['2024-06-12T00:00:00.000', '2024-06-13T00:00:00.000', '2024-06-14T00:00:00.000', '2024-06-16T00:00:00.000', '2024-06-17T00:00:00.000'];
export const datePickerPresetSamples = [
  { ...base, id: 'static-validity', disabledDay: '2024-06-15', minDate: '2024-06-05', maxDate: '2024-06-25',
    presets: [{ id: 'valid', label: 'Valid June 12', value: '2024-06-12' }, { id: 'disabled', label: 'Disabled June 15', value: '2024-06-15' },
      { id: 'below-min', label: 'Before minimum', value: '2024-06-04' }, { id: 'above-max', label: 'After maximum', value: '2024-06-26' }],
    actions: [open(), hover('valid'), leave(), hover('disabled'), click('disabled'), click('below-min'), click('above-max'), escape(), open(), click('valid')] },
  { ...base, id: 'lazy-hover-click', initialValue: null,
    presets: [{ id: 'lazy', label: 'Lazy dates', sequence: lazyDates }],
    actions: [open(), hover('lazy'), action('clear'), open(), leave(), hover('lazy'), click('lazy'), open(), cell('2024-06-18'), leave(), escape(), open()] },
  { ...base, id: 'preview-false-and-switch', initialValue: null, preview: false,
    presets: [{ id: 'lazy', label: 'Lazy without preview', sequence: lazyDates }],
    actions: [open(), hover('lazy'), leave(), cell('2024-06-18'), leave(), action('preview', 'hover'), hover('lazy'), action('preview', false), leave(), click('lazy'), open(), escape()] },
  { ...base, id: 'time-confirm-preset', initialValue: '2024-06-10T08:00:00.000', format: 'YYYY-MM-DD HH:mm:ss',
    showTime: { format: 'HH:mm:ss', hourStep: 2, minuteStep: 15, secondStep: 10 }, needConfirm: true,
    presets: [{ id: 'time', label: 'Full timestamp', sequence: ['2024-06-12T14:23:45.678', '2024-06-13T16:37:59.456', '2024-06-14T11:22:33.789'] }],
    actions: [open(), hover('time'), click('time'), open(), cell('2024-06-18'), leave(), escape(), open()] },
  { ...base, id: 'controlled-rejection', rejectChange: true, presets: [{ id: 'valid', label: 'Rejected June 12', value: '2024-06-12' }],
    actions: [open(), click('valid'), open(), cell('2024-06-18'), leave(), escape(), open(), action('outside')] },
  { ...base, id: 'custom-label-prefix', prefixCls: 'preset-picker',
    presets: [{ id: 'custom', customLabel: true, label: 'Custom June 12', value: '2024-06-12' }],
    actions: [open(), hover('custom'), leave(), click('custom'), open(), cell('2024-06-18'), leave(), action('outside')] }
];
export const datePickerPresetGeometry = { viewport: { width: 1280, height: 900 }, root: { left: 240, top: 160, width: 280 } };
