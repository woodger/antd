// Раскладывает DOM-атрибуты по узлам Table и объединяет классы и CSS слотов.
// Pagination разрешает callbacks с параметрами конкретного пейджера
// и с отдельным приоритетом локальных стилей.
import type { PaginationProps, PaginationSemantic } from './pagination.types';
import { mergeComponentSemantics } from './semantic-style.engine';
import type {
  TableClassNameSlots, TableConfig, TableConfigSemantic, TablePaginationConfig, TableProps,
  TableSemantic, TableSemanticSlots
} from './table.types';

const outerSlots = ['root', 'section', 'title', 'footer', 'content'] as const;
const groupSlots = ['wrapper', 'row', 'cell'] as const;
const paginationSlots = ['root', 'item'] as const;

/** Выбирает атрибуты контейнера и семантических таблиц с сохранением 0, false и ''. */
export function getTableDomAttributes<Row extends object>(props: TableProps<Row>) {
  const data: Record<string, string> = {};
  const aria: Record<string, unknown> = {};

  for (const name of Object.keys(props)) {
    if (name === 'role' || name.startsWith('aria-')) {
      aria[name] = Reflect.get(props, name);
    }
    else if (name.startsWith('data-')) {
      const value: unknown = Reflect.get(props, name);
      if (value !== null && value !== undefined) {
        data[name] = String(value);
      }
    }
  }

  return { data, aria };
}

/** Вызывает настройки провайдера и экземпляра с одними и теми же параметрами таблицы. */
function resolve<Row extends object, Slots extends TableClassNameSlots>(
  value: TableConfigSemantic<Slots> | TableSemantic<Row, Slots> | undefined,
  props: TableProps<Row>
) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Привязывает сокращённую строку классов к основному элементу группы. */
function expandClassNames(classNames?: TableClassNameSlots): TableSemanticSlots | undefined {
  if (!classNames) {
    return undefined;
  }

  const { header, body, pagination, ...outer } = classNames;

  return {
    ...outer,
    header: typeof header === 'string' ? { wrapper: header } : header,
    body: typeof body === 'string' ? { wrapper: body } : body,
    pagination: typeof pagination === 'string' ? { root: pagination } : pagination
  };
}

/** Классы складываются, а стили внешнего узла завершаются обычным style экземпляра. */
export function getTableSemantics<Row extends object>(
  provider: TableConfig | undefined, props: TableProps<Row>
) {
  const providerClasses = expandClassNames(resolve(provider?.classNames, props));
  const localClasses = expandClassNames(resolve(props.classNames, props));
  const providerStyles = resolve(provider?.styles, props);
  const localStyles = resolve(props.styles, props);

  const outer = mergeComponentSemantics(
    { classNames: providerClasses, styles: providerStyles, style: provider?.style },
    { classNames: localClasses, styles: localStyles, style: props.style },
    outerSlots
  );

  // На уровне группы экземпляр заменяет CSS указанного слота целиком.
  const header = mergeComponentSemantics(
    { classNames: providerClasses?.header },
    {
      classNames: localClasses?.header,
      styles: { ...providerStyles?.header, ...localStyles?.header }
    },
    groupSlots
  );
  const body = mergeComponentSemantics(
    { classNames: providerClasses?.body },
    { classNames: localClasses?.body, styles: { ...providerStyles?.body, ...localStyles?.body } },
    groupSlots
  );
  const pagination = mergeComponentSemantics(
    { classNames: providerClasses?.pagination },
    {
      classNames: localClasses?.pagination,
      styles: { ...providerStyles?.pagination, ...localStyles?.pagination }
    },
    paginationSlots
  );

  return {
    classes: {
      ...outer.classes, header: header.classes, body: body.classes, pagination: pagination.classes
    },
    styles: {
      ...outer.styles, header: header.styles, body: body.styles, pagination: pagination.styles
    }
  };
}

/** Разрешает настройки конкретного пейджера после его нормализации Pagination. */
function resolvePagination(value: PaginationSemantic | undefined, props: PaginationProps) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Классы пейджера добавляются к классам Table. Стили Table замыкают каскад. */
export function getTablePaginationSemantics(
  classes: TableSemanticSlots['pagination'],
  styles: TableSemanticSlots['pagination'],
  pagination: TablePaginationConfig | false | undefined
): Pick<TablePaginationConfig, 'classNames' | 'styles'> {
  const localClasses = pagination ? pagination.classNames : undefined;
  const localStyles = pagination ? pagination.styles : undefined;

  /** Классы владельца страницы идут после классов таблицы. */
  const classNames: PaginationSemantic | undefined = classes?.root || classes?.item
    ? ({ props }) => {
        const pager = resolvePagination(localClasses, props);
        const merged = mergeComponentSemantics(
          { classNames: classes }, { classNames: pager }, paginationSlots
        );
        return merged.classes;
      }
    : localClasses;

  /** Стиль таблицы перекрывает свойства владельца страницы. */
  const paginationStyles: PaginationSemantic | undefined = styles?.root || styles?.item
    ? ({ props }) => {
        const pager = resolvePagination(localStyles, props);
        const merged = mergeComponentSemantics({ styles: pager }, { styles }, paginationSlots);
        return merged.styles;
      }
    : localStyles;

  return { classNames, styles: paginationStyles };
}
