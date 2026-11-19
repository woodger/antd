<script lang="ts">
  import { onMount, setContext, untrack, type Snippet } from 'svelte';
  import { Select, ConfigProvider, type SelectRef, type SelectInputContext, type SelectTagInfo } from 'antd-svelte';
  import TagBody from './SelectComponentsTagCloseHandlesTagBody.svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { selectTagCloseHandleGeometry, type SelectTagCloseHandleSample, type SelectTagCloseHandleOption,
    type SelectTagCloseHandleAction, type SelectTagCloseHandleRetain, type SelectTagCloseHandleInvoke } from '../select-components-tag-close-handles-cases.mjs';
  import { tagCloseHandlesContext, type TagCloseHandlesContext } from '../select-components-tag-close-handles-context';
  import type { SelectTagCloseHandleCapture } from '../select-components-tag-close-handles-metrics.mjs';
  const Choice = Select<string, 'multiple' | 'tags', SelectTagCloseHandleOption>;
  type Info = SelectTagInfo<string>;
  type Handle = { value: string; info: Info; callback: (event?: Event) => void };
  let { sample, capture }: {
    sample: SelectTagCloseHandleSample;
    capture?: SelectTagCloseHandleCapture
  } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture);
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], invocations: unknown[] = [],
    retention: unknown[] = [], lifecycle: unknown[] = [], bodyActivity: unknown[] = [], componentObservations: unknown[] = [];
  const latest = new Map<string, Handle>(), retained = new Map<string, Handle>();
  const initialOptions = recorder.register(
    initial.initialOptions,
    { dataset: 'handles-options-initial' }
  );
  const replacementOptions = recorder.register(
    initial.replacementOptions,
    { dataset: 'handles-options-updated' }
  );
  for (const [phase, rows] of [['initial', initialOptions], ['updated', replacementOptions]] as const)
    for (const option of rows) recorder.register(option, { option: option.value, phase });
  let model = $state.raw<string[] | undefined>(initial.initialModel), options = $state.raw(initialOptions);
  let disabled = $state(false), open = $state(false), control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<HTMLInputElement>();
  let authoredInput: HTMLInputElement | null = null, alive = false, actionIndex = -1;
  const handler = <Value,>(name: string, fn: Value): Value => recorder.register(
    fn,
    { callback: 'handles-' + name }
  );
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const onChange = handler('change', function onChange(
    value: string[] | undefined,
    option: SelectTagCloseHandleOption[]
  ) {
    model = value;
    event('change', value, option);
  });
  const onDeselect = handler('deselect', function onDeselect(
    value: string,
    option: SelectTagCloseHandleOption
  ) {
    event('deselect', value, option);
  });
  const onSelect = handler('select', function onSelect(
    value: string,
    option: SelectTagCloseHandleOption
  ) {
    event('select', value, option);
  });
  const onSearch = handler('search', function onSearch(value: string) { event('search', value); });
  const onOpenChange = handler('open', function onOpenChange(value: boolean) {
    open = value;
    event('open', value);
  });
  const onFocus = handler(
    'focus',
    (e: FocusEvent) => event(
      'focus',
      { type: e.type, target: (e.target as Element).tagName, currentTarget: (e.currentTarget as Element).tagName }
    )
  );
  const onBlur = handler(
    'blur',
    (e: FocusEvent) => event(
      'blur',
      { type: e.type, target: (e.target as Element).tagName, currentTarget: (e.currentTarget as Element).tagName }
    )
  );
  const authoredInputRef = handler('input-ref', (node: HTMLInputElement | null) => {
    authoredInput = node;
    lifecycle.push({ event: node ? 'attach' : 'detach', tag: node?.tagName ?? null });
  });
  setContext<TagCloseHandlesContext>(tagCloseHandlesContext, { recorder, bodyActivity });
  function connectInput(context: SelectInputContext<HTMLInputElement>, node: HTMLInputElement) {
    authoredInputRef(node);
    const release = context.register(node);
    return () => {
      authoredInputRef(null);
      release();
    };
  }
  function inputCall(context: SelectInputContext<HTMLInputElement>, result: Snippet) {
    componentObservations.push({ context: recorder.encode(context), rawContext: recorder.raw(context),
      attributes: recorder.encode(context.attributes), rawAttributes: recorder.raw(context.attributes), own: recorder.own(context.attributes), register: recorder.raw(context.register) });
    recorder.register(result, { node: 'handles-input-result' });
    return recorder.record('components.input', 'own', context, result, { publicArgumentCount: 1 });
  }
  function tagCall(info: Info, result: Snippet) {
    if (!info.isMaxTag && typeof info.onClose === 'function') latest.set(
      info.value,
      { value: info.value, info, callback: info.onClose }
    );
    recorder.register(result, { node: 'handles-tag-result-' + info.value });
    return recorder.record('tagRender', 'own', [info], result, { publicArgumentCount: 1,
      argumentOwnKeys: [Reflect.ownKeys(info)], argumentDescriptors: [recorder.own(info)] });
  }
  function describeHandle(handle: Handle) {
    const current = latest.get(handle.value);
    return { value: handle.value, infoIdentity: recorder.identity(handle.info), callbackIdentity: recorder.identity(handle.callback),
      info: recorder.encode(handle.info), rawInfo: recorder.raw(handle.info), callback: recorder.encode(handle.callback), rawCallback: recorder.raw(handle.callback),
      callbackOwnKeys: Reflect.ownKeys(handle.callback).map(String), callbackDescriptors: recorder.own(handle.callback),
      sameInfoAsLastProduced: current?.info === handle.info, sameCallbackAsLastProduced: current?.callback === handle.callback,
      callbackIsInfoOnClose: handle.callback === handle.info.onClose };
  }
  function actualHandle(action: SelectTagCloseHandleRetain | SelectTagCloseHandleInvoke) {
    const handle = action.from === 'retained' ? retained.get(action.slot) : latest.get(action.value);
    if (!handle || typeof handle.callback !== 'function') throw Error('Actual supplied public onClose required: ' + action.id);
    return handle;
  }
  function retain(action: SelectTagCloseHandleRetain) {
    const handle = actualHandle(action);
    retained.set(action.slot, handle);
    retention.push({
      actionIndex,
      id: action.id,
      reason: action.reason,
      slot: action.slot,
      handle: describeHandle(handle)
    });
  }
  function invoke(action: SelectTagCloseHandleInvoke) {
    const handle = actualHandle(action), callback = handle.callback, forwardedArguments = [undefined];
    if (action.saveAs) {
      retained.set(action.saveAs, handle);
      retention.push({ actionIndex, id: action.id, reason: action.reason,
      slot: action.saveAs, handle: describeHandle(handle), savedExactInvokedFunction: callback === retained.get(action.saveAs)?.callback });
    }
    const observation = { actionIndex, id: action.id, reason: action.reason, from: action.from, slot: action.slot,
      handle: describeHandle(handle), actualArgumentCount: forwardedArguments.length,
      arguments: recorder.encode(forwardedArguments), rawArguments: recorder.raw(forwardedArguments),
      eventCountBefore: events.length, result: null as unknown, rawResult: null as unknown, thrown: null as {
        name: string;
        message: string
      } | null,
      eventCountAfter: undefined as number | undefined };
    invocations.push(observation);
    event('invoke-before', action.id, action.reason, handle.value);
    try {
      const result = Reflect.apply(callback, undefined, forwardedArguments);
      observation.result = recorder.encode(result);
      observation.rawResult = recorder.raw(result);
      event('invoke-after', action.id, action.reason, handle.value, result);
    }
    catch (error) {
      const e = error as Error;
      observation.thrown = { name: e.name, message: e.message };
      throw error;
    }
    finally { observation.eventCountAfter = events.length; }
  }
  function activate(action: SelectTagCloseHandleAction | SelectTagCloseHandleRetain) {
    if (action.type === 'retain') retain(action); else if (action.type === 'invoke') invoke(action);
    else if (action.type === 'model') model = [...action.value]; else if (action.type === 'options') options = replacementOptions;
    else if (action.type === 'disabled') disabled = action.value;
    else if (action.type === 'enable-reset') {
      disabled = false;
      model = [...action.value];
    }
    else throw Error('Unknown ordinary caller action');
  }
  const inputRenderer = recorder.register(inputFunction, { component: 'handles-input-function' });
  const tagRenderer = recorder.register(renderTag, { callback: 'handles-tagRender' });
  const components = recorder.register({ input: inputRenderer }, { components: 'handles-input' });
  const provider = recorder.register(
    { theme: { token: { motion: false }, cssVar: { key: 'handles-source' } } },
    { provider: 'handles-source' }
  );
  let ownerProps = $derived({ id: 'handles-field', style: { width: '100%' }, options, value: model, mode: initial.mode,
    open, disabled, virtual: false, showSearch: { filterOption: false, onSearch }, components, tagRender: tagRenderer,
    onChange, onDeselect, onSelect, onOpenChange, onFocus, onBlur, 'aria-label': 'Tag close handles' });
  let last: { authoredProps: unknown; rawAuthoredProps: unknown } | undefined;
  export function read() {
    if (alive || !last) last = {
      authoredProps: recorder.encode(ownerProps),
      rawAuthoredProps: recorder.raw(ownerProps)
    };
    return { model: recorder.encode(model), rawModel: recorder.raw(model), options: recorder.encode(options), rawOptions: recorder.raw(options),
      modelIdentity: model ? recorder.identity(model) : null, optionsIdentity: recorder.identity(options), optionIdentities: options.map(option => ({
        value: option.value,
        identity: recorder.identity(option)
      })),
      disabled, open, alive, actionIndex, events, rawEvents, calls: recorder.calls, invocations, retention, lifecycle, bodyActivity, componentObservations,
      lastProducedInvocableHandles: [...latest.values()].map(handle => ({
        ...describeHandle(handle),
        currentlySelected: Boolean(model?.includes(handle.value))
      })),
      retainedHandles: [...retained].map(([slot, handle]) => ({
        slot,
        ...describeHandle(handle),
        currentlySelected: Boolean(model?.includes(handle.value))
      })),
      authoredSample: recorder.encode(initial), rawAuthoredSample: recorder.raw(initial), ...last,
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
  }
  export function readRefs() {
    return { control, root: root ?? null, editor: editor ?? null, authoredInput };
  }
  export function setActionIndex(value: number) { actionIndex = value; }
  if (ownerCapture) {
    ownerCapture.read = read;
    ownerCapture.readRefs = readRefs;
    ownerCapture.setActionIndex = setActionIndex;
  }
  onMount(() => {
    alive = true;
    return () => { alive = false; };
  });
  const box = selectTagCloseHandleGeometry.root, actionPosition = selectTagCloseHandleGeometry.actions;
</script>
{#snippet inputFunction(context: SelectInputContext<HTMLInputElement>)}
  {#snippet inputBody()}{@const { value, ...attrs } = context.attributes}<input {...attrs} data-handles-editor="" value={value} {@attach node => connectInput(untrack(() => context), node)} />{/snippet}
  {@const content = inputCall(context, inputBody)}{@render content()}
{/snippet}
{#snippet renderTag(info: Info)}{#snippet content()}<TagBody {info} />{/snippet}{@const rendered = tagCall(info, content)}{@render rendered()}{/snippet}
{#snippet button(action: SelectTagCloseHandleAction | SelectTagCloseHandleRetain)}<button type="button" data-handles-action={action.id} onclick={() => activate(action)}>{action.id}</button>{/snippet}
<section data-handles-case={initial.id} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider}><div style="position:absolute;left:{box.left}px;top:{box.top}px;width:{box.width}px;font-family:initial;font-size:16px;line-height:normal"><Choice {...ownerProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} /></div></ConfigProvider>
  <div data-handles-actions="" style="position:fixed;left:{actionPosition.left}px;top:{actionPosition.top}px">{#if initial.retentionSetup}{@render button(initial.retentionSetup)}{/if}{#each initial.actions as action (action.id)}{@render button(action)}{/each}</div>
</section>
