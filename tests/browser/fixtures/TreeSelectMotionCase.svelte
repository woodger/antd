<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, TreeSelect, type ThemeConfig, type TreeSelectInputContext,
    type TreeSelectProps, type TreeSelectRef, type TreeSelectRootContext,
    type TreeSelectStyles, type TreeSelectValue
  } from 'antd-svelte';
  import TreeSelectMotionCompositeRoot from './TreeSelectMotionCompositeRoot.svelte';
  import {
    treeSelectMotionCss, type TreeSelectMotionSample,
    type TreeSelectMotionSettings
  } from './tree-select-motion-cases';
  import type { TreeSelectMotionRootSwapAction } from './tree-select-motion-root-swap-cases';

  let { sample }: { sample: TreeSelectMotionSample } = $props();
  const initialDraft = 'Panel draft';
  const names = ['animation', 'transitionName'] as const;
  type MotionProps = Pick<TreeSelectProps, typeof names[number]>;
  let settings = $state.raw<TreeSelectMotionSettings>(untrack(() => ({ ...sample })));
  let open = $state(untrack(() => Boolean(sample.initialOpen)));
  let left = $state(300);
  let rootVersion = $state(false);
  let label = $state('Panel label A');
  let model = $state.raw<TreeSelectValue>(untrack(() => sample.multiple ? ['a'] : null));
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

  function record(...entry: unknown[]) {
    events = [...events, entry];
  }
  function getter(trigger: HTMLElement) {
    getterArguments.push(trigger);
    return sample.container === 'shadow' ? shadow! : host!;
  }
  export function update(action: TreeSelectMotionRootSwapAction) {
    if (action.type === 'props') {
      const next = { ...settings, ...action.set };
      for (const key of action.unset ?? []) delete next[key];
      settings = next;
    }
    else if (action.type === 'open') open = action.value;
    else if (action.type === 'label') label = action.value;
    else if (action.type === 'left') left = action.value;
    else if (action.type === 'root-swap') {
      left = action.left;
      rootVersion = !rootVersion;
    }
  }
  function styles(info: { props: MotionProps }): TreeSelectStyles {
    receipt.semantic = {
      keys: names.filter(key => Object.hasOwn(info.props, key)),
      animation: info.props.animation ?? null,
      animationType: typeof info.props.animation,
      transitionName: info.props.transitionName ?? null,
      transitionType: typeof info.props.transitionName,
      animationSame: info.props.animation === settings.animation,
      transitionSame: info.props.transitionName === settings.transitionName
    };
    return { popup: { root: '--motion-owner:original' } };
  }
  function semanticReceipt() {
    void settings;
    void model;
    void query;
    void events.length;
    return JSON.stringify(receipt.semantic);
  }
  let motionProps = $derived.by<MotionProps>(() => {
    const props: MotionProps = {};
    if (Object.hasOwn(settings, 'animation')) props.animation = settings.animation;
    if (Object.hasOwn(settings, 'transitionName')) props.transitionName = settings.transitionName;
    return props;
  });
  let common = $derived({
    id: 'motion-field',
    class: 'motion-audit-root',
    value: model,
    style: 'width:220px',
    ...motionProps,
    prefixCls: settings.local,
    placement: settings.placement,
    multiple: sample.multiple,
    treeData: [{ value: 'a', title: 'Alpha' }, { value: 'b', title: 'Beta' }],
    showSearch: {
      searchValue: query,
      filterTreeNode: false as const,
      onSearch: (text: string) => {
        query = text;
        record('search', text);
      }
    },
    ...(sample.defaultOpen ? { defaultOpen: true } : { open }),
    popupMatchSelectWidth: 300,
    getPopupContainer: sample.container ? getter : undefined,
    popupRender: panel,
    classNames: { popup: { root: 'motion-audit-popup' } },
    styles,
    onOpenChange: (next: boolean) => {
      record('open', next);
      open = next;
    },
    onChange: (next: TreeSelectValue) => {
      model = next ?? null;
      record('change', next ?? null);
    },
    onSelect: (value: unknown) => record('select', value),
    onFocus: () => record('focus'),
    onBlur: () => record('blur')
  });
  let configuration = $derived<ThemeConfig>({
    token: { motion: settings.motion ?? true },
    components: {
      ...(settings.selectMotion === false ? { Select: { algorithm: true, motion: false } } : {}),
      ...(settings.treeSelectMotion === false
        ? { TreeSelect: { algorithm: true, motion: false } } : {})
    },
    cssVar: { key: 'tree-select-motion' }
  });
  export function readRefs() {
    return {
      root: buttonRoot ?? publicCompositeRoot ?? defaultRoot,
      editor: compositeEditor ?? editor,
      control,
      getterArguments,
      shadow
    };
  }
  export function readEvents() {
    return events;
  }
  export function readSemantic() {
    return receipt.semantic;
  }
  export function syncShadowStyles() {
    if (!shadow) {
      return;
    }
    for (const style of document.querySelectorAll('style')) {
      if (![...shadow.querySelectorAll('style')].some(node => node.textContent === style.textContent))
        shadow.append(style.cloneNode(true));
    }
    for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
      if (![...shadow.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
        .some(node => node.href === link.href)) {
        shadow.append(link.cloneNode(true));
      }
    }
  }
</script>

<svelte:head>{@html `<style data-motion-author>${treeSelectMotionCss}</style>`}</svelte:head>

{#snippet panel(menu: Snippet)}
  <div data-motion-panel><input data-motion-draft value={initialDraft} defaultValue={initialDraft} /><span data-motion-label>{label}</span>{@render menu()}</div>
{/snippet}
{#snippet button(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-motion-root
    {@attach context.register}>Root button</button>
  <output data-motion-received hidden>{JSON.stringify({
    keys: names.filter(key => Object.hasOwn(context.attributes, key))
  })}</output>
{/snippet}
{#snippet replacementButton(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-motion-root
    {@attach context.register}>Root button</button>
  <output data-motion-received hidden>{JSON.stringify({
    keys: names.filter(key => Object.hasOwn(context.attributes, key))
  })}</output>
{/snippet}
{#snippet composite(context: TreeSelectRootContext<HTMLSpanElement>)}
  <TreeSelectMotionCompositeRoot {context} onInput={text => record('root-input', text)}
    bind:nativeElement={compositeRoot} bind:inputElement={compositeEditor} />
{/snippet}
{#snippet input(context: TreeSelectInputContext)}
  <input {...context.attributes} data-motion-editor {@attach context.register} />
  <output data-motion-received hidden>{JSON.stringify({
    keys: names.filter(key => Object.hasOwn(context.attributes, key))
  })}</output>
{/snippet}
{#snippet configured()}
  <ConfigProvider prefixCls={settings.prefix} theme={configuration}
    style="direction:ltr;font-family:initial;font-size:16px;line-height:normal">
    <div data-motion-case={sample.id} data-motion-host
      data-motion-bound={Boolean(root && control && (sample.slot?.startsWith('root-') || editor))}
      bind:this={host}
      style={`position:fixed;left:${left}px;top:200px;width:420px;height:160px`}>
      {#if sample.slot === 'root-button'}
        <TreeSelect {...common}
          components={{ root: { render: rootVersion ? replacementButton : button,
            props: { style: 'width:220px;height:40px' } } }}
          bind:this={control} bind:nativeElement={buttonRoot} />
      {:else if sample.slot === 'root-composite'}
        <TreeSelect {...common}
          components={{ root: { render: composite, props: { style: 'width:220px;height:40px' } } }}
          bind:this={control} bind:nativeElement={publicCompositeRoot} />
      {:else if sample.slot === 'input'}
        <TreeSelect {...common} components={{ input }}
          bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
      {:else}
        <TreeSelect {...common}
          bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
      {/if}
      <output data-motion-semantic hidden>{semanticReceipt()}</output>
      <output data-motion-model hidden>{JSON.stringify(model)}</output>
      <output data-motion-events hidden>{JSON.stringify(events)}</output>
      <output data-motion-ssr-resources hidden>{JSON.stringify({
        getterCalls: getterArguments.length,
        native: root?.tagName ?? null,
        editor: (compositeEditor ?? editor)?.tagName ?? null,
        control: typeof control
      })}</output>
      <div data-motion-command hidden {@attach node => {
        const command = (event: Event) => update((event as CustomEvent<TreeSelectMotionRootSwapAction>).detail);
        const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
        const sync = () => syncShadowStyles();
        node.addEventListener('motionupdate', command);
        node.addEventListener('motionrefs', refs);
        node.addEventListener('motionshadowstyles', sync);
        return () => {
          node.removeEventListener('motionupdate', command);
          node.removeEventListener('motionrefs', refs);
          node.removeEventListener('motionshadowstyles', sync);
        };
      }}></div>
    </div>
    {#if sample.container === 'shadow'}
      <div data-motion-shadow style="display:contents" {@attach node => {
        shadow = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
        return () => { shadow = undefined; };
      }}></div>
    {/if}
    <button type="button" data-motion-outside style="position:fixed;left:10px;top:10px">
      Motion outside
    </button>
  </ConfigProvider>
{/snippet}
{#if sample.warmMotionProvider}
  <ConfigProvider theme={{ token: { motion: false } }}>{@render configured()}</ConfigProvider>
{:else}{@render configured()}{/if}
