// Объединяет слоты общего пикера и внешнего TimePicker. Семейство фабрики
// выводит слоты из фактических props одиночного поля или набора времени.
import type {
  TimePickerConfig,
  TimePickerMultipleProps,
  TimePickerProps,
  TimePickerSlots,
  TimePickerPopupSlots
} from './time-picker.types';

/** Сохраняет порядок источников и переводит строковый popup в слот root. */
export function mergePickerSlots(values: (TimePickerSlots | undefined)[], separator: string) {
  /** Нормализует запись слота для общего обхода классов и стилей. */
  const popup = (value: TimePickerSlots | undefined): TimePickerPopupSlots =>
    typeof value?.popup === 'string' ? { root: value.popup } : value?.popup ?? {};
  /** Возвращает undefined, когда у слота нет ни одного источника. */
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

type SlotOptions<Props extends object> = TimePickerSlots
  | ((info: { props: Props; }) => TimePickerSlots | undefined);

/** Читает провайдер и слоты владельца с одним снимком props. */
function mergeTimePickerAppearance<Props extends object>(
  props: Props, config: TimePickerConfig | undefined,
  localClasses: SlotOptions<Props> | undefined, localStyles: SlotOptions<Props> | undefined
) {
  /** Выполняет callback на фактических props с типом даты текущего адаптера. */
  const resolve = (value: SlotOptions<Props> | undefined) =>
    typeof value === 'function' ? value({ props }) : value;
  // Провайдер разделяется между пикерами разных адаптеров и размеров выбора.
  const providerClasses = config?.classNames as SlotOptions<Props> | undefined;
  const providerStyles = config?.styles as SlotOptions<Props> | undefined;

  return {
    classes: mergePickerSlots([resolve(providerClasses), resolve(localClasses)], ' '),
    styles: mergePickerSlots([
      resolve(providerStyles), { root: config?.style }, resolve(localStyles)
    ], ';')
  };
}

/** Semantic слои outer TimePicker/inner SinglePicker, включая порядок callbacks. */
export function timePickerSemantic<DateType extends object>(
  props: TimePickerProps<'time', DateType> | TimePickerMultipleProps<DateType>,
  config: TimePickerConfig | undefined,
  resolved: Pick<TimePickerProps, 'variant' | 'size' | 'disabled'>,
  standalone = true
) {
  if (props.multiple) {
    const resolvedProps = { ...props, size: resolved.size, disabled: resolved.disabled };
    return mergeTimePickerAppearance(resolvedProps, config, props.classNames, props.styles);
  }
  const outerProps = standalone
    ? { ...props, variant: resolved.variant }
    : { ...props, size: resolved.size, disabled: resolved.disabled, status: props.status,
      variant: props.variant };
  const outer = mergeTimePickerAppearance(outerProps, config, props.classNames, props.styles);
  if (!standalone) {
    return outer;
  }

  const innerProps: TimePickerProps<'time', DateType> = {
    ...outerProps,
    ...resolved,
    classNames: outer.classes,
    styles: outer.styles,
    renderExtraFooter: props.renderExtraFooter
  };

  return mergeTimePickerAppearance(innerProps, config, outer.classes, outer.styles);
}
