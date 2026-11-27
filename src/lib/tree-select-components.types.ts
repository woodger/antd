import type { Snippet } from 'svelte';
import type {
  HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes, HTMLTextareaAttributes
} from 'svelte/elements';

export type TreeSelectEditorElement = HTMLInputElement | HTMLTextAreaElement;

export type TreeSelectRootAttributes<RootElement extends HTMLElement = HTMLDivElement> =
  RootElement extends HTMLInputElement ? Omit<HTMLInputAttributes, 'children'>
    : RootElement extends HTMLTextAreaElement ? Omit<HTMLTextareaAttributes, 'children'>
    : RootElement extends HTMLButtonElement ? Omit<HTMLButtonAttributes, 'children'>
    : Omit<HTMLAttributes<RootElement>, 'children'>;
export type TreeSelectInputAttributes<EditorElement extends TreeSelectEditorElement = HTMLInputElement> =
  EditorElement extends HTMLTextAreaElement ? Omit<HTMLTextareaAttributes, 'children'>
    : Omit<HTMLInputAttributes, 'children'>;

export type TreeSelectRootRegistration<RootElement extends HTMLElement = HTMLDivElement> = RootElement | {
  nativeElement: RootElement;
  focus?(options?: FocusOptions): void;
  blur?(): void;
};
export type TreeSelectInputRegistration<EditorElement extends TreeSelectEditorElement = HTMLInputElement> = EditorElement | {
  inputElement: EditorElement;
  nativeElement?: HTMLElement;
  focus?(options?: FocusOptions): void;
  blur?(): void;
};

/** Apply merged attributes to the root and register its DOM or composite ref. */
export interface TreeSelectRootContext<RootElement extends HTMLElement = HTMLDivElement> {
  attributes: TreeSelectRootAttributes<RootElement>;
  register: (ref: TreeSelectRootRegistration<RootElement>) => () => void;
}
/** Apply merged attributes to the editor and register it with DOM or composite ref. */
export interface TreeSelectInputContext<EditorElement extends TreeSelectEditorElement = HTMLInputElement> {
  attributes: TreeSelectInputAttributes<EditorElement>;
  register: (ref: TreeSelectInputRegistration<EditorElement>) => () => void;
}

export type TreeSelectRootComponent<RootElement extends HTMLElement = HTMLDivElement> =
  Snippet<[TreeSelectRootContext<RootElement>]> | {
    render: Snippet<[TreeSelectRootContext<RootElement>]>;
    /** Own attrs; callbacks are triggered after the root's internal handlers. */
    props?: TreeSelectRootAttributes<RootElement>;
  };
export type TreeSelectInputComponent<EditorElement extends TreeSelectEditorElement = HTMLInputElement> =
  Snippet<[TreeSelectInputContext<EditorElement>]> | {
    render: Snippet<[TreeSelectInputContext<EditorElement>]>;
    /** Own attrs; callbacks are called before the editor 's internal handlers. */
    props?: TreeSelectInputAttributes<EditorElement>;
  };
export interface TreeSelectComponents<
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends TreeSelectEditorElement = HTMLInputElement
> {
  /** Complete field replacement; standard content and components.input are not rendered. */
  root?: TreeSelectRootComponent<RootElement>;
  input?: TreeSelectInputComponent<EditorElement>;
}
