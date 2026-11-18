<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, type SelectRef, type SelectInputComponent } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { HydrationOwnershipOwnerSample, HydrationOwnershipTag, HydrationOwnershipUpdate } from '../select-components-hydration-ownership-cases.mjs';
  import type { HydrationOwnershipCapture } from '../select-components-hydration-ownership-metrics.mjs';

  type Editor = HTMLInputElement | HTMLTextAreaElement;
  interface Option { value: string; label: string }
  const Multiple = Select<string, 'multiple', Option, false, HTMLDivElement, Editor>;
  const Completion = AutoComplete<Option, HTMLDivElement, Editor>;
  let { sample, capture }: { sample: HydrationOwnershipOwnerSample; capture: HydrationOwnershipCapture } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture), callerUID = $props.id();
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: unknown[] = [];
  let query = $state(initial.initialQuery), model = $state.raw<string | string[]>(initial.initialValue);
  let tag = $state<HydrationOwnershipTag>(initial.initialTag);
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<Editor>(), outside = $state<HTMLButtonElement>();
  let authoredInput: Editor | null = null, alive = true;
  const handler = <Value,>(name: string, fn: Value): Value => recorder.register(fn, { callback: 'ownership-' + name });
  const record = (...args: unknown[]) => { events.push(recorder.encode(args)); rawEvents.push(recorder.raw(args)); };
  const target = (node: EventTarget | null) => node instanceof Node ? { tag: node instanceof Element ? node.tagName : node.nodeName,
    ownerKey: node instanceof Element ? node.closest('[data-ownership-owner]')?.getAttribute('data-ownership-owner') ?? null : null,
    connected: node.isConnected, rootType: node.getRootNode().nodeType } : null;
  const event = (input: Event) => ({ type: input.type, key: (input as KeyboardEvent).key, code: (input as KeyboardEvent).code,
    defaultPrevented: input.defaultPrevented, propagationStopped: input.cancelBubble,
    target: target(input.target), currentTarget: target(input.currentTarget), relatedTarget: target((input as FocusEvent).relatedTarget), nativeType: null });
  const onChange = handler('change', (value: string | string[] | undefined, option: unknown) => {
    if (initial.control === 'autocomplete') query = value as string; else model = value as string[];
    record('change', value, option);
  });
  const onSearch = handler('search', (value: string, info?: unknown) => { query = value; record('search', value, info); });
  const onOpenChange = handler('open', (value: boolean) => record('open', value));
  const onFocus = handler('focus', (input: FocusEvent) => record('focus', event(input)));
  const onBlur = handler('blur', (input: FocusEvent) => record('blur', event(input)));
  const onInputKeyDown = handler('input-keydown', (input: KeyboardEvent) => record('input-keydown', event(input)));
  const inputRef = handler('authored-input-ref', (node: Editor | null) => {
    authoredInput = node;
    lifecycle.push({ ownerKey: initial.ownerKey, event: node ? 'attach' : 'detach', tag: node?.tagName ?? null,
      observation: ownerCapture.onAuthoredRef?.(node) ?? null });
  });
  const options = recorder.register([{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }], { dataset: 'ownership-options' });
  const ownInputProps = { ref: inputRef, 'data-ownership-editor': initial.ownerKey,
    class: 'ownership-editor', placeholder: 'Editor ' + initial.ownerKey, style: initial.editorStyle };
  const elements = new Map<HydrationOwnershipTag, SelectInputComponent<Editor>>();
  function component(currentTag: HydrationOwnershipTag) {
    if (!elements.has(currentTag)) {
      const { ref, ...props } = ownInputProps;
      elements.set(currentTag, recorder.register({ element: currentTag, props, ref }, { node: 'ownership-input-element' }));
    }
    return elements.get(currentTag)!;
  }
  const provider = { theme: { token: { motion: false }, cssVar: { key: 'ownership-source' } } };
  let showSearch = $derived(initial.control === 'select'
    ? { searchValue: query, onSearch, filterOption: false, autoClearSearchValue: false }
    : { onSearch, filterOption: false });
  let ownerProps = $derived({ id: initial.publicId, 'data-ownership-control': initial.ownerKey,
    class: 'ownership-control', style: { width: '100%' }, options,
    value: initial.control === 'select' ? model : query, open: false, virtual: false,
    showSearch, components: { input: component(tag) }, onChange, onOpenChange, onFocus, onBlur, onInputKeyDown,
    'aria-label': 'Owned editor ' + initial.ownerKey, ...(initial.control === 'select' ? { mode: 'multiple' as const } : {}) });
  type Authored = { authoredSample: unknown; rawAuthoredSample: unknown; authoredProps: unknown; rawAuthoredProps: unknown;
    authoredInputProps: unknown; rawAuthoredInputProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown };
  let lastAuthored: Authored | undefined;
  function read() {
    if (alive || !lastAuthored) lastAuthored = { authoredSample: recorder.encode(initial), rawAuthoredSample: recorder.raw(initial),
      authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
      authoredInputProps: recorder.encode(ownInputProps), rawAuthoredInputProps: recorder.raw(ownInputProps),
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
    return { ownerKey: initial.ownerKey, controlKey: initial.controlKey, publicId: initial.publicId,
      callerUID, query, model: recorder.encode(model), rawModel: recorder.raw(model), tag, open: false as const, alive,
      events, rawEvents, lifecycle, calls: recorder.calls, ...lastAuthored };
  }
  ownerCapture.read = read;
  ownerCapture.readRefs = () => ({ control, root: root ?? null, editor: editor ?? null, authoredInput, outside: outside ?? null });
  ownerCapture.update = (action: HydrationOwnershipUpdate) => {
    if (action.type === 'controlled-query') query = action.value;
    else if (action.type === 'intrinsic-tag-replacement') tag = initial.replacementTag;
    else throw Error('Unknown public owner update');
  };
  onMount(() => { ownerCapture.onCommit?.(); return () => { alive = false; }; });
  const frame = untrack(() => initial.frame);
  const frameStyle = `position:${frame.position};left:${frame.left}px;top:${frame.top}px;width:${frame.width}px;font-family:${frame.fontFamily};font-size:${frame.fontSize}px;line-height:${frame.lineHeight}`;
</script>

<section data-ownership-owner={initial.ownerKey} data-ownership-scenario={initial.scenarioId} style={frameStyle}>
  <ConfigProvider {...provider}>
    {#if initial.control === 'select'}<Multiple {...ownerProps} value={model as string[]} mode="multiple"
      bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />
    {:else}<Completion {...ownerProps} value={query} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />{/if}
  </ConfigProvider>
  <button bind:this={outside} type="button" data-ownership-outside={initial.ownerKey} style="display:block;margin-top:24px">Outside {initial.ownerKey}</button>
</section>
