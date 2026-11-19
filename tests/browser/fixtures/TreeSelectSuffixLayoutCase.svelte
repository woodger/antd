<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, TreeSelect, type TreeSelectInputContext, type TreeSelectLabeledValue,
    type TreeSelectRef, type TreeSelectTagInfo } from 'antd-svelte';
  import TreeSelectSuffixLayoutEditor from './TreeSelectSuffixLayoutEditor.svelte';
  import type { TreeSelectSuffixLayoutAction, TreeSelectSuffixLayoutSample } from './tree-select-suffix-layout-cases';
  let { sample, popupContainer }: { sample: TreeSelectSuffixLayoutSample;
    popupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  } = $props();
  const keys = ['a', 'b', 'c', 'd'];
  let values = $state<string[]>(untrack(() => keys.slice(0, sample.count)));
  let events = $state<unknown[][]>([]);
  let lastQuery = $state('');
  let rootWidth = $state(untrack(() => sample.width + 34));
  let prefixWidth = $state(untrack(() => sample.prefixWidth));
  let restWidth = $state(untrack(() => sample.restWidth));
  let size = $state<'small' | 'medium' | 'large' | undefined>(untrack(() => sample.size));
  let direction = $state(untrack(() => sample.direction));
  let maxTagCount = $state<number | 'responsive' | undefined>('responsive');
  let control = $state<TreeSelectRef>();
  let root = $state<HTMLDivElement>();
  let input = $state<HTMLInputElement>();
  let textarea = $state<HTMLInputElement | HTMLTextAreaElement>();
  let editor = $derived(sample.kind === 'textarea' ? textarea : input);
  function record(...entry: unknown[]) { events = [...events, entry]; }
  function resize(width: number) {
    if (!root) {
      rootWidth = width + 34;
      return;
    }
    const content = root.querySelector<HTMLElement>('.ant-select-content')!;
    rootWidth = width + root.getBoundingClientRect().width - content.clientWidth;
  }
  function command(action: TreeSelectSuffixLayoutAction) {
    if (action.type === 'resize') resize(action.width);
    else if (action.type === 'prefix-resize') prefixWidth = action.width;
    else if (action.type === 'rest-resize') restWidth = action.width;
    else if (action.type === 'value') values = keys.slice(0, action.count);
  }
  function update(patch: { width?: number; rootWidth?: number; prefixWidth?: number; restWidth?: number;
    count?: number; values?: string[]; direction?: 'ltr' | 'rtl'; size?: 'small' | 'middle' | 'medium' | 'large';
    maxTagCount?: number | 'responsive'; }) {
    if (patch.width !== undefined) resize(patch.width);
    if (patch.rootWidth !== undefined) rootWidth = patch.rootWidth;
    if (patch.prefixWidth !== undefined) prefixWidth = patch.prefixWidth;
    if (patch.restWidth !== undefined) restWidth = patch.restWidth;
    if (patch.count !== undefined) values = keys.slice(0, patch.count);
    if (patch.values !== undefined) values = patch.values;
    if (patch.direction !== undefined) direction = patch.direction;
    if (Object.hasOwn(patch, 'size')) size = patch.size === 'middle' ? 'medium' : patch.size;
    if (Object.hasOwn(patch, 'maxTagCount')) maxTagCount = patch.maxTagCount;
  }
  let common = $derived({
    id: 'suffix-layout-control', name: 'suffix-layout-choice', multiple: true, value: values, size,
    style: `width:${rootWidth}px`, maxTagCount,
    getPopupContainer: popupContainer,
    showSearch: { filterTreeNode: false as const, onSearch: (text: string) => {
      lastQuery = text;
      record('search', text);
    } },
    treeData: [{ value: 'a', title: 'One' }, { value: 'b', title: 'Two' }, {
      value: 'c',
      title: 'Three'
    }, {
      value: 'd',
      title: 'Four'
    }],
    onChange: (next: string[]) => {
      values = next;
      lastQuery = '';
      record('change', next);
    },
    onOpenChange: (open: boolean) => record('open', open), onFocus: () => record('focus'), onBlur: () => record('blur')
  });
  export function readRefs() { return { root, input: textarea ?? input, control }; }
  export function focus(options?: FocusOptions) { control?.focus(options); }
  export function blur() { control?.blur(); }
</script>

{#snippet inputRender(context: TreeSelectInputContext<HTMLInputElement>)}
  <TreeSelectSuffixLayoutEditor {context} kind={sample.kind} {prefixWidth} />
{/snippet}
{#snippet textareaRender(context: TreeSelectInputContext<HTMLTextAreaElement>)}
  <textarea {...context.attributes} {@attach context.register} data-suffix-layout-editor></textarea>
{/snippet}
{#snippet summary(omitted: TreeSelectLabeledValue[])}
  <span data-suffix-layout-rest data-suffix-layout-omitted={omitted.map(item => item.value).join(',')}
    style={`display:inline-flex;width:${restWidth}px;height:22px;box-sizing:border-box`}>Rest</span>
{/snippet}
{#snippet tag(info: TreeSelectTagInfo)}
  {#if info.isMaxTag}{@render info.label()}{:else}<span data-suffix-layout-tag={String(info.value)}
    style="display:inline-flex;width:64px;height:22px;box-sizing:border-box">{@render info.label()}</span>{/if}
{/snippet}
<div data-suffix-layout-case={sample.id} data-suffix-layout-bound={Boolean(root && editor && control)} style="margin:64px">
  <!-- React Provider передаёт context без DOM: host сохраняет LTR и UA font 16px/normal. -->
  <ConfigProvider {direction} style="direction:ltr;font-family:initial;font-size:16px;line-height:normal"
    theme={{ cssVar: { key: 'tree-select-suffix-layout' }, token: { motion: false } }}>
    {#if sample.kind === 'textarea'}
      <TreeSelect {...common} components={{ input: { render: textareaRender, props: {} } }}
        maxTagPlaceholder={summary} tagRender={sample.customTags === false ? undefined : tag}
        bind:this={control} bind:nativeElement={root} bind:inputElement={textarea} />
    {:else}
      <TreeSelect {...common} components={{ input: { render: inputRender, props: {} } }}
        maxTagPlaceholder={summary} tagRender={sample.customTags === false ? undefined : tag}
        bind:this={control} bind:nativeElement={root} bind:inputElement={input} />
    {/if}
  </ConfigProvider>
  <output hidden data-suffix-layout-model>{JSON.stringify(values)}</output>
  <output hidden data-suffix-layout-query>{lastQuery}</output>
  <output hidden data-suffix-layout-events>{JSON.stringify(events)}</output>
  <output hidden data-suffix-layout-refs>{JSON.stringify({ root: root?.tagName ?? null, editor: editor?.tagName ?? null,
    nativeContainsEditor: root?.contains(editor ?? null) ?? false, focus: typeof control?.focus, blur: typeof control?.blur })}</output>
  <div hidden data-suffix-layout-command {@attach node => {
    const onCommand = (event: Event) => command((event as CustomEvent<TreeSelectSuffixLayoutAction>).detail);
    const onUpdate = (event: Event) => update((event as CustomEvent<Parameters<typeof update>[0]>).detail);
    node.addEventListener('fixtureupdate', onCommand);
    node.addEventListener('suffixlayoutupdate', onUpdate);
    return () => { node.removeEventListener('fixtureupdate', onCommand); node.removeEventListener('suffixlayoutupdate', onUpdate); };
  }}></div>
  <button type="button" style="display:block;margin-top:320px">Outside suffix layout</button>
</div>
