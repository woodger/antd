/** Extra read-only CSSOM width receipt; no setter instrumentation or DOM writes. */
export function readInputWidthOwn() {
  const { root, editor } = raw.current.readRefs(), computed = getComputedStyle(editor), box = editor.getBoundingClientRect();
  return { value: editor.value, inlineWidth: editor.style.width, inlineWidthProperty: editor.style.getPropertyValue('width'),
    inlineWidthPriority: editor.style.getPropertyPriority('width'), cssomOwnWidth: [...editor.style].includes('width'),
    inlineOrder: [...editor.style], inlineProperties: [...editor.style].map(name => ({ name,
      value: editor.style.getPropertyValue(name), priority: editor.style.getPropertyPriority(name) })),
    styleAttribute: editor.getAttribute('style'), cssText: editor.style.cssText,
    inlineVariable: editor.style.getPropertyValue('--select-input-width'), computedVariable: computed.getPropertyValue('--select-input-width'),
    legacyInlineVariable: editor.style.getPropertyValue('--input-width'), computedWidth: computed.width,
    computedFont: computed.font, computedFontSize: computed.fontSize, computedBoxSizing: computed.boxSizing,
    computedMinWidth: computed.minWidth, computedMaxWidth: computed.maxWidth,
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    scrollWidth: editor.scrollWidth, clientWidth: editor.clientWidth, offsetWidth: editor.offsetWidth,
    editorAttributes: [...editor.attributes].map(attr => [attr.name, attr.value]), editorOuterHTML: editor.outerHTML,
    rootAttributes: [...root.attributes].map(attr => [attr.name, attr.value]),
    resourceEntries: performance.getEntriesByType('resource').map(entry => ({ name: entry.name, initiatorType: entry.initiatorType })) };
}
