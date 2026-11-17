import type { Snippet } from 'svelte';
import type { SelectStyle } from './select.types';
import type {
  HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes, HTMLTextareaAttributes
} from 'svelte/elements';

export type SelectRootAttributes<Element extends HTMLElement = HTMLDivElement> =
  Element extends HTMLInputElement ? Omit<HTMLInputAttributes, 'children'>
    : Element extends HTMLTextAreaElement ? Omit<HTMLTextareaAttributes, 'children'>
    : Element extends HTMLButtonElement ? Omit<HTMLButtonAttributes, 'children'>
    : Omit<HTMLAttributes<Element>, 'children'>;

interface SelectInputElementAttributes extends Omit<HTMLInputAttributes, 'children' | 'value' | 'type'> {
  value?: string;
  type?: string;
}
interface SelectTextareaElementAttributes extends Omit<HTMLTextareaAttributes, 'children' | 'value' | 'type'> {
  value?: string;
  type?: string;
}
interface SelectButtonElementAttributes extends Omit<HTMLButtonAttributes, 'children' | 'value' | 'type'> {
  value?: string;
  type?: string;
}
interface SelectOtherElementAttributes<Element extends HTMLElement> extends Omit<HTMLAttributes<Element>, 'children' | 'value' | 'type'> {
  value?: string;
  type?: string;
}
/** Source передаёт type и строковый value также в textarea/custom editor. */
export type SelectInputAttributes<Element extends HTMLElement = HTMLInputElement> =
  Element extends HTMLInputElement ? SelectInputElementAttributes
    : Element extends HTMLTextAreaElement ? SelectTextareaElementAttributes
    : Element extends HTMLButtonElement ? SelectButtonElementAttributes
    : SelectOtherElementAttributes<Element>;

// Direct named leaves avoid Omit<conditional generic attributes>, which causes
// TS2590 when Select semantic props recursively include components.
interface SelectInputElementOwnProps extends Omit<SelectInputElementAttributes, 'style'> {
  style?: SelectStyle;
}
interface SelectTextareaElementOwnProps extends Omit<SelectTextareaElementAttributes, 'style'> {
  style?: SelectStyle;
}
interface SelectButtonElementOwnProps extends Omit<SelectButtonElementAttributes, 'style'> {
  style?: SelectStyle;
}
interface SelectOtherElementOwnProps<Element extends HTMLElement> extends Omit<SelectOtherElementAttributes<Element>, 'style'> {
  style?: SelectStyle;
}
/** Source element own props accept CSS objects; forwarded context style stays a DOM string. */
export type SelectInputOwnProps<Element extends HTMLElement = HTMLInputElement> =
  Element extends HTMLInputElement ? SelectInputElementOwnProps
    : Element extends HTMLTextAreaElement ? SelectTextareaElementOwnProps
    : Element extends HTMLButtonElement ? SelectButtonElementOwnProps
    : SelectOtherElementOwnProps<Element>;

interface SelectComponentHandle<Native extends HTMLElement, Editor extends HTMLElement> {
  nativeElement: Native;
  inputElement?: Editor;
  focus?(options?: FocusOptions): void;
  blur?(): void;
}

export type SelectRootRegistration<Element extends HTMLElement = HTMLDivElement> = Element
  | SelectComponentHandle<Element, HTMLElement>;
export type SelectInputRegistration<Element extends HTMLElement = HTMLInputElement> = Element
  | SelectComponentHandle<HTMLElement, Element>;

/** Полная замена поля: примените attributes и зарегистрируйте DOM/composite ref. */
export interface SelectRootContext<Element extends HTMLElement = HTMLDivElement> {
  attributes: SelectRootAttributes<Element>;
  register: (registration: SelectRootRegistration<Element>) => () => void;
}

/** Замена редактора внутри стандартного поля. */
export interface SelectInputContext<Element extends HTMLElement = HTMLInputElement> {
  attributes: SelectInputAttributes<Element>;
  register: (registration: SelectInputRegistration<Element>) => () => void;
}

export type SelectRootComponent<Element extends HTMLElement = HTMLDivElement> = string
  | { element: string; props?: SelectRootAttributes<Element>; ref?: (node: Element | null) => void }
  | Snippet<[SelectRootContext<Element>]> | {
    render: Snippet<[SelectRootContext<Element>]>;
    /** Переданные полем attrs перекрывают own props; внутренние callbacks идут первыми. */
    props?: SelectRootAttributes<Element>;
  };

export type SelectInputComponent<Element extends HTMLElement = HTMLInputElement> = string
  | { element: string; props?: SelectInputOwnProps<Element>; ref?: (node: Element | null) => void }
  | Snippet<[SelectInputContext<Element>]> | {
    render: Snippet<[SelectInputContext<Element>]>;
    /** Own props перекрывают generated attrs; собственные callbacks идут первыми. */
    props?: SelectInputOwnProps<Element>;
  };

export interface SelectComponents<Root extends HTMLElement = HTMLDivElement, Editor extends HTMLElement = HTMLInputElement> {
  root?: SelectRootComponent<Root>;
  input?: SelectInputComponent<Editor>;
}
