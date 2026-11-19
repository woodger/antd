// Подключает редактор Select к гидратированному DOM. Начальная синхронизация учитывает dirty value
// и атрибуты SSR, последующие обновления применяют различия между наборами props.
// React DOM 18.3.1 hydration semantics; MIT, vendor/LICENSE.react-dom.
import { untrack } from 'svelte';

type Editor = HTMLInputElement | HTMLTextAreaElement;
type Attributes = Record<string, unknown>;
type Handler = (this: Editor, event: Event) => unknown;
interface Listener { type: string; capture: boolean; handler: Handler; listener: EventListener; }
const booleanAttributes = new Set(['autofocus', 'disabled', 'formnovalidate', 'hidden', 'inert',
  'itemscope', 'multiple', 'readonly', 'required']);
const controlled = new Set(['value', 'defaultvalue', 'checked', 'defaultchecked']);

// Нормализует class для SSR-редактора из строки, списка или карты включённых классов.
function classValue(value: unknown): unknown {
  if (typeof value !== 'object') {
    return value;
  }
  if (!value) {
    return '';
  }
  const output: string[] = [];
  // Добавляет непустые классы, сохраняя порядок вложенного массива и перечисляемых ключей.
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

// Выделяет DOM event и capture. Имена gotpointercapture и lostpointercapture уже содержат capture
// в типе события.
function eventName(name: string) {
  if (!name.startsWith('on') || name.length < 3) {
    return;
  }
  let type = name.slice(2);
  const capture = type.endsWith('capture') && type !== 'gotpointercapture' && type !== 'lostpointercapture';
  if (capture) type = type.slice(0, -7);
  return { type, capture };
}

// Даёт приоритет value перед defaultValue, сохраняя пустую строку и число 0.
function initialValue(attributes: Attributes) {
  return attributes.value ?? attributes.defaultValue ?? attributes.defaultvalue ?? '';
}

/** Только hydration leaf: CSR attributes/events по-прежнему ведёт Svelte. */
export function createSelectComponentHydration(element: Editor, attributes: Attributes) {
  const listeners = new Map<string, Listener>();
  let previous = { ...attributes };

  // Синхронизирует DOM-подписку по имени атрибута. При замене функции переиспользует listener.
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
      // Вызывает актуальный обработчик с редактором как receiver и вне реактивного чтения.
      listener(input) {
        untrack(() => record.handler.call(element, input));
      }
    };
    listeners.set(name, record);
    element.addEventListener(record.type, record.listener, { capture: record.capture,
      passive: record.type === 'touchstart' || record.type === 'touchmove' });
  }

  // Обновляет нативные атрибуты и делегирует события. Значение, checked и стиль обслуживаются
  // отдельными владельцами.
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

  // CSS/обычные SSR attrs сохраняются; class сохраняет прежнюю Svelte-нормализацию.
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
      // React postMountWrapper сохраняет dirty value; checked синхронизирует отдельно.
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
    // React postMountWrapper textarea: непустое совпавшее SSR body становится value.
    if (text !== '' && text !== null && text === String(initialValue(attributes))) textarea.value = text;
  }

  // Применяет live и default свойства по контракту Web IDL. При удалении live сохраняет прежнее
  // default.
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
      // Web IDL setter сохраняет в том числе прежний synthetic null -> "null".
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
    /** Вызывается только после initial pass; первый reactive replay пропускает renderer. */
    update(next: Attributes, syncTextareaBody = next.value != null) {
      const changes = { ...next };
      for (const name of Object.keys(previous)) {
        if (!Object.hasOwn(next, name)) changes[name] = null;
      }
      // Как DOM input spread, type меняется до value и остальных attrs.
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
      // Старый hydrated textarea обновляет body только от raw controlled value.
      if (element.localName === 'textarea' && syncTextareaBody && next.value != null) {
        const text = String(next.value);
        if (element.defaultValue !== text) element.defaultValue = text;
      }
      previous = { ...changes };
    },
    // Отсоединяет все listeners, принадлежащие этому проходу гидратации.
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
