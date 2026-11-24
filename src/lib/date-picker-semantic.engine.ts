// Объединяет оформление календаря и диапазона. Отдельный plain style диапазона
// применяется между семантическими настройками провайдера и самого поля.
import type {
  DatePickerConfig, DatePickerMultipleProps, DatePickerProps, DatePickerSemantic, DatePickerSlots
} from './date-picker.types';
import type { RangePickerProps } from './range-picker.types';
import { mergePickerSlots } from './time-picker-semantic.engine';

/** Вычисляет слоты в контексте фактического поля, не меняя переданные props. */
function resolveSlots<Props extends object>(value: DatePickerSemantic<Props> | undefined, props: Props) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Объединяет общие слоты picker и роли заголовка и тела календаря. */
function mergeCalendarSlots(layers: (DatePickerSlots | undefined)[], separator: string) {
  const common = mergePickerSlots(layers, separator);
  const headers: string[] = [];
  const bodies: string[] = [];

  for (const layer of layers) {
    const popup = layer?.popup;
    if (!popup || typeof popup === 'string') continue;

    if (popup.header) headers.push(popup.header);
    if (popup.body) bodies.push(popup.body);
  }

  return {
    ...common,
    popup: {
      ...common.popup,
      header: headers.join(separator) || undefined,
      body: bodies.join(separator) || undefined
    }
  };
}

/** Собирает контекст и локальные слои в порядке DatePicker/RangePicker. */
export function datePickerSemantic<
  Props extends DatePickerProps | DatePickerMultipleProps | RangePickerProps
>(
  props: Props,
  config: DatePickerConfig | undefined,
  localClassNames: DatePickerSemantic<Props> | undefined,
  localStyles: DatePickerSemantic<Props> | undefined,
  providerStyle: string | undefined
) {
  const classes = mergeCalendarSlots([
    resolveSlots(config?.classNames, props), resolveSlots(localClassNames, props)
  ], ' ');
  const styles = mergeCalendarSlots([
    resolveSlots(config?.styles, props), { root: providerStyle }, resolveSlots(localStyles, props)
  ], ';');

  return { classes, styles };
}
