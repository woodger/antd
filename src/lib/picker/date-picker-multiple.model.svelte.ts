// Keeps committed values separate from selection in the open panel. Date references are preserved,
// and sorting only affects the new selection array.
import { untrack } from 'svelte';
import type { createDatePickerEngine } from './date-picker.engine';
import type { PickerDateOperations } from './picker-date-operations.engine';
import type {
  DatePickerFormat, DatePickerMultipleProps, DatePickerPicker
} from './date-picker.types';

interface MultiplePickerOptions<DateType extends object> {
  props?: Pick<DatePickerMultipleProps<DateType>, 'value' | 'order' | 'onChange' | 'onOk'>;
  local: readonly DateType[];
  picker: DatePickerPicker | 'time';
  locale: string;
  formats: DatePickerFormat<DateType>[];
  disabled: boolean;
  valid: (value: DateType) => boolean;
  calendarChange?: (value: DateType[], text: string[]) => void;
}

export const emptyPickerDates: readonly never[] = [];

/** Coordinates panel changes, confirmation, and values rejected by the owner. */
export function createMultiplePicker<DateType extends object>(
  options: MultiplePickerOptions<DateType>,
  dates: PickerDateOperations<DateType>,
  { formatPicker, samePickerPanelValue }: ReturnType<typeof createDatePickerEngine<DateType>>
) {
  /** Compares both the order and all calendar fields of the selected dates. */
  function sameDates(left: readonly DateType[], right: readonly DateType[]) {
    return left.length === right.length && left.every((date, index) => {
      const other = right[index];

      return date === other || samePickerPanelValue(date, other, true);
    });
  }

  let saved = $derived.by(() => {
    const value = options.props?.value;

    return value === undefined ? options.local : value ?? emptyPickerDates;
  });
  let draft = $state.raw<readonly DateType[]>(untrack(() => saved));
  let confirmed = false;

  $effect.pre(() => {
    const accepted = saved;
    draft = accepted;
  });

  /** Formats one date with the shared field format, locale, and callback. */
  function format(value: DateType) {
    const { locale, formats } = options;

    return formatPicker(value, locale, formats);
  }

  /** Updates the panel list and informs the owner only when it changes. */
  function update(values: readonly DateType[]) {
    const props = options.props;
    const next = [...values];

    if (props?.order !== false) {
      next.sort(dates.compare);
    }
    if (!sameDates(draft, next)) {
      draft = next;
      options.calendarChange?.(next, next.map(format));
    }
  }

  /** The tag button removes all values in the same period or at the same time to the second. */
  function withoutPeriod(value: DateType) {
    const { picker, locale } = options;
    if (picker === 'time') {
      return draft.filter(date => !dates.sameTime(value, date));
    }

    return draft.filter(date => !samePickerPanelValue(value, date, false, picker, locale));
  }

  /** Selecting the same time again removes the first matching tag, as in useToggleDates. */
  function toggle(value: DateType) {
    if (options.picker === 'time') {
      const index = draft.findIndex(date => dates.sameTime(value, date));
      const next = [...draft];
      if (index === -1) {
        next.push(value);
      }
      else {
        next.splice(index, 1);
      }
      return next;
    }

    const remainder = withoutPeriod(value);

    return remainder.length === draft.length ? [...draft, value] : remainder;
  }

  /** Publishes the validated array. Clearing the selection has a special null payload. */
  function publish(clear = false, accepted?: readonly DateType[]) {
    const { props, disabled, valid } = options;

    if (!props || disabled || !clear && draft.some(date => !valid(date))) {
      return false;
    }

    const next = [...draft];
    const changed = !sameDates(accepted ?? saved, next);
    if (props.value === undefined) options.local = next;
    if (changed) props.onChange?.(clear ? null : next, next.length ? next.map(format) : null);

    return true;
  }

  /** Restores the committed list. Canceling the panel also reports a draft change. */
  function reset(notify: boolean) {
    const accepted = saved;

    if (notify && !sameDates(draft, accepted)) {
      update(accepted);
    }
    else {
      draft = accepted;
    }
  }

  return {
    /** The interactive field displays the draft until the panel closes. */
    get values() { return draft; },
    /** Begins a new confirmation session after opening. */
    open() {
      confirmed = false;
    },
    /** Preserves the panel highlight and pending tags until selection finishes. */
    select(value: DateType) {
      confirmed = false;
      update(toggle(value));
    },
    /** A preset applies the period immediately and keeps the panel open. */
    preset(value: DateType) {
      update(toggle(value));
      publish();
    },
    /** Removal in the open panel stays in the draft until the panel closes. */
    remove(value: DateType, open: boolean) {
      confirmed = false;
      update(withoutPeriod(value));
      if (!open) {
        publish();
        reset(false);
      }
    },
    /** Checks whether the entire selection can be confirmed. */
    get canConfirm() {
      const { valid } = options;

      return draft.length > 0 && draft.every(valid);
    },
    /** Reports the draft and prepares submission with the value from before onOk. */
    prepareConfirmation() {
      if (!this.canConfirm) {
        return undefined;
      }

      const props = options.props;
      const onOk = props?.onOk;
      const accepted = onOk && saved;
      onOk?.call(props, [...draft]);

      /** The confirmation session owner determines when to submit. */
      return () => publish(false, accepted);
    },
    /** Finishes calendar selection after a successful submission. */
    confirm() {
      const submit = this.prepareConfirmation();
      if (!submit) {
        return false;
      }

      confirmed = submit();
      return confirmed;
    },
    /** Commits the draft on close or restores the accepted dates. */
    close(needsConfirmation: boolean) {
      if (confirmed || !needsConfirmation
        && (sameDates(saved, draft) || draft.length && publish())) {
        reset(false);
      }
      else {
        reset(true);
      }
      confirmed = false;
    },
    /** An explicit clear can publish an empty selection regardless of needConfirm. */
    clear() {
      update(emptyPickerDates);
      publish(true);
      reset(false);
    },
    format, update, toggle, withoutPeriod, publish, reset
  };
}
