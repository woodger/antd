// Разрешает локальный словарь для одной таблицы. Настройки провайдера остаются общими.
import type { TableLocaleOverrides } from './table.types';
import { ruRU, type RenderEmptyContent, type TableLocale } from './types';

type ContentField = 'filterApply' | 'filterConfirm' | 'filterReset' | 'filterEmptyText'
  | 'filterCheckAll' | 'selectionAll' | 'selectInvert' | 'selectNone';

/** Значение из собственного поля может явно оставить видимый текст пустым. */
function readContent(
  local: TableLocaleOverrides | undefined,
  inherited: RenderEmptyContent,
  ...fields: ContentField[]
): RenderEmptyContent {
  if (local) {
    for (const field of fields) {
      if (Object.hasOwn(local, field)) {
        return local[field];
      }
    }
  }

  return inherited;
}

/** Совмещает текстовые подписи Native и актуальные поля словаря Ant Design. */
export function resolveTableLocale(
  provider: Partial<TableLocale> | undefined,
  local: TableLocaleOverrides | undefined
) {
  const fallback = ruRU.table;
  const inherited = { ...fallback, ...provider };

  return {
    label: local?.label ?? inherited.label,
    emptyText: inherited.emptyText,
    loadingText: local?.loadingText ?? inherited.loadingText,
    selectAll: local?.selectAll ?? inherited.selectAll,
    selectRow: local?.selectRow ?? inherited.selectRow,
    selectionMenu: local?.selectionMenu ?? inherited.selectionMenu ?? fallback.selectionMenu,
    selectionAll: readContent(local, inherited.selectionAll ?? fallback.selectionAll, 'selectionAll'),
    selectInvert: readContent(local, inherited.selectInvert ?? fallback.selectInvert, 'selectInvert'),
    selectNone: readContent(local, inherited.selectNone ?? fallback.selectNone, 'selectNone'),
    sortAscending: local?.triggerAsc ?? local?.sortAscending ?? inherited.sortAscending,
    sortDescending: local?.triggerDesc ?? local?.sortDescending ?? inherited.sortDescending,
    cancelSort: local?.cancelSort ?? inherited.cancelSort,
    filterTitle: local?.filterTitle ?? inherited.filterTitle ?? fallback.filterTitle,
    filterApply: readContent(
      local, inherited.filterApply ?? fallback.filterApply, 'filterConfirm', 'filterApply'
    ),
    filterReset: readContent(local, inherited.filterReset ?? fallback.filterReset, 'filterReset'),
    filterEmptyText: readContent(
      local, inherited.filterEmptyText ?? fallback.filterEmptyText, 'filterEmptyText'
    ),
    filterCheckAll: readContent(
      local, inherited.filterCheckAll ?? fallback.filterCheckAll, 'filterCheckAll'
    ),
    filterSearchPlaceholder: local?.filterSearchPlaceholder
      ?? inherited.filterSearchPlaceholder ?? fallback.filterSearchPlaceholder,
    expandColumn: local?.expandColumn ?? inherited.expandColumn,
    expandRow: local?.expand ?? local?.expandRow ?? inherited.expandRow,
    collapseRow: local?.collapse ?? local?.collapseRow ?? inherited.collapseRow
  };
}

export type ResolvedTableLocale = ReturnType<typeof resolveTableLocale>;
export type TableFilterLocale = Pick<ResolvedTableLocale,
  'filterTitle' | 'filterApply' | 'filterReset' | 'filterEmptyText' | 'filterCheckAll'
    | 'filterSearchPlaceholder'>;
