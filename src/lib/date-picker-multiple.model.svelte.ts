// Хранит принятый массив отдельно от выбора в открытой панели. Даты и их
// ссылки сохраняются, сортировка затрагивает только новый массив выбора.
import { untrack } from 'svelte';
import type { createDatePickerEngine } from './date-picker.engine';
import type { PickerDateOperations } from './picker-date-operations.engine';
import type {
  DatePickerFormat, DatePickerMultipleProps, DatePickerPicker
} from './date-picker.types';

interface MultiplePickerOptions<DateType extends object> {
  props?: DatePickerMultipleProps<DateType>;
  local: readonly DateType[];
  picker: DatePickerPicker;
  locale: string;
  formats: DatePickerFormat<DateType>[];
  disabled: boolean;
  valid: (value: DateType) => boolean;
}

export const emptyPickerDates: readonly never[] = [];

/** Связывает изменения панели, подтверждение и отклонённое значение владельца. */
export function createMultiplePicker<DateType extends object>(
  options: MultiplePickerOptions<DateType>,
  dates: PickerDateOperations<DateType>,
  { formatPicker, samePickerPanelValue }: ReturnType<typeof createDatePickerEngine<DateType>>
) {
  /** Строго сравнивает порядок и полные календарные поля выбранных дат. */
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

  /** Выводит одну дату общим форматом поля, включая locale и callback. */
  function format(value: DateType) {
    const { locale, formats } = options;

    return formatPicker(value, locale, formats);
  }

  /** Обновляет список панели и сообщает владельцу только фактическое изменение. */
  function update(values: readonly DateType[]) {
    const props = options.props;
    const next = [...values];

    if (props?.order !== false) {
      next.sort(dates.compare);
    }
    if (!sameDates(draft, next)) {
      draft = next;
      props?.onCalendarChange?.(next, next.map(format), { source: 'date' });
    }
  }

  /** Снятие выбора удаляет весь период, даже если начальный массив содержал дубликаты. */
  function withoutPeriod(value: DateType) {
    const { picker, locale } = options;

    return draft.filter(date => !samePickerPanelValue(value, date, false, picker, locale));
  }

  /** Выбор уже отмеченного периода удаляет его. */
  function toggle(value: DateType) {
    const remainder = withoutPeriod(value);

    return remainder.length === draft.length ? [...draft, value] : remainder;
  }

  /** Публикует проверенный массив. Полная очистка имеет специальный null payload. */
  function publish(clear = false) {
    const { props, disabled, valid } = options;

    if (!props || disabled || !clear && draft.some(date => !valid(date))) {
      return false;
    }

    const next = [...draft];
    const changed = !sameDates(saved, next);
    if (props.value === undefined) options.local = next;
    if (changed) props.onChange?.(clear ? null : next, next.length ? next.map(format) : null);

    return true;
  }

  /** Восстанавливает принятый список. Отмена панели также сообщает о смене черновика. */
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
    /** Интерактивное поле показывает черновик до закрытия панели. */
    get values() { return draft; },
    /** Начинает новый цикл подтверждения после открытия. */
    open() {
      confirmed = false;
    },
    /** Сохраняет подсветку панели и pending tags до завершения выбора. */
    select(value: DateType) {
      confirmed = false;
      update(toggle(value));
    },
    /** Пресет применяет период сразу и оставляет панель открытой. */
    preset(value: DateType) {
      update(toggle(value));
      publish();
    },
    /** В открытой панели удаление остаётся черновиком до её закрытия. */
    remove(value: DateType, open: boolean) {
      confirmed = false;
      update(withoutPeriod(value));
      if (!open) {
        publish();
        reset(false);
      }
    },
    /** Проверяет возможность подтверждения всего выбранного набора. */
    get canConfirm() {
      const { valid } = options;

      return draft.length > 0 && draft.every(valid);
    },
    /** OK предшествует итоговому изменению и закрытию панели. */
    confirm() {
      if (!this.canConfirm) {
        return false;
      }

      options.props?.onOk?.([...draft]);
      confirmed = publish();

      return confirmed;
    },
    /** Применяет черновик после закрытия либо возвращает принятые даты. */
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
    /** Явная очистка может опубликовать пустой выбор независимо от needConfirm. */
    clear() {
      update(emptyPickerDates);
      publish(true);
      reset(false);
    },
    format
  };
}
