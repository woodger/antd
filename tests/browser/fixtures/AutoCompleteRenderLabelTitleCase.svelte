<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { AutoComplete, ConfigProvider, enUS, type AutoCompleteInput, type AutoCompleteProps,
    type SelectLabelRenderInfo, type SelectRef } from '@woodger/antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { LabelTitleSample, LabelTitleAction } from '../autocomplete-render-label-title-cases.mjs';
  let { sample, capture }: { sample: LabelTitleSample; capture?: { read?: () => ReturnType<typeof read>;
    readRefs?: () => ReturnType<typeof readRefs>; update?: (action: LabelTitleAction) => void } } = $props();
  const initial = untrack(() => sample), recorder = createSelectSurfaceRecorder();
  const Completion = AutoComplete<Record<string, unknown>>;
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const options = [{ value: 'a', label: 'Alpha no title' }];
  recorder.register(options[0], { data: 'label-title-raw-option' });
  let renderer = $state(initial.ssrState?.renderer ?? 'string');
  let open = $state(Boolean(initial.ssrState?.open));
  let control = $state<SelectRef>();
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let childNode = $state<HTMLInputElement>();
  let alive = true;
  let lastAuthored: {
    authoredProps: unknown;
    rawAuthoredProps: unknown;
    authoredProvider: unknown;
    rawAuthoredProvider: unknown
  } | undefined;
  onDestroy(() => { alive = false; });
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const callback = <Value,>(name: string, value: Value): Value => recorder.register(
    value,
    { callback: 'label-title-' + name }
  );
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onChange = callback(
    'change',
    (value: string | undefined, option: unknown) => event('change', value, option)
  );
  const onSelect = callback(
    'select',
    (value: string, option: unknown) => event('select', value, option)
  );
  const renderers = new Map<string, (info: SelectLabelRenderInfo<string>) => string | number | null | undefined>();
  for (const kind of ['string', 'zero', 'null', 'undefined']) {
    renderers.set(kind, callback('renderer-' + kind, info => {
      const result = kind === 'string' ? 'Display ' + info.value : kind === 'zero' ? 0 : kind === 'null' ? null : undefined;
      return recorder.record('labelRender', 'own', info, result, { renderer: kind,
        resultDescription: result === undefined ? { $: 'undefined' } : result });
    }));
  }
  recorder.register(child, { node: 'label-title-custom-input' });
  function registerChild(node: HTMLInputElement, register: AutoCompleteInput['register']) {
    const registration = register(node);
    childNode = node;
    return { destroy() {
      registration.destroy();
      childNode = undefined;
    } };
  }
  const provider = {
    theme: { token: { motion: false }, cssVar: { key: 'autocomplete-render-label-title' } },
    popupOverflow: 'viewport' as const
  };
  let ownerProps = $derived.by(() => {
    const props: Record<string, unknown> = { id: 'label-title-field', class: 'surface-control label-title-owner',
      style: { width: '100%' }, value: 'a', options, open, listHeight: 120, virtual: false,
      'aria-label': 'Label title value', showSearch: { filterOption: false }, labelRender: renderers.get(renderer), onOpenChange, onChange, onSelect };
    if (initial.custom) props.children = child;
    if (Object.hasOwn(initial, 'title')) props.title = initial.title;
    return props;
  });
  let completionProps = $derived(ownerProps as AutoCompleteProps<Record<string, unknown>> & {
    labelRender?: (info: SelectLabelRenderInfo<string>) => string | number | null | undefined; children?: Snippet<[AutoCompleteInput]> });
  export function update(action: LabelTitleAction) {
    if (action.type === 'renderer') renderer = action.kind;
  }
  export function readRefs() { return { control, root, editor, child: childNode }; }
  export function read() {
    if (alive) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
    }
    if (!lastAuthored) {
      throw Error('Read the actual live label/title owner before disposing it');
    }
    return { renderer, open, model: 'a', alive, events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls],
      optionTitleOwnKey: Object.hasOwn(options[0], 'title'), optionOwnKeys: Reflect.ownKeys(options[0]), ...lastAuthored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
    initialCapture.update = update;
  }
</script>
{#snippet child(context: AutoCompleteInput)}<input {...context.attributes} data-label-title-child aria-label="Label title value" use:registerChild={context.register} />{/snippet}
<section data-surface-case={initial.id} data-surface-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider} locale={enUS}><div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
    <Completion {...completionProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside title</button>
  <output hidden data-label-title-owner>{JSON.stringify(read())}</output>
  <div hidden data-surface-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<LabelTitleAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('labeltitleupdate', updating); node.addEventListener('labeltitleread', reading); node.addEventListener('surfacerefs', refs);
    return () => {
      node.removeEventListener('labeltitleupdate', updating);
      node.removeEventListener('labeltitleread', reading);
      node.removeEventListener('surfacerefs', refs);
    };
  }}></div>
</section>
<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
