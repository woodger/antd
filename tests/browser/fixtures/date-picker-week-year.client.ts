import '@woodger/antd-svelte/styles.css';
import { mount } from 'svelte';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker, RangePicker, ruRU } from '@woodger/antd-svelte';

const target = document.getElementById('root');
const model = document.getElementById('week-model');
const query = new URLSearchParams(location.search);
if (!target || !model) {
  throw Error('Week-year fixture requires a target and model output');
}

// Преобразует заданную в URL дату, сохраняя отсутствие настройки.
function readDate(name: string): Dayjs | undefined {
  const value = query.get(name);
  return value === null ? undefined : dayjs(value);
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

const start = readDate('start') ?? dayjs('2020-12-21');
const props = {
  picker: 'week' as const,
  locale: ruRU.datePicker,
  minDate: readDate('minDate'),
  maxDate: readDate('maxDate'),
  defaultPickerValue: readDate('panel')
};
if (query.has('range')) {
  const end = readDate('end') ?? dayjs('2024-01-08');
  mount(RangePicker, { target, props: {
    ...props,
    id: { start: 'week-start', end: 'week-end' },
    defaultValue: [start, end],
    onChange: (dates, texts) => publish(dates ?? [], texts)
  } });
}
else {
  mount(DatePicker, { target, props: {
    ...props,
    id: 'week-start',
    defaultValue: start,
    onChange: (date, text) => publish([date], text)
  } });
}
