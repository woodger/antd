<script lang="ts" generics="Element extends HTMLElement = HTMLDivElement">
  import { untrack, type Snippet } from 'svelte';
  import { isSelectComponentHydration, selectComponentHydrationAttributes, takeSelectComponentHydration } from './select-components-hydration.dom';
  type Context = { attributes: object; register: (registration: Element) => () => void };
  type Intrinsic = { element: string; ref?: (node: Element | null) => void };
  type Renderer = Snippet<[never]>;
  // Own props уже объединены вызывающим полем; renderer использует только context.attributes.
  type Component = string | Renderer | (Intrinsic & { props?: object })
    | { render: Renderer; props?: object };
  let { component, context, root = false }: {
    component: Component;
    context: Context;
    root?: boolean;
  } = $props();

  let intrinsic: Intrinsic | undefined = $derived(typeof component === 'object' && 'element' in component ? component : undefined);
  let tag = $derived(typeof component === 'string' ? component : intrinsic?.element);
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
    // React сохраняет последний defaultValue на прежнем uncontrolled DOM input.
    const initialValue = defaultValue ?? defaultvalue ?? retainedInputDefaultValue;
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

{#if tag === 'input'}<input {...input} {...selectComponentHydrationAttributes(root)} {@attach attachElement} />
{:else if tag === 'textarea'}<textarea {...textarea.attributes} value={textarea.value} {@attach attachElement}></textarea>
{:else if tag}<svelte:element this={tag} {...attributes} {@attach attachElement} />
{:else if render}{@render render(context)}{/if}
