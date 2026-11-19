<script lang="ts">
  import { onMount, setContext, untrack, type Snippet } from 'svelte';
  import { Select, ConfigProvider, type SelectRef, type SelectInputContext, type SelectTagInfo } from 'antd-svelte';
  import TagBody from './SelectComponentsResponsiveTagBody.svelte';
  import PrefixBody from './SelectComponentsResponsiveTagPrefixBody.svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { selectCustomTagPrefixGeometry, type SelectCustomTagPrefixSample, type SelectCustomTagPrefixUpdate } from '../select-components-responsive-tag-prefix-cases.mjs';
  import { customTagPrefixContext, type CustomTagPrefixContext } from '../select-components-responsive-tag-prefix-context';
  import type { SelectCustomTagPrefixCapture } from '../select-components-responsive-tag-prefix-metrics.mjs';
  interface Option { value: string; label: string }
  const Choice = Select<string, 'multiple' | 'tags', Option>;
  let { sample, capture }: {
    sample: SelectCustomTagPrefixSample;
    capture?: SelectCustomTagPrefixCapture
  } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture);
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: unknown[] = [], bodyActivity: unknown[] = [], componentObservations: unknown[] = [];
  let settings = $state.raw({ ...initial.settings }), model = $state.raw<string[] | undefined>(initial.value), open = $state(true), query = $state('');
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<HTMLInputElement>();
  let authoredInput: HTMLInputElement | null = null, alive = false;
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const handler = <Value,>(name: string, fn: Value): Value => recorder.register(
    fn,
    { callback: 'custom-tags-' + name }
  );
  const project = (input: Event) => ({ type: input.type, key: (input as KeyboardEvent).key,
    defaultPrevented: input.defaultPrevented, propagationStopped: input.cancelBubble,
    target: (input.target as Element | null)?.tagName, currentTarget: (input.currentTarget as Element | null)?.tagName });
  const onChange = handler('change', (value: string[] | undefined, option: unknown) => {
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
  const options = recorder.register(
    initial.options,
    { dataset: 'custom-tags-unique-string-options' }
  );
  const componentRef = handler('component-ref', (node: HTMLInputElement | null) => {
    authoredInput = node;
    lifecycle.push({ slot: 'input', event: node ? 'attach' : 'detach', tag: node?.tagName ?? null });
  });
  let geometry = $derived({
    tagWidth: settings.tagWidth,
    closeWidth: settings.closeWidth,
    restWidth: settings.restWidth,
    prefixWidth: settings.prefixWidth
  });
  setContext<CustomTagPrefixContext>(customTagPrefixContext, { get current() {
    return geometry;
  }, sample: initial, recorder, bodyActivity, event, project, handler });
  function connectInput(context: SelectInputContext<HTMLInputElement>, node: HTMLInputElement) {
    componentRef(node);
    const release = context.register(node);
    return () => {
      componentRef(null);
      release();
    };
  }
  function inputCall(context: SelectInputContext<HTMLInputElement>, result: Snippet) {
    componentObservations.push({ slot: 'input', kind: 'function', context: recorder.encode(context), rawContext: recorder.raw(context),
      attributes: recorder.encode(context.attributes), rawAttributes: recorder.raw(context.attributes), own: recorder.own(context.attributes), register: recorder.raw(context.register) });
    recorder.register(result, { node: 'custom-tags-input-result' });
    return recorder.record('components.input', 'own', context, result);
  }
  function tagCall(info: SelectTagInfo<string>, result: Snippet) {
    recorder.register(
      result,
      { node: 'custom-tag-render-' + (info.isMaxTag ? 'rest' : info.value) }
    );
    // One actual public Snippet parameter. No private Snippet call arguments or
    // React invocation counts are inspected or manufactured.
    return recorder.record('tagRender', 'own', [info], result, { publicArgumentCount: 1,
      argumentOwnKeys: [Reflect.ownKeys(info)], argumentDescriptors: [recorder.own(info)] });
  }
  const inputRenderer = recorder.register(inputFunction, { component: 'input:function' });
  const tagRenderer = recorder.register(renderTag, { callback: 'custom-tags-tagRender' });
  const prefixRenderer = recorder.register(prefixBody, { node: 'custom-tags-prefix-element' });
  const components = recorder.register(
    { input: inputRenderer },
    { components: 'custom-tags-input' }
  );
  const semanticClasses = handler(
    'classNames',
    (info: unknown) => recorder.record(
      'classNames',
      'own',
      info,
      { root: 'select-icons-metadata-root', input: 'select-icons-metadata-input' }
    )
  );
  const semanticStyles = handler(
    'styles',
    (info: unknown) => recorder.record(
      'styles',
      'own',
      info,
      { suffix: { color: 'rgb(17,31,47)' }, itemRemove: { color: 'rgb(47,31,17)' } }
    )
  );
  const provider = recorder.register(
    {
      theme: { token: { motion: false }, cssVar: { key: 'select-icons' } },
      popupOverflow: 'viewport' as const
    },
    { provider: 'custom-tags-context' }
  );
  let ownerProps = $derived({ id: 'select-icons-field', class: 'surface-control select-icons-control', style: { width: '100%' }, options,
    value: model, mode: initial.mode, open, listHeight: 160, virtual: false, maxTagCount: 'responsive' as const,
    placeholder: 'Choose icon value', 'aria-label': 'Icon value', showSearch: {
      filterOption: false,
      onSearch
    },
    onChange, onSelect, onDeselect, onOpenChange, onInputKeyDown, onMouseDown: onRootMouseDown,
    onFocus: onPublicFocus, onBlur: onPublicBlur, components, tagRender: tagRenderer, prefix: settings.prefixPresent ? prefixRenderer : null,
    classNames: semanticClasses, styles: semanticStyles });
  let last: {
    context: unknown;
    rawContext: unknown;
    authoredProps: unknown;
    rawAuthoredProps: unknown
  } | undefined;
  export function read() {
    if (alive || !last) {
      last = { context: recorder.encode(geometry), rawContext: recorder.raw(geometry),
        authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps) };
    }
    return { model: recorder.encode(model), rawModel: recorder.raw(model), open, query, alive,
      settings: recorder.encode(settings), rawSettings: recorder.raw(settings), ...last,
      events, rawEvents, calls: recorder.calls, lifecycle, bodyActivity, componentObservations,
      authoredSample: recorder.encode(initial), rawAuthoredSample: recorder.raw(initial),
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
  }
  export function readRefs() {
    return {
      control,
      root: root ?? null,
      editor: editor ?? null,
      authoredRoot: null,
      authoredInput
    };
  }
  export function update(action: SelectCustomTagPrefixUpdate, _index = -1) {
    if (action.type === 'caller-width') {
      settings = {
        ...settings,
        containerWidth: action.containerWidth
      };
    }
    else if (action.type === 'caller-prefix-width') {
      settings = {
        ...settings,
        prefixWidth: action.prefixWidth
      };
    }
    else if (action.type === 'caller-tag-width') {
      settings = {
        ...settings,
        tagWidth: action.tagWidth
      };
    }
    else if (action.type === 'prefix') {
      settings = {
        ...settings,
        prefixPresent: action.present === true,
        ...(action.prefixWidth === undefined ? {} : { prefixWidth: action.prefixWidth })
      };
    }
    else {
      throw Error('Unknown ordinary caller update');
    }
  }
  if (ownerCapture) {
    ownerCapture.read = read;
    ownerCapture.readRefs = readRefs;
    ownerCapture.update = update;
  }
  onMount(() => {
    alive = true;
    return () => { alive = false; };
  });
  const position = selectCustomTagPrefixGeometry.root;
</script>
{#snippet inputFunction(context: SelectInputContext<HTMLInputElement>)}
  {#snippet inputBody()}{@const { value, ...attrs } = context.attributes}<input {...attrs} data-select-icons-component="input:function" value={value} {@attach node => connectInput(untrack(() => context), node)} />{/snippet}
  {@const content = inputCall(context, inputBody)}{@render content()}
{/snippet}
{#snippet renderTag(info: SelectTagInfo<string>)}
  {#snippet content()}<TagBody {info} />{/snippet}{@const rendered = tagCall(info, content)}{@render rendered()}
{/snippet}
{#snippet prefixBody()}<PrefixBody />{/snippet}
<section data-surface-case={initial.id} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider}><div data-custom-tag-frame="" style="position:absolute;left:{position.left}px;top:{position.top}px;width:{settings.containerWidth}px;font-family:initial;font-size:16px;line-height:normal">
    <form data-select-icons-form onsubmit={onSubmit}><Choice {...ownerProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} /></form>
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside custom tags</button>
</section>
