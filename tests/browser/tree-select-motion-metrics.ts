interface TreeSelectMotionFrameClock {
  advance: (count: number) => Promise<void>;
  setTime: (time: number) => Promise<void>;
  pending: () => number;
  stop: () => void;
}

type MotionClockWindow = Window & { treeSelectMotionFrameClock?: TreeSelectMotionFrameClock };

/** Test consumer controls public RAF/WAAPI APIs; neither Source nor Native internals are inspected. */
export function installTreeSelectMotionClock() {
  const scope = window as MotionClockWindow;
  if (scope.treeSelectMotionFrameClock) return;
  const originalRequest = window.requestAnimationFrame;
  const originalCancel = window.cancelAnimationFrame;
  const queue = new Map<number, FrameRequestCallback>();
  const known = new WeakSet<Animation>();
  let serial = 0;
  let timestamp = 0;
  let active = true;
  window.requestAnimationFrame = callback => {
    const id = ++serial;
    queue.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = id => { queue.delete(id); };

  function popups() {
    const roots: ParentNode[] = [document];
    const shadow = document.querySelector('[data-motion-shadow]')?.shadowRoot;
    if (shadow) roots.push(shadow);
    return roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('.motion-audit-popup')]);
  }
  function freeze() {
    if (!active) return;
    for (const popup of popups()) {
      for (const animation of popup.getAnimations({ subtree: false })) {
        if (known.has(animation)) continue;
        known.add(animation);
        animation.pause();
        animation.currentTime = 0;
      }
    }
  }
  const observer = new MutationObserver(freeze);
  observer.observe(document, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']
  });
  const task = () => new Promise<void>(resolve => window.setTimeout(resolve, 0));
  async function drain() {
    await Promise.resolve();
    await new Promise<void>(resolve => originalRequest.call(window, () => resolve()));
    await task();
    await task();
    freeze();
    await Promise.resolve();
  }

  scope.treeSelectMotionFrameClock = {
    async advance(count) {
      await drain();
      for (let index = 0; index < count; index++) {
        timestamp += 1000 / 60;
        const frame = [...queue];
        queue.clear();
        for (const [, callback] of frame) callback(timestamp);
        await drain();
      }
    },
    async setTime(time) {
      freeze();
      for (const popup of popups()) {
        for (const animation of popup.getAnimations({ subtree: false })) {
          animation.pause();
          animation.currentTime = time;
        }
      }
      await drain();
      await scope.treeSelectMotionFrameClock!.advance(1);
    },
    pending: () => queue.size,
    stop() {
      active = false;
      observer.disconnect();
      queue.clear();
      window.requestAnimationFrame = originalRequest;
      window.cancelAnimationFrame = originalCancel;
      delete scope.treeSelectMotionFrameClock;
    }
  };
}

export async function advanceTreeSelectMotionFrames(count = 1) {
  const clock = (window as MotionClockWindow).treeSelectMotionFrameClock;
  if (!clock) throw Error('Install the public TreeSelect motion clock before mounting');
  await clock.advance(count);
}

export async function setTreeSelectMotionTime(time: number) {
  const clock = (window as MotionClockWindow).treeSelectMotionFrameClock;
  if (!clock) throw Error('Install the public TreeSelect motion clock before mounting');
  await clock.setTime(time);
}

/** Identical measured DOM projection for the unmodified official UMD and built Native package. */
export function readTreeSelectMotion() {
  const host = document.querySelector<HTMLElement>('[data-motion-host]')!;
  const root = host.querySelector<HTMLElement>('[data-motion-root]')
    ?? host.querySelector<HTMLElement>('.motion-audit-root')!;
  const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    '[data-motion-editor],input[role="combobox"],textarea[role="combobox"]'
  );
  const shadow = document.querySelector('[data-motion-shadow]')?.shadowRoot;
  const popup = shadow?.querySelector<HTMLElement>('.motion-audit-popup')
    ?? document.querySelector<HTMLElement>('.motion-audit-popup');
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const rect = (node: Element) => {
    const box = node.getBoundingClientRect();
    return { x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height) };
  };
  const output = (name: string) => {
    const node = document.querySelector(`[data-motion-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const classes = popup ? [...popup.classList] : [];
  const phases = classes.filter(name => /-(?:appear|enter|leave)(?:-(?:prepare|start|active))?$/.test(name));
  const names = new Set(phases.map(name => name.replace(/-(?:appear|enter|leave)(?:-(?:prepare|start|active))?$/, '')));
  const popupCss = popup ? getComputedStyle(popup) : null;
  const hidden = Boolean(popup && (popup.hidden || popupCss!.display === 'none'));
  const active = (root.getRootNode() as Document | ShadowRoot).activeElement;
  const draft = popup?.querySelector<HTMLInputElement>('[data-motion-draft]');
  const scopes: ParentNode[] = [document];
  if (shadow) scopes.push(shadow);
  const leaked = scopes.flatMap(scope => [...scope.querySelectorAll('[animation],[transitionname]')])
    .map(node => ({ tag: node.tagName, animation: node.getAttribute('animation'),
      transitionName: node.getAttribute('transitionname') }));
  const parent = popup?.offsetParent;
  return {
    view: {
      viewport: { width: innerWidth, height: innerHeight },
      host: rect(host),
      root: { tag: root.tagName, box: rect(root), direction: getComputedStyle(root).direction,
        focused: active === root, containsFocus: Boolean(active && root.contains(active)) },
      editor: editor ? { tag: editor.tagName, value: editor.value,
        selection: [editor.selectionStart, editor.selectionEnd], focused: active === editor,
        expanded: editor.getAttribute('aria-expanded'), readonly: editor.readOnly, disabled: editor.disabled } : null,
      popup: popup ? {
        hidden,
        box: rect(popup),
        motionClasses: classes.filter(name => phases.includes(name) || names.has(name)),
        placementClasses: classes.filter(name => name.includes('-placement-')),
        direction: popupCss!.direction,
        opacity: popupCss!.opacity,
        label: popup.querySelector('[data-motion-label]')?.textContent ?? null,
        draft: draft ? { value: draft.value, selection: [draft.selectionStart, draft.selectionEnd] } : null
      } : null,
      model: output('model'),
      events: output('events'),
      semantic: output('semantic'),
      receivedAttrs: output('received'),
      leaked
    },
    raw: {
      root: { id: root.id, dir: root.getAttribute('dir'), role: root.getAttribute('role'),
        expanded: root.getAttribute('aria-expanded') },
      editorBox: editor ? rect(editor) : null,
      popup: popup ? {
        position: popupCss!.position,
        display: popupCss!.display,
        visibility: popupCss!.visibility,
        pointerEvents: popupCss!.pointerEvents,
        axes: { left: popup.style.left, top: popup.style.top,
          right: popup.style.right, bottom: popup.style.bottom },
        transform: popupCss!.transform,
        transformOrigin: popupCss!.transformOrigin,
        animationName: popupCss!.animationName,
        animationDuration: popupCss!.animationDuration,
        transitionProperty: popupCss!.transitionProperty,
        transitionDuration: popupCss!.transitionDuration,
        offsetParent: parent ? { tag: parent.tagName, host: parent === host, box: rect(parent) } : null,
        container: popup.parentNode === shadow ? 'shadow' : host.contains(popup) ? 'host' : 'body',
        animations: popup.getAnimations({ subtree: false }).map(animation => ({
          kind: animation.constructor.name,
          playState: animation.playState,
          currentTime: typeof animation.currentTime === 'number' ? round(animation.currentTime) : null,
          timing: animation.effect?.getTiming(),
          keyframes: animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : []
        }))
      } : null,
      document: { compatMode: document.compatMode, doctype: document.doctype?.name ?? null }
    }
  };
}
