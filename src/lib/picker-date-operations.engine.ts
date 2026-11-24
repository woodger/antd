// Связывает календарные операции поля и панели с одной конфигурацией дат. Значения
// принадлежат адаптеру и передаются наружу с исходным типом и ссылкой.
import type { Dayjs } from 'dayjs';
import type { GenerateConfig } from './date-generate.types';
import { dayjsGenerateConfig } from './date-picker-dayjs.engine';
import type { TimePickerUnit } from './time-picker.types';

export type PickerDatePeriod = 'day' | 'month' | 'year';

type PickerDateFields<DateType> = Pick<GenerateConfig<DateType>,
  'getYear' | 'getMonth' | 'getDate' | 'getHour' | 'getMinute' | 'getSecond' | 'getMillisecond'
  | 'setYear' | 'setMonth' | 'setDate' | 'setHour' | 'setMinute' | 'setSecond' | 'setMillisecond'
  | 'addYear' | 'addMonth' | 'addDate' | 'isValidate'>;

export interface PickerDateOperations<DateType extends object> {
  generateConfig: GenerateConfig<DateType>;
  fields: PickerDateFields<DateType>;
  getTimeUnit: (value: DateType, unit: TimePickerUnit) => number;
  setTimeUnit: (value: DateType, unit: TimePickerUnit, next: number) => DateType;
  add: (value: DateType, amount: number, unit: PickerDatePeriod | 'millisecond') => DateType;
  startOf: (value: DateType, period: PickerDatePeriod) => DateType;
  endOf: (value: DateType, period: PickerDatePeriod) => DateType;
  isBefore: (value: DateType, reference: DateType, period?: PickerDatePeriod) => boolean;
  isAfter: (value: DateType, reference: DateType, period?: PickerDatePeriod) => boolean;
  samePeriod: (value: DateType, reference: DateType, period: PickerDatePeriod) => boolean;
  sameTime: (value: DateType, reference: DateType) => boolean;
  sameWallValue: (value: DateType | null, reference: DateType | null) => boolean;
  sameValue: (
    value: DateType | null | undefined, reference: DateType | null | undefined
  ) => boolean;
  compare: (value: DateType, reference: DateType) => number;
  key: (value: DateType) => number | string;
  formatKey: (value: DateType, format?: string, locale?: string) => string;
}

const timeReaders = {
  hour: 'getHour', minute: 'getMinute', second: 'getSecond', millisecond: 'getMillisecond'
} as const;
const timeWriters = {
  hour: 'setHour', minute: 'setMinute', second: 'setSecond', millisecond: 'setMillisecond'
} as const;
const calendarOffsets = { day: 'addDate', month: 'addMonth', year: 'addYear' } as const;

/** Собирает операции панели из GenerateConfig, сохраняя receiver его методов. */
export function createPickerDateOperations<DateType extends object>(
  generateConfig: GenerateConfig<DateType>,
  fields: PickerDateFields<DateType> = generateConfig
): PickerDateOperations<DateType> {
  /** Устанавливает время границы календарного периода с точностью до миллисекунды. */
  function setDayBoundary(value: DateType, end: boolean) {
    const hours = fields.setHour(value, end ? 23 : 0);
    const minutes = fields.setMinute(hours, end ? 59 : 0);
    const seconds = fields.setSecond(minutes, end ? 59 : 0);

    return fields.setMillisecond(seconds, end ? 999 : 0);
  }

  /** Сравнивает поля до выбранного периода, начиная с календарного года. */
  function samePeriod(value: DateType, reference: DateType, period: PickerDatePeriod) {
    return fields.getYear(value) === fields.getYear(reference)
      && (period === 'year' || fields.getMonth(value) === fields.getMonth(reference))
      && (period !== 'day' || fields.getDate(value) === fields.getDate(reference));
  }

  /** Сравнивает время для режима time и границ, точных до секунды. */
  function sameTime(value: DateType, reference: DateType) {
    return fields.getHour(value) === fields.getHour(reference)
      && fields.getMinute(value) === fields.getMinute(reference)
      && fields.getSecond(value) === fields.getSecond(reference);
  }

  /** Сравнивает все календарные поля, включая долю секунды, как isSameTimestamp rc-picker. */
  function sameWallValue(value: DateType | null, reference: DateType | null) {
    if (!value || !reference) {
      return value === reference;
    }

    return samePeriod(value, reference, 'day') && sameTime(value, reference)
      && fields.getMillisecond(value) === fields.getMillisecond(reference);
  }

  return {
    generateConfig,
    fields,
    // Выбирает getter колонки без преобразования значения даты.
    getTimeUnit: (value, unit) => fields[timeReaders[unit]](value),
    // Передаёт новое значение колонки адаптеру и возвращает вычисленную им дату.
    setTimeUnit: (value, unit, next) => fields[timeWriters[unit]](value, next),
    // Календарный шаг зависит от выбранной единицы. Для доли секунды сохраняет перенос.
    add: (value, amount, unit) => unit === 'millisecond'
      ? fields.setMillisecond(value, fields.getMillisecond(value) + amount)
      : fields[calendarOffsets[unit]](value, amount),
    // Обнуляет младшие поля выбранного календарного периода.
    startOf(value, period) {
      const month = period === 'year' ? fields.setMonth(value, 0) : value;
      const day = period === 'day' ? month : fields.setDate(month, 1);

      return setDayBoundary(day, false);
    },
    // Последний день определяет адаптер, включая разную длину месяцев.
    endOf(value, period) {
      const month = period === 'year' ? fields.setMonth(value, 11) : value;
      const day = period === 'day' ? month : generateConfig.getEndDate(month);

      return setDayBoundary(day, true);
    },
    // Порядок в пределах одного календарного периода считается равным.
    isBefore: (value, reference, period) => (!period || !samePeriod(value, reference, period))
      && generateConfig.isAfter(reference, value),
    // Проверяет превышение границы с указанной точностью, если она задана.
    isAfter: (value, reference, period) => (!period || !samePeriod(value, reference, period))
      && generateConfig.isAfter(value, reference),
    samePeriod,
    sameTime,
    sameWallValue,
    // Поле использует null и undefined как отсутствие выбранной даты.
    sameValue: (value, reference) => value === reference
      || sameWallValue(value ?? null, reference ?? null),
    // Порядок адаптера задаёт сортировку, совпадающие значения оставляют порядок входа.
    compare: (value, reference) => generateConfig.isAfter(value, reference) ? 1
      : generateConfig.isAfter(reference, value) ? -1 : 0,
    // Ключ тегов сохраняется при замене даты равным экземпляром того же адаптера.
    key: value => [
      fields.getYear(value), fields.getMonth(value), fields.getDate(value),
      fields.getHour(value), fields.getMinute(value), fields.getSecond(value),
      fields.getMillisecond(value)
    ].join(':'),
    // Метки календаря и маркеры фокуса используют одинаковую локаль и формат.
    formatKey: (value, format = 'YYYY-MM-DD HH:mm:ss.SSS', locale = 'en_US') =>
      generateConfig.locale.format(locale, value, format)
  };
}

const dayjsFields: PickerDateFields<Dayjs> = {
  // Панель использует календарный год в режиме самого экземпляра Dayjs.
  getYear: value => value.year(),
  // Индекс от нуля применяется для сетки и вычисления квартала.
  getMonth: value => value.month(),
  // Сохраняет локальный день месяца при сравнении ячеек.
  getDate: value => value.date(),
  // Временная шкала колонки часов начинается с нуля.
  getHour: value => value.hour(),
  // Сохраняет минуты в исходной зоне значения.
  getMinute: value => value.minute(),
  // Возвращает секунду минуты для ограничений и колонки выбора.
  getSecond: value => value.second(),
  // Читает точность поля без преобразования к timestamp.
  getMillisecond: value => value.millisecond(),
  // Устанавливает год правилами исходного экземпляра Dayjs.
  setYear: (value, year) => value.year(year),
  // Переход к месяцу сохраняет правила Dayjs для коротких месяцев.
  setMonth: (value, month) => value.month(month),
  // Установка дня сохраняет перенос на соседний месяц.
  setDate: (value, day) => value.date(day),
  // Заменяет час, сохраняя режим UTC или локального времени у значения.
  setHour: (value, hour) => value.hour(hour),
  // Заменяет минуту в том же календарном режиме.
  setMinute: (value, minute) => value.minute(minute),
  // Заменяет секунду без округления до минуты.
  setSecond: (value, second) => value.second(second),
  // Сохраняет миллисекунды в Dayjs.
  setMillisecond: (value, millisecond) => value.millisecond(millisecond),
  // Прокручивает год панели по календарю.
  addYear: (value, amount) => value.add(amount, 'year'),
  // Прокручивает месяц с коррекцией дня в целевом месяце.
  addMonth: (value, amount) => value.add(amount, 'month'),
  // Сохраняет календарный шаг при переходе через смену часового смещения.
  addDate: (value, amount) => value.add(amount, 'day'),
  // Проверяет значение в его исходном экземпляре.
  isValidate: value => value.isValid()
};

export const dayjsPickerDates: PickerDateOperations<Dayjs> = {
  ...createPickerDateOperations(dayjsGenerateConfig, dayjsFields),
  // Сохраняет исходный Dayjs get, включая настройки подключённых plugins.
  getTimeUnit: (value, unit) => value.get(unit),
  // Сохраняет Dayjs set для изменения одной колонки.
  setTimeUnit: (value, unit, next) => value.set(unit, next),
  // Использует календарные и абсолютные шаги Dayjs с правилами текущей зоны.
  add: (value, amount, unit) => value.add(amount, unit),
  // Вычисляет начало в исходной зоне значения с правилами timezone plugins.
  startOf: (value, period) => value.startOf(period),
  // Вычисляет конец периода средствами исходного Dayjs.
  endOf: (value, period) => value.endOf(period),
  // Сохраняет сравнение Dayjs с приведением к периоду первого значения.
  isBefore: (value, reference, period) => value.isBefore(reference, period),
  // Сохраняет сравнение Dayjs по началу периода первого значения.
  isAfter: (value, reference, period) => value.isAfter(reference, period),
  // Для навигации Dayjs сравнивает календарный интервал первого значения.
  samePeriod: (value, reference, period) => value.isSame(reference, period),
  // Выбор даты по умолчанию сравнивается как timestamp и учитывает смещение зоны.
  sameValue: (value, reference) => value?.valueOf() === reference?.valueOf(),
  // Сортирует теги Dayjs по прежнему числовому timestamp.
  compare: (value, reference) => value.valueOf() - reference.valueOf(),
  // Теги Dayjs используют исходный timestamp как часть ключа.
  key: value => value.valueOf(),
  // Служебные подписи Dayjs сохраняют locale самого экземпляра.
  formatKey: (value, format) => value.format(format)
};
