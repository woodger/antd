// Реализует GenerateConfig через Dayjs. Нормализует локаль и значения из другого экземпляра Dayjs
// перед операциями адаптера.
// Day.js adapter по @rc-component/picker 1.12.2; MIT, vendor/LICENSE.rc-picker.
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import weekday from 'dayjs/plugin/weekday.js';
import localeData from 'dayjs/plugin/localeData.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import weekYear from 'dayjs/plugin/weekYear.js';
import 'dayjs/locale/ru.js';
import type { GenerateConfig } from './date-generate.types';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend((_options, constructor) => {
  const original = constructor.prototype.format;
  constructor.prototype.format = function(format) {
    // Оригинальный formatter использует текущий экземпляр Dayjs как receiver.
    return original.call(this, (format ?? '').replace('Wo', 'wo'));
  };
});
const localeMap: Record<string, string> = {
  bn_BD: 'bn-bd',
  by_BY: 'be',
  en_GB: 'en-gb',
  en_US: 'en',
  fr_BE: 'fr',
  fr_CA: 'fr-ca',
  hy_AM: 'hy-am',
  km_KH: 'km',
  kmr_IQ: 'ku',
  nl_BE: 'nl-be',
  pt_BR: 'pt-br',
  zh_CN: 'zh-cn',
  zh_HK: 'zh-hk',
  zh_TW: 'zh-tw'
};
// Сопоставляет имена locale Picker с кодом Dayjs, сохраняя исключения для регионов.
const localeName = (locale: string) => localeMap[locale] || locale.split('_')[0];
// Сохраняем поведение адаптера при нескольких экземплярах библиотеки Day.js.
const own = (value: Dayjs) => !dayjs.isDayjs(value) || value instanceof dayjs
  ? value
  : dayjs(value.valueOf());
export const dayjsGenerateConfig: GenerateConfig<Dayjs> = {
  // Учитывает текущую зону, если у установленного Dayjs доступен plugin timezone.
  getNow: () => {
    const now = dayjs() as Dayjs & { tz?: () => Dayjs; };
    return typeof now.tz === 'function' ? now.tz() : now;
  },
  // Разбирает служебную дату с месяцем из одной или двух цифр.
  getFixedDate: text => dayjs(text, ['YYYY-M-DD', 'YYYY-MM-DD']),
  // Возвращает конец месяца с правилами календаря Dayjs.
  getEndDate: value => own(value).endOf('month'),
  // Считает индекс дня на общей шкале, используя английскую locale для вычисления.
  getWeekDay: value => {
    const date = own(value).locale('en');
    return date.weekday() + date.localeData().firstDayOfWeek();
  },
  // Читает календарный год, используемый панелью выбора года.
  getYear: value => own(value).year(),
  // Возвращает индекс месяца от нуля, как ожидает GenerateConfig.
  getMonth: value => own(value).month(),
  // Возвращает номер дня месяца от единицы для сетки.
  getDate: value => own(value).date(),
  // Читает час в 24-часовой шкале; meridiem вычисляет панель.
  getHour: value => own(value).hour(),
  // Читает минуту текущего часа для колонки выбора.
  getMinute: value => own(value).minute(),
  // Читает секунду текущей минуты для колонки выбора.
  getSecond: value => own(value).second(),
  // Сохраняет дробную часть секунды как целое число от 0 до 999.
  getMillisecond: value => own(value).millisecond(),
  // Сдвигает календарный год с нормализацией дня в целевом месяце.
  addYear: (value, amount) => own(value).add(amount, 'year'),
  // Сдвигает месяц по календарю вместо фиксированного числа дней.
  addMonth: (value, amount) => own(value).add(amount, 'month'),
  // Сдвигает календарный день, используя локальную арифметику Dayjs.
  addDate: (value, amount) => own(value).add(amount, 'day'),
  // Создаёт значение для выбранного года с коррекцией датой адаптера.
  setYear: (value, year) => own(value).year(year),
  // Передаёт Dayjs индекс месяца от нуля, включая перенос через границу года.
  setMonth: (value, month) => own(value).month(month),
  // Устанавливает календарный день для переходов между ячейками.
  setDate: (value, date) => own(value).date(date),
  // Заменяет часы, сохраняя остальные единицы времени Dayjs.
  setHour: (value, hour) => own(value).hour(hour),
  // Заменяет минуты, оставляя нормализацию переполнения адаптеру.
  setMinute: (value, minute) => own(value).minute(minute),
  // Заменяет секунды без округления миллисекунд.
  setSecond: (value, second) => own(value).second(second),
  // Заменяет миллисекунды в значении времени.
  setMillisecond: (value, millisecond) => own(value).millisecond(millisecond),
  // Сравнивает приведённые Dayjs без округления до крупной единицы.
  isAfter: (a, b) => own(a).isAfter(own(b)),
  // Использует статус валидности Dayjs перед публикацией значения.
  isValidate: value => own(value).isValid(),
  locale: {
    // Читает локальный первый день недели для смещения сетки.
    getWeekFirstDay: locale => dayjs().locale(localeName(locale)).localeData().firstDayOfWeek(),
    // Возвращает начальную дату недели в указанной locale.
    getWeekFirstDate: (locale, value) => own(value).locale(localeName(locale)).weekday(0),
    // Читает номер недели по правилам locale, используемой при parse.
    getWeek: (locale, value) => own(value).locale(localeName(locale)).week(),
    // Передаёт короткие подписи дней из localeData Dayjs.
    getShortWeekDays: locale => dayjs().locale(localeName(locale)).localeData().weekdaysMin(),
    // Передаёт краткие названия месяцев в порядке индексов Dayjs.
    getShortMonths: locale => dayjs().locale(localeName(locale)).localeData().monthsShort(),
    // Форматирует значение в указанной locale с поддержкой обозначения номера недели.
    format: (locale, value, format) => own(value).locale(localeName(locale)).format(format),
    // Проверяет форматы строго. Ветка номера недели завершает поиск независимо от оставшихся
    // форматов.
    parse: (locale, text, formats) => {
      for (const format of formats) {
        if (format.includes('wo') || format.includes('Wo')) {
          const [year, week] = text.split('-');
          const first = dayjs(year, 'YYYY').startOf('year').locale(localeName(locale));
          for (let n = 0; n <= 52; n++) {
            const date = first.add(n, 'week');
            if (date.format('Wo') === week) {
              return date;
            }
          }
          return null;
        }
        const date = dayjs(text, format, true).locale(localeName(locale));
        if (date.isValid()) {
          return date;
        }
      }
      return null;
    }
  }
};
