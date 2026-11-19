import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type {
  AutoCompleteInput, AutoCompleteProps, AutoCompleteSemanticInfo, SelectComponents,
  SelectInputAttributes, SelectInputComponent, SelectInputContext, SelectInputOwnProps, SelectInputRegistration,
  SelectLabelValue, SelectOption, SelectProps, SelectRootAttributes, SelectRootComponent,
  SelectRootContext, SelectRootRegistration, SelectSemanticInfo, SelectStyle
} from 'antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
interface Entry { code: number; caption: string; audit: { owner: string }; }
interface CompletionEntry { code: string; caption: string; audit: { owner: string }; }
type CustomSelect = SelectProps<number, 'multiple', Entry, true, HTMLButtonElement, HTMLTextAreaElement>;
type CustomCompletion = AutoCompleteProps<CompletionEntry, HTMLButtonElement, HTMLTextAreaElement>;
type CustomSelectInfo = SelectSemanticInfo<number, 'multiple', Entry, true, HTMLButtonElement, HTMLTextAreaElement>;
type CustomCompletionInfo = AutoCompleteSemanticInfo<CompletionEntry, HTMLButtonElement, HTMLTextAreaElement>;

export type SelectComponentTypeAssertions = [
  Assert<Equal<SelectProps['nativeElement'], HTMLDivElement | undefined>>,
  Assert<Equal<SelectProps['inputElement'], HTMLInputElement | undefined>>,
  Assert<Equal<AutoCompleteProps['nativeElement'], HTMLDivElement | undefined>>,
  Assert<AutoCompleteProps['inputElement'] extends HTMLInputElement | HTMLTextAreaElement | undefined ? true : false>,
  Assert<HTMLInputElement | HTMLTextAreaElement | undefined extends AutoCompleteProps['inputElement'] ? true : false>,
  Assert<Equal<CustomSelect['nativeElement'], HTMLButtonElement | HTMLDivElement | undefined>>,
  Assert<Equal<CustomSelect['inputElement'], HTMLTextAreaElement | HTMLInputElement | undefined>>,
  Assert<Equal<CustomCompletion['nativeElement'], HTMLButtonElement | HTMLDivElement | undefined>>,
  Assert<Equal<CustomCompletion['inputElement'], HTMLTextAreaElement | HTMLInputElement | undefined>>,
  Assert<Equal<CustomCompletion['children'], Snippet<[AutoCompleteInput]> | undefined>>,
  Assert<Equal<CustomSelect['value'], SelectLabelValue<number>[] | null | undefined>>,
  Assert<Equal<SelectProps<number, 'tags', Entry, true, HTMLButtonElement, HTMLTextAreaElement>['value'],
    SelectLabelValue<number | string>[] | null | undefined>>,
  Assert<Equal<SelectProps<number, undefined, Entry, false, HTMLButtonElement, HTMLTextAreaElement>['value'],
    number | null | undefined>>,
  Assert<Equal<Parameters<NonNullable<CustomSelect['onChange']>>[1], Entry[]>>,
  Assert<Equal<Parameters<NonNullable<CustomCompletion['onSelect']>>[1], CompletionEntry>>,
  Assert<Equal<CustomSelectInfo['props']['components'], SelectComponents<HTMLButtonElement, HTMLTextAreaElement> | undefined>>,
  Assert<Equal<CustomCompletionInfo['props']['components'], SelectComponents<HTMLButtonElement, HTMLTextAreaElement> | undefined>>,
  Assert<Equal<ReturnType<SelectRootContext['register']>, () => void>>,
  Assert<Equal<ReturnType<SelectInputContext['register']>, () => void>>,
  Assert<Equal<SelectInputOwnProps<HTMLInputElement>['style'], SelectStyle | undefined>>,
  Assert<Equal<SelectInputContext<HTMLTextAreaElement>['attributes']['style'], string | null | undefined>>,
  Assert<Equal<SelectRootAttributes<HTMLButtonElement>['style'], string | null | undefined>>
];

export function selectComponentProps(
  root: Snippet<[SelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[SelectInputContext<HTMLTextAreaElement>]>
) {
  const select = {
    mode: 'multiple', labelInValue: true, value: [{ value: 1 }],
    options: [{ code: 1, caption: 'Alpha', audit: { owner: 'source' } }],
    fieldNames: { value: 'code', label: 'caption' },
    components: {
      root: { render: root, props: { type: 'button', onkeydown(event) {
        const target: HTMLButtonElement = event.currentTarget;
        void target;
      } } },
      input: { render: input, props: { rows: 3, wrap: 'soft', type: 'text',
        style: { width: 83, fontSize: 17, paddingInline: 7 }, oninput(event) {
        const target: HTMLTextAreaElement = event.currentTarget;
        void target;
      } } }
    },
    onChange(values, options) {
      const payload: SelectLabelValue<number>[] = values;
      const owners: string[] = options.map(option => option.audit.owner);
      void [payload, owners];
    },
    onSelect(value, option) {
      const primitive: number = value.value;
      const owner: string = option.audit.owner;
      void [primitive, owner];
    },
    labelRender(info) {
      const primitive: number = info.value;
      return String(primitive);
    },
    classNames({ props }) {
      const slots: SelectComponents<HTMLButtonElement, HTMLTextAreaElement> | undefined = props.components;
      const values: SelectLabelValue<number>[] | null | undefined = props.value;
      void [slots, values];
      return { root: 'typed-select' };
    }
  } satisfies CustomSelect;
  const completion = {
    value: 'a', options: [{ code: 'a', caption: 'Alpha', audit: { owner: 'source' } }],
    fieldNames: { value: 'code', label: 'caption' }, components: { root,
      input: { render: input, props: { style: { width: 83, fontSize: 17, paddingInline: 7 } } } },
    onChange(value, option) {
      const text: string | undefined = value;
      const owner: string | undefined = option?.audit?.owner;
      void [text, owner];
    },
    styles({ props }) {
      const slots: SelectComponents<HTMLButtonElement, HTMLTextAreaElement> | undefined = props.components;
      const text: string | undefined = props.value;
      void [slots, text];
      return { input: { color: 'navy' } };
    }
  } satisfies CustomCompletion;
  return { select, completion };
}

function inferSelectProps<Value extends string | number = string,
  Mode extends 'multiple' | 'tags' | undefined = undefined,
  Option extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>,
  Label extends boolean = false, Root extends HTMLElement = HTMLDivElement,
  Editor extends HTMLElement = HTMLInputElement>(props: SelectProps<Value, Mode, Option, Label, Root, Editor>) {
  return props;
}

function inferCompletionProps<Option extends object, Root extends HTMLElement = HTMLDivElement,
  Editor extends HTMLElement = HTMLInputElement | HTMLTextAreaElement>(props: AutoCompleteProps<Option, Root, Editor>) {
  return props;
}

export function selectComponentInference(
  root: Snippet<[SelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[SelectInputContext<HTMLTextAreaElement>]>
) {
  const options: readonly Entry[] = [{ code: 1, caption: 'Alpha', audit: { owner: 'source' } }];
  const defaults = inferSelectProps({ value: 1 as number, options });
  const custom = inferSelectProps({ value: 1 as number, options, components: { root, input } });
  const completion = inferCompletionProps({ value: 'a', options, components: { root, input } });
  const assertions: [
    Assert<Equal<typeof defaults.nativeElement, HTMLDivElement | undefined>>,
    Assert<Equal<typeof defaults.inputElement, HTMLInputElement | undefined>>,
    Assert<Equal<typeof custom.nativeElement, HTMLButtonElement | HTMLDivElement | undefined>>,
    Assert<Equal<typeof custom.inputElement, HTMLTextAreaElement | HTMLInputElement | undefined>>,
    Assert<Equal<typeof custom.value, number | null | undefined>>,
    Assert<Equal<typeof custom.options, readonly Entry[] | undefined>>,
    Assert<Equal<typeof completion.nativeElement, HTMLButtonElement | HTMLDivElement | undefined>>,
    Assert<Equal<typeof completion.inputElement, HTMLTextAreaElement | HTMLInputElement | undefined>>
  ] = [true, true, true, true, true, true, true, true];
  return { defaults, custom, completion, assertions };
}

export function selectComponentRegistrations(
  root: SelectRootContext<HTMLButtonElement>, input: SelectInputContext<HTMLTextAreaElement>,
  button: HTMLButtonElement, textarea: HTMLTextAreaElement, wrapper: HTMLSpanElement
) {
  const rootAttachment: Attachment<HTMLButtonElement> = root.register;
  const inputAttachment: Attachment<HTMLTextAreaElement> = input.register;
  const rootComposite: SelectRootRegistration<HTMLButtonElement> = { nativeElement: button,
    focus: options => button.focus(options), blur: () => button.blur() };
  const inputComposite: SelectInputRegistration<HTMLTextAreaElement> = { nativeElement: wrapper,
    inputElement: textarea, focus: options => textarea.focus(options), blur: () => textarea.blur() };
  // A composite without methods is valid. Runtime focus/blur must remain no-ops.
  const rootWithoutMethods: SelectRootRegistration<HTMLButtonElement> = { nativeElement: button };
  const inputWithoutMethods: SelectInputRegistration<HTMLTextAreaElement> = { nativeElement: wrapper };
  const cleanupRoot: () => void = root.register(rootComposite);
  const cleanupInput: () => void = input.register(inputComposite);
  const cleanupBareRoot: () => void = root.register(rootWithoutMethods);
  const cleanupBareInput: () => void = input.register(inputWithoutMethods);
  return {
    rootAttachment,
    inputAttachment,
    cleanupRoot,
    cleanupInput,
    cleanupBareRoot,
    cleanupBareInput
  };
}

export const intrinsicComponents = [
  { root: 'button', input: 'textarea' },
  { root: 'custom-select-root', input: 'custom-select-input' },
  { root: { element: 'button', props: { type: 'button' }, ref(node) {
    const button: HTMLButtonElement | null = node;
    void button;
  } }, input: { element: 'textarea', props: { rows: 2, type: 'text', value: undefined }, ref(node) {
    const textarea: HTMLTextAreaElement | null = node;
    void textarea;
  } } }
] satisfies readonly SelectComponents<HTMLButtonElement, HTMLTextAreaElement>[];

export function selectComponentNegativeTypes(
  root: SelectRootContext<HTMLButtonElement>, input: SelectInputContext<HTMLTextAreaElement>,
  wrongInputSnippet: Snippet<[SelectInputContext<HTMLInputElement>]>
) {
  // @ts-expect-error A native input editor does not accept textarea-only attributes.
  const invalidInput: SelectInputAttributes<HTMLInputElement> = { rows: 2 };
  // @ts-expect-error A button root does not accept textarea-only attributes.
  const invalidRoot: SelectRootAttributes<HTMLButtonElement> = { rows: 2 };
  // @ts-expect-error The source input value is a string even for a textarea editor.
  const invalidValue: SelectInputAttributes<HTMLTextAreaElement> = { value: 1 };
  // @ts-expect-error Forwarded context style remains a DOM string.
  input.attributes.style = { width: 83 };
  const invalidRootStyle: SelectRootComponent<HTMLButtonElement> = {
    element: 'button',
    // @ts-expect-error Расширенный style для input не действует на корневой элемент.
    props: { style: { width: 83 } }
  };
  // @ts-expect-error A textarea context cannot register a native input.
  input.register(document.createElement('input'));
  // @ts-expect-error The composite editor must retain the declared textarea type.
  input.register({ nativeElement: document.body, inputElement: document.createElement('input') });
  // @ts-expect-error The composite root must expose the declared native root type.
  root.register({ nativeElement: document.createElement('textarea') });
  // @ts-expect-error Typed snippets cannot exchange input and textarea contexts.
  const invalidSnippet: SelectInputComponent<HTMLTextAreaElement> = wrongInputSnippet;
  const invalidRef: SelectRootComponent<HTMLButtonElement> = {
    element: 'button',
    // @ts-expect-error Тип ref соответствует объявленному корневому элементу.
    ref: (_node: HTMLInputElement | null) => {}
  };
  // @ts-expect-error Additional component generics do not widen primitive values.
  const invalidModel: SelectProps<number, undefined, Entry, false, HTMLButtonElement, HTMLTextAreaElement> = { value: 'a' };
  // @ts-expect-error Label-in-value and multiple still require labeled arrays.
  const invalidLabels: CustomSelect = { value: [1] };
  // @ts-expect-error AutoComplete keeps its existing free text value contract.
  const invalidCompletion: CustomCompletion = { value: 1 };
  return {
    invalidInput,
    invalidRoot,
    invalidValue,
    invalidRootStyle,
    invalidSnippet,
    invalidRef,
    invalidModel,
    invalidLabels,
    invalidCompletion
  };
}
