interface PositionedBox { rect: { left: number; top: number }; }
export interface TreeSelectSuffixContainerSnapshot {
  root: PositionedBox;
  host: PositionedBox & { style: { position: string; top: string; left: string } };
  popup: PositionedBox | null;
  scroller: { scrollTop: number; scrollLeft: number; clientWidth: number; clientHeight: number };
  rootIsPublicRef: boolean;
  popupIsInsideHost: boolean;
  popupParentIsHost: boolean;
}

// Source raw DOMRect observations and Native DOM pass one relative projection.
export function projectTreeSelectSuffixContainer(snapshot: TreeSelectSuffixContainerSnapshot) {
  // Rounds the fractional dimension to the thousandth for comparing images.
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const relative = (node: PositionedBox) => ({
    x: round(node.rect.left - snapshot.host.rect.left),
    y: round(node.rect.top - snapshot.host.rect.top)
  });
  return {
    rootIsPublicRef: snapshot.rootIsPublicRef,
    rootRelativeHost: relative(snapshot.root),
    host: {
      position: snapshot.host.style.position,
      top: snapshot.host.style.top,
      left: snapshot.host.style.left
    },
    popup: snapshot.popup ? { relativeHost: relative(snapshot.popup), insideHost: snapshot.popupIsInsideHost,
      parentIsHost: snapshot.popupParentIsHost } : null,
    scroller: { left: snapshot.scroller.scrollLeft, top: snapshot.scroller.scrollTop,
      width: snapshot.scroller.clientWidth, height: snapshot.scroller.clientHeight }
  };
}

export function readTreeSelectSuffixContainer(): TreeSelectSuffixContainerSnapshot {
  const host = document.querySelector<HTMLElement>('[data-suffix-layout-case]')!;
  const root = host.querySelector<HTMLElement>('.ant-select')!;
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const scroller = document.querySelector<HTMLElement>('[data-suffix-container-scroller],[data-source-scroller]')!;
  // Saves the measured box in prime numbers to transmit from browser realm.
  const rect = (node: HTMLElement) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, top: box.top };
  };
  const style = getComputedStyle(host);
  const refs = JSON.parse(document.querySelector('[data-suffix-container-refs]')!.textContent!);
  return {
    root: { rect: rect(root) },
    host: {
      rect: rect(host),
      style: { position: style.position, top: style.top, left: style.left }
    },
    popup: popup ? { rect: rect(popup) } : null,
    scroller: { scrollTop: scroller.scrollTop, scrollLeft: scroller.scrollLeft,
      clientWidth: scroller.clientWidth, clientHeight: scroller.clientHeight },
    rootIsPublicRef: refs.rootIsPublicRef,
    popupIsInsideHost: Boolean(popup && host.contains(popup)),
    popupParentIsHost: popup?.parentNode === host
  };
}
