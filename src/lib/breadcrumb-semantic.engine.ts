import type { BreadcrumbConfig, BreadcrumbProps, BreadcrumbSlots } from './breadcrumb.types';
import { mergeComponentSemantics } from './semantic-style.engine';

// Applies semantic settings to the root, items, and separators using the instance parameter type.
export function breadcrumbSemantics<Params extends Record<string, unknown>>(
  context: BreadcrumbConfig | undefined,
  props: BreadcrumbProps<Params>
) {
  // Shared context cannot know the instance's Params. Callbacks receive its original props without a wrapper.
  return mergeComponentSemantics<keyof BreadcrumbSlots, BreadcrumbProps<Params>>(
    context as BreadcrumbConfig<Params> | undefined,
    props,
    ['root', 'item', 'separator']
  );
}
