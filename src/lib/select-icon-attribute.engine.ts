import type { RenderEmptyContent } from './types';

/** React leaves loadingIcon on the intrinsic root. Keep Svelte templates opaque. */
export function selectIconAttribute(content: RenderEmptyContent): string | number | undefined {
  if (content == null || typeof content === 'boolean') {
    return undefined;
  }
  return Array.isArray(content) ? content.map(iconArrayItem).join(',')
    : typeof content === 'function' ? '[object Object]' : content as string | number;
}

function iconArrayItem(content: RenderEmptyContent): string {
  if (content == null) {
    return '';
  }
  if (Array.isArray(content)) {
    return content.map(iconArrayItem).join(',');
  }
  return typeof content === 'function' ? '[object Object]' : String(content);
}
