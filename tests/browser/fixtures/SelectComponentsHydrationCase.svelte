<script module lang="ts">
  import type { SelectRef } from '@woodger/antd-svelte';
  export type HydrationSlot = 'root-string' | 'root-element' | 'input-string' | 'input-element' | 'input-composite';
  export interface HydrationSample { id: string; control: 'select' | 'autocomplete'; initialSlot: HydrationSlot; }
  export interface HydrationAction { type: string; value?: string | boolean; }
  export interface HydrationLifecycle { event: string; tag?: string | null; editor?: string; }
  export interface HydrationRefCheck { kind: string; tag: string; markerPresent: boolean;
    contextKeys?: string[]; contextHasMarker?: boolean; }
  export interface HydrationBlurCheck {
    type: string;
    stack?: string;
    target: { tag: string; connected: boolean } | null;
    currentTarget: { tag: string; connected: boolean } | null;
    relatedTarget: { tag: string; connected: boolean } | null;
    activeElement: { tag: string; connected: boolean } | null;
    owner: { slot: HydrationSlot; alive: boolean; open: boolean };
    currentTargetIsPublicRoot: boolean; targetIsPublicEditor: boolean;
    boundRoot: { tag: string; connected: boolean } | null;
    boundEditor: { tag: string; connected: boolean } | null;
  }
  export interface HydrationCapture {
    read?(): { model: unknown; open: boolean; slot: HydrationSlot; alive: boolean; revision: number;
      events: unknown[]; methods: unknown[]; lifecycle: HydrationLifecycle[] };
    readRefs?(): { control: SelectRef | undefined; root: HTMLElement | null; editor: HTMLElement | null };
    update?(action: HydrationAction): void;
    readNativeRefChecks?(): HydrationRefCheck[];
    readNativeBlurChecks?(): HydrationBlurCheck[];
    onCommit?(): void;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    Select, AutoComplete, ConfigProvider, type SelectComponents, type SelectInputContext
  } from '@woodger/antd-svelte';
  let { sample, capture }: { sample: HydrationSample; capture: HydrationCapture } = $props();
  const ownerCapture = untrack(() => capture);
  interface Option { value: string; label: string; }
  const HydrationSelect = Select<string, undefined, Option, false, HTMLInputElement, HTMLTextAreaElement>;
  const HydrationCompletion = AutoComplete<Option, HTMLInputElement, HTMLTextAreaElement>;
  const options: readonly Option[] = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  let model = $state<string | undefined>('a'), open = $state(false), alive = $state(true), revision = $state(0);
  let slot = $state<HydrationSlot>(untrack(() => sample.initialSlot));
  let control = $state<SelectRef>();
  let nativeElement = $state<HTMLInputElement | HTMLDivElement>();
  let inputElement = $state<HTMLInputElement | HTMLTextAreaElement>();
  let compositeWrapper = $state<HTMLSpanElement>();
  const events: unknown[] = [], methods: unknown[] = [], lifecycle: HydrationLifecycle[] = [];
  const nativeRefChecks: HydrationRefCheck[] = [];
  const nativeBlurChecks: HydrationBlurCheck[] = [];
  const ssrMarker = 'data-ant-native-select-component-ssr';
  const value = (input: unknown) => input === undefined ? { $: 'undefined' } : input;
  const project = (event: FocusEvent | KeyboardEvent) => ({ type: event.type,
    key: value('key' in event ? event.key : undefined), defaultPrevented: event.defaultPrevented,
    propagationStopped: event.cancelBubble, target: (event.target as Element | null)?.tagName,
    currentTarget: (event.currentTarget as Element | null)?.tagName });
  function onChange(next: string | undefined, option: Partial<Option> | undefined) {
    events.push(['change', value(next), option === undefined ? { $: 'undefined' }
      : Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(option)).map(([key, descriptor]) =>
        [key, 'value' in descriptor ? value(descriptor.value) : { $: 'accessor' }]))]);
    model = next;
  }
  function onSearch(next: string) { events.push(['search', next]); }
  function onOpenChange(next: boolean) { events.push(['open', next]); open = next; }
  const onFocus = (event: FocusEvent) => events.push(['focus', project(event)]);
  function onBlur(event: FocusEvent) {
    const node = (target: EventTarget | null | undefined) => target instanceof Element
      ? { tag: target.tagName, connected: target.isConnected } : null;
    nativeBlurChecks.push({ type: event.type, stack: new Error('Native hydration blur observation').stack,
      target: node(event.target), currentTarget: node(event.currentTarget),
      relatedTarget: node(event.relatedTarget), activeElement: node(document.activeElement),
      owner: { slot, alive, open }, currentTargetIsPublicRoot: event.currentTarget === nativeElement,
      targetIsPublicEditor: event.target === inputElement, boundRoot: node(nativeElement), boundEditor: node(inputElement) });
    events.push(['blur', project(event)]);
  }
  const onInputKeyDown = (event: KeyboardEvent) => events.push(['input-keydown', project(event)]);
  function inspectRef(kind: string, node: HTMLElement, context?: SelectInputContext<HTMLTextAreaElement>) {
    const check = { kind, tag: node.tagName, markerPresent: Boolean(node.closest(`[${ssrMarker}]`)),
      ...(context ? { contextKeys: Object.keys(context), contextHasMarker: Object.hasOwn(context.attributes, ssrMarker) } : {}) };
    nativeRefChecks.push(check);
    if (check.markerPresent || check.contextHasMarker) throw Error('Private SSR marker leaked through a public ref/context');
    if (check.contextKeys && check.contextKeys.join(',') !== 'attributes,register') throw Error('Changed public input context keys');
  }
  const rootRef = (node: HTMLInputElement | null) => {
    if (node) inspectRef('root-authored-ref', node);
    lifecycle.push({ event: node ? 'root-attach' : 'root-detach', tag: node?.tagName ?? null });
  };
  const inputRef = (node: HTMLTextAreaElement | null) => {
    if (node) inspectRef('input-authored-ref', node);
    lifecycle.push({ event: node ? 'input-attach' : 'input-detach', tag: node?.tagName ?? null });
  };
  function connectComposite(context: SelectInputContext<HTMLTextAreaElement>, editor: HTMLTextAreaElement) {
    const handle = { nativeElement: compositeWrapper!, inputElement: editor,
      focus(...args: [options?: FocusOptions]) { methods.push(['focus', args.map(value)]); editor.focus(...args); },
      blur(...args: []) { methods.push(['blur', args.map(value)]); editor.blur(...args); } };
    const release = context.register(handle);
    inspectRef('composite-register-return', editor, context);
    lifecycle.push({ event: 'composite-attach', tag: compositeWrapper?.tagName, editor: editor.tagName });
    return () => { lifecycle.push({ event: 'composite-detach' }); release(); };
  }
  let components: SelectComponents<HTMLInputElement, HTMLTextAreaElement> = $derived(
    slot === 'root-string' ? { root: 'input' }
      : slot === 'root-element' ? { root: { element: 'input', props: {
        defaultValue: 'Root draft', 'data-hydration-root': '' }, ref: rootRef } }
        : slot === 'input-element' ? { input: { element: 'textarea', props: {
          'data-hydration-editor': '' }, ref: inputRef } }
          : slot === 'input-composite' ? { input: compositeInput } : { input: 'textarea' });
  let controlProps = $derived({ id: 'components-hydration-field', 'aria-label': 'Hydration value',
    class: 'components-hydration-control', style: 'width:100%', name: 'hydration-field',
    options, value: model, open, virtual: false, listHeight: 120,
    showSearch: { filterOption: false, onSearch }, components, onChange, onOpenChange, onFocus, onBlur, onInputKeyDown });
  ownerCapture.readRefs = () => ({ control, root: nativeElement ?? null, editor: inputElement ?? null });
  ownerCapture.update = action => {
    if (action.type === 'model') model = action.value as string;
    if (action.type === 'slot') slot = action.value as HydrationSlot;
    if (action.type === 'rerender') revision++;
    if (action.type === 'alive') alive = Boolean(action.value);
  };
  ownerCapture.read = () => ({ model: value(model), open, slot, alive, revision,
    events: events.slice(), methods: methods.slice(), lifecycle: lifecycle.slice() });
  ownerCapture.readNativeRefChecks = () => nativeRefChecks.slice();
  ownerCapture.readNativeBlurChecks = () => nativeBlurChecks.slice();
  onMount(() => { ownerCapture.onCommit?.(); });
</script>

{#snippet compositeInput(context: SelectInputContext<HTMLTextAreaElement>)}
  {@const { value, ...rest } = context.attributes}
  <span bind:this={compositeWrapper} data-hydration-composite><textarea {...rest} value={value}
    data-hydration-editor="" {@attach editor => connectComposite(untrack(() => context), editor)}></textarea></span>
{/snippet}

<section data-components-hydration-case={sample.id} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider theme={{ token: { motion: false }, cssVar: { key: 'components-hydration' } }}>
    <div data-hydration-control style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
      {#if alive}
        {#if sample.control === 'autocomplete'}
          <HydrationCompletion {...controlProps} bind:nativeElement bind:inputElement bind:this={control} />
        {:else}<HydrationSelect {...controlProps} bind:nativeElement bind:inputElement bind:this={control} />{/if}
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-hydration-outside style="position:fixed;left:16px;top:80px">Outside hydration</button>
</section>
