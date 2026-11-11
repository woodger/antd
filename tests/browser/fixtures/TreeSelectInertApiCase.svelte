<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, TreeSelect, type TreeSelectInputContext, type TreeSelectProps,
    type TreeSelectRef, type TreeSelectRootContext, type TreeSelectStyles, type TreeSelectValue
  } from 'antd-svelte';
  import { treeSelectInertApiPropSpec, type TreeSelectInertApiMode, type TreeSelectInertApiSample } from './tree-select-inert-api-cases';
  let { sample, initialMode = 'provided' }: { sample: TreeSelectInertApiSample; initialMode?: TreeSelectInertApiMode } = $props();
  const names = ['onPopupVisibleChange', 'popupStyle', 'choiceTransitionName', 'direction'] as const;
  type InertProps = Pick<TreeSelectProps, typeof names[number]>;
  let mode = $state(untrack(() => initialMode));
  let model = $state<TreeSelectValue>(untrack(() => sample.multiple ? ['a'] : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let control = $state<TreeSelectRef>();
  let defaultRoot = $state<HTMLDivElement>();
  let customRoot = $state<HTMLButtonElement>();
  let editor = $state<HTMLInputElement>();
  let root = $derived(customRoot ?? defaultRoot);
  const ownStyle = 'width:220px;color:rgb(90,30,20);--inert-api-own-root:own';
  // A receipt from the actual semantic callback; no state writes inside derived rendering.
  const capture: { semantic: unknown } = { semantic: null };
  function record(...entry: unknown[]) { events = [...events, entry]; }
  const providedCallback = (open: boolean) => record('inert-open', open);
  const liveCallback = (open: boolean) => record('inert-live-open', open);
  let resolved = $derived.by(() => {
    const spec = treeSelectInertApiPropSpec(sample, mode);
    const style = spec.style === 'empty' ? '' : spec.style
      ? `outline:${spec.style.outlineWidth}px solid rgb(1,2,3);width:${spec.style.width}px;--inert-api-ignored-popup:${spec.style.marker}` : undefined;
    const callback = spec.callback ? mode === 'live' ? liveCallback : providedCallback : undefined;
    const props: InertProps = spec.keys ? { onPopupVisibleChange: callback, popupStyle: style,
      choiceTransitionName: spec.choice, direction: spec.direction } : {};
    return { spec, style, callback, props };
  });
  function styles(info: { props: InertProps }): TreeSelectStyles {
    capture.semantic = {
      keys: names.filter(name => Object.hasOwn(info.props, name)), direction: info.props.direction ?? null,
      choice: info.props.choiceTransitionName ?? null,
      callback: { isFunction: typeof info.props.onPopupVisibleChange === 'function',
        sameReference: info.props.onPopupVisibleChange === resolved.callback },
      popupStyle: { marker: /--inert-api-ignored-popup:([^;]+)/.exec(info.props.popupStyle ?? '')?.[1] ?? null,
        sameReference: info.props.popupStyle === resolved.style }
    };
    return { root: '--inert-api-semantic-root:semantic',
      popup: { root: 'outline:7px solid rgb(11,22,33);--inert-api-semantic-popup:semantic' } };
  }
  function semanticReceipt() {
    // Refresh the receipt after a consumer update, keeping the callback itself pure.
    void mode; void model; void query; void events.length;
    return JSON.stringify(capture.semantic);
  }
  function received(attributes: TreeSelectRootContext<HTMLButtonElement>['attributes'] | TreeSelectInputContext['attributes'], slot: 'root' | 'input') {
    return JSON.stringify({ slot, keys: names.filter(name => Object.hasOwn(attributes, name)),
      dirKey: Object.hasOwn(attributes, 'dir'), dir: attributes.dir ?? null,
      ownStyleKept: slot === 'root' ? attributes.style === ownStyle : null });
  }
  let nativeDir = $derived(sample.explicitUndefinedDir ? { dir: undefined }
    : sample.nativeDir ? { dir: sample.nativeDir } : {});
  let common = $derived({
    id: 'inert-api-field', value: model, multiple: sample.multiple, style: 'width:220px',
    treeData: [{ value: 'a', title: 'Alpha' }, { value: 'b', title: 'Beta' }],
    showSearch: sample.multiple ? false as const : { searchValue: query, filterTreeNode: false as const,
      onSearch: (text: string) => { query = text; record('search', text); } },
    ...resolved.props, ...nativeDir, styles, popupMatchSelectWidth: 300,
    onOpenChange: sample.callbackOnly ? undefined : (open: boolean) => record('open', open),
    onChange: (next: TreeSelectValue) => { model = next ?? null; record('change', next ?? null); },
    onFocus: () => record('focus'), onBlur: () => record('blur')
  });
  export function update(next: TreeSelectInertApiMode) { mode = next; }
  export function readRefs() { return { root: customRoot ?? defaultRoot, editor, control }; }
  export function readEvents() { return events; }
</script>

{#snippet rootRender(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-inert-api-root {@attach context.register}>Custom response</button>
  <output data-inert-api-received hidden>{received(context.attributes, 'root')}</output>
{/snippet}
{#snippet inputRender(context: TreeSelectInputContext)}
  <input {...context.attributes} data-inert-api-input {@attach context.register} />
  <output data-inert-api-received hidden>{received(context.attributes, 'input')}</output>
{/snippet}
<ConfigProvider direction={sample.provider} style="direction:ltr;font-family:initial;font-size:16px;line-height:normal"
  theme={{ token: { motion: false }, cssVar: { key: 'tree-select-inert-api' } }}>
  <div data-inert-api-case={sample.id} data-inert-api-bound={Boolean(root && control && (sample.slot === 'root' || editor))}
    style="margin:160px;direction:ltr;font-family:initial;font-size:16px;line-height:normal">
    {#if sample.slot === 'root'}
      <TreeSelect {...common} components={{ root: { render: rootRender, props: { dir: sample.ownDir, style: ownStyle } } }}
        bind:this={control} bind:nativeElement={customRoot} bind:inputElement={editor} />
    {:else if sample.slot === 'input'}
      <TreeSelect {...common} components={{ input: { render: inputRender, props: { dir: sample.ownDir } } }}
        bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
    {:else}
      <TreeSelect {...common} bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
    {/if}
    <output data-inert-api-semantic hidden>{semanticReceipt()}</output>
    <output data-inert-api-mode hidden>{JSON.stringify(mode)}</output>
    <output data-inert-api-model hidden>{JSON.stringify(model)}</output>
    <output data-inert-api-events hidden>{JSON.stringify(events)}</output>
    <div data-inert-api-command hidden {@attach node => {
      const change = (event: Event) => update((event as CustomEvent<TreeSelectInertApiMode>).detail);
      const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
      node.addEventListener('inertapiupdate', change);
      node.addEventListener('inertapirefs', refs);
      return () => { node.removeEventListener('inertapiupdate', change); node.removeEventListener('inertapirefs', refs); };
    }}></div>
    <button type="button" style="display:block;margin-top:320px">Outside inert API</button>
  </div>
</ConfigProvider>
