import type { StepsStatus } from './steps.types';
import type { Snippet } from 'svelte';

export type StepsDataContent = string | number | boolean | null | undefined | Snippet;
export type StepsSemanticSlots = Partial<
  Record<
    'root'
    | 'item'
    | 'itemWrapper'
    | 'itemIcon'
    | 'itemSection'
    | 'itemHeader'
    | 'itemTitle'
    | 'itemSubtitle'
    | 'itemContent'
    | 'itemRail',
    string
  >
>;
export type StepsItemSlots = Partial<
  Record<
    'root' | 'wrapper' | 'icon' | 'section' | 'header' | 'title' | 'subtitle' | 'content' | 'rail',
    string
  >
>;
export interface StepsDataItem {
  key?: string | number;
  title?: StepsDataContent;
  subTitle?: StepsDataContent;
  content?: StepsDataContent;
  icon?: StepsDataContent;
  status?: StepsStatus;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  class?: string;
  style?: string;
  classNames?: StepsItemSlots;
  styles?: StepsItemSlots;
}
export interface NormalizedStepsDataItem extends Omit<StepsDataItem, 'key'> {
  key: string;
  originalKey?: string | number;
}

/** Distinguishes explicit strings from numeric and generated keys. */
function stepsDataKey(key: StepsDataItem['key'], index: number, namespace: string): string {
  if (typeof key === 'string') {
    return key;
  }

  return key === undefined ? `${namespace}index:${index}` : `${namespace}number:${key}`;
}

/** Keeps the first item for each key and counts indices before removing duplicates. */
export function stepsDataItems(
  items: readonly (StepsDataItem | false | null | undefined)[]
): NormalizedStepsDataItem[] {
  const explicitKeys = items.flatMap(item => item && typeof item.key === 'string'
    ? [item.key]
    : []);
  let namespace = '@steps:';
  while (explicitKeys.some(key => key.startsWith(namespace))) {
    namespace = `@${namespace}`;
  }

  const present = items.filter((item): item is StepsDataItem => Boolean(item));
  const normalized: NormalizedStepsDataItem[] = [];
  const seen = new Set<string>();
  for (const [index, item] of present.entries()) {
    const key = stepsDataKey(item.key, index, namespace);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ ...item, key, originalKey: item.key, content: item.content });
  }

  return normalized;
}
export function stepsDataHasContent(value: StepsDataContent): boolean {
  return value !== undefined && value !== null;
}
export function stepsLayout(
  type: 'default' | 'dot' | 'inline' | 'navigation' | 'panel' | undefined,
  orientation: 'horizontal' | 'vertical' | undefined,
  responsive: boolean,
  mobile: boolean,
  titlePlacement?: 'horizontal' | 'vertical'
) {
  const dot = type === 'dot' || type === 'inline';
  const vertical = type !== 'panel'
    && ((responsive && mobile) || orientation === 'vertical');

  return {
    type,
    dot,
    vertical,
    titlePlacement: dot || vertical
      ? vertical ? 'horizontal' : 'vertical'
      : type === 'navigation' ? 'horizontal' : titlePlacement || 'horizontal'
  };
}
