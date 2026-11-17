<script lang="ts" generics="Element extends HTMLElement = HTMLDivElement">
  import { untrack, type Snippet } from 'svelte';
  type Context = { attributes: object; register: (registration: Element) => () => void };
  type Intrinsic = { element: string; ref?: (node: Element | null) => void };
  type Renderer = Snippet<[never]>;
  // Own props уже объединены вызывающим полем; renderer использует только context.attributes.
  type Component = string | Renderer | (Intrinsic & { props?: object })
    | { render: Renderer; props?: object };
  let { component, context }: {
    component: Component;
    context: Context;
  } = $props();

  let intrinsic: Intrinsic | undefined = $derived(typeof component === 'object' && 'element' in component ? component : undefined);
  let tag = $derived(typeof component === 'string' ? component : intrinsic?.element);
  let register = $derived(context.register);
  let reference = $derived(intrinsic?.ref);
  const initializedInputs = new WeakSet<HTMLInputElement>();
  let attributes = $derived(context.attributes);
  let input = $derived.by(() => {
    const { value, defaultValue, defaultvalue, ...attributes } = context.attributes as {
      value?: string | number | string[] | null;
      defaultValue?: string | number | string[] | null;
      defaultvalue?: string | number | string[] | null;
      [key: string]: unknown
    };
    const initialValue = defaultValue ?? defaultvalue;
    return { ...attributes, ...(value != null ? { value }
      : initialValue != null ? { defaultValue: initialValue } : {}) };
  });
  let textarea = $derived.by(() => {
    const { value, defaultValue, defaultvalue, ...attributes } = context.attributes as {
      value?: string | number | string[] | null;
      defaultValue?: string | number | string[] | null;
      defaultvalue?: string | number | string[] | null;
      [key: string]: unknown
    };
    return { attributes, value: value ?? defaultValue ?? defaultvalue };
  });
  // Один renderer принимает совместимый root/input context на framework boundary.
  let render = $derived((typeof component === 'function' ? component
    : typeof component === 'object' && 'render' in component ? component.render : undefined) as Snippet<[Context]> | undefined);

  function attachElement(node: HTMLElement) {
    const attachedRegister = register;
    const attachedReference = reference;
    const element = node as Element;
    const attrs = untrack(() => context.attributes) as { value?: unknown; defaultValue?: unknown; defaultvalue?: unknown };
    const initialValue = attrs.defaultValue ?? attrs.defaultvalue;
    if (node instanceof HTMLInputElement && !initializedInputs.has(node)) {
      initializedInputs.add(node);
      if (attrs.value == null && initialValue != null) {
        node.value = String(initialValue);
        if (node.selectionStart !== null) node.setSelectionRange(node.value.length, node.value.length);
      }
    }
    const unregister = untrack(() => attachedRegister(element));
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

{#if tag === 'input'}<input {...input} {@attach attachElement} />
{:else if tag === 'textarea'}<textarea {...textarea.attributes} value={textarea.value} {@attach attachElement}></textarea>
{:else if tag}<svelte:element this={tag} {...attributes} {@attach attachElement} />
{:else if render}{@render render(context)}{/if}
