// Connects editor Select to hydrated DOM. Initial synchronization takes into account dirty values
// and attributes of SSR, subsequent updates apply the differences between sets props. React DOM
// 18.3.1 hydration semantics; MIT, vendor/LICENSE.react-dom.
import { untrack } from 'svelte';

type Editor = HTMLInputElement | HTMLTextAreaElement;
type Attributes = Record<string, unknown>;
type Handler = (this: Editor, event: Event) => unknown;
interface Listener { type: string; capture: boolean; handler: Handler; listener: EventListener; }
const booleanAttributes = new Set(['autofocus', 'disabled', 'formnovalidate', 'hidden', 'inert',
  'itemscope', 'multiple', 'readonly', 'required']);
const controlled = new Set(['value', 'defaultvalue', 'checked', 'defaultchecked']);

// Normalizes the class for SSR-editor from the line, list or map of the included classes.
function classValue(value: unknown): unknown {
  if (typeof value !== 'object') {
    return value;
  }
  if (!value) {
    return '';
  }
  const output: string[] = [];
  // Adds non-empty classes, preserving the order of the nested array and listed keys.
  const append = (item: unknown) => {
    if (!item) {
      return;
    }
    if (typeof item === 'string' || typeof item === 'number') {
      output.push(String(item));
    }
    else if (Array.isArray(item)) {
      item.forEach(append);
    }
    else if (typeof item === 'object') {
      for (const key in item) {
        if (Reflect.get(item, key)) output.push(key);
      }
    }
  };
  append(value);
  return output.join(' ');
}

// Allocates DOM event and capture. The names gotpointercapture and lostpointercapture already
// contain capture in the event type.
function eventName(name: string) {
  if (!name.startsWith('on') || name.length < 3) {
    return;
  }
  let type = name.slice(2);
  const capture = type.endsWith('capture') && type !== 'gotpointercapture' && type !== 'lostpointercapture';
  if (capture) type = type.slice(0, -7);
  return { type, capture };
}

// Prioritizes value before defaultValue, saving an empty string and number 0.
function initialValue(attributes: Attributes) {
  return attributes.value ?? attributes.defaultValue ?? attributes.defaultvalue ?? '';
}

/** Hydration leaf only. Svelte still manages CSR attributes and events. */
export function createSelectComponentHydration(element: Editor, attributes: Attributes) {
  const listeners = new Map<string, Listener>();
  let previous = { ...attributes };

  // Synchronizes DOM-subscription by attribute name. When replacing a function, the listener reuses.
  function event(name: string, value: unknown) {
    const descriptor = eventName(name);
    if (!descriptor) {
      return;
    }
    const current = listeners.get(name);
    if (typeof value !== 'function') {
      if (current) element.removeEventListener(current.type, current.listener, current.capture);
      listeners.delete(name);
      return;
    }
    if (current) {
      current.handler = value as Handler;
      return;
    }
    const record: Listener = {
      ...descriptor,
      handler: value as Handler,
      // Quotes an up-to-date handler with a receive editor as and outside the reactive reading.
      listener(input) {
        untrack(() => record.handler.call(element, input));
      }
    };
    listeners.set(name, record);
    element.addEventListener(record.type, record.listener, { capture: record.capture,
      passive: record.type === 'touchstart' || record.type === 'touchmove' });
  }

  // Updates native attributes and delegates events. Importance, checked and style are serviced by
  // individual owners.
  function attribute(name: string, value: unknown) {
    const normalized = name.toLowerCase();
    if (normalized === 'style' || controlled.has(normalized)) {
      return;
    }
    if (eventName(name)) {
      event(name, value);
      return;
    }
    if (name === 'class') {
      const classes = classValue(value);
      const text = classes == null || classes === '' ? null : String(classes);
      if (element.getAttribute('class') !== text) {
        if (text === null) {
          element.removeAttribute('class');
        }
        else {
          element.setAttribute('class', text);
        }
      }
      return;
    }
    if (typeof value === 'function') {
      return;
    }
    const boolean = booleanAttributes.has(normalized) && !(normalized === 'hidden' && value === 'until-found');
    if (value == null || boolean && !value && value !== '') {
      element.removeAttribute(normalized);
    }
    else {
      element.setAttribute(normalized, boolean ? '' : normalized === 'translate' && typeof value === 'boolean'
        ? value ? 'yes' : 'no' : String(value));
    }
  }

  // CSS/usual SSR attrs are preserved; class retains the previous Svelte-normalization.
  for (const [name, value] of Object.entries(attributes)) {
    if (eventName(name)) {
      event(name, value);
    }
    else if (name === 'class') attribute(name, value);
  }
  if (element.localName === 'input') {
    const input = element as HTMLInputElement;
    const type = attributes.type;
    if (!(type === 'submit' || type === 'reset') || attributes.value != null) {
      if (Object.hasOwn(attributes, 'value') || Object.hasOwn(attributes, 'defaultValue') || Object.hasOwn(
        attributes,
        'defaultvalue'
      )) {
        input.defaultValue = String(initialValue(attributes));
      }
      // React postMountWrapper preserves the dirty value; checked synchronizes separately.
      const name = input.name;
      if (name) input.name = '';
      input.defaultChecked = !input.defaultChecked;
      input.defaultChecked = Boolean(attributes.checked ?? attributes.defaultChecked ?? attributes.defaultchecked);
      if (name) input.name = name;
    }
  }
  else {
    const textarea = element as HTMLTextAreaElement;
    const text = textarea.textContent;
    // React postMountWrapper textarea: non-empty matched SSR body becomes value.
    if (text !== '' && text !== null && text === String(initialValue(attributes))) textarea.value = text;
  }

  // Applies live and default properties under the Web IDL contract. When deleted, live preserves
  // the previous default.
  function controlledAttribute(name: string, value: unknown) {
    const normalized = name.toLowerCase();
    if (normalized === 'value') {
      if (value == null) {
        const initial = element.defaultValue;
        element.removeAttribute('value');
        element.defaultValue = initial;
        element.value = '';
      }
      else {
        Reflect.set(element, 'value', value);
      }
    }
    else if (normalized === 'defaultvalue') {
      // Web IDL setter retains including the former synthetic null -> "null".
      Reflect.set(element, 'defaultValue', value);
    }
    else if (element.localName === 'input') {
      const input = element as HTMLInputElement;
      if (normalized === 'checked') {
        if (value == null) {
          const initial = input.defaultChecked;
          input.removeAttribute('checked');
          input.defaultChecked = initial;
          input.checked = false;
        }
        else {
          Reflect.set(input, 'checked', value);
        }
      }
      else {
        Reflect.set(input, 'defaultChecked', value);
      }
    }
  }

  return {
    /** is called only after the initial pass; the first reactive replay skips the renderer. */
    update(next: Attributes, syncTextareaBody = next.value != null) {
      const changes = { ...next };
      for (const name of Object.keys(previous)) {
        if (!Object.hasOwn(next, name)) changes[name] = null;
      }
      // As DOM input spread, the type changes to value and the rest of the attrs.
      if (!Object.is(previous.type, changes.type)) attribute('type', changes.type);
      if (!Object.is(previous.class, changes.class)) attribute('class', changes.class);
      for (const [name, value] of Object.entries(changes)) {
        if (name === 'type' || name === 'class') continue;
        const controlledValue = controlled.has(name.toLowerCase());
        if (Object.is(previous[name], value) && !(controlledValue && value === undefined && element.hasAttribute(name))) continue;
        if (controlledValue) {
          controlledAttribute(name, value);
        }
        else {
          attribute(name, value);
        }
      }
      // Older hydrated textarea only updates the body from the raw recovered value.
      if (element.localName === 'textarea' && syncTextareaBody && next.value != null) {
        const text = String(next.value);
        if (element.defaultValue !== text) element.defaultValue = text;
      }
      previous = { ...changes };
    },
    // Disconnects all listeners belonging to this hydration aisle.
    destroy() {
      for (const record of listeners.values()) {
        element.removeEventListener(
          record.type,
          record.listener,
          record.capture
        );
      }
      listeners.clear();
    }
  };
}
