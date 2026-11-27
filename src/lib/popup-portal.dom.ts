// Carries a popup between the origin and the target container. Responsible for transferring theme
// tokens, restoring focus and releasing scroll lock when closing.
import { getPopupActiveElement } from './popup.dom';

// Removes calculated CSS-variables. For the empty CSSOM distinguishes between empty value and
// guaranteed-invalid.
function readPopupThemeVariables(origin: HTMLElement) {
  const document = origin.ownerDocument;
  const view = document.defaultView!;
  const source = view.getComputedStyle(origin);
  const values = new Map<string, string>();
  for (const name of source) {
    if (name.startsWith('--')) values.set(name, source.getPropertyValue(name));
  }
  const empty = [...values.keys()].filter(name => values.get(name) === '');
  if (!empty.length) {
    return values;
  }

  // CSSOM returns '' both for an empty token list and for guaranteed-invalid.
  const typed = origin.computedStyleMap?.();
  if (typed) {
    for (const name of empty) values.set(name, typed.get(name) === undefined ? 'initial' : ' ');
    return values;
  }

  const probe = document.createElement('span');
  probe.hidden = true;
  probe.style.setProperty('display', 'none', 'important');
  empty.forEach((name, index) => {
    probe.style.setProperty(`--ant-svelte-popup-probe-${index}`,
      `var(${CSS.escape(name)}, ant-svelte-invalid)`, 'important');
  });
  origin.append(probe);
  try {
    const computed = view.getComputedStyle(probe);
    empty.forEach((name, index) => {
      const invalid = computed.getPropertyValue(`--ant-svelte-popup-probe-${index}`).trim()
        === 'ant-svelte-invalid';
      values.set(name, invalid ? 'initial' : ' ');
    });
  } finally {
    probe.remove();
  }
  return values;
}

/** Portal retains the calculated CSS variables of the original Svelte theme. */
export function connectPopupPortal(element: HTMLElement, options: {
  getPopupContainer: false | ((reference?: HTMLElement) => Element | DocumentFragment) | undefined;
  reference?: HTMLElement;
  autoLock: boolean;
  origin: HTMLElement;
  marker: Comment;
  /** Connects the disconnected CSS-context after transfer, until the first reading is CSSOM. */
  prepareOrigin?: () => void;
  preserveVariables?: readonly string[];
  preservePointerEvents?: boolean;
  restoreOnDestroy?: boolean;
}) {
  const origin = options.origin;
  const document = element.ownerDocument;
  const view = document.defaultView!;
  const getter = options.getPopupContainer;
  const inline = getter === false;
  const modal = origin.closest<HTMLDialogElement>('dialog:modal');
  const container = inline ? origin : typeof getter === 'function'
    ? (options.reference ? getter(options.reference) : getter()) ?? document.body
    : modal ?? document.body;
  const managed = new Set<string>();
  let active = true;
  let queued = false;

  // Carry the existing node. When the fallback insertion restores the focus inside it, if the focus
  // has gone to body.
  function move(parent: Element | DocumentFragment, before: ChildNode | null) {
    if (element.parentNode === parent && element.nextSibling === before) {
      return;
    }
    const focused = getPopupActiveElement(element);
    if (typeof parent.moveBefore === 'function' && parent.isConnected && element.isConnected) {
      parent.moveBefore(element, before);
    }
    else {
      parent.insertBefore(element, before);
      if (focused instanceof view.HTMLElement && element.contains(focused)
        && document.activeElement === document.body) {
        focused.focus({ preventScroll: true });
      }
    }
  }

  // Removes CSS variables of past synchronization, except already belonging to other owners.
  function clearManaged() {
    const preserved = new Set(options.preserveVariables);
    // After the past sync, the variable could go component-theme attachment.
    for (const name of managed) {
      if (!preserved.has(name)) element.style.removeProperty(name);
    }
    managed.clear();
    return preserved;
  }

  // Transfers the calculated values from origin after removing the previous layer. Inline popup
  // enjoys inheritance.
  function syncTheme() {
    if (!active || inline) {
      return;
    }
    const values = readPopupThemeVariables(origin);
    const preserved = clearManaged();
    // Copy the finished values: local var() is otherwise recalculated after recording the neighboring variable.
    for (const [name, value] of values) {
      if (preserved.has(name)) continue;
      element.style.setProperty(name, value);
      managed.add(name);
    }
  }

  // Combines notifications MutationObserver and resize into one microtask theme update.
  function scheduleTheme() {
    if (queued) {
      return;
    }
    queued = true;
    queueMicrotask(() => {
      queued = false;
      syncTheme();
    });
  }

  // Native dialog makes body inert; the standard portal remains in its top layer.
  if (!options.preservePointerEvents) {
    element.style.pointerEvents = !getter && modal ? 'auto' : '';
  }
  if (inline) {
    origin.insertBefore(element, options.marker.nextSibling);
  }
  else if (container !== element && !element.contains(container)) {
    if (options.restoreOnDestroy) {
      move(container, null);
    }
    else {
      container.append(element);
    }
    options.prepareOrigin?.();
  }
  syncTheme();
  const observer = new view.MutationObserver(scheduleTheme);
  if (!inline) {
    let ancestor: HTMLElement | null = origin;
    while (ancestor) {
      observer.observe(ancestor, { attributes: true });
      ancestor = ancestor.parentElement;
    }
    view.addEventListener('resize', scheduleTheme);
  }

  // A separate style belongs to the portal: inline and custom containers do not block the body.
  let lock: HTMLStyleElement | undefined;
  if (!inline && options.autoLock && (!getter || container === document.body)) {
    const body = document.body;
    const overflowing = body.scrollHeight
      > (view.innerHeight || document.documentElement.clientHeight)
      && view.innerWidth > body.offsetWidth;
    const scrollbar = Math.max(0, view.innerWidth - document.documentElement.clientWidth);
    lock = document.createElement('style');
    lock.dataset.antTourLock = '';
    lock.textContent = (
      `html body { overflow-y:hidden;`
      + `${overflowing ? `width:calc(100% - ${scrollbar}px);` : ''} }`
    );
    document.head.append(lock);
  }

  // Releases subscriptions, scroll lock and CSS. In the presence of a valid marker can return the
  // popup to the original place.
  const disconnect = () => {
    active = false;
    observer.disconnect();
    view.removeEventListener('resize', scheduleTheme);
    lock?.remove();
    clearManaged();
    if (!inline) {
      const parent = options.marker.parentNode;
      if (options.restoreOnDestroy && options.marker.isConnected && parent) {
        move(parent as Element | DocumentFragment, options.marker.nextSibling);
      }
      else {
        element.remove();
      }
    }
  };
  return Object.assign(disconnect, { syncTheme });
}
