import 'antd-svelte/styles.css';
import { mount } from 'svelte';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker, RangePicker, ruRU } from 'antd-svelte';

const target = document.getElementById('root');
const model = document.getElementById('week-model');
if (!target || !model) {
  throw Error('Week-year fixture requires a target and model output');
}

// Записывает опубликованные даты и текст без вычисления номера недели в фикстуре.
function publish(dates: readonly (Dayjs | null)[], texts: string | string[] | null) {
  if (model) {
    model.textContent = JSON.stringify({
      dates: dates.map(date => date?.format('YYYY-MM-DD') ?? null),
      texts
    });
  }
}

const start = dayjs('2020-12-21');
const locale = ruRU.datePicker;
if (new URLSearchParams(location.search).has('range')) {
  mount(RangePicker, { target, props: {
    picker: 'week',
    locale,
    id: { start: 'week-start', end: 'week-end' },
    defaultValue: [start, dayjs('2024-01-08')],
    onChange: (dates, texts) => publish(dates ?? [], texts)
  } });
}
else {
  mount(DatePicker, { target, props: {
    picker: 'week',
    locale,
    id: 'week-start',
    defaultValue: start,
    onChange: (date, text) => publish([date], text)
  } });
}
