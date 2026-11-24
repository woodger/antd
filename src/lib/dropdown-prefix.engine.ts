import template from './vendor/dropdown-prefix.css.js';

/** Dropdown владеет menu prefix; Button namespace и canonical tokens остаются независимыми. */
export function getDropdownPrefixCss(prefix: string, rootPrefix: string, menuPrefix?: string) {
  const defaultMenu = `${prefix}-menu`;
  const menu = menuPrefix || defaultMenu;
  if (prefix === 'ant-dropdown' && rootPrefix === 'ant' && menu === defaultMenu) {
    return undefined;
  }

  const menuScope = menu === defaultMenu ? ''
    : `[data-ant-dropdown-menu-prefix=${JSON.stringify(menu)}]`;
  const scope = `:where([data-ant-dropdown-prefix=${JSON.stringify(prefix)}]`
    + `[data-ant-dropdown-root-prefix=${JSON.stringify(rootPrefix)}]${menuScope})`;
  const roots = new Set(['', '-trigger', '-menu-vertical', '-menu-submenu']);

  return template.replace(/\.ant-dropdown([-\w]*)|\.ant-btn([-\w]*)/g,
    (_match, suffix: string | undefined, buttonSuffix: string | undefined) => {
      if (buttonSuffix !== undefined) {
        return `.${rootPrefix}-btn${buttonSuffix}`;
      }
      if (suffix === '-css-var' || suffix === '-menu-css-var') {
        return `.ant-dropdown${suffix}${scope}`;
      }

      const part = suffix ?? '';
      const name = part.startsWith('-menu') ? `${menu}${part.slice(5)}` : `${prefix}${part}`;
      return `.${name}${roots.has(part) || part.startsWith('-placement-') ? scope : ''}`;
    }).replace(/<\/style/gi, '<\\/style');
}
