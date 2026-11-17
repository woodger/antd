import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent } from './types';
import type {
  SelectClassNames, SelectFieldNames, SelectFlattenOption, SelectLabelRenderInfo, SelectPopupRender, SelectRef,
  SelectSemanticValue, SelectStyle, SelectStyles, SelectTagInfo
} from './select.types';

/** Общие методы Select; nativeElement/inputElement остаются отдельными bindable props. */
export type AutoCompleteRef = SelectRef;

export type AutoCompleteClassNames = Pick<SelectClassNames,
  'root' | 'prefix' | 'input' | 'placeholder' | 'content' | 'clear' | 'popup'>;
export type AutoCompleteStyles = Pick<SelectStyles,
  'root' | 'prefix' | 'input' | 'placeholder' | 'content' | 'clear' | 'popup'>;
/** Собственные raw props и три нормализованных поля wrapper; defaults/context не подставляются. */
export interface AutoCompleteSemanticInfo<OptionType extends object = AutoCompleteItem> {
  props: Omit<AutoCompleteProps<OptionType>, 'nativeElement' | 'inputElement'> & {
    popupRender: SelectPopupRender | undefined;
    onOpenChange: AutoCompleteProps<OptionType>['onOpenChange'];
    popupMatchSelectWidth: AutoCompleteProps<OptionType>['popupMatchSelectWidth'];
  };
}

export interface AutoCompleteOption {
  value: string;
  label?: string | number | Snippet;
  key?: string | number | bigint;
  disabled?: boolean;
  title?: string;
  class?: string;
  style?: string;
}
export interface AutoCompleteGroup {
  label?: string | number | Snippet;
  key?: string | number | bigint;
  options: readonly AutoCompleteOption[];
}
export type AutoCompleteItem = AutoCompleteOption | AutoCompleteGroup;
/** Управление поисковой строкой и фильтрацией подсказок AutoComplete. */
export interface AutoCompleteSearchConfig<OptionType extends object = AutoCompleteItem> {
  /** Predicate получает поверхностную копию исходного option/group. */
  filterOption?: boolean | ((text: string, option: OptionType) => boolean);
  onSearch?: (text: string) => void;
}
export interface AutoCompleteInput {
  attributes: Pick<
    HTMLInputAttributes,
    'id'
    | 'value'
    | 'name'
    | 'placeholder'
    | 'disabled'
    | 'required'
    | 'readonly'
    | 'dir'
    | 'autocomplete'
    | 'role'
    | 'aria-expanded'
    | 'aria-controls'
    | 'aria-activedescendant'
    | 'aria-autocomplete'
    | 'aria-invalid'
    | 'aria-describedby'
    | 'aria-label'
  > & {
    class?: string;
    style?: string;
    oninput: (event: Event) => void;
    onkeydown: (event: KeyboardEvent) => void;
    onkeyup: (event: KeyboardEvent) => void;
    onclick: (event: MouseEvent) => void;
    onfocus: (event: FocusEvent) => void;
    onblur: (event: FocusEvent) => void;
  };
  register: (element: HTMLInputElement | HTMLTextAreaElement) => { destroy: () => void; };
}
/** Свободный текст с options, выбором подсказки и собственным input snippet. */
export interface AutoCompleteProps<OptionType extends object = AutoCompleteItem> extends Omit<
  HTMLInputAttributes,
  'value'
  | 'defaultValue'
  | 'size'
  | 'children'
  | 'onchange'
  | 'onselect'
  | 'oninput'
  | 'onfocus'
  | 'onblur'
  | 'onkeydown'
  | 'onkeyup'
  | 'onclick'
  | 'prefix'
  | 'style'
> {
  /** Локальный namespace Select; пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  /** Содержимое affix; falsy scalar, включая 0, не создаёт узел. */
  prefix?: RenderEmptyContent;
  options?: readonly OptionType[];
  /** Имена полей исходных options и одного уровня групп. */
  fieldNames?: SelectFieldNames;
  /** Пассивное содержимое leaf; metadata и абсолютный index соответствуют текущему flattened списку. */
  optionRender?: Snippet<[SelectFlattenOption<string, OptionType>, { index: number }]>;
  /** Чистый display producer; editor сохраняет исходное строковое value. */
  labelRender?: (info: SelectLabelRenderInfo<string>) => RenderEmptyContent;
  /** Передаётся в semantic metadata; combobox не вызывает renderer тегов. */
  tagRender?: Snippet<[SelectTagInfo<string>]>;
  /** Произвольная строка; соответствие options не требуется. */
  value?: string;
  /** Начальное локальное значение; последующие изменения prop не переинициализируют состояние. */
  defaultValue?: string;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  /** Наследует ConfigProvider.select; combobox остаётся редактируемым при false. */
  showSearch?: boolean | AutoCompleteSearchConfig<OptionType>;
  /** Свободный ввод и выбор; очистка может передать undefined, затем пустую строку. */
  onChange?: (value: string | undefined, option: Partial<OptionType> | undefined) => void;
  /** Повторный выбор также уведомляет владельца; option сохраняет raw поля. */
  onSelect?: (value: string, option: OptionType) => void;
  onDeselect?: (value: string, option: OptionType) => void;
  onOpenChange?: (open: boolean) => void;
  onClear?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /**
   * Локальный getter получает корень Select и перекрывает ConfigProvider.
   * Undefined наследует provider; без общей функции сохраняется native размещение.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  /** @defaultValue false */
  backfill?: boolean;
  /** @defaultValue false */
  defaultActiveFirstOption?: boolean;
  /** @defaultValue false */
  allowClear?: boolean | { clearIcon?: Snippet; };
  notFoundContent?: string | number | Snippet | null;
  /** @defaultValue true */
  popupMatchSelectWidth?: boolean | number;
  /** @defaultValue 256 */
  listHeight?: number;
  /** Отсутствующий prop наследует ConfigProvider; собственный undefined включает Source default. */
  virtual?: boolean;
  /** Оценка высоты до измерения; по умолчанию token.controlHeight, 0 отключает windowing. */
  listItemHeight?: number;
  showScrollBar?: boolean | 'optional';
  /** Последнее активное value за microtask; null означает отсутствие активной строки. */
  onActive?: (value: string | null) => void;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  /** @defaultValue 'outlined' */
  /** Читает Select config; локальные variant перекрывают Form и provider. */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Собственный control: примените attributes и register из контекста snippet. */
  children?: Snippet<[AutoCompleteInput]>;
  class?: string;
  /** Root и popup получают общий класс. */
  rootClassName?: string;
  classNames?: SelectSemanticValue<AutoCompleteClassNames, AutoCompleteSemanticInfo<OptionType>['props']>;
  styles?: SelectSemanticValue<AutoCompleteStyles, AutoCompleteSemanticInfo<OptionType>['props']>;
  /**
   * CSS object и прежняя CSS-строка оформляют единственный public root.
   * Class/CSS-строка сохраняют наследуемый цвет input; control semantics задают независимые цвета.
   */
  style?: SelectStyle | null;
  /** Чистый producer вызывается также закрытым и при SSR; nullish result оставляет popup пустым. */
  popupRender?: SelectPopupRender;
  /** Нативный ref доступен после mount и очищается при unmount. */
  nativeElement?: HTMLDivElement;
  /** Нативный ref доступен после mount и очищается при unmount. */
  inputElement?: HTMLInputElement | HTMLTextAreaElement;
}
