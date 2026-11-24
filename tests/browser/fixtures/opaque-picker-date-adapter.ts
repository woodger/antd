// Адаптер сценариев фабрики. Наружу выходит иммутабельный объект с одним полем;
// календарная арифметика использует UTC внутри реализации.
import type { GenerateConfig } from '@woodger/antd';

export type OpaquePickerDate = Readonly<{ stamp: number; }>;

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;

/** Создаёт значение в представлении, которое использует независимый UMD-прогон. */
export function opaqueDate(text: string): OpaquePickerDate {
  return Object.freeze({ stamp: Date.parse(text) });
}

/** Разворачивает значение только внутри адаптера или в наблюдении теста. */
export function readOpaqueDate(value: OpaquePickerDate): Date {
  return new Date(value.stamp);
}

/** Применяет изменение к отдельной копии UTC даты, сохраняя иммутабельность значения. */
function editOpaqueDate(value: OpaquePickerDate, edit: (date: Date) => number | void) {
  const date = readOpaqueDate(value);
  edit(date);

  return Object.freeze({ stamp: date.getTime() });
}

/** Сдвигает месяц с ограничением дня последним числом нового месяца. */
function addMonth(value: OpaquePickerDate, amount: number) {
  return editOpaqueDate(value, date => {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    date.setUTCDate(Math.min(day, end.getUTCDate()));
  });
}

/** Форматирует токены, которые использует тестовый календарь и редактор. */
function printOpaqueDate(value: OpaquePickerDate, format: string) {
  const date = readOpaqueDate(value);
  const month = date.getUTCMonth() + 1;
  const tokens: Record<string, number> = {
    YYYY: date.getUTCFullYear(), MM: month, M: month, DD: date.getUTCDate(), D: date.getUTCDate(),
    HH: date.getUTCHours(), mm: date.getUTCMinutes(), ss: date.getUTCSeconds(),
    SSS: date.getUTCMilliseconds(), Q: Math.ceil(month / 3)
  };
  // Литералы в скобках идут в подпись без обработки токенов.
  return format.replace(/\[[^\]]*\]|YYYY|MM|DD|HH|mm|ss|SSS|M|D|Q/g, token =>
    token.startsWith('[') ? token.slice(1, -1) : String(tokens[token]).padStart(token.length, '0'));
}

export const opaquePickerAdapter: GenerateConfig<OpaquePickerDate> = {
  // Связывает служебную дату с receiver конкретного адаптера.
  getNow() { return this.getFixedDate('2024-06-19T16:00:00Z'); },
  getFixedDate: opaqueDate,
  // Определяет последнее число месяца, сохраняя время.
  getEndDate: value => editOpaqueDate(value, date => date.setUTCMonth(date.getUTCMonth() + 1, 0)),
  // Возвращает индекс дня для сетки с началом недели в воскресенье.
  getWeekDay: value => readOpaqueDate(value).getUTCDay(),
  // Читает календарный год по UTC.
  getYear: value => readOpaqueDate(value).getUTCFullYear(),
  // Возвращает индекс месяца от нуля.
  getMonth: value => readOpaqueDate(value).getUTCMonth(),
  // Возвращает число месяца от единицы.
  getDate: value => readOpaqueDate(value).getUTCDate(),
  // Читает час в 24-часовом формате.
  getHour: value => readOpaqueDate(value).getUTCHours(),
  // Возвращает минуты в текущем часе.
  getMinute: value => readOpaqueDate(value).getUTCMinutes(),
  // Возвращает секунды в текущей минуте.
  getSecond: value => readOpaqueDate(value).getUTCSeconds(),
  // Хранит дробную часть секунды без округления.
  getMillisecond: value => readOpaqueDate(value).getUTCMilliseconds(),
  // Год и месяц используют один способ выбора дня на границе февраля.
  addYear(value, amount) { return this.addMonth(value, amount * 12); },
  addMonth,
  // Сдвигает дату на календарные дни, сохраняя единицы времени.
  addDate: (value, amount) => editOpaqueDate(value, date => date.setUTCDate(date.getUTCDate() + amount)),
  // Заменяет календарный год, используя нормализацию UTC Date.
  setYear: (value, year) => editOpaqueDate(value, date => date.setUTCFullYear(year)),
  // Заменяет индекс месяца с переносом в соседний год.
  setMonth: (value, month) => editOpaqueDate(value, date => date.setUTCMonth(month)),
  // Заменяет число месяца.
  setDate: (value, day) => editOpaqueDate(value, date => date.setUTCDate(day)),
  // Устанавливает час с переносом за полночь при переполнении.
  setHour: (value, hour) => editOpaqueDate(value, date => date.setUTCHours(hour)),
  // Заменяет единицу времени независимо от календарного дня.
  setMinute: (value, minute) => editOpaqueDate(value, date => date.setUTCMinutes(minute)),
  // Устанавливает секунды без округления миллисекунд.
  setSecond: (value, second) => editOpaqueDate(value, date => date.setUTCSeconds(second)),
  // Поддерживает перенос за текущую секунду при отрицательной миллисекунде.
  setMillisecond: (value, ms) => editOpaqueDate(value, date => date.setUTCMilliseconds(ms)),
  // Сравнивает абсолютные UTC значения диапазона.
  isAfter: (a, b) => a.stamp > b.stamp,
  // Отбрасывает служебное NaN значение, которое возвращает Date.parse.
  isValidate: value => Number.isFinite(value.stamp),
  locale: {
    // Начало недели совпадает с настройкой UMD-прогона.
    getWeekFirstDay: () => 0,
    // Читает первую дату недели средствами того же календаря.
    getWeekFirstDate(_locale, value) {
      return opaquePickerAdapter.addDate(value, -opaquePickerAdapter.getWeekDay(value));
    },
    // Считает номер недели от начала календарного года.
    getWeek(_locale, value) {
      const year = opaquePickerAdapter.getYear(value);
      return Math.ceil((value.stamp - Date.UTC(year, 0, 1)) / weekMilliseconds) + 1;
    },
    // Использует краткие подписи, захваченные в эталоне.
    getShortWeekDays: () => weekdays,
    // Возвращает подписи в порядке индексов месяца.
    getShortMonths: () => months,
    // Форматирует дату как текст редактора или подпись ячейки.
    format: (_locale, value, format) => printOpaqueDate(value, format),
    // Принимает точную календарную дату и проверяет её через locale receiver.
    parse(locale, text, formats) {
      if (!formats.includes('YYYY-MM-DD') || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return null;
      }

      const date = opaqueDate(`${text}T00:00:00Z`);
      return opaquePickerAdapter.isValidate(date) && this.format(locale, date, 'YYYY-MM-DD') === text
        ? date : null;
    }
  }
};
