import type {
  TimePickerConfig,
  TimePickerProps,
  TimePickerSemantic,
  TimePickerSlots,
  TimePickerPopupSlots
} from './time-picker.types';

export function mergePickerSlots(values: (TimePickerSlots | undefined)[], separator: string) {
  const popup = (value: TimePickerSlots | undefined): TimePickerPopupSlots =>
    typeof value?.popup === 'string' ? { root: value.popup } : value?.popup ?? {};
  const join = (parts: (string | undefined)[]) =>
    parts.filter(Boolean).join(separator) || undefined;

  return {
    root: join(values.map(value => value?.root)),
    prefix: join(values.map(value => value?.prefix)),
    input: join(values.map(value => value?.input)),
    suffix: join(values.map(value => value?.suffix)),
    popup: {
      root: join(values.map(value => popup(value).root)),
      content: join(values.map(value => popup(value).content)),
      item: join(values.map(value => popup(value).item)),
      footer: join(values.map(value => popup(value).footer)),
      container: join(values.map(value => popup(value).container))
    }
  };
}

/** Semantic слои outer TimePicker/inner SinglePicker, включая порядок callbacks. */
export function timePickerSemantic<DateType extends object>(
  props: TimePickerProps<'time', DateType>,
  config: TimePickerConfig | undefined,
  resolved: Pick<TimePickerProps, 'variant' | 'size' | 'disabled'>
) {
  const resolve = (
    value: TimePickerSemantic<DateType> | undefined,
    props: TimePickerProps<'time', DateType>
  ) =>
    typeof value === 'function' ? value({ props }) : value;
  // Настройки провайдера получают props фактического пикера, включая его тип даты.
  const providerClasses = config?.classNames as TimePickerSemantic<DateType> | undefined;
  const providerStyles = config?.styles as TimePickerSemantic<DateType> | undefined;
  const outerProps = { ...props, variant: resolved.variant };
  const outerClasses = mergePickerSlots([
    resolve(providerClasses, outerProps), resolve(props.classNames, outerProps)
  ], ' ');
  const outerStyles = mergePickerSlots([
    resolve(providerStyles, outerProps), { root: config?.style },
    resolve(props.styles, outerProps)
  ], ';');
  const innerProps: TimePickerProps<'time', DateType> = {
    ...outerProps,
    ...resolved,
    classNames: outerClasses,
    styles: outerStyles,
    renderExtraFooter: props.renderExtraFooter
  };

  return {
    classes: mergePickerSlots([resolve(providerClasses, innerProps), outerClasses], ' '),
    styles: mergePickerSlots([
      resolve(providerStyles, innerProps), { root: config?.style }, outerStyles
    ], ';')
  };
}
