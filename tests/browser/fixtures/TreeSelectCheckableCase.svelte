<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, TreeSelect, type TreeSelectCheckableContent, type TreeSelectClassNames,
    type TreeSelectInputContext, type TreeSelectProps, type TreeSelectRef,
    type TreeSelectRootContext, type TreeSelectStyles, type TreeSelectValue
  } from 'antd-svelte';
  import {
    treeSelectCheckableData, type TreeSelectCheckableAction, type TreeSelectCheckableDescriptor,
    type TreeSelectCheckableSample, type TreeSelectCheckableSettings
  } from './tree-select-checkable-cases';

  let { sample, formName }: { sample: TreeSelectCheckableSample; formName?: string } = $props();
  let settings = $state.raw<TreeSelectCheckableSettings>(untrack(() => ({ ...sample })));
  let model = $state.raw<TreeSelectValue>(untrack(() => sample.initialModel ?? null));
  let query = $state('');
  let open = $state(false);
  let events = $state<unknown[][]>([]);
  let control = $state<TreeSelectRef>();
  let defaultRoot = $state<HTMLDivElement>();
  let customRoot = $state<HTMLButtonElement>();
  let editor = $state<HTMLInputElement>();
  let root = $derived(customRoot ?? defaultRoot);
  const ignored = $state({ renderCalls: 0, iteratorCalls: 0, thenReads: 0 });
  const cache: { values?: Record<TreeSelectCheckableDescriptor, TreeSelectCheckableContent> } = {};
  const receipt: { semantic: Record<string, unknown>; raw: Record<string, unknown> } = {
    semantic: {}, raw: {}
  };

  function failRender(): never {
    ignored.renderCalls++;
    throw Error('TreeSelect must not invoke the consumer treeCheckable snippet');
  }
  function materialize(descriptor: TreeSelectCheckableDescriptor): TreeSelectCheckableContent {
    if (!cache.values) {
      const iterable = (entries: TreeSelectCheckableContent[], throws = false) => ({
        [Symbol.iterator]() {
          ignored.iteratorCalls++;
          if (throws) {
            throw Error('TreeSelect must not consume treeCheckable iterables');
          }
          return entries[Symbol.iterator]();
        }
      });
      const pending = new Promise<null>(() => {});
      // oxlint-disable-next-line unicorn/no-thenable -- Намеренный throwing getter проверяет отсутствие чтения then и await.
      Object.defineProperty(pending, 'then', { get() {
        ignored.thenReads++;
        throw Error('TreeSelect must not read treeCheckable.then');
      } });
      cache.values = {
        omitted: undefined, undefined, false: false, null: null, zero: 0, 'negative-zero': -0,
        nan: Number.NaN, 'empty-string': '', true: true, text: 'Checkbox text', number: 2, negative: -3,
        'element-empty': ignoredEmpty, 'element-rich': ignoredRich,
        'array-empty': [], 'array-false': [false], 'array-zero': [0],
        'array-nested': [false, [0, ignoredRich]],
        'bigint-zero': 0n, 'bigint-one': 1n, 'bigint-negative': -1n,
        'iterable-empty': iterable([]), 'iterable-values': iterable([false, 0, ignoredRich]),
        'iterable-throw': iterable([], true), 'promise-pending': pending
      };
    }
    return cache.values[descriptor];
  }
  let original = $derived({ value: materialize(settings.value) });
  let checkableProps = $derived(settings.value === 'omitted' ? {} : { treeCheckable: original.value });
  function record(...entry: unknown[]) { events = [...events, entry]; }
  function observeSemantic(
    slot: 'classNames' | 'styles',
    info: { props: Pick<TreeSelectProps, 'treeCheckable'> }
  ) {
    const value = info.props.treeCheckable;
    receipt.semantic[slot] = {
      keyPresent: Object.hasOwn(info.props, 'treeCheckable'), descriptor: settings.value,
      truthy: Boolean(value), sameOriginal: Object.is(value, original.value),
      isArray: Array.isArray(value), length: Array.isArray(value) ? value.length : null
    };
    receipt.raw[slot] = {
      type: typeof value,
      scalar: value == null ? null : typeof value === 'string' || typeof value === 'boolean' ? value
        : typeof value === 'number' ? Number.isNaN(value) ? 'NaN' : Object.is(value, -0) ? '-0' : String(value)
          : typeof value === 'bigint' ? String(value) + 'n' : null,
      arrayLength: Array.isArray(value) ? value.length : null,
      sameOriginal: Object.is(value, original.value), nativeSnippet: value === ignoredEmpty || value === ignoredRich
    };
  }
  function classNames(info: { props: Pick<TreeSelectProps, 'treeCheckable'> }): TreeSelectClassNames {
    observeSemantic('classNames', info);
    return { popup: { root: 'checkable-audit-popup' } };
  }
  function styles(info: { props: Pick<TreeSelectProps, 'treeCheckable'> }): TreeSelectStyles {
    observeSemantic('styles', info);
    return {};
  }
  function semanticReceipt(raw = false) {
    void settings;
    void model;
    void query;
    void events.length;
    return JSON.stringify(raw ? receipt.raw : receipt.semantic);
  }
  function received(attributes: TreeSelectRootContext<HTMLButtonElement>['attributes']
    | TreeSelectInputContext['attributes'], slot: 'root' | 'input') {
    return JSON.stringify({
      slot,
      keys: ['treeCheckable'].filter(name => Object.hasOwn(attributes, name))
    });
  }
  let common = $derived({
    id: 'checkable-field', class: 'checkable-audit-root', style: 'width:220px',
    ...(formName ? { name: formName } : {}),
    treeData: treeSelectCheckableData, treeDefaultExpandAll: true, virtual: false,
    popupMatchSelectWidth: 300, value: model, open, multiple: settings.multiple,
    treeCheckStrictly: settings.strict, maxCount: settings.maxCount,
    showCheckedStrategy: settings.strategy, ...checkableProps,
    classNames, styles, transitionName: '',
    showSearch: sample.searchable ? {
      searchValue: query, filterTreeNode: false as const,
      onSearch: (text: string) => {
        query = text;
        record('search', text);
      }
    } : false as const,
    allowClear: { label: 'Clear checked values' },
    onOpenChange: (next: boolean) => {
      open = next;
      record('open', next);
    },
    onChange: (next: TreeSelectValue, labels: unknown, extra: { triggerValue?: unknown }) => {
      model = next ?? null;
      record('change', next ?? null, labels ?? null, { triggerValue: extra.triggerValue ?? null });
    },
    onSelect: (value: unknown, node?: { value?: unknown }) => record(
      'select',
      value,
      node?.value ?? null
    ),
    onDeselect: (value: unknown, node?: { value?: unknown }) => record(
      'deselect',
      value,
      node?.value ?? null
    ),
    onClear: () => record('clear'), onFocus: () => record('focus'), onBlur: () => record('blur')
  });
  export function update(action: TreeSelectCheckableAction) {
    if (action.type === 'value') settings = { ...settings, value: action.value };
    else if (action.type === 'props') {
      const next = { ...settings, ...action.set };
      for (const name of action.unset ?? []) delete next[name];
      settings = next;
    }
    else if (action.type === 'open') open = action.value;
  }
  export function readRefs() { return { root: customRoot ?? defaultRoot, editor, control }; }
  export function readEvents() { return events; }
  export function readIgnored() { return { ...ignored }; }
</script>

{#snippet ignoredEmpty()}{failRender()}{/snippet}
{#snippet ignoredRich()}{failRender()}<strong data-checkable-ignored-content>Ignored checkbox label</strong>{/snippet}
{#snippet rootRender(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-checkable-root
    {@attach context.register}>Root button</button>
  <output data-checkable-received hidden>{received(context.attributes, 'root')}</output>
{/snippet}
{#snippet inputRender(context: TreeSelectInputContext)}
  <input {...context.attributes} data-checkable-editor {@attach context.register} />
  <output data-checkable-received hidden>{received(context.attributes, 'input')}</output>
{/snippet}
<form data-checkable-form onsubmit={event => event.preventDefault()}>
  <ConfigProvider theme={{ token: { motion: false }, cssVar: { key: 'tree-select-checkable' } }}>
    <div data-checkable-case={sample.id} data-checkable-searchable={Boolean(sample.searchable)}
      data-checkable-bound={Boolean(root && control && (sample.slot === 'root' || editor))}
      style="margin:160px;width:420px;direction:ltr;font-family:initial;font-size:16px;line-height:normal">
      {#if sample.slot === 'root'}
        <TreeSelect {...common} components={{ root: { render: rootRender,
          props: { style: 'width:220px;height:40px' } } }}
          bind:this={control} bind:nativeElement={customRoot} bind:inputElement={editor} />
      {:else if sample.slot === 'input'}
        <TreeSelect {...common} components={{ input: inputRender }}
          bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
      {:else}
        <TreeSelect {...common} bind:this={control} bind:nativeElement={defaultRoot} bind:inputElement={editor} />
      {/if}
      <output data-checkable-semantic hidden>{semanticReceipt()}</output>
      <output data-checkable-raw-semantic hidden>{semanticReceipt(true)}</output>
      <output data-checkable-ignored hidden>{JSON.stringify(ignored)}</output>
      <output data-checkable-descriptor hidden>{JSON.stringify(settings.value)}</output>
      <output data-checkable-model hidden>{JSON.stringify(model)}</output>
      <output data-checkable-query hidden>{JSON.stringify(query)}</output>
      <output data-checkable-events hidden>{JSON.stringify(events)}</output>
      <output data-checkable-ssr-resources hidden>{JSON.stringify({
        root: root?.tagName ?? null, editor: editor?.tagName ?? null, control: typeof control
      })}</output>
      <div data-checkable-command hidden {@attach node => {
        const command = (event: Event) => update((event as CustomEvent<TreeSelectCheckableAction>).detail);
        const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs(), {
          ignored: readIgnored()
        });
        node.addEventListener('checkableupdate', command);
        node.addEventListener('checkablerefs', refs);
        return () => {
          node.removeEventListener('checkableupdate', command);
          node.removeEventListener('checkablerefs', refs);
        };
      }}></div>
    </div>
  </ConfigProvider>
</form>
