import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

export type DatePickerEditorElement = HTMLInputElement | HTMLTextAreaElement;

/** Общие атрибуты текстового редактора, включая события маски и доступное имя. */
export type DatePickerEditorAttributes = Omit<
  HTMLInputAttributes, symbol | `on${string}` | 'children' | 'value' | 'defaultValue'
> & Pick<HTMLAttributes<DatePickerEditorElement>,
  Extract<keyof HTMLAttributes<DatePickerEditorElement>, symbol | `on${string}`>> & {
  value: string;
  defaultValue: string;
  'data-range'?: 'start' | 'end';
};

/** Редактор внутри пользовательской обёртки передаётся по фактическому DOM ref. */
export type DatePickerEditorRegistration = DatePickerEditorElement
  | { inputElement: DatePickerEditorElement; };

/** Передайте attributes и register полю. Для textarea задайте value явно для SSR. */
export interface DatePickerEditorContext {
  attributes: DatePickerEditorAttributes;
  register: (element: DatePickerEditorRegistration) => () => void;
  range?: 'start' | 'end';
}

/** Замена нативного редактора или snippet с собственным оформлением. */
export type DatePickerEditor = 'input' | 'textarea' | Snippet<[DatePickerEditorContext]>;

/** Атрибуты кнопки подтверждения и подпись из текущей локали. */
export interface DatePickerButtonContext {
  attributes: Pick<HTMLButtonAttributes, 'type' | 'disabled' | 'onclick'>;
  children: string;
}

/** Замены элементов поля и раскрытой панели. */
export interface DatePickerComponents {
  /** В одиночном поле и в обеих границах диапазона. */
  input?: DatePickerEditor;
  button?: 'button' | Snippet<[DatePickerButtonContext]>;
}
