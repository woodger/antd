/** Read-only actual paint: computed text fill and every real ancestor, no expected colors. */
export function readSelectSurfaceEdgePaint() {
  const owner = document.querySelector('[data-surface-case]'), refs = {};
  owner.querySelector('[data-surface-command]').dispatchEvent(new CustomEvent(
    'surfacerefs',
    { detail: refs }
  ));
  const root = refs.root, input = refs.editor;
  const box = node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const css = node => {
    const s = getComputedStyle(node);
    return { color: s.color, textFillColor: s.getPropertyValue('-webkit-text-fill-color'), backgroundColor: s.backgroundColor,
      visibility: s.visibility, opacity: s.opacity, display: s.display, height: s.height, width: s.width,
      pointerEvents: s.pointerEvents, overflow: s.overflow };
  };
  const measure = node => ({ tag: node.tagName, attributes: [...node.attributes].map(attr => [attr.name, attr.value]),
    css: css(node), box: box(node), outerHTML: node.outerHTML });
  const alpha = color => {
    if (color === 'transparent') return 0;
    const match = color.match(/^rgba?\(([^)]+)\)$/);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean);
    return parts.length === 4 ? Number(parts[3]) : 1;
  };
  const paint = node => {
    const ancestors = [];
    let opacity = 1;
    for (let current = node; current; current = current.parentElement) {
      const style = css(current);
      opacity *= Number(style.opacity);
      ancestors.push(measure(current));
      if (current === root) break;
    }
    const self = css(node), rect = box(node), suppressedByDisplay = ancestors.some(n => n.css.display === 'none');
    const effectiveVisible = !suppressedByDisplay && !['hidden', 'collapse'].includes(self.visibility)
      && opacity > 0 && rect.width > 0 && rect.height > 0;
    const textFillAlpha = alpha(self.textFillColor);
    return { css: self, box: rect, opacity, effectiveVisible, suppressedByDisplay, textFillAlpha,
      effectiveTextVisible: textFillAlpha === null ? null : effectiveVisible && textFillAlpha > 0,
      ancestors };
  };
  const placeholders = [...root.querySelectorAll('.ant-select-placeholder')];
  const placeholderPaint = placeholders.map(node => ({ text: node.textContent, ...paint(node) }));
  const inputPaint = paint(input);
  const { ancestors: inputAncestors, ...inputView } = inputPaint;
  const targets = new Map([[input, 'input'], ...placeholders.map((node, index) => [node, 'placeholder:' + index])]);
  const rules = [], cssErrors = [];
  const readRules = (list, sheetIndex, context = []) => {
    for (const rule of list) {
      if (rule.selectorText) {
        const matched = [];
        for (const [node, key] of targets) if (node.matches(rule.selectorText)) matched.push(key);
        if (matched.length) rules.push({
          sheetIndex,
          context,
          selector: rule.selectorText,
          cssText: rule.cssText,
          matched
        });
      }
      if (rule.cssRules) readRules(
        rule.cssRules,
        sheetIndex,
        [...context, rule.conditionText ?? rule.name ?? '']
      );
    }
  };
  [...document.styleSheets].forEach((sheet, index) => {
    try {
    readRules(sheet.cssRules, index);
  }
  catch (error) {
    cssErrors.push(String(error));
  }
  });
  return { view: { input: { ...inputView, value: input.value },
    placeholders: placeholderPaint.map(({ ancestors: _ancestors, ...rest }) => rest),
    passivePanels: [...document.querySelectorAll('[data-surface-edge-panel]')].map(node => ({
      text: node.textContent,
      ...box(node)
    })) },
    raw: { input: { ...measure(input), paintAncestors: inputAncestors },
      placeholders: placeholders.map((node, index) => ({
        ...measure(node),
        paintAncestors: placeholderPaint[index].ancestors
      })),
      rules, cssErrors } };
}
