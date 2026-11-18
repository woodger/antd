<script lang="ts" generics="Element extends HTMLElement = HTMLDivElement">
  import { untrack, type Snippet } from 'svelte';
  import { isSelectComponentHydration, selectComponentHydrationAttributes, takeSelectComponentHydration } from './select-components-hydration.dom';
  type Context = { attributes: object; register: (registration: Element) => () => void };
  type Intrinsic = { element: string; ref?: (node: Element | null) => void };
  type Renderer = Snippet<[never]>;
  // Own props уже объединены вызывающим полем; renderer использует только context.attributes.
  type Component = string | Renderer | (Intrinsic & { props?: object })
    | { render: Renderer; props?: object };
  let { component, context, root = false, hydrationId }: {
    component: Component;
    context: Context;
    root?: boolean;
    hydrationId?: string;
  } = $props();

  let intrinsic: Intrinsic | undefined = $derived(typeof component === 'object' && 'element' in component ? component : undefined);
  let tag = $derived(typeof component === 'string' ? component : intrinsic?.element);
  const editorHydrationAttribute = 'data-ant-native-select-component-editor-ssr';
  const hydratedEditor = untrack(() => {
    if (root || !hydrationId || typeof document === 'undefined' || !['input', 'textarea'].includes(tag ?? '')) return;
    const matches = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[${editorHydrationAttribute}]`)]
      .filter(node => node.getAttribute(editorHydrationAttribute) === hydrationId);
    if (matches.length > 1) throw new Error('Select editor SSR hydration id must be unique');
    const node = matches[0];
    if (!node || node.localName !== tag) return;
    const defaultValue = node.defaultValue;
    // До compiler reset помечаем value dirty без смены значения, фокуса и selection.
    if (node instanceof HTMLTextAreaElement) {
      const value = node.value;
      node.value = value;
    }
    return { node, defaultValue };
  });
  let retainHydratedEditor = $state(Boolean(hydratedEditor));
  let restoredHydratedDefault = false;
  $effect.pre(() => {
    // Новый tag создаёт новый DOM editor обычным client-конструктором.
    if (retainHydratedEditor && tag !== hydratedEditor?.node.localName) retainHydratedEditor = false;
  });
  let staticEditor = $derived(!root && (typeof document === 'undefined' ? Boolean(hydrationId) : retainHydratedEditor));
  let editorHydrationAttributes = $derived(!root && hydrationId && typeof document === 'undefined'
    && ['input', 'textarea'].includes(tag ?? '') ? { [editorHydrationAttribute]: hydrationId } : {});
  let register = $derived(context.register);
  let reference = $derived(intrinsic?.ref);
  const initializedInputs = new WeakSet<HTMLInputElement>();
  let attributes = $derived(context.attributes);
  type InputValue = string | number | string[] | null | undefined;
  let retainedInputDefaultValue = $state<InputValue>(untrack(() => {
    const attrs = context.attributes as { defaultValue?: InputValue; defaultvalue?: InputValue };
    return attrs.defaultValue ?? attrs.defaultvalue;
  }));
  $effect.pre(() => {
    const attrs = context.attributes as { defaultValue?: InputValue; defaultvalue?: InputValue };
    const value = attrs.defaultValue ?? attrs.defaultvalue;
    if (tag !== 'input') retainedInputDefaultValue = undefined;
    else if (value != null) retainedInputDefaultValue = value;
  });
  let input = $derived.by(() => {
    const { value, defaultValue, defaultvalue, ...attributes } = context.attributes as {
      value?: string | number | string[] | null;
      defaultValue?: string | number | string[] | null;
      defaultvalue?: string | number | string[] | null;
      [key: string]: unknown
    };
    // Стили editor применяет контроллер до публичного ref.
    if (!root && typeof document !== 'undefined') delete attributes.style;
    // React сохраняет последний defaultValue на прежнем uncontrolled DOM input.
    const initialValue = defaultValue ?? defaultvalue ?? retainedInputDefaultValue;
    const result = { ...attributes, ...(value != null ? { value,
      ...(!root && typeof document !== 'undefined' ? { defaultValue: value } : {}) }
      : initialValue != null ? { defaultValue: initialValue } : {}) };
    if (root || typeof document !== 'undefined') return result;
    // Dynamic input не получает compiler input-flag для SSR defaults.
    const entries = Object.entries(result);
    return Object.fromEntries(entries.flatMap(([name, value]) => {
      const lower = name.toLowerCase();
      const alias = lower === 'defaultvalue' ? 'value' : lower === 'defaultchecked' ? 'checked' : undefined;
      return alias && entries.some(([key]) => key.toLowerCase() === alias) ? [] : [[alias ?? name, value]];
    })) as typeof result;
  });
  let textarea = $derived.by(() => {
    const { value, defaultValue, defaultvalue, ...attributes } = context.attributes as {
      value?: string | number | string[] | null;
      defaultValue?: string | number | string[] | null;
      defaultvalue?: string | number | string[] | null;
      [key: string]: unknown
    };
    if (!root && typeof document !== 'undefined') delete attributes.style;
    return { attributes, value: value ?? defaultValue ?? defaultvalue };
  });
  let textareaValueAttributes = $derived(typeof document === 'undefined' ? {} : { value: textarea.value });
  let textareaText = $derived.by(() => {
    const text = String(textarea.value ?? '');
    return typeof document === 'undefined' && text.startsWith('\n') ? '\n' + text : text;
  });
  // Один renderer принимает совместимый root/input context на framework boundary.
  let render = $derived((typeof component === 'function' ? component
    : typeof component === 'object' && 'render' in component ? component.render : undefined) as Snippet<[Context]> | undefined);

  function attachElement(node: HTMLElement) {
    const attachedRegister = register;
    const attachedReference = reference;
    const element = node as Element;
    if (node === hydratedEditor?.node && !restoredHydratedDefault) {
      restoredHydratedDefault = true;
      node.removeAttribute(editorHydrationAttribute);
      if (node instanceof HTMLTextAreaElement && node.defaultValue !== hydratedEditor.defaultValue)
        node.defaultValue = hydratedEditor.defaultValue;
    }
    const attrs = untrack(() => context.attributes) as { value?: unknown; defaultValue?: unknown; defaultvalue?: unknown };
    const initialValue = attrs.defaultValue ?? attrs.defaultvalue;
    if (node instanceof HTMLInputElement && !initializedInputs.has(node)) {
      initializedInputs.add(node);
      if (!isSelectComponentHydration(node) && attrs.value == null && initialValue != null) {
        node.value = String(initialValue);
        if (node.selectionStart !== null) node.setSelectionRange(node.value.length, node.value.length);
      }
    }
    const unregister = untrack(() => attachedRegister(element));
    if (root) takeSelectComponentHydration(node);
    try { untrack(() => attachedReference?.(element)); }
    catch (error) { unregister(); throw error; }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      try { attachedReference?.(null); }
      finally { unregister(); }
    };
  }
</script>

{#if tag === 'input'}
  {#if root}<input {...input} {...selectComponentHydrationAttributes(root)} {@attach attachElement} />
  {:else if staticEditor}<input {...input} {...editorHydrationAttributes} {@attach attachElement} />
  {:else}<svelte:element this={tag} {...input} {@attach attachElement} />{/if}
{:else if tag === 'textarea'}
  {#if root}<textarea {...textarea.attributes} value={textarea.value} {@attach attachElement}></textarea>
  {:else if staticEditor}<textarea {...textarea.attributes} value={typeof document === 'undefined' ? textareaText : textarea.value} {...editorHydrationAttributes} {@attach attachElement}></textarea>
  {:else}<svelte:element this={tag} {...textarea.attributes} {...textareaValueAttributes} {@attach attachElement}>{textareaText}</svelte:element>{/if}
{:else if tag}<svelte:element this={tag} {...attributes} {@attach attachElement} />
{:else if render}{@render render(context)}{/if}
