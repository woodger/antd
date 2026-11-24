// Подключает словари Ant Design к контексту Svelte. У каждого словаря есть
// английские defaults источника, а locale в нативной форме наследует провайдера.
import english from './locale/en_US';
import type { AntDesignLocale } from './locale.types';
import { enUS, type Locale } from './types';

/** Держит подпись страницы для accessibility и отдельно переводит суффикс быстрого перехода. */
function paginationLocale(locale: AntDesignLocale['Pagination']): Locale['pagination'] {
  const source = { ...english.Pagination, ...locale };
  const fallback = enUS.pagination;

  return {
    ...fallback,
    previous: source.prev_page ?? fallback.previous,
    next: source.next_page ?? fallback.next,
    jumpPrevious: source.prev_5 ?? fallback.jumpPrevious,
    jumpNext: source.next_5 ?? fallback.jumpNext,
    prev_3: source.prev_3,
    next_3: source.next_3,
    pageSize: source.page_size ?? fallback.pageSize,
    itemsPerPage: source.items_per_page ?? fallback.itemsPerPage,
    jumpTo: source.jump_to ?? fallback.jumpTo,
    jumpToConfirm: source.jump_to_confirm ?? fallback.jumpToConfirm,
    pageSuffix: source.page ?? fallback.pageSuffix
  };
}

/** Переносит подписи Table. Стандартная пустая таблица использует словарь Empty. */
function tableLocale(locale: AntDesignLocale['Table'], emptyText?: string): Locale['table'] {
  const source = { ...english.Table, ...locale };
  const fallback = enUS.table;

  return {
    ...fallback,
    emptyText: emptyText ?? fallback.emptyText,
    selectAll: source.selectAll ?? fallback.selectAll,
    selectionAll: source.selectionAll ?? fallback.selectionAll,
    selectInvert: source.selectInvert ?? fallback.selectInvert,
    selectNone: source.selectNone ?? fallback.selectNone,
    sortAscending: source.triggerAsc ?? fallback.sortAscending,
    sortDescending: source.triggerDesc ?? fallback.sortDescending,
    cancelSort: source.cancelSort ?? fallback.cancelSort,
    filterTitle: source.filterTitle ?? fallback.filterTitle,
    filterApply: source.filterConfirm ?? fallback.filterApply,
    filterReset: source.filterReset ?? fallback.filterReset,
    filterEmptyText: source.filterEmptyText ?? fallback.filterEmptyText,
    expandRow: source.expand ?? fallback.expandRow,
    collapseRow: source.collapse ?? fallback.collapseRow
  };
}

/** Разрешает словарь из публичного подмодуля или возвращает настройки Svelte провайдера. */
export function resolveProviderLocale(
  locale?: Partial<Locale> | AntDesignLocale
): Partial<Locale> | undefined {
  if (!locale || !('locale' in locale)) {
    return locale;
  }

  const modal = { ...english.Modal, ...locale.Modal };
  const global = { ...enUS.global, ...english.global, ...locale.global };
  const empty = { ...english.Empty, ...locale.Empty };
  const datePicker = locale.DatePicker ?? english.DatePicker ?? enUS.datePicker;
  const transfer = { ...enUS.transfer, ...english.Transfer, ...locale.Transfer };

  return {
    ...enUS,
    okText: modal.okText ?? enUS.okText,
    cancelText: modal.cancelText ?? enUS.cancelText,
    justOkText: modal.justOkText,
    popconfirm: { ...english.Popconfirm, ...locale.Popconfirm },
    closeText: global.close ?? enUS.closeText,
    clearText: datePicker.lang.clear ?? enUS.clearText,
    searchText: transfer.searchPlaceholder ?? enUS.searchText,
    emptyText: empty.description ?? enUS.emptyText,
    datePicker,
    calendar: locale.Calendar ?? english.Calendar ?? enUS.calendar,
    pagination: paginationLocale(locale.Pagination),
    table: tableLocale(locale.Table, empty.description),
    upload: { ...english.Upload, ...locale.Upload },
    transfer,
    empty,
    qrcode: { ...english.QRCode, ...locale.QRCode },
    ...locale,
    global,
    Form: { ...english.Form, ...locale.Form },
    Text: { ...english.Text, ...locale.Text },
    Tour: { ...english.Tour, ...locale.Tour },
    Carousel: { ...english.Carousel, ...locale.Carousel },
    ColorPicker: { ...english.ColorPicker, ...locale.ColorPicker }
  };
}
