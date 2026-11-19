import 'antd-svelte/styles.css';
import { mount } from 'svelte';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb.js';
import { DatePicker, enUS } from 'antd-svelte';

const value = dayjs('2020-12-31T16:37:59.456');
const selectionEvents: string[] = [], navigationEvents: string[] = [];
const target = document.getElementById('root');
if (!target) throw Error('Week keyboard owner root missing');
mount(DatePicker, { target, props: { picker: 'week', value, defaultPickerValue: value,
  ...(new URLSearchParams(location.search).has('controlled') ? { pickerValue: value } : {}),
  id: 'week-keyboard', allowClear: false,
  locale: { lang: { ...enUS.datePicker.lang, locale: 'en_GB' } },
  onChange: () => { selectionEvents.push('change'); },
  onCalendarChange: () => { selectionEvents.push('calendar'); },
  onPickerValueChange: () => { navigationEvents.push('picker-value'); },
  onPanelChange: () => { navigationEvents.push('panel'); }
} });
declare global {
  interface Window {
    readWeekKeyboard(): { modelISO: string; selectionEvents: string[]; navigationEvents: string[] };
  }
}
window.readWeekKeyboard = () => ({ modelISO: value.toISOString(),
  selectionEvents: [...selectionEvents], navigationEvents: [...navigationEvents] });
