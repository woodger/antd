import type { Snippet } from 'svelte';
import type { DesignTokenConfig } from './theme-token.types';
import type { ComponentsConfig } from './theme-component-token.types';
import type { FormLocale } from './form/form.types';
import type { TypographyLocale } from './typography/typography.types';
import type { ColorPickerLocale } from './color-picker/color-picker.types';
import { colorPickerEnUS, colorPickerRuRU } from './color-picker/color-picker.locale';
import { typographyEnUS, typographyRuRU } from './typography/typography.locale';
import type { TourLocale } from './tour/tour.types';
import type { CarouselLocale } from './carousel/carousel.types';
import { tourEnUS, tourRuRU } from './tour/tour.locale';
import type { UploadLocale } from './upload/upload.types';
import type { DatePickerLocale } from './picker/date-picker.types';
import { datePickerEnUS, datePickerRuRU } from './picker/date-picker.locale';
import type { QRCodeLocale } from './qr-code/qrcode.types';
import type { CalendarLocale } from './calendar/calendar.types';
import type { TransferLocale } from './transfer/transfer.types';
import { transferEnUS, transferRuRU } from './transfer/transfer.locale';
import { qrCodeEnUS, qrCodeRuRU } from './qr-code/qrcode.locale';
export type ComponentSize = 'small' | 'medium' | 'large';
export type Variant = 'outlined' | 'borderless' | 'filled' | 'underlined';

/** Content Security Policy settings for the styles that the library creates. */
export interface CSPConfig {
  nonce?: string;
}

/** Container popup from ConfigProvider; there is no trigger in some upstream consumers. */
export type GetPopupContainer = (triggerNode?: HTMLElement) => HTMLElement | ShadowRoot;

/** Overflowing area Select, TreeSelect, Cascader and AutoComplete. */
export type PopupOverflow = 'viewport' | 'scroll';

/** Scroll targeted Affix/Anchor; getter is only invoked in the browser. */
export type GetTargetContainer = () => HTMLElement | Window;

/** Container Modal/Drawer: false leaves DOM in place; the function is called only in the browser. */
export type GetContainer = string | Element | DocumentFragment
  | (() => Element | DocumentFragment) | false;

export type RenderEmptyComponent = 'Table' | 'Table.filter' | 'Select'
  | 'TreeSelect' | 'Cascader' | 'Transfer' | 'Mentions';
export type RenderEmptyContent = string | number | boolean | null | undefined | Snippet
  | readonly RenderEmptyContent[];
/** Producer callback replaces ReactNode; falsy uses fallback, Table.filter – only nullish. */
export type RenderEmptyHandler = (componentName?: RenderEmptyComponent) => RenderEmptyContent;

/** Source tokens/algorithms with inheritance; mode/primary/compact save the native theme API. */
export interface ThemeConfig extends DesignTokenConfig {
  mode?: 'light' | 'dark';
  primary?: 'blue' | 'purple' | 'green';
  /** Compact metrics of text, sizes and indents; native colors are preserved. */
  compact?: boolean;
  /**
   * Component overrides in GlobalToken; algorithm=true recalculates dependent aliases. The
   * application of ComponentToken to the styles of the components is still transferred separately.
   */
  components?: ComponentsConfig;
  /** false resets parent tokens/algorithm/components; hashed/cssVar/zeroRuntime inherited. */
  inherit?: boolean;
  /** By default true; false returns blank hashId. */
  hashed?: boolean;
  /** Prefix by default ant; key is generated for each provider with local theme. */
  cssVar?: { prefix?: string; key?: string; };
  /** Components use published CSS; the setting is inherited together with the source theme. */
  zeroRuntime?: boolean;
}

export type ResolvedThemeConfig = ThemeConfig
  & Required<Pick<ThemeConfig, 'mode' | 'primary' | 'compact'>>;

export interface Locale {
  Form?: FormLocale;
  colorPicker?: Partial<ColorPickerLocale>;
  ColorPicker?: Partial<ColorPickerLocale>;
  typography?: Partial<TypographyLocale>;
  /** Initial alias Ant Design; Local Text fields overlap typography. */
  Text?: Partial<TypographyLocale>;
  global?: { show?: string; hide?: string; close?: string; backToTop?: string; };
  tour?: Partial<TourLocale>;
  /** Initial alias Ant Design; the local Tour takes precedence over tour. */
  Tour?: Partial<TourLocale>;
  carousel?: Partial<CarouselLocale>;
  /** Initial alias Ant Design; the local Carousel overrides the carousel. */
  Carousel?: Partial<CarouselLocale>;
  image?: { preview?: string; };
  tree?: { expand?: string; collapse?: string; };
  upload?: UploadLocale;
  datePicker?: DatePickerLocale;
  calendar?: CalendarLocale;
  transfer?: TransferLocale;
  okText: string;
  cancelText: string;
  /** Label for the single Modal button in the Ant Design dictionary. */
  justOkText?: string;
  /** Allows separate action labels for Popconfirm. */
  popconfirm?: { okText?: string; cancelText?: string; };
  closeText: string;
  clearText: string;
  emptyText: string;
  searchText: string;
  submitErrorText: string;
  confirmErrorText?: string;
  removeText?: string;
  selectRequiredText?: string;
  pagination?: Partial<PaginationLocale>;
  table?: Partial<TableLocale>;
  inputNumber?: Partial<InputNumberLocale>;
  progress?: Partial<ProgressLocale>;
  spin?: Partial<SpinLocale>;
  skeleton?: Partial<SkeletonLocale>;
  empty?: Partial<EmptyLocale>;
  steps?: Partial<StepsLocale>;
  badge?: Partial<BadgeLocale>;
  avatarGroup?: Partial<AvatarGroupLocale>;
  layout?: Partial<LayoutLocale>;
  qrcode?: Partial<QRCodeLocale>;
}

export interface LayoutLocale {
  expand: string;
  collapse: string;
}

export interface AvatarGroupLocale {
  label: string;
  hiddenLabel: string;
  overflow: string;
}

export interface BadgeLocale {
  count: string;
  dot: string;
  success: string;
  processing: string;
  default: string;
  error: string;
  warning: string;
}

export interface StepsLocale {
  label: string;
  wait: string;
  process: string;
  finish: string;
  error: string;
}

export interface EmptyLocale {
  description: string;
}

export interface SkeletonLocale {
  loadingText: string;
}

export interface SpinLocale {
  loadingText: string;
}

export interface ProgressLocale {
  label: string;
  successText: string;
  exceptionText: string;
}

export interface InputNumberLocale {
  increase: string;
  decrease: string;
  invalidNumber: string;
}

export interface TableLocale {
  label: string;
  emptyText: string;
  loadingText: string;
  selectAll: string;
  selectRow: string;
  selectionAll?: string;
  selectInvert?: string;
  selectNone?: string;
  selectionMenu?: string;
  sortAscending: string;
  sortDescending: string;
  cancelSort: string;
  filterTitle?: string;
  filterApply?: string;
  filterReset?: string;
  filterEmptyText?: string;
  filterCheckAll?: string;
  filterSearchPlaceholder?: string;
  expandColumn?: string;
  expandRow?: string;
  collapseRow?: string;
}

export interface PaginationLocale {
  label: string;
  previous: string;
  next: string;
  page: string;
  jumpPrevious: string;
  jumpNext: string;
  pageSize: string;
  itemsPerPage: string;
  jumpTo?: string;
  jumpToConfirm?: string;
  pageSuffix?: string;
  items_per_page?: string;
  jump_to?: string;
  jump_to_confirm?: string;
  prev_page?: string;
  next_page?: string;
  prev_5?: string;
  next_5?: string;
  prev_3?: string;
  next_3?: string;
  page_size?: string;
}

export interface SelectOption<Value extends string | number = string> {
  value: Value;
  label: string;
  disabled?: boolean;
  /** Obligatory key optionRender; without it used value. */
  key?: string | number | bigint | null;
}

export const ruRU = {
  Form: { optional: '(необязательно)' },
  colorPicker: colorPickerRuRU,
  typography: typographyRuRU,
  tour: tourRuRU,
  carousel: { prevSlide: 'Предыдущий слайд', nextSlide: 'Следующий слайд' },
  tree: { expand: 'Развернуть', collapse: 'Свернуть' },
  upload: {
    uploading: 'Загрузка...',
    removeFile: 'Удалить файл',
    uploadError: 'При загрузке произошла ошибка',
    previewFile: 'Предпросмотр файла',
    downloadFile: 'Загрузить файл'
  },
  datePicker: datePickerRuRU,
  calendar: datePickerRuRU,
  layout: { expand: 'Развернуть боковую панель', collapse: 'Свернуть боковую панель' },
  avatarGroup: {
    label: 'Участники',
    hiddenLabel: 'Скрытые участники',
    overflow: 'Ещё участников'
  },
  badge: {
    count: 'Количество',
    dot: 'Есть обновления',
    success: 'Успешно',
    processing: 'Выполняется',
    default: 'Обычный статус',
    error: 'Ошибка',
    warning: 'Предупреждение'
  },
  steps: {
    label: 'Этапы',
    wait: 'Ожидается',
    process: 'Выполняется',
    finish: 'Завершён',
    error: 'Ошибка'
  },
  empty: { description: 'Нет данных' },
  skeleton: { loadingText: 'Загрузка…' },
  spin: { loadingText: 'Загрузка…' },
  qrcode: qrCodeRuRU,
  progress: { label: 'Ход выполнения', successText: 'Завершено', exceptionText: 'Ошибка' },
  inputNumber: {
    increase: 'Увеличить значение',
    decrease: 'Уменьшить значение',
    invalidNumber: 'Введите число в допустимом диапазоне.'
  },
  removeText: 'Удалить',
  selectRequiredText: 'Выберите хотя бы один вариант.',
  okText: 'Подтвердить',
  cancelText: 'Отмена',
  closeText: 'Закрыть',
  global: { show: 'Показать', hide: 'Скрыть', close: 'Закрыть', backToTop: 'Наверх' },
  image: { preview: 'Просмотр изображения' },
  clearText: 'Очистить',
  emptyText: 'Ничего не найдено',
  searchText: 'Поиск',
  submitErrorText: 'Не удалось отправить форму. Попробуйте ещё раз.',
  confirmErrorText: 'Не удалось выполнить действие. Попробуйте ещё раз.',
  pagination: {
    label: 'Пагинация',
    previous: 'Предыдущая страница',
    next: 'Следующая страница',
    page: 'Страница',
    jumpPrevious: 'Предыдущие страницы',
    jumpNext: 'Следующие страницы',
    pageSize: 'Записей на странице',
    itemsPerPage: '/ стр.',
    jumpTo: 'Перейти',
    jumpToConfirm: 'подтвердить',
    pageSuffix: 'Страница'
  },
  transfer: transferRuRU,
  table: {
    label: 'Таблица',
    emptyText: 'Нет данных',
    loadingText: 'Загрузка данных…',
    selectAll: 'Выбрать все строки на странице',
    selectRow: 'Выбрать строку',
    selectionAll: 'Выбрать все строки',
    selectInvert: 'Инвертировать выбор на странице',
    selectNone: 'Сбросить выбор',
    selectionMenu: 'Команды выбора строк',
    sortAscending: 'Сортировать по возрастанию',
    sortDescending: 'Сортировать по убыванию',
    cancelSort: 'Сбросить сортировку',
    filterTitle: 'Фильтр',
    filterApply: 'Применить',
    filterReset: 'Сбросить',
    filterEmptyText: 'Без фильтров',
    filterCheckAll: 'Выбрать все элементы',
    filterSearchPlaceholder: 'Поиск в фильтрах',
    expandColumn: 'Подробности',
    expandRow: 'Раскрыть строку',
    collapseRow: 'Свернуть строку'
  }
} satisfies Locale;

export const enUS = {
  Form: { optional: '(optional)' },
  colorPicker: colorPickerEnUS,
  typography: typographyEnUS,
  tour: tourEnUS,
  carousel: { prevSlide: 'Previous slide', nextSlide: 'Next slide' },
  tree: { expand: 'Expand', collapse: 'Collapse' },
  upload: {
    uploading: 'Uploading...',
    removeFile: 'Remove file',
    uploadError: 'Upload error',
    previewFile: 'Preview file',
    downloadFile: 'Download file'
  },
  datePicker: datePickerEnUS,
  calendar: datePickerEnUS,
  layout: { expand: 'Expand sidebar', collapse: 'Collapse sidebar' },
  avatarGroup: { label: 'Members', hiddenLabel: 'Hidden members', overflow: 'More members' },
  badge: {
    count: 'Count',
    dot: 'Updates available',
    success: 'Success',
    processing: 'Processing',
    default: 'Default status',
    error: 'Error',
    warning: 'Warning'
  },
  steps: {
    label: 'Steps',
    wait: 'Waiting',
    process: 'In progress',
    finish: 'Finished',
    error: 'Error'
  },
  empty: { description: 'No data' },
  skeleton: { loadingText: 'Loading…' },
  spin: { loadingText: 'Loading…' },
  qrcode: qrCodeEnUS,
  progress: { label: 'Progress', successText: 'Completed', exceptionText: 'Failed' },
  inputNumber: {
    increase: 'Increase value',
    decrease: 'Decrease value',
    invalidNumber: 'Enter a number within the allowed range.'
  },
  removeText: 'Remove',
  selectRequiredText: 'Select at least one option.',
  okText: 'OK',
  cancelText: 'Cancel',
  closeText: 'Close',
  global: { show: 'Show', hide: 'Hide', close: 'Close', backToTop: 'Back to top' },
  image: { preview: 'Image preview' },
  clearText: 'Clear',
  emptyText: 'No options',
  searchText: 'Search',
  submitErrorText: 'Could not submit the form. Please try again.',
  confirmErrorText: 'Could not complete the action. Please try again.',
  pagination: {
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    jumpPrevious: 'Previous pages',
    jumpNext: 'Next pages',
    pageSize: 'Items per page',
    itemsPerPage: '/ page',
    jumpTo: 'Go to',
    jumpToConfirm: 'confirm',
    pageSuffix: 'Page'
  },
  transfer: transferEnUS,
  table: {
    label: 'Table',
    emptyText: 'No data',
    loadingText: 'Loading data…',
    selectAll: 'Select all rows on this page',
    selectRow: 'Select row',
    selectionAll: 'Select all data',
    selectInvert: 'Invert current page',
    selectNone: 'Clear all data',
    selectionMenu: 'Selection commands',
    sortAscending: 'Sort ascending',
    sortDescending: 'Sort descending',
    cancelSort: 'Clear sorting',
    filterTitle: 'Filter',
    filterApply: 'Apply',
    filterReset: 'Reset',
    filterEmptyText: 'No filters',
    filterCheckAll: 'Select all items',
    filterSearchPlaceholder: 'Search in filters',
    expandColumn: 'Details',
    expandRow: 'Expand row',
    collapseRow: 'Collapse row'
  }
} satisfies Locale;
