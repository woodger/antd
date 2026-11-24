// Сохраняет вывод props одиночного DatePicker при императивном mount и render.
import DatePickerRoot from './DatePicker.svelte';

// Шаблон и явный DatePicker<true> выводят props выбора. Mount без параметра
// типа использует последнюю сигнатуру с прежними скалярными callbacks.
const DatePicker: typeof DatePickerRoot & typeof DatePickerRoot<false> = DatePickerRoot;

export default DatePicker;
