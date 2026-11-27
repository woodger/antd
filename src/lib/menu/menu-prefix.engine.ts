import base from '../vendor/menu-prefix.css.js';
import theme from '../vendor/menu-theme-prefix.css.js';
import motion from '../vendor/menu-motion-prefix.css.js';

/** Saves a common namespace motion; the key frames coincide with all Menu. */
export function getMenuMotionCss(rootPrefix: string) {
  if (rootPrefix === 'ant') {
    return undefined;
  }

  return motion.replace(/"ant"|\.ant-(?=motion-collapse|slide-up|slide-down|zoom-big)/g, match =>
    match === '"ant"' ? JSON.stringify(rootPrefix) : `.${rootPrefix}-`
  ).replace(/<\/style/gi, '<\\/style');
}

/** Menu/popup save canonical variables and scoped themes, Typography uses general prefix. */
export function getMenuPrefixCss(prefix: string, rootPrefix: string) {
  if (prefix === 'ant-menu' && rootPrefix === 'ant') {
    return undefined;
  }

  const scope = `:where([data-ant-menu-prefix=${JSON.stringify(prefix)}]`
    + `[data-ant-menu-root-prefix=${JSON.stringify(rootPrefix)}])`;
  const roots = new Set(['', '-light', '-dark', '-inline', '-vertical', '-horizontal',
    '-inline-collapsed', '-root', '-rtl', '-submenu', '-submenu-popup']);

  return `${base}\n${theme}`.replace(
    /\.ant-menu([-\w]*)|\.ant-(layout-header|typography[-\w]*)|"ant-menu"|" ant-menu"/g,
    (match, suffix: string | undefined, shared: string | undefined) => {
      if (shared !== undefined) {
        return `.${rootPrefix}-${shared}`;
      }
      if (suffix === '-css-var') {
        return `.ant-menu-css-var${scope}`;
      }
      if (suffix !== undefined) {
        return `.${prefix}${suffix}${roots.has(suffix) || suffix.startsWith('-submenu-placement-') ? scope : ''}`;
      }

      return match === '"ant-menu"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
