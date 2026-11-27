// Lays out DOM attributes according to nodes Table and combines classes and CSS slots. Pagination
// allows callbacks with specific pager parameters and with a separate local style priority.
import type { PaginationProps, PaginationSemantic } from '../pagination/pagination.types';
import { mergeComponentSemantics } from '../semantic-style.engine';
import type {
  TableClassNameSlots, TableConfig, TableConfigSemantic, TablePaginationConfig, TableProps,
  TableSemantic, TableSemanticSlots
} from './table.types';

const outerSlots = ['root', 'section', 'title', 'footer', 'content'] as const;
const groupSlots = ['wrapper', 'row', 'cell'] as const;
const paginationSlots = ['root', 'item'] as const;

/** Select attributes of the container and semantic tables with the preservation of 0, false and ''. */
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

/** Causes the settings of the provider and instance with the same table parameters. */
function resolve<Row extends object, Slots extends TableClassNameSlots>(
  value: TableConfigSemantic<Slots> | TableSemantic<Row, Slots> | undefined,
  props: TableProps<Row>
) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Links the abbreviated string of classes to the main element of the group. */
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

/** The classes are folded, and the styles of the external node are completed by the usual style of the instance. */
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

  // At the group level, the instance replaces CSS of the specified slot in its entirety.
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

/** Allows the settings of a specific pager after it normalizes Pagination. */
function resolvePagination(value: PaginationSemantic | undefined, props: PaginationProps) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Pager classes are added to classes Table. Styles Table close the cascade. */
export function getTablePaginationSemantics(
  classes: TableSemanticSlots['pagination'],
  styles: TableSemanticSlots['pagination'],
  pagination: TablePaginationConfig | false | undefined
): Pick<TablePaginationConfig, 'classNames' | 'styles'> {
  const localClasses = pagination ? pagination.classNames : undefined;
  const localStyles = pagination ? pagination.styles : undefined;

  /** The classes of the owner of the page go after the classes of the table. */
  const classNames: PaginationSemantic | undefined = classes?.root || classes?.item
    ? ({ props }) => {
        const pager = resolvePagination(localClasses, props);
        const merged = mergeComponentSemantics(
          { classNames: classes }, { classNames: pager }, paginationSlots
        );
        return merged.classes;
      }
    : localClasses;

  /** The table style overlaps the properties of the page owner. */
  const paginationStyles: PaginationSemantic | undefined = styles?.root || styles?.item
    ? ({ props }) => {
        const pager = resolvePagination(localStyles, props);
        const merged = mergeComponentSemantics({ styles: pager }, { styles }, paginationSlots);
        return merged.styles;
      }
    : localStyles;

  return { classNames, styles: paginationStyles };
}
