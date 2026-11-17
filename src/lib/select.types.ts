import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent, SelectOption } from './types';
import type { VirtualScrollAlign } from './virtual-list.engine';
import type { VirtualScrollConfig, VirtualScrollOffset, VirtualScrollOffsetInfo } from './virtual-list.types';
import type { FormValidateStatus } from './form-error-list.types';
import type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from './select-icons.types';

export type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from './select-icons.types';

type SelectCSSValue = string | number | null | undefined;
type SelectDOMStringStyleKey = {
  [Key in keyof CSSStyleDeclaration]-?: CSSStyleDeclaration[Key] extends string ? Key : never
}[keyof CSSStyleDeclaration];
type SelectDOMStyleKey = Exclude<Extract<SelectDOMStringStyleKey, string>, 'cssText' | 'cssFloat'> | 'float';
type SelectWebkitStyleKey = Extract<SelectDOMStyleKey, `webkit${string}`> extends `webkit${infer Tail}`
  ? `Webkit${Tail}` : never;
type SelectKnownCSSProperties = Readonly<Partial<Record<SelectDOMStyleKey | SelectWebkitStyleKey, SelectCSSValue>>>;
type SelectCustomStyleKey = `--${string}` | `Webkit${string}` | `Moz${string}` | `ms${string}` | `O${string}`;
/** Обычный interface с CSS-полями не требует index signature; custom-only interface требует свой pattern index. */
export type SelectCSSProperties = SelectKnownCSSProperties
  | (SelectKnownCSSProperties & Readonly<Partial<Record<SelectCustomStyleKey, SelectCSSValue>>>);
export type SelectStyle = string | SelectCSSProperties | null;
export type SelectPopupContent = string | number | boolean | null | undefined
  | Snippet<[origin: Snippet]> | readonly SelectPopupContent[];
/** Pure producer вызывается и при закрытом popup; nullish result не заменяется меню. */
export type SelectPopupRender = (originMenu: Snippet) => SelectPopupContent;
type SelectControlSlots<Content> = Partial<Record<
  'root' | 'prefix' | 'suffix' | 'input' | 'placeholder' | 'content'
  | 'item' | 'itemContent' | 'itemRemove' | 'clear', Content
>>;
export type SelectPopupClassNames = Partial<Record<'root' | 'list' | 'listItem', string>>;
export type SelectPopupStyles = Partial<Record<'root' | 'list' | 'listItem', SelectStyle>>;
export type SelectClassNames = SelectControlSlots<string> & { popup?: string | SelectPopupClassNames };
export type SelectStyles = SelectControlSlots<SelectStyle> & { popup?: SelectPopupStyles };
export type SelectSemanticValue<Slots, Props> = Slots | ((info: { props: Props }) => Slots | undefined);
export interface SelectSemanticState {
  variant: NonNullable<SelectProps['variant']>;
  status: FormValidateStatus | undefined;
  disabled: boolean;
  size: ComponentSize | undefined;
}
export interface SelectSemanticInfo<
  Value extends string | number = string,
  Mode extends 'multiple' | 'tags' | undefined = undefined,
  OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>,
  LabelInValue extends boolean = false
> {
  props: Omit<SelectProps<Value, Mode, OptionType, LabelInValue>,
    keyof SelectSemanticState | 'nativeElement' | 'inputElement'> & SelectSemanticState
    & Readonly<Record<string, unknown>>;
}
/** Общий provider работает и с AutoComplete wrapper; его raw props остаются opaque. */
export interface SelectConfigSemanticInfo {
  props: Readonly<Record<string, unknown>> & SelectSemanticState;
}

/** Исходный key строки; отличается от value и включает React.Key bigint. */
export type SelectScrollKey = string | number | bigint;
export type SelectScrollAlign = VirtualScrollAlign;
/** Размеры берутся из измерений и оценки ещё не отрисованных строк. */
export type SelectScrollOffsetInfo = VirtualScrollOffsetInfo<SelectScrollKey>;
export type SelectScrollOffset = VirtualScrollOffset<SelectScrollKey>;
/** Число означает индекс строки; объект задаёт key/index либо позицию top/left. */
export type SelectScrollConfig = VirtualScrollConfig<SelectScrollKey>;
/** Методы bind:this; nativeElement/inputElement предоставляются отдельными bindable props. */
export interface SelectRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  /** Null/undefined показывают scrollbar, не меняя позицию. */
  scrollTo: (config?: SelectScrollConfig | null) => void;
}

/** Разделители multiple/tags либо пользовательский разбор всей строки. */
export type SelectTokenSeparators = readonly string[]
  | ((input: string) => readonly string[]);

/** Metadata пункта текущей выдачи; обычный raw option сохраняет identity владельца. */
export interface SelectFlattenOption<
  Value extends string | number = string,
  OptionType extends object = SelectOption<Value>
> {
  key: string | number | bigint;
  value: Value;
  /** Исходное значение mapped label; fieldNames может указывать на любое поле. */
  label: unknown;
  data: OptionType & Readonly<Record<string, unknown>>;
  groupOption?: boolean;
  group?: boolean;
}

/** Имена полей исходных options; пустые строки используют стандартные имена. */
export interface SelectFieldNames {
  value?: string;
  label?: string;
  options?: string;
  /** По умолчанию совпадает с итоговым label field. */
  groupLabel?: string;
}

/** Labeled payload сохраняет raw label, включая supplied/mapped пользовательские поля. */
export interface SelectLabelValue<Value extends string | number = string> {
  value: Value;
  label?: unknown;
  /** Входной key не заменяет внутренний key=value. */
  key?: SelectScrollKey;
}

/** Label renderer получает metadata до nullish fallback; raw option сюда не добавляется. */
export interface SelectLabelRenderInfo<Value extends string | number = string> {
  label: unknown;
  value: Value;
  key: Value;
  disabled: boolean | undefined;
  title: unknown;
}

export type SelectValueElement<Value extends string | number, LabelInValue extends boolean> =
  LabelInValue extends true ? SelectLabelValue<Value> : Value;
export type SelectValueModel<Value extends string | number, Mode extends 'multiple' | 'tags' | undefined,
  LabelInValue extends boolean> = Mode extends 'tags' ? SelectValueElement<Value | string, LabelInValue>[]
    : Mode extends 'multiple' ? SelectValueElement<Value, LabelInValue>[] : SelectValueElement<Value, LabelInValue>;

/** Скрытый tag после labelRender; label не усечён, key совпадает с typed value. */
export interface SelectOmittedTag<Value extends string | number = string, Label = unknown> {
  value: Value;
  label: Label;
  disabled?: boolean;
  title?: unknown;
  key: Value;
}

/** Snippet получает скрытые selected values; null/undefined выбирают исходное + N ... . */
export type SelectTagPlaceholder<Value extends string | number = string> = string | number
  | boolean | null | Snippet<[SelectOmittedTag<Value>[]]>;

/** Label — Snippet с итоговым текстом; summary не имеет value/index/onClose. */
export type SelectTagInfo<Value extends string | number = string> = { label: Snippet } & ({
  isMaxTag: false;
  value: Value;
  index: number;
  disabled?: boolean;
  closable: boolean;
  onClose: (event?: Event) => void;
} | {
  isMaxTag: true;
  value?: undefined;
  index?: undefined;
  disabled: false;
  closable: false;
  onClose?: undefined;
});

/** Общий record Select и AutoComplete; собственный record заменяет родительский. */
export interface SelectConfig {
  class?: string;
  style?: SelectStyle;
  variant?: SelectProps['variant'];
  classNames?: SelectSemanticValue<SelectClassNames, SelectConfigSemanticInfo['props']>;
  styles?: SelectSemanticValue<SelectStyles, SelectConfigSemanticInfo['props']>;
  showSearch?: boolean | SelectSearchConfig<string | number, object>;
  allowClear?: boolean | SelectAllowClear;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  menuItemSelectedIcon?: SelectRenderNode<SelectMenuItemIconInfo<string | number>>;
  removeIcon?: SelectRenderNode<undefined>;
}

/** Настройки controlled search и локальной фильтрации Select без сетевого транспорта. */
export interface SelectSearchConfig<
  Value extends string | number = string,
  OptionType extends object = SelectOption<Value>
> {
  searchIcon?: RenderEmptyContent;
  /** Управляемая строка поиска; undefined оставляет локальное состояние. */
  searchValue?: string;
  /**
   * Уведомляет о пользовательском поиске; запросы и защиту от старых ответов делает потребитель.
   */
  onSearch?: (value: string) => void;
  /** false отключает фильтрацию; predicate получает поверхностную копию исходного option/group. */
  filterOption?: boolean | ((search: string, option: OptionType) => boolean);
  /** Явные поля Source search; несколько полей объединяются через OR. */
  optionFilterProp?: string | readonly string[];
  /** Сортирует отфильтрованные options и synthetic tags; получает текущий searchValue. */
  filterSort?: (
    optionA: OptionType,
    optionB: OptionType,
    info: { searchValue: string }
  ) => number;
  /** Очищает локальный search при выборе multiple/tags; controlled query меняет владелец. */
  autoClearSearchValue?: boolean;
}

/** Single/multiple/tags с нативным FormData; свободные tags добавляют строковые значения. */
export interface SelectProps<
  Value extends string | number = string,
  Mode extends 'multiple' | 'tags' | undefined = undefined,
  OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>,
  LabelInValue extends boolean = false
> extends Omit<
  HTMLInputAttributes,
  'value' | 'size' | 'class' | 'style' | 'prefix' | 'onchange' | 'oninput' | 'type' | 'children'
> {
  /** Локальный namespace Select; пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  /** Содержимое affix; Source не создаёт его для falsy scalar, включая 0. */
  prefix?: RenderEmptyContent;
  /** Статический template передаётся массивом; функция получает состояние Select. */
  suffix?: SelectRenderNode<SelectSuffixInfo>;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  menuItemSelectedIcon?: SelectRenderNode<SelectMenuItemIconInfo<Mode extends 'tags' ? Value | string : Value>>;
  removeIcon?: SelectRenderNode<undefined>;
  /** Семантический root и popup; прежний class остаётся на Native outer container. */
  rootClassName?: string;
  classNames?: SelectSemanticValue<SelectClassNames, SelectSemanticInfo<Value, Mode, OptionType, LabelInValue>['props']>;
  styles?: SelectSemanticValue<SelectStyles, SelectSemanticInfo<Value, Mode, OptionType, LabelInValue>['props']>;
  /** CSS object красит public control; прежняя CSS-строка остаётся на outer container. */
  style?: SelectStyle;
  popupRender?: SelectPopupRender;
  /** @internal Intrinsic ширина readonly single для составного владельца, без смены public default. */
  _autoWidth?: boolean;
  /** Пустой список по умолчанию; tags может создавать значения без options. */
  options?: readonly OptionType[];
  /** Отображает исходные поля value/label/options/groupLabel; группы имеют один уровень. */
  fieldNames?: SelectFieldNames;
  /** Выбранная подпись из raw option; пустая строка использует итоговый fieldNames.label. */
  optionLabelProp?: string;
  /** Меняет value/defaultValue и исходящие selection callbacks на { label, value }. */
  labelInValue?: LabelInValue;
  /** Чистый display renderer; возвращаемый Snippet рендерится как Svelte content. */
  labelRender?: (info: SelectLabelRenderInfo<Mode extends 'tags' ? Value | string : Value>) => RenderEmptyContent;
  /** Пассивное содержимое пункта; выбранный label и native option button сохраняются. */
  optionRender?: Snippet<[
    SelectFlattenOption<Mode extends 'tags' ? Value | string : Value, OptionType>,
    { index: number }
  ]>;
  mode?: Mode;
  /** Управляемая видимость; onOpenChange сообщает запрос. Поддерживает bind:open. */
  open?: boolean;
  /** Начальная uncontrolled видимость; SSR остаётся закрытым. @defaultValue false */
  defaultOpen?: boolean;
  /** Физический угол popup; по умолчанию bottomLeft, в RTL — bottomRight. */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Local ?? ConfigProvider ?? true; false и число сохраняют ширину поля как минимум. */
  popupMatchSelectWidth?: boolean | number;
  /** Отсутствующий prop наследует ConfigProvider; собственный undefined включает Source default. */
  virtual?: boolean;
  /** Высота внутреннего viewport; 0 снимает ограничение. @defaultValue 256 */
  listHeight?: number;
  /** Оценка до измерения строки; по умолчанию token.controlHeight. */
  listItemHeight?: number;
  /** True/false задаются при создании scrollbar; optional скрывает его через 3 секунды. */
  showScrollBar?: boolean | 'optional';
  /** Последнее активное value за microtask; null означает отсутствие доступной строки. */
  onActive?: (value: (Mode extends 'tags' ? Value | string : Value) | null) => void;
  /** Начальная активная строка; выбранное single value может задать её при открытии. */
  defaultActiveFirstOption?: boolean;
  /** Разбор строк в multiple/tags; function получает текущий ввод, включая восстановленный paste. */
  tokenSeparators?: SelectTokenSeparators;
  /** Максимум выбранных значений в multiple/tags; existing/default values не обрезаются. */
  maxCount?: number;
  /** Ограничивает отображаемый текст multiple/tags; title и полный label сохраняются. */
  maxTagTextLength?: number;
  /** Числовой предел либо responsive измерение видимых tags; hidden values сохраняются. */
  maxTagCount?: number | 'responsive';
  /** Содержимое сводного тега без remove button; omitted labels остаются полными. */
  maxTagPlaceholder?: SelectTagPlaceholder<Mode extends 'tags' ? Value | string : Value>;
  /** Рендер обычных и сводного tags в multiple/tags; single игнорирует Snippet. */
  tagRender?: Snippet<[SelectTagInfo<Mode extends 'tags' ? Value | string : Value>]>;
  /** Bind:value; multiple сохраняет Value[], tags допускает также новые string values. */
  value?: SelectValueModel<Value, Mode, LabelInValue> | null;
  /** Начальное локальное значение; последующие изменения prop не переинициализируют состояние. */
  defaultValue?: (Mode extends 'tags' ? readonly SelectValueElement<Value | string, LabelInValue>[]
    : Mode extends 'multiple' ? readonly SelectValueElement<Value, LabelInValue>[]
      : SelectValueElement<Value, LabelInValue>) | null;
  size?: ComponentSize;
  /** Приоритет: variant, Form, Select config, global variant, outlined. */
  variant?: 'outlined' | 'filled' | 'borderless' | 'underlined';
  /** Объект задаёт настройки поиска; boolean включает или отключает его. */
  showSearch?: boolean | SelectSearchConfig<
    Mode extends 'tags' ? Value | string : Value, OptionType
  >;
  /** @defaultValue false */
  loading?: boolean;
  notFoundContent?: RenderEmptyContent;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /**
   * Getter получает корень Select; undefined наследует ConfigProvider.
   * Без getter сохраняется DOM parent, popup отображается как fixed manual popover.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  /** @defaultValue false */
  allowClear?: boolean | SelectAllowClear;
  status?: 'error' | 'warning';
  onValueChange?: (value: SelectValueModel<Value, Mode, LabelInValue>
    | (Mode extends 'multiple' | 'tags' ? never : undefined)) => void;
  /** Изменение последовательности values; второй аргумент сохраняет исходные поля options. */
  onChange?: (
    value: SelectValueModel<Value, Mode, LabelInValue> | (Mode extends 'multiple' | 'tags' ? never : undefined),
    option: Mode extends 'multiple' | 'tags' ? OptionType[] : OptionType | undefined
  ) => void;
  /** Выбор пункта, включая повторный single выбор; option — поверхностная копия raw record. */
  onSelect?: (value: SelectValueElement<Mode extends 'tags' ? Value | string : Value, LabelInValue>, option: OptionType) => void;
  /** Снятие выбора в multiple/tags; очистка всех значений не вызывает callback. */
  onDeselect?: (value: SelectValueElement<Mode extends 'tags' ? Value | string : Value, LabelInValue>, option: OptionType) => void;
  /** Пользовательская очистка; вызывается до onChange. */
  onClear?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => void;
  onOpenChange?: (open: boolean) => void;
  class?: string;
  /** Корень Select после mount; ref очищается при unmount. */
  nativeElement?: HTMLDivElement;
  /** Нативный editor после mount; ref очищается при unmount. */
  inputElement?: HTMLInputElement;
}
