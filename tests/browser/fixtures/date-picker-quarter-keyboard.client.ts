import 'antd-svelte/styles.css';
import { mount } from 'svelte';
import dayjs from 'dayjs';
import { DatePicker, enUS } from 'antd-svelte';

const value = dayjs('2024-05-20T16:37:59.456');
const selectionEvents: string[] = [], navigationEvents: string[] = [];
const target = document.getElementById('root');
if (!target) throw Error('Quarter keyboard owner root missing');
mount(DatePicker, { target, props: { picker: 'quarter', value, defaultPickerValue: value,
  id: 'quarter-keyboard', locale: enUS.datePicker, allowClear: false,
  onChange: () => { selectionEvents.push('change'); },
  onCalendarChange: () => { selectionEvents.push('calendar'); },
  onPickerValueChange: () => { navigationEvents.push('picker-value'); },
  onPanelChange: () => { navigationEvents.push('panel'); }
} });
declare global {
  interface Window {
    readQuarterKeyboard(): { modelISO: string; selectionEvents: string[]; navigationEvents: string[] };
  }
}
window.readQuarterKeyboard = () => ({ modelISO: value.toISOString(),
  selectionEvents: [...selectionEvents], navigationEvents: [...navigationEvents] });
