<script lang="ts" generics="Element extends HTMLElement = HTMLDivElement">
  import { createRawSnippet, untrack, type Snippet } from 'svelte';
  import { createSelectComponentHydration } from './select-component-hydration.dom';
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
  let constructorCSR = $state(false);
  let constructorRequested = $state(false);
  let renderedOnClient = false;
  $effect.pre(() => { if (constructorRequested) constructorCSR = true; });
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
  type Editor = HTMLInputElement | HTMLTextAreaElement;
  let hydration: { node: Editor; attributes: Record<string, unknown>;
    writer: ReturnType<typeof createSelectComponentHydration> } | undefined;
  let editorAttributes = $derived(tag === 'input' ? input
    : { ...textarea.attributes, value: textarea.value });
  function setupHydratedEditor(node: globalThis.Element) {
    if (renderedOnClient) {
      // Пустой CSR placeholder не получает attrs/ref; новый DOM создаёт прежняя ветка.
      constructorRequested = true;
      return;
    }
    if ((node.localName !== 'input' && node.localName !== 'textarea') || node.localName !== tag)
      throw new Error('Select hydration requires its matching input or textarea');
    const editor = node as Editor;
    const initial = untrack(() => editorAttributes);
    const writer = untrack(() => createSelectComponentHydration(editor, initial));
    const current = { node: editor, attributes: initial, writer };
    hydration = current;
    // Как attachment: register/CSS prepare/authored ref получают connected DOM.
    $effect(() => attachElement(editor));
    return () => {
      writer.destroy();
      if (hydration === current) hydration = undefined;
    };
  }
  $effect(() => {
    if (root || tag !== 'input' && tag !== 'textarea') return;
    const attributes = editorAttributes;
    const current = hydration;
    if (current && attributes !== current.attributes) {
      untrack(() => current.writer.update(attributes, (context.attributes as { value?: unknown }).value != null));
      current.attributes = attributes;
    }
  });
  const hydratedEditor = createRawSnippet(() => ({
    render() {
      renderedOnClient = true;
      return untrack(() => tag === 'input' ? '<input>' : '<textarea></textarea>');
    },
    setup: setupHydratedEditor
  }));
  let editorRenderer = $derived(typeof document === 'undefined'
    ? tag === 'input' ? ssrInput : ssrTextarea : hydratedEditor);
</script>

{#if !root && constructorCSR && (tag === 'input' || tag === 'textarea')}
  {#if tag === 'input'}<svelte:element this={tag} {...input} {@attach attachElement} />
  {:else}<svelte:element this={tag} {...textarea.attributes} {...textareaValueAttributes} {@attach attachElement}>{textareaText}</svelte:element>{/if}
{:else if !root && (tag === 'input' || tag === 'textarea')}
  {#key tag}{@render editorRenderer()}{/key}
{:else if tag === 'input'}<input {...input} {...selectComponentHydrationAttributes(root)} {@attach attachElement} />
{:else if tag === 'textarea'}<textarea {...textarea.attributes} value={textarea.value} {@attach attachElement}></textarea>
{:else if tag}<svelte:element this={tag} {...attributes} {@attach attachElement} />
{:else if render}{@render render(context)}{/if}

{#snippet ssrInput()}<input {...input} />{/snippet}
{#snippet ssrTextarea()}<textarea {...textarea.attributes} value={textareaText}></textarea>{/snippet}
