import template from '../vendor/grid-responsive.css.js';
import { getGridMediaCss, getGridMediaScope } from './grid-style.engine';
import { hashTokenString } from '../theme/theme-hash.engine';
import type { AliasToken } from '../theme/theme-token.types';

/** Prefix scope is independent of the overall media scope, including canonical Col in another namespace. */
export function getGridColPrefixScope(prefix: string, rootPrefix: string, token: AliasToken) {
  if (prefix === 'ant-col' && rootPrefix === 'ant') {
    return undefined;
  }

  return `ant-grid-col-${hashTokenString(
    [prefix, rootPrefix, getGridMediaScope(token) ?? 'default'].join('\0')
  )}`;
}

/** The full Col template preserves media thresholds, canonical tokens and namespace private vars. */
export function getGridColPrefixCss(prefix: string, rootPrefix: string, token: AliasToken) {
  const scope = getGridColPrefixScope(prefix, rootPrefix, token);
  if (!scope) {
    return undefined;
  }

  const media = getGridMediaCss(token);
  const css = media
    ? media.replaceAll(getGridMediaScope(token)!, scope)
    : template.replaceAll('__ANT_GRID_MEDIA_SCOPE__', scope);
  const namespace = rootPrefix.replace(/\./g, '');

  return css.replace(
    /\.ant-col([-\w]*)|--ant-col-|--ant-grid-display|"ant-col"|" ant-col"/g,
    (match, suffix: string | undefined) => {
      if (suffix !== undefined) {
        return `.${prefix}${suffix}`;
      }
      if (match === '--ant-col-') {
        return `--${namespace}-col-`;
      }
      if (match === '--ant-grid-display') {
        return `--${namespace}-grid-display`;
      }
      return match === '"ant-col"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
