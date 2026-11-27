// Measures only classes and declarations from public semantic slots. Geometry of the original
// rc-trigger and the native popover are checked by individual scenarios.
type MenuConfigHost = HTMLElement & { menuConfigCalls?: Record<string, unknown>; };

/** Readers nodes of the same panel and actual callbacks arguments after the render. */
export function readMenuConfig() {
  const host = document.querySelector<MenuConfigHost>('#menu-config-fixture');
  const root = host?.querySelector('ul.ant-menu-root');
  if (!host || !root) {
    return null;
  }

  // Inline branch and its hidden portal-copy can be mounted at the same time.
  const popup = host.querySelector('.x-popup-parent');
  const parentList = root.querySelector('.x-parent > ul') ?? popup?.querySelector(':scope > ul');
  const nestedPopup = host.querySelector('.x-popup-nested');
  const nestedList = parentList?.querySelector('.x-nested > ul')
    ?? nestedPopup?.querySelector(':scope > ul');
  const nodes = {
    root,
    leaf: root.querySelector('.x-leaf'),
    leafIcon: root.querySelector('.x-leaf .ant-menu-item-icon'),
    leafContent: root.querySelector('.x-leaf .ant-menu-title-content'),
    rootGroupTitle: root.querySelector('.x-group > .ant-menu-item-group-title'),
    rootGroupList: root.querySelector('.x-group > .ant-menu-item-group-list'),
    rootGroupItem: root.querySelector('.x-group-child'),
    parent: root.querySelector('.x-parent'),
    parentTitle: root.querySelector('.x-parent > .ant-menu-submenu-title'),
    parentIcon: root.querySelector('.x-parent > .ant-menu-submenu-title > .ant-menu-item-icon'),
    parentContent: root.querySelector('.x-parent > .ant-menu-submenu-title > .ant-menu-title-content'),
    popup,
    parentList,
    child: parentList?.querySelector('.x-child'),
    childIcon: parentList?.querySelector('.x-child .ant-menu-item-icon'),
    childContent: parentList?.querySelector('.x-child .ant-menu-title-content'),
    nestedGroupTitle: parentList?.querySelector('.x-nested-group > .ant-menu-item-group-title'),
    nestedGroupList: parentList?.querySelector('.x-nested-group > .ant-menu-item-group-list'),
    nestedGroupItem: parentList?.querySelector('.x-nested-group-child'),
    nestedTitle: parentList?.querySelector('.x-nested > .ant-menu-submenu-title'),
    nestedList,
    nestedPopup,
    grandchild: nestedList?.querySelector('.x-grandchild')
  };
  const properties = [
    'color', 'background-color', 'opacity', 'font-weight', 'padding-block-start',
    'padding-block-end', 'padding-inline-start', 'letter-spacing', 'z-index'
  ];

  /** Retrieves traces of the provider, local layers and an icon from a single node. */
  function readNode(node: HTMLElement) {
    const styles = Object.fromEntries(properties.flatMap(property => {
      const value = node.style.getPropertyValue(property);
      return value ? [[property, value]] : [];
    }));

    return {
      tag: node.localName,
      classes: [...node.classList].filter(name => /^(p-|l-|provider-|local-)/.test(name)).sort(),
      styles,
      expand: node.querySelector('.provider-expand')?.textContent ?? null
    };
  }

  return {
    calls: { ...host.menuConfigCalls },
    nodes: Object.fromEntries(Object.entries(nodes).flatMap(([slot, node]) => {
      return node instanceof HTMLElement ? [[slot, readNode(node)]] : [];
    }))
  };
}
