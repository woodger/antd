<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, TreeSelect, type TreeSelectInputContext, type TreeSelectLabeledValue,
    type TreeSelectProps, type TreeSelectRef, type TreeSelectRootContext, type TreeSelectStyles,
    type TreeSelectTagInfo, type TreeSelectValue
  } from 'antd-svelte';
  import TreeSelectAlignCompositeRoot from './TreeSelectAlignCompositeRoot.svelte';
  import type { TreeSelectAlignAction, TreeSelectAlignSample, TreeSelectAlignSettings } from './tree-select-align-cases';
  let { sample, baselineNoAlignment = false }: {
    sample: TreeSelectAlignSample;
    baselineNoAlignment?: boolean
  } = $props();
  const names = ['popupAlign', 'builtinPlacements', 'placement'] as const;
  type AlignProps = Pick<TreeSelectProps, typeof names[number]>;
  let settings = $state.raw<TreeSelectAlignSettings>(untrack(() => ({ ...sample })));
  let hostState = $state(untrack(() => ({ left: 0, top: 0,
    width: sample.hostStyle?.width ?? 420, height: sample.hostStyle?.height ?? 160 })));
  let model = $state.raw<TreeSelectValue>(untrack(() => sample.slot === 'input-responsive'
    ? ['a', 'b', 'c', 'd'] : sample.multiple ? ['a'] : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let control = $state<TreeSelectRef>();
  let defaultRoot = $state<HTMLDivElement>();
  let buttonRoot = $state<HTMLButtonElement>();
  let compositeRoot = $state<HTMLSpanElement>();
  let publicCompositeRoot = $state<HTMLSpanElement>();
  let editor = $state<HTMLInputElement>();
  let compositeEditor = $state<HTMLInputElement>();
  let host = $state<HTMLDivElement>();
  let shadow = $state<ShadowRoot>();
  let root = $derived(buttonRoot ?? publicCompositeRoot ?? defaultRoot);
  const getterArguments: HTMLElement[] = [];
  const receipt: { semantic: unknown } = { semantic: null };
  function record(...entry: unknown[]) { events = [...events, entry]; }
  function getter(trigger: HTMLElement) {
    getterArguments.push(trigger);
    return sample.container === 'shadow' ? shadow! : host!;
  }
  export function update(action: TreeSelectAlignAction) {
    if (action.type === 'props') {
      const next = { ...settings, ...action.set };
      for (const key of action.unset ?? []) delete next[key];
      settings = next;
    }
    else if (action.type === 'host') {
      hostState = { ...hostState,
        ...(action.left === undefined ? {} : { left: action.left }),
        ...(action.top === undefined ? {} : { top: action.top }),
        ...(action.width === undefined ? {} : { width: action.width }),
        ...(action.height === undefined ? {} : { height: action.height }) };
    }
  }
  function styles(info: { props: AlignProps }): TreeSelectStyles {
    receipt.semantic = {
      keys: names.filter(key => Object.hasOwn(info.props, key)), popupAlign: info.props.popupAlign ?? null,
      builtinPlacements: info.props.builtinPlacements ?? null, placement: info.props.placement ?? null,
      popupAlignSame: info.props.popupAlign === settings.popupAlign,
      placementsSame: info.props.builtinPlacements === settings.builtinPlacements
    };
    return { popup: { root: ['--align-semantic:original',
      sample.surface?.margin ? `margin:${sample.surface.margin.map(value => `${value}px`).join(' ')}` : undefined,
      sample.surface?.translate ? `transform:translate(${sample.surface.translate.map(value => `${value}px`).join(',')})` : undefined
    ].filter(Boolean).join(';') } };
  }
  function semanticReceipt() {
    void settings;
    void model;
    void query;
    void events.length;
    return JSON.stringify(receipt.semantic);
  }
  let alignProps = $derived.by<AlignProps>(() => {
    const props: AlignProps = {};
    if (baselineNoAlignment) return props;
    if (Object.hasOwn(settings, 'popupAlign')) props.popupAlign = settings.popupAlign;
    if (Object.hasOwn(settings, 'builtinPlacements')) props.builtinPlacements = settings.builtinPlacements;
    if (Object.hasOwn(settings, 'placement')) props.placement = settings.placement;
    return props;
  });
  let common = $derived({
    id: 'align-field', value: model,
    style: `width:${settings.width ?? (sample.slot === 'input-responsive' ? 234 : 220)}px`,
    ...alignProps,
    multiple: sample.multiple || sample.slot === 'input-responsive',
    showSearch: { searchValue: query, filterTreeNode: false as const,
      onSearch: (text: string) => {
        query = text;
        record('search', text);
      } },
    treeData: [{ value: 'a', title: 'Alpha' }, { value: 'b', title: 'Beta' },
      { value: 'c', title: 'Gamma' }, { value: 'd', title: 'Delta' }].slice(
        0,
        sample.slot === 'input-responsive' ? 4 : 2
      ),
    popupMatchSelectWidth: settings.popupWidth ?? 300,
    getPopupContainer: sample.container ? getter : undefined, styles,
    maxTagCount: sample.slot === 'input-responsive' ? 'responsive' as const : undefined,
    onOpenChange: (open: boolean) => record('open', open),
    onChange: (next: TreeSelectValue) => {
      model = next ?? null;
      record('change', next ?? null);
    },
    onFocus: () => record('focus'), onBlur: () => record('blur')
  });
  let hostStyle = $derived([
    `position:${sample.scrollAncestor ? 'absolute' : 'fixed'}`,
    `left:${(sample.left ?? 300) + hostState.left}px`, `top:${(sample.top ?? 200) + hostState.top}px`,
    `width:${hostState.width}px`, `height:${hostState.height}px`, 'box-sizing:content-box',
    sample.hostStyle?.border ? `border:${sample.hostStyle.border}px solid rgb(100,100,100)` : undefined,
    sample.hostStyle?.padding === undefined ? undefined : `padding:${sample.hostStyle.padding}px`,
    sample.hostStyle?.overflow ? `overflow:${sample.hostStyle.overflow}` : undefined,
    sample.hostStyle?.scale ? `transform:scale(${sample.hostStyle.scale})` : undefined,
    'transform-origin:0 0;direction:ltr;font-family:initial;font-size:16px;line-height:normal'
  ].filter(Boolean).join(';'));
  export function readRefs() {
    return { root: buttonRoot ?? publicCompositeRoot ?? defaultRoot, editor: compositeEditor ?? editor, control,
      getterArguments, shadow };
  }
  export function readEvents() { return events; }
  export function readSemantic() { return receipt.semantic; }
  export function syncShadowStyles() {
    if (!shadow) return;
    for (const style of document.querySelectorAll('style')) {
      if (![...shadow.querySelectorAll('style')].some(current => current.textContent === style.textContent))
        shadow.append(style.cloneNode(true));
    }
    // Production consumers load static CSS through links, while Source UMD injects styles.
    for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
      if (![...shadow.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some(current => current.href === link.href))
        shadow.append(link.cloneNode(true));
    }
  }
</script>

{#snippet button(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-align-root {@attach context.register}>Root button</button>
  <output data-align-received hidden>{JSON.stringify({ keys: ['popupAlign', 'builtinPlacements'].filter(key => Object.hasOwn(context.attributes, key)) })}</output>
{/snippet}
{#snippet composite(context: TreeSelectRootContext<HTMLSpanElement>)}
  <TreeSelectAlignCompositeRoot {context} onInput={text => record('root-input', text)}
    bind:nativeElement={compositeRoot} bind:inputElement={compositeEditor} />
{/snippet}
{#snippet fragmentInput(context: TreeSelectInputContext)}<span data-align-prefix style="display:inline-block;width:64px">Prefix</span><input {...context.attributes} data-align-editor {@attach context.register} /><output data-align-received hidden>{JSON.stringify({ keys: ['popupAlign', 'builtinPlacements'].filter(key => Object.hasOwn(context.attributes, key)) })}</output>{/snippet}
{#snippet rest(_omitted: TreeSelectLabeledValue[])}
  <span data-align-rest style="display:inline-flex;width:64px;height:22px">Rest</span>
{/snippet}
{#snippet tag(info: TreeSelectTagInfo)}
  {#if info.isMaxTag}{@render info.label()}{:else}<span data-align-tag={String(info.value)} style="display:inline-flex;width:64px;height:22px">{@render info.label()}</span>{/if}
{/snippet}
{#snippet content()}
  <div data-align-case={sample.id} data-align-bound={Boolean(root && control && (sample.slot?.startsWith('root-') || editor))}
    bind:this={host} style={hostStyle}>
    {#if sample.slot === 'root-button'}
      <TreeSelect {...common} components={{ root: { render: button, props: { style: 'width:220px;height:40px' } } }}
        bind:this={control} bind:nativeElement={buttonRoot} />
    {:else if sample.slot === 'root-composite'}
      <TreeSelect {...common} components={{ root: { render: composite, props: { style: 'width:220px;height:40px' } } }}
        bind:this={control} bind:nativeElement={publicCompositeRoot} />
    {:else if sample.slot === 'input-responsive'}
      <TreeSelect {...common} components={{ input: fragmentInput }} maxTagPlaceholder={rest} tagRender={tag}
        bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
    {:else}
      <TreeSelect {...common} bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
    {/if}
    <output data-align-semantic hidden>{semanticReceipt()}</output>
    <output data-align-model hidden>{JSON.stringify(model)}</output>
    <output data-align-events hidden>{JSON.stringify(events)}</output>
    <output data-align-ssr-resources hidden>{JSON.stringify({ getterCalls: getterArguments.length,
      native: (buttonRoot ?? publicCompositeRoot ?? defaultRoot)?.tagName ?? null,
      editor: (compositeEditor ?? editor)?.tagName ?? null, control: typeof control })}</output>
    <div data-align-command hidden {@attach node => {
      const command = (event: Event) => update((event as CustomEvent<TreeSelectAlignAction>).detail);
      const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
      const sync = () => syncShadowStyles();
      node.addEventListener('alignupdate', command); node.addEventListener('alignrefs', refs);
      node.addEventListener('alignshadowstyles', sync);
      return () => { node.removeEventListener('alignupdate', command); node.removeEventListener('alignrefs', refs);
        node.removeEventListener('alignshadowstyles', sync); };
    }}></div>
  </div>
{/snippet}
<ConfigProvider direction={settings.provider ?? 'ltr'}
  style="direction:ltr;font-family:initial;font-size:16px;line-height:normal"
  theme={{ token: { motion: false }, cssVar: { key: 'tree-select-align' } }}>
  {#if sample.scrollAncestor}<div data-align-scroller style="position:fixed;left:0;top:0;width:1000px;height:600px;overflow:auto">
    <div style="position:relative;min-width:1600px;min-height:1600px">{@render content()}</div>
  </div>{:else}{@render content()}{/if}
  {#if sample.container === 'shadow'}<div data-align-shadow style="display:contents" {@attach node => {
    shadow = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
    return () => { shadow = undefined; };
  }}></div>{/if}
  <button type="button" style="position:fixed;left:16px;top:16px">Outside align</button>
</ConfigProvider>
