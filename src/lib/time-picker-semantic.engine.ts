// Combines slots of total picker and external TimePicker. The factory family removes slots from the
// actual props single field or time set.
import type {
  TimePickerConfig,
  TimePickerMultipleProps,
  TimePickerProps,
  TimePickerSlots,
  TimePickerPopupSlots
} from './time-picker.types';

/** Reserves the order of the sources and translates the string popup into the root slot. */
export function mergePickerSlots(values: (TimePickerSlots | undefined)[], separator: string) {
  /** Normalizes the recording of the slot for the general circumvention of classes and styles. */
  const popup = (value: TimePickerSlots | undefined): TimePickerPopupSlots =>
    typeof value?.popup === 'string' ? { root: value.popup } : value?.popup ?? {};
  /** Returns undefined when the slot does not have a single source. */
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

interface AppearanceConfig<Props extends object> {
  classNames?: SlotOptions<Props>;
  styles?: SlotOptions<Props>;
  style?: string;
}

/** Merges the provider and local slots against the props of the picker being rendered. */
function mergeTimePickerAppearance<Props extends object>(
  props: Props,
  config: AppearanceConfig<NoInfer<Props>> | undefined,
  localClasses: SlotOptions<Props> | undefined,
  localStyles: SlotOptions<Props> | undefined
) {
  /** Each callback receives the same props for this pass through the style layers. */
  const resolve = (value: SlotOptions<Props> | undefined) =>
    typeof value === 'function' ? value({ props }) : value;
  const providerClasses = config?.classNames;
  const providerStyles = config?.styles;

  return {
    classes: mergePickerSlots([resolve(providerClasses), resolve(localClasses)], ' '),
    styles: mergePickerSlots([
      resolve(providerStyles), { root: config?.style }, resolve(localStyles)
    ], ';')
  };
}

/** Semantic layers are outer TimePicker/inner SinglePicker, including callbacks order. */
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
