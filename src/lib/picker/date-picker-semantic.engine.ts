// Merges date picker and range styling. The range's plain style goes between the provider's
// semantic styles and the field's own styles.
import type {
  DatePickerConfig, DatePickerSemantic, DatePickerSlots
} from './date-picker.types';
import { mergePickerSlots } from './time-picker-semantic.engine';

/** Resolves slots in the actual field's context without changing the received props. */
function resolveSlots<Props extends object>(value: DatePickerSemantic<Props> | undefined, props: Props) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Merges shared picker slots with the calendar header and body roles. */
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

/** Combines contextual and local layers in DatePicker/RangePicker precedence order. */
export function datePickerSemantic<Props extends object>(
  props: Props,
  config: DatePickerConfig | undefined,
  localClassNames: DatePickerSemantic<Props> | undefined,
  localStyles: DatePickerSemantic<Props> | undefined,
  providerStyle: string | undefined
) {
  // ConfigProvider is shared by pickers with different adapters. Its callback receives the actual
  // field props, including a date object from the selected adapter.
  const providerClasses = config?.classNames as DatePickerSemantic<Props> | undefined;
  const providerStyles = config?.styles as DatePickerSemantic<Props> | undefined;

  const classes = mergeCalendarSlots([
    resolveSlots(providerClasses, props), resolveSlots(localClassNames, props)
  ], ' ');
  const styles = mergeCalendarSlots([
    resolveSlots(providerStyles, props), { root: providerStyle }, resolveSlots(localStyles, props)
  ], ';');

  return { classes, styles };
}
