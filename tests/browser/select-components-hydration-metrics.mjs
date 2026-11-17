/** Read-only observer, serialized unchanged into Original and Native pages. */
export function initializeSelectComponentsHydrationProbe() {
  const owner = document.querySelector('[data-components-hydration-case]');
  const editor = owner?.querySelector('input:not([type="hidden"]),textarea') ?? null;
  window.componentsHydrationProbe = { api: undefined, nodeIds: new WeakMap(), lastNodeId: 0,
    parsed: { owner, editor, root: editor?.closest('.ant-select') ?? editor } };
}

export function readSelectComponentsHydration() {
  const state = window.componentsHydrationProbe;
  const holder = document.querySelector('[data-hydration-control]');
  const field = holder?.querySelector('input:not([type="hidden"]),textarea') ?? null;
  const root = field?.closest('.ant-select') ?? field;
  const owner = document.querySelector('[data-components-hydration-case]');
  const refs = state.api?.readRefs() ?? {};
  const identity = node => {
    if (!node) return null;
    let id = state.nodeIds.get(node);
    if (!id) { id = ++state.lastNodeId; state.nodeIds.set(node, id); }
    return id;
  };
  const node = element => element ? {
    identity: identity(element), connected: element.isConnected, tag: element.tagName,
    attributes: [...element.attributes].map(attr => [attr.name, attr.value]),
    value: 'value' in element ? element.value : null,
    defaultValue: 'defaultValue' in element ? element.defaultValue : null,
    textContent: element.textContent,
    selection: 'selectionStart' in element ? [element.selectionStart, element.selectionEnd, element.selectionDirection] : null,
    focused: document.activeElement === element,
    box: (() => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; })()
  } : null;
  return {
    root: node(root), editor: node(field),
    identity: {
      owner: owner === state.parsed.owner,
      root: root === state.parsed.root, editor: field === state.parsed.editor,
      rootConnected: state.parsed.root?.isConnected ?? false,
      editorConnected: state.parsed.editor?.isConnected ?? false
    },
    refs: { control: Boolean(refs.control), rootIdentity: identity(refs.root), editorIdentity: identity(refs.editor),
      rootMatchesDOM: refs.root === root, editorMatchesDOM: refs.editor === field },
    owner: state.api?.read() ?? null,
    popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    parsedRoot: node(state.parsed.root), parsedEditor: node(state.parsed.editor)
  };
}
