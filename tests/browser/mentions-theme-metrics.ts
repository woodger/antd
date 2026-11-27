/** Compares CSS control and popup, not tied to React/Svelte DOM-inch. */
export function snapshotMentionsTheme() {
  const root = document.querySelector<HTMLElement>('.ant-mentions');
  if (!root) {
    throw new Error('Mentions root is missing');
  }

  // Fixes computed declarations. The missing node remains null in the picture.
  const css = (node: Element | null, keys: readonly string[]) => {
    if (!node) {
      return null;
    }
    const style = getComputedStyle(node);
    return Object.fromEntries(keys.map(key => [key, style.getPropertyValue(key)]));
  };
  const typography = ['font-family', 'font-size', 'font-weight', 'line-height', 'color'];
  const box = [
    'width', 'height', 'min-height', 'padding-top', 'padding-right', 'padding-bottom',
    'padding-left', 'border-top-width', 'border-top-color', 'border-radius',
    'background-color', 'box-shadow'
  ];
  const popup = document.querySelector<HTMLElement>('.ant-mentions-dropdown');
  const visiblePopup = popup && getComputedStyle(popup).display !== 'none' ? popup : null;

  return {
    root: css(root, [...typography, ...box]),
    textarea: css(root.querySelector('textarea'), [
      ...typography, ...box, 'resize', 'overflow-x', 'overflow-y'
    ]),
    placeholder: (() => {
      const input = root.querySelector('textarea');
      return input ? getComputedStyle(input, '::placeholder').color : null;
    })(),
    popup: css(visiblePopup, [
      ...typography, ...box, 'z-index', 'font-variant', 'direction'
    ]),
    menu: css(visiblePopup?.querySelector('.ant-mentions-dropdown-menu') ?? null, [
      'max-height', 'overflow-x', 'overflow-y', 'padding-left'
    ]),
    items: [...(visiblePopup?.querySelectorAll('.ant-mentions-dropdown-menu-item') ?? [])]
      .map(node => css(node, [...typography, ...box, 'min-width', 'cursor']))
  };
}

/** Reads all the variables from the original registration rule, including alias overrides. */
export function snapshotMentionsThemeVariables(prefix: string) {
  const root = document.querySelector('.ant-mentions');
  if (!root) {
    throw new Error('Mentions root is missing');
  }
  const declarations: Record<string, string> = {};

  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (!(rule instanceof CSSStyleRule)
        || !root.matches(rule.selectorText)
        || ![...rule.style].some(name => name.startsWith(`--${prefix}-mentions-`))) {
        continue;
      }

      for (const name of rule.style) {
        if (name.startsWith(`--${prefix}-`)) {
          declarations[name] = rule.style.getPropertyValue(name).trim();
        }
      }
    }
  }

  return declarations;
}
