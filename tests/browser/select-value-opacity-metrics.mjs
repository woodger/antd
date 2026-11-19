/** Read-only DOM paint observer; no framework-specific state or expected values. */
export function readSelectValueOpacity() {
  const root = document.querySelector('.select-value-control');
  const content = root?.querySelector('.ant-select-content');
  if (!root || !content) {
    throw Error('Selected-value opacity observer requires actual root/content DOM');
  }
  const styledValue = content.querySelector('.ant-select-content-value');
  const properties = ['opacity', 'visibility', 'display', 'color', 'fontFamily', 'fontSize', 'fontWeight',
    'fontStyle', 'lineHeight', 'overflow', 'position'];
  const computed = (node, pseudo) => {
    const css = getComputedStyle(node, pseudo);
    return Object.fromEntries(properties.map(key => [key, css[key]]));
  };
  const measure = node => ({ tag: node.tagName,
    attributes: [...node.attributes].map(attr => [attr.name, attr.value]),
    css: computed(node), before: computed(node, '::before'), after: computed(node, '::after'),
    outerHTML: node.outerHTML });
  const targets = new Map([[content, 'content']]);
  if (styledValue) targets.set(styledValue, 'styledValue');
  const text = [], textNodes = [];
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.data.length) continue;
    const ancestors = [];
    let effectiveOpacity = 1;
    for (let element = node.parentElement; element; element = element.parentElement) {
      const css = computed(element);
      const factor = Number(css.opacity);
      if (!Number.isFinite(factor)) {
        throw Error('Actual computed opacity is not finite: ' + css.opacity);
      }
      effectiveOpacity *= factor;
      if (!targets.has(element)) targets.set(
        element,
        `text:${text.length}:ancestor:${ancestors.length}`
      );
      ancestors.push({ target: targets.get(element), ...measure(element) });
      if (element === content) break;
    }
    if (!ancestors.length || ancestors.at(-1).target !== 'content') {
      throw Error('Text paint chain escaped content');
    }
    const path = [];
    for (let current = node; current !== content; current = current.parentNode) {
      path.unshift([...current.parentNode.childNodes].indexOf(current));
    }
    text.push({ text: node.data, effectiveOpacity });
    textNodes.push({ text: node.data, path, ancestors });
  }
  const cssRules = [], inaccessibleSheets = [];
  function readRules(rules, sheetIndex, indexPath = [], context = []) {
    for (let index = 0; index < rules.length; index++) {
      const rule = rules[index];
      const currentPath = [...indexPath, index];
      if (rule.selectorText) {
        const matches = [];
        for (const [node, name] of targets) {
          if (node.matches(rule.selectorText)) matches.push(name);
        }
        if (matches.length) {
          cssRules.push({ sheetIndex, indexPath: currentPath, context,
            selectorText: rule.selectorText, cssText: rule.cssText, declaration: rule.style.cssText, matches });
        }
      }
      if (rule.cssRules) {
        readRules(rule.cssRules, sheetIndex, currentPath,
          [...context, rule.conditionText ?? rule.name ?? rule.cssText.split('{')[0]]);
      }
    }
  }
  const styleSheets = [...document.styleSheets].map((sheet, index) => {
    try { readRules(sheet.cssRules, index); }
    catch (error) { inaccessibleSheets.push({ index, error: String(error) }); }
    return { index, href: sheet.href, disabled: sheet.disabled,
      owner: sheet.ownerNode ? { tag: sheet.ownerNode.tagName,
        attributes: [...sheet.ownerNode.attributes].map(attr => [attr.name, attr.value]) } : null };
  });
  const parentCSS = computed(content), childCSS = styledValue ? computed(styledValue) : null;
  return { view: { contentOpacity: parentCSS.opacity, contentVisibility: parentCSS.visibility,
    styledValue: childCSS ? { opacity: childCSS.opacity, visibility: childCSS.visibility } : null, text },
    raw: { root: measure(root), content: measure(content), styledValue: styledValue ? measure(styledValue) : null,
      textNodes, styleSheets, cssRules, inaccessibleSheets } };
}
