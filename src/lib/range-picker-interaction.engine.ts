// Ведёт состояние взаимодействия с полями диапазона. Решение о переходе отделено от публикации,
// фокуса и сброса.
// Переходы useRangeValueChange из rc-picker 1.12.2; MIT, vendor/LICENSE.rc-picker.
export type RangeInteractionSource =
  'field-switch'
  | 'input'
  | 'panel-intermediate'
  | 'panel-final'
  | 'keyboard-submit-weak'
  | 'keyboard-submit'
  | 'confirm'
  | 'remove'
  | 'popupClose'
  | 'esc';
export type RangeInteractionSubmit = (index: number, all: boolean) => void;

// Создаёт отдельное состояние редактирования для одного RangePicker.
export function createRangeInteraction<Value>(options: {
  fieldCount: () => number;
  needConfirm: () => boolean;
  allowEmpty: () => readonly boolean[];
  getCalendarValue: () => readonly (Value | null | undefined)[];
  triggerCalendarChange: (index: number, value: Value | null) => void;
  flushSubmit: RangeInteractionSubmit;
  resetValue: (index?: number) => void;
}) {
  const { getCalendarValue, triggerCalendarChange, flushSubmit, resetValue } = options;

  let triggeredFields: { index: number; modified: boolean; }[] = [];
  let confirmedIndex: number | null = null;
  let isLastInput = false;
  let current: number | null = null;
  let lastValid = 0;
  // Читает редактируемое поле. Null используется между взаимодействиями.
  const getCurrentIndex = () => current;
  // Сохраняет последнюю реальную позицию даже после сброса текущего поля.
  const setCurrentIndex = (value: number | null) => {
    current = value;
    if (value !== null)
      lastValid = value;
  };
  let forceFocus = false;
  // Запоминает необходимость перевести фокус после перехода.
  const setForceFocus = (value: boolean) => {
    forceFocus = value;
  };

  // Сбрасывает состояние взаимодействия и подтверждения, сохраняя последнюю реальную позицию.
  const reset = () => {
    triggeredFields = [];
    confirmedIndex = null;
    isLastInput = false;
    setCurrentIndex(null);
    setForceFocus(false);
  };
  // Добавляет поле в порядке действий или обновляет его modified-флаг.
  const recordTriggeredField = (index: number, modified?: boolean) => {
    const field = triggeredFields.find(item => item.index === index);
    if (field) {
      if (modified !== undefined) {
        field.modified = modified;
      }
    }
    else {
      triggeredFields = [...triggeredFields, {
        index,
        modified: modified ?? false
      }];
    }
  };
  // Публикует выбранное поле и завершает взаимодействие, когда обработаны все поля.
  const submitField = (index: number, flush: RangeInteractionSubmit) => {
    recordTriggeredField(index);
    const allFieldsTriggered = triggeredFields.length >= options.fieldCount();
    flush(index, allFieldsTriggered);
    if (allFieldsTriggered) {
      reset();
    }
    return allFieldsTriggered;
  };
  // Выбирает команду по источнику действия, пустому значению и needConfirm.
  const resolveAction = (
    currentIndex: number | null,
    index: number,
    source: RangeInteractionSource,
    value?: Value | null
  ) => {
    if (source === 'esc') {
      return 'resetAll';
    }
    if (currentIndex === null) {
      return source === 'popupClose' ? 'resetAll' : 'abort';
    }
    let currentValue = value;
    if (currentValue === undefined) {
      const calendarValue = getCalendarValue();
      currentValue = calendarValue[currentIndex];
    }

    const currentEmpty = currentValue === null || currentValue === undefined;
    const canSwitch = !currentEmpty || options.allowEmpty()[currentIndex];
    const canSubmit = source === 'remove' || canSwitch;
    if (source === 'field-switch') {
      return fieldSwitchAction(currentIndex, index, canSwitch);
    }
    if (index !== currentIndex) {
      return 'abort';
    }
    if (source === 'popupClose') {
      return closeAction(currentIndex, canSwitch, canSubmit);
    }
    if (source === 'input' || source === 'panel-intermediate') {
      return 'modify';
    }
    if (source === 'panel-final') {
      return options.needConfirm() ? 'modify' : 'switchNext';
    }
    if (source === 'keyboard-submit-weak') {
      return canSubmit ? 'submitCurrent' : 'abort';
    }
    if (source === 'keyboard-submit' || source === 'confirm' || source === 'remove') {
      return canSubmit ? 'switchNext' : 'abort';
    }
    return 'abort';
  };

  // Переход в другое поле разрешён только по циклическому порядку полей.
  function fieldSwitchAction(currentIndex: number, index: number, canSwitch: boolean) {
    if (index === currentIndex) {
      return 'abort';
    }
    const nextIndex = (currentIndex + 1) % options.fieldCount();
    if (index !== nextIndex) {
      return 'abort';
    }

    const nextFieldTriggered = triggeredFields.some(field => field.index === nextIndex);
    if (options.needConfirm()) {
      if (confirmedIndex === currentIndex) {
        return 'switchNext';
      }
      return options.allowEmpty()[currentIndex] ? 'resetCurrentAndSwitchNext' : 'abort';
    }
    if (canSwitch) {
      return 'switchNext';
    }

    return nextFieldTriggered ? 'resetCurrentAndSwitchNext' : 'resetCurrent';
  }

  // При закрытии учитывает изменения draft, полноту ввода и требование подтверждения.
  function closeAction(currentIndex: number, canSwitch: boolean, canSubmit: boolean) {
    const interactionModified = triggeredFields.some(field => field.modified);
    if (!interactionModified) {
      return 'finish';
    }
    if (options.needConfirm()) {
      const currentModified = triggeredFields.some(
        field => field.index === currentIndex && field.modified
      );
      const allFieldsTriggered = triggeredFields.length >= options.fieldCount();
      if (!allFieldsTriggered || !canSwitch) {
        return 'resetAll';
      }
      if (currentModified) {
        return options.allowEmpty()[currentIndex] ? 'resetCurrentAndSwitchNext' : 'resetAll';
      }
      return 'switchNext';
    }

    return canSubmit ? 'switchNext' : 'resetAll';
  }

  // Применяет команду к текущему взаимодействию, публикуя draft до перехода фокуса.
  // Подтверждение может передать обработчик со снимком принятого значения.
  const triggerChange = (
    index: number,
    source: RangeInteractionSource,
    value?: Value | null,
    flush = flushSubmit
  ) => {
    let currentIndex = getCurrentIndex();
    if (source !== 'popupClose') {
      isLastInput = source === 'input';
    }
    if (currentIndex === null && source !== 'popupClose' && source !== 'esc') {
      currentIndex = index;
      setCurrentIndex(index);
      setForceFocus(false);
      recordTriggeredField(index, false);
    }
    const action = resolveAction(currentIndex, index, source, value);
    const actionIndex = currentIndex ?? index;
    switch (action) {
      case 'modify':
        recordTriggeredField(actionIndex, true);
        if (confirmedIndex === actionIndex) {
          confirmedIndex = null;
        }
        if (value !== undefined) {
          triggerCalendarChange(actionIndex, value);
        }
        break;
      case 'submitCurrent':
        if (options.needConfirm()) {
          confirmedIndex = actionIndex;
        }
        submitField(actionIndex, flush);
        break;
      case 'switchNext':
        submitAndSwitch(actionIndex, index, source, value, flush);
        break;
      case 'finish':
        reset();
        break;
      case 'resetCurrent':
        resetValue(actionIndex);
        if (confirmedIndex === actionIndex) {
          confirmedIndex = null;
        }
        triggeredFields = triggeredFields.filter(field => field.index !== actionIndex);
        break;
      case 'resetCurrentAndSwitchNext':
        resetAndSwitch(actionIndex, index, source);
        break;
      case 'resetAll':
        resetValue();
        reset();
        break;
      case 'abort':
        if (source === 'field-switch' && index === actionIndex) {
          recordTriggeredField(index);
        }
        break;
    }
  };

  // Публикует draft и submit перед выбором следующего поля и его фокуса.
  function submitAndSwitch(
    actionIndex: number,
    requestedIndex: number,
    source: RangeInteractionSource,
    value: Value | null | undefined,
    flush: RangeInteractionSubmit
  ) {
    if (source === 'panel-final' || value !== undefined) {
      recordTriggeredField(actionIndex, true);
    }
    if (value !== undefined) {
      triggerCalendarChange(actionIndex, value);
    }
    if (options.needConfirm() && (source === 'keyboard-submit' || source === 'confirm')) {
      confirmedIndex = actionIndex;
    }

    const shouldFocusNext = source === 'confirm' || source === 'keyboard-submit'
      || source === 'panel-final' || source === 'popupClose' && !isLastInput;
    const allFieldsTriggered = submitField(actionIndex, flush);
    if (allFieldsTriggered && source === 'field-switch') {
      setCurrentIndex(requestedIndex);
      setForceFocus(false);
    }
    else if (!allFieldsTriggered) {
      const nextIndex = (actionIndex + 1) % options.fieldCount();
      setCurrentIndex(nextIndex);
      setForceFocus(shouldFocusNext);
    }
    if (source === 'field-switch') {
      recordTriggeredField(requestedIndex, false);
    }
  }

  // Снимает неподтверждённый draft. Явный переход начинает состояние указанного поля.
  function resetAndSwitch(actionIndex: number, requestedIndex: number, source: RangeInteractionSource) {
    resetValue(actionIndex);
    if (confirmedIndex === actionIndex) {
      confirmedIndex = null;
    }
    if (source !== 'field-switch') {
      reset();
      return;
    }

    const nextFieldTriggered = triggeredFields.some(field => field.index === requestedIndex);
    if (nextFieldTriggered) {
      triggeredFields = [];
    }
    setCurrentIndex(requestedIndex);
    setForceFocus(false);
    recordTriggeredField(requestedIndex, false);
  }

  return {
    // Сообщает текущее поле, пока идёт взаимодействие.
    get currentIndex() {
      return current;
    },
    // Сохраняет индекс для панели и после закрытия текущего взаимодействия.
    get activeIndex() {
      return current ?? lastValid;
    },
    // Сообщает владельцу, требуется ли явный фокус при автоматическом переходе.
    get forceFocus() {
      return forceFocus;
    },
    // Возвращает индексы без внутренних признаков modified.
    get triggeredFields() {
      return triggeredFields.map(field => field.index);
    },
    trigger: triggerChange,
    reset
  };
}
