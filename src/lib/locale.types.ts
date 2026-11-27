import type { CarouselLocale } from './carousel.types';
import type { ColorPickerLocale } from './color-picker.types';
import type { DatePickerLocale } from './date-picker.types';
import type { FormLocale } from './form.types';
import type { QRCodeLocale } from './qrcode.types';
import type { TimePickerLocale } from './time-picker.types';
import type { TourLocale } from './tour.types';
import type { TransferLocale } from './transfer.types';
import type { TypographyLocale } from './typography.types';
import type { EmptyLocale, Locale, PaginationLocale, TableLocale } from './types';
import type { UploadLocale } from './upload.types';

type SourcePaginationLocale = Pick<PaginationLocale,
  'items_per_page' | 'jump_to' | 'jump_to_confirm' | 'page' | 'page_size'
  | 'prev_page' | 'next_page' | 'prev_5' | 'next_5' | 'prev_3' | 'next_3'>;

type SourceTableLocale = Pick<TableLocale,
  'filterTitle' | 'filterReset' | 'filterEmptyText' | 'emptyText' | 'selectAll' | 'cancelSort'> & {
  filterConfirm: string;
  filterCheckAll: string;
  filterSearchPlaceholder: string;
  selectInvert: string;
  selectNone: string;
  selectionAll: string;
  sortTitle: string;
  expand: string;
  collapse: string;
  triggerAsc: string;
  triggerDesc: string;
};

/** Dictionary Ant Design in its original form. ConfigProvider connects it to components Svelte. */
export interface AntDesignLocale {
  locale: string;
  Pagination?: Partial<SourcePaginationLocale>;
  DatePicker?: DatePickerLocale;
  TimePicker?: TimePickerLocale;
  Calendar?: DatePickerLocale;
  Table?: Partial<SourceTableLocale>;
  Modal?: { okText?: string; cancelText?: string; justOkText?: string; };
  Tour?: Partial<TourLocale>;
  Popconfirm?: Locale['popconfirm'];
  Transfer?: TransferLocale;
  Select?: Record<string, unknown>;
  Upload?: UploadLocale;
  Empty?: Partial<EmptyLocale>;
  global?: { placeholder?: string; close?: string; sortable?: string; show?: string; hide?: string; };
  Icon?: { icon?: string; };
  Text?: Partial<TypographyLocale>;
  Form?: FormLocale;
  QRCode?: Partial<QRCodeLocale>;
  Carousel?: Partial<CarouselLocale>;
  ColorPicker?: Partial<ColorPickerLocale>;
}
