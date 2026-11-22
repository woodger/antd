<script lang="ts">
  import { onDestroy, onMount, untrack, type Component } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, type SelectRef } from '@woodger/antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { createSelectOwnStyleInitFrames } from '../select-components-own-style-init-cases.mjs';
  import type { SelectComponentsOwnStyleSample, SelectComponentsOwnStyleAction } from '../select-components-own-style-init-cases.mjs';

  type Model = string | string[] | undefined;
  type CallerProps = Record<string, unknown> & {
    nativeElement?: HTMLElement;
    inputElement?: HTMLElement
  };
  let { sample, capture }: { sample: SelectComponentsOwnStyleSample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs>;
      update?: (action: SelectComponentsOwnStyleAction, index?: number) => void;
      onCommit?: () => void; onAuthoredRef?: (node: HTMLElement | null) => unknown } } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture);
  const profile = initial.profile ?? 'same', frames = createSelectOwnStyleInitFrames(profile);
  const Choice = Select as unknown as Component<CallerProps, SelectRef, 'nativeElement' | 'inputElement'>;
  const Completion = AutoComplete as unknown as Component<CallerProps, SelectRef, 'nativeElement' | 'inputElement'>;
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: unknown[] = [];
  let settings = $state.raw({
    ...initial.settings,
    phase: 'initial' as Parameters<typeof frames.get>[0],
    componentProps: frames.get('initial')
  });
  let model = $state.raw<Model>(initial.value), open = $state(Boolean(initial.settings.open)), query = $state('');
  let control = $state<SelectRef>(), root = $state<HTMLElement>(), editor = $state<HTMLElement>();
  let authoredInput: HTMLElement | undefined, alive = true;
  let lastAuthored: { authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown;
    rawAuthoredProvider: unknown; authoredInnerProvider: unknown; rawAuthoredInnerProvider: unknown } | undefined;
  onDestroy(() => { alive = false; });
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const handler = <Value,>(name: string, fn: Value): Value => recorder.register(
    fn,
    { callback: 'icons-' + name }
  );
  const project = (input: Event) => ({ type: input.type, key: (input as KeyboardEvent).key,
    defaultPrevented: input.defaultPrevented, propagationStopped: input.cancelBubble,
    target: (input.target as Element | null)?.tagName, currentTarget: (input.currentTarget as Element | null)?.tagName });
  const onChange = handler('change', (value: Model, option: unknown) => {
    model = value;
    event('change', value, option);
  });
  const onSelect = handler(
    'select',
    (value: string, option: unknown) => event('select', value, option)
  );
  const onDeselect = handler(
    'deselect',
    (value: string, option: unknown) => event('deselect', value, option)
  );
  const onClear = handler('clear', () => event('clear'));
  const onSearch = handler('search', (value: string) => {
    query = value;
    event('search', value);
  });
  const onOpenChange = handler('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onInputKeyDown = handler(
    'input-keydown',
    (input: KeyboardEvent) => event('input-keydown', project(input))
  );
  const onRootMouseDown = handler(
    'root-mousedown',
    (input: MouseEvent) => event('root-mousedown', project(input))
  );
  const onOriginInputKeyDown = handler(
    'origin-input-keydown',
    (input: KeyboardEvent) => event('origin-input-keydown', project(input))
  );
  const onOriginInputChange = handler(
    'origin-input-change',
    (input: Event) => event('origin-input-change', (input.target as HTMLInputElement).value)
  );
  const onPublicFocus = handler(
    'public-focus',
    (input: FocusEvent) => event('public-focus', project(input))
  );
  const onPublicBlur = handler(
    'public-blur',
    (input: FocusEvent) => event('public-blur', project(input))
  );
  const onSubmit = handler('form-submit', (input: SubmitEvent) => {
    input.preventDefault();
    event('form-submit', [...new FormData(input.currentTarget as HTMLFormElement)]);
  });
  const inputRef = handler('component-ref-input', (value: HTMLElement | null) => {
    authoredInput = value ?? undefined;
    const observation = ownerCapture?.onAuthoredRef?.(value) ?? null;
    lifecycle.push({
      slot: 'input',
      event: value ? 'attach' : 'detach',
      tag: value?.tagName ?? null,
      observation
    });
  });
  const options = recorder.register(
    [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
    { dataset: 'select-icons-values' }
  );
  const elements = new WeakMap<Record<string, unknown>, {
    element: string;
    props: Record<string, unknown>;
    ref: typeof inputRef
  }>();
  function component(authored: Record<string, unknown>) {
    // Actual frame identity preserves own undefined versus absent style. The
    // descriptor tag/ref stay stable; no CSSOM readback enters authored props.
    if (!elements.has(authored)) {
      const props = { 'data-select-icons-component': 'input:element', onkeydown: onOriginInputKeyDown,
        oninput: onOriginInputChange, ...Object.fromEntries(Object.entries(authored)
          .map(([name, value]) => [name === 'className' ? 'class' : name, value])) };
      elements.set(authored, recorder.register({
        element: initial.settings.componentTag!,
        props,
        ref: inputRef
      },
        { node: 'component-input:element' }));
    }
    return elements.get(authored)!;
  }
  const provider = { theme: { token: { motion: false }, cssVar: { key: 'select-icons' } },
    popupOverflow: 'viewport' as const, select: {} };
  let ownerProps = $derived.by(() => {
    const props: Record<string, unknown> = { id: 'select-icons-field', class: 'surface-control select-icons-control',
      style: { width: '100%' }, options, value: model, open, listHeight: 160, virtual: false,
      placeholder: 'Choose icon value', 'aria-label': 'Icon value', onChange, onSelect, onDeselect, onClear,
      onOpenChange, onInputKeyDown, showSearch: { ...settings.showSearch, onSearch } };
    if (Object.hasOwn(settings, 'mode')) props.mode = settings.mode;
    props.name = settings.name;
    if (settings.observeFocus) {
      props.onFocus = onPublicFocus;
      props.onBlur = onPublicBlur;
    }
    props.styles = settings.styles;
    props.components = { input: component(settings.componentProps) };
    props.onMouseDown = onRootMouseDown;
    return props;
  });
  let controlProps = $derived(ownerProps as CallerProps);
  export function update(action: SelectComponentsOwnStyleAction, _index = -1) {
    if (action.type === 'own-style-phase') {
      settings = {
        ...settings,
        phase: action.phase,
        componentProps: frames.get(action.phase)
      };
    }
  }
  export function readRefs() {
    return { control, root, editor, authoredRoot: undefined, authoredInput };
  }
  export function read() {
    if (alive || !lastAuthored) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider),
        authoredInnerProvider: recorder.encode(undefined), rawAuthoredInnerProvider: recorder.raw(undefined) };
    }
    return { model: recorder.encode(model), rawModel: recorder.raw(model), open, query,
      settings: recorder.encode(settings), rawSettings: recorder.raw(settings), profile, phase: settings.phase,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], lifecycle: [...lifecycle],
      componentObservations: [], bodyActivity: [],
      authoredInputProps: recorder.encode(settings.componentProps), inputOwnKeys: Reflect.ownKeys(settings.componentProps),
      inputOwnDescriptors: recorder.own(settings.componentProps), inputHasOwnStyle: Object.hasOwn(
        settings.componentProps,
        'style'
      ),
      rawAuthoredInputProps: recorder.raw(settings.componentProps),
      rawAuthoredInputStyle: recorder.raw(Object.getOwnPropertyDescriptor(
        settings.componentProps,
        'style'
      )?.value),
      alive, nodeSpecifications: [], ...lastAuthored };
  }
  if (ownerCapture) {
    ownerCapture.read = read;
    ownerCapture.readRefs = readRefs;
    ownerCapture.update = update;
  }
  onMount(() => { ownerCapture?.onCommit?.(); });
</script>

<section data-surface-case={initial.id} data-components-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider}><div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
    <form data-select-icons-form onsubmit={onSubmit}>
      {#if initial.control === 'autocomplete'}<Completion {...controlProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />
      {:else}<Choice {...controlProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />{/if}
    </form>
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside icons</button>
  <div hidden data-surface-command></div>
</section>
