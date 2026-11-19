export interface SelectVirtualShadowStyleState {
  syncs: number;
  samples: number;
  linkLoads: number;
  links: Array<{ href: string | null; originalConnected: boolean; copyConnected: boolean;
    loaded: boolean; rules: number | null }>;
  rowHeights: string[];
  violations: Array<{ stage: string; issue: string }>;
}
declare global {
  interface Window {
    selectVirtualShadowStyleProbe?: { read: () => SelectVirtualShadowStyleState; stop: () => void };
  }
}

/** Observe actual copied nodes/stylesheets through every ordinary virtualstyles synchronization. */
export function installSelectVirtualShadowStyleProbe() {
  type SheetNode = HTMLStyleElement | HTMLLinkElement;
  const host = document.querySelector<HTMLElement>('[data-select-virtual-shadow]')!;
  const root = host.shadowRoot!;
  const command = document.querySelector('[data-select-virtual-command]')!;
  const marker = 'data-select-virtual-copied';
  const pairs = new Map<SheetNode, { copy: SheetNode; loadedHref?: string | null }>();
  const rowHeights = new Set<string>();
  const violations: SelectVirtualShadowStyleState['violations'] = [];
  let syncs = 0, samples = 0, linkLoads = 0, stopped = false, frame: number;
  const signature = (node: SheetNode) => JSON.stringify({ tag: node.tagName,
    attributes: [...node.attributes].filter(attribute => attribute.name !== marker)
      .map(attribute => [attribute.name, attribute.value]).sort(),
    text: node instanceof HTMLStyleElement ? node.textContent : null });
  const issue = (stage: string, message: string) => {
    if (!violations.some(item => item.stage === stage && item.issue === message)) {
      violations.push({
        stage,
        issue: message
      });
    }
  };
  function bindPairs() {
    const originals = [...document.head.querySelectorAll<SheetNode>('style,link[rel="stylesheet"]')];
    const copies = [...root.querySelectorAll<SheetNode>(`[${marker}]`)];
    const used = new Set<SheetNode>();
    for (const [original, pair] of pairs) {
      if (!originals.includes(original)) {
        pairs.delete(original);
        continue;
      }
      used.add(pair.copy);
    }
    for (const original of originals) {
      if (pairs.has(original)) continue;
      const copy = copies.find(node => !used.has(node) && signature(node) === signature(original));
      if (copy) {
        pairs.set(original, { copy });
        used.add(copy);
      }
    }
  }
  function observe(stage: string) {
    if (!host.isConnected) {
      return;
    }
    bindPairs();
    samples++;
    for (const [original, pair] of pairs) {
      if (!pair.copy.isConnected || pair.copy.getRootNode() !== root) {
        issue(
          stage,
          'Copied node disconnected while its head source remains'
        );
      }
      if (original instanceof HTMLLinkElement && pair.copy instanceof HTMLLinkElement) {
        const href = original.getAttribute('href');
        if (pair.loadedHref === href && !pair.copy.sheet) issue(
          stage,
          `Loaded stylesheet disappeared: ${href}`
        );
        if (pair.copy.sheet) pair.loadedHref = href;
      }
    }
    for (const popup of root.querySelectorAll<HTMLElement>('.ant-select-dropdown')) {
      if (popup.hidden || getComputedStyle(popup).display === 'none' || !popup.getBoundingClientRect().width) continue;
      for (const row of popup.querySelectorAll<HTMLElement>('.ant-select-item-option')) {
        const height = getComputedStyle(row).height;
        rowHeights.add(height);
        if (height !== '32px') issue(
          stage,
          `Ordinary option lost its actual32px CSS height: ${height}`
        );
      }
    }
  }
  const before = () => observe('before-sync');
  const after = () => {
    syncs++;
    observe('after-sync');
  };
  const loaded = (event: Event) => {
    if (event.target instanceof HTMLLinkElement && event.target.hasAttribute(marker)) linkLoads++;
  };
  const mutations = new MutationObserver(records => {
    if (!host.isConnected) {
      return;
    }
    for (const record of records) {
      if (record.type === 'childList') {
        for (const removed of record.removedNodes) {
          for (const [original, pair] of pairs) {
            if (removed === pair.copy && document.head.contains(original)) {
              issue(
                'mutation',
                'Copied stylesheet node removed while original remains'
              );
            }
          }
        }
      }
      if (record.type === 'attributes' && record.attributeName === 'href' && record.target instanceof HTMLLinkElement
        && record.oldValue === record.target.getAttribute('href')) {
        issue(
          'mutation',
          'Unchanged stylesheet href was reset'
        );
      }
    }
  });
  mutations.observe(
    root,
    {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['href']
    }
  );
  command.addEventListener('virtualstyles', before, true);
  command.addEventListener('virtualstyles', after);
  root.addEventListener('load', loaded, true);
  const sample = () => {
    if (stopped) {
      return;
    }
    observe('frame');
    frame = requestAnimationFrame(sample);
  };
  observe('install');
  frame = requestAnimationFrame(sample);
  window.selectVirtualShadowStyleProbe = {
    read() {
      observe('read');
      const links = [...pairs].flatMap(([original, pair]) => {
        if (!(original instanceof HTMLLinkElement) || !(pair.copy instanceof HTMLLinkElement)) {
          return [];
        }
        let rules: number | null = null;
        try {
          rules = pair.copy.sheet?.cssRules.length ?? null;
        }
        catch { /* Same-node continuity remains observable for a cross-origin sheet. */ }
        return [{ href: pair.copy.getAttribute('href'), originalConnected: original.isConnected,
          copyConnected: pair.copy.isConnected, loaded: Boolean(pair.copy.sheet), rules }];
      });
      return {
        syncs,
        samples,
        linkLoads,
        links,
        rowHeights: [...rowHeights].sort(),
        violations: [...violations]
      };
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      mutations.disconnect();
      command.removeEventListener('virtualstyles', before, true);
      command.removeEventListener('virtualstyles', after);
      root.removeEventListener('load', loaded, true);
    }
  };
}
