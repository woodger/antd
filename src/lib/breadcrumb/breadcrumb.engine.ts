// Prepares Breadcrumb items and links. Nested routes are built from accumulated path values in
// their original order.
import type { BreadcrumbContent, BreadcrumbItem } from './breadcrumb.types';

// Distinguishes empty content from significant numeric zero.
export function breadcrumbHasContent(value: BreadcrumbContent | undefined): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}
// Preserves the heading snippet and substitutes parameters only in the string representation.
export function breadcrumbName(
  title: BreadcrumbContent | undefined,
  params: Record<string, unknown>
): BreadcrumbContent | null {
  if (!breadcrumbHasContent(title)) {
    return null;
  }
  if (typeof title === 'function') {
    return title;
  }

  const keys = Object.keys(params).join('|');
  const text = String(title);
  const parameterPattern = new RegExp(`:(${keys})`, 'g');

  return text.replace(
    parameterPattern,
    (replacement, key: string) => String(params[key] || replacement)
  );
}
// Prepares a separate snapshot of the accumulated path for each item. A separator has no heading.
export function breadcrumbEntries(
  items: readonly BreadcrumbItem[],
  params: Record<string, unknown>
) {
  const paths: string[] = [];
  return items.map((item, index) => {
    let path = item.path;
    if (path !== undefined) {
      path = (path || '').replace(/^\//, '');
      for (const key of Object.keys(params))
        path = path.replace(`:${key}`, String(params[key]));
      paths.push(path);
    }
    return {
      item,
      index,
      paths: [...paths],
      href: paths.length && path !== undefined ? `#/${paths.join('/')}` : item.href,
      title: item.type === 'separator' ? null : breadcrumbName(item.title, params)
    };
  });
}
// Forwards only the entry's data and aria attributes.
export function breadcrumbAttributes(item: BreadcrumbItem): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => key.startsWith('data-') || key.startsWith('aria-'))
  );
}
