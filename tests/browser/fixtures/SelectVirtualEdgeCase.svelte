<script lang="ts">
  import { untrack } from 'svelte';
  import { AutoComplete, ConfigProvider, enUS, type AutoCompleteRef, type AutoCompleteItem } from 'antd-svelte';
  import {
    selectVirtualGeometry, selectVirtualProps, selectVirtualProviderProps, selectVirtualReceipts
  } from './select-virtual-cases';
  import { selectVirtualEdgeOptions, type SelectVirtualEdgeSample, type SelectVirtualEdgeAction } from './select-virtual-edge-cases';

  let { sample }: { sample: SelectVirtualEdgeSample } = $props();
  const options: readonly AutoCompleteItem[] = untrack(() => selectVirtualEdgeOptions(sample));
  const localProps = untrack(() => selectVirtualProps(sample));
  const outerProps = untrack(() => selectVirtualProviderProps(sample.outer));
  const innerProps = untrack(() => selectVirtualProviderProps(sample.inner));
  const theme = { token: { motion: false }, cssVar: { key: 'select-virtual' } };
  const position = selectVirtualGeometry.plain;
  const getSizeCalls: Array<{ align: string | null; first: {
    top: number;
    bottom: number | undefined
  };
    second: { top: number; bottom: number | undefined } }> = [];
  let open = $state(false);
  let model = $state<unknown>(untrack(() => sample.initialValue ?? ''));
  let query = $state(untrack(() => sample.initialValue ?? ''));
  let events = $state<unknown[][]>([]);
  let control = $state<AutoCompleteRef>();
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();

  function record(...entry: unknown[]) { events.push(entry); }
  function opening(next: boolean) {
    open = next;
    record('open', next);
  }
  function search(next: string) {
    query = next;
    record('search', next);
  }
  function change(next: string | undefined) {
    model = next ?? null;
    query = next ?? '';
    record('change', next ?? null);
  }
  function active(next: string | null) { record('active', next); }
  function scrolled(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    const node = event.currentTarget;
    record('scroll', { trusted: event.isTrusted, tag: node.tagName,
      holder: node.classList.contains('ant-select-dropdown-list-holder'), top: node.scrollTop,
      left: node.scrollLeft, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight });
  }
  export function update(action: SelectVirtualEdgeAction) {
    if (action.type === 'ref') {
      if (action.target.kind === 'key') {
        control?.scrollTo({
          key: action.target.key,
          align: action.target.align
        });
      }
      else {
        control?.scrollTo({ index: action.target.index });
      }
    }
  }
  export function readRefs() {
    return {
      root,
      anchor: root,
      editor,
      control,
      publicRoot: root,
      publicEditor: editor,
      getSizeCalls
    };
  }
  export function readEvents() { return events; }
  export function readGetSizeCalls() { return getSizeCalls; }
  export function readModel() { return model; }
  export function readQuery() { return query; }
  export function readReceipts() {
    return selectVirtualReceipts(sample, outerProps, innerProps, localProps);
  }
</script>

<section data-select-virtual-case={sample.id} data-select-virtual-family="auto-complete"
  data-select-virtual-bound={Boolean(control)}
  style="font-family:initial;font-size:16px;line-height:normal;direction:ltr">
  <ConfigProvider {...outerProps} {theme} popupOverflow="viewport" direction="ltr" locale={enUS}>
    <ConfigProvider {...innerProps}>
      <div data-select-virtual-position style={`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px`}>
        <AutoComplete {...localProps} id="virtual-field" class="select-virtual-control" style="width:100%"
          {options} value={query} {open} showSearch={{ filterOption: false, onSearch: search }}
          onChange={change} onOpenChange={opening} onActive={active} onPopupScroll={scrolled}
          bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />
      </div>
    </ConfigProvider>
  </ConfigProvider>
  <button type="button" data-select-virtual-outside style="position:fixed;left:16px;top:80px">Outside virtual</button>
  <output data-select-virtual-receipts hidden>{JSON.stringify(readReceipts())}</output>
  <output data-select-virtual-model hidden>{JSON.stringify(model)}</output>
  <output data-select-virtual-query hidden>{JSON.stringify(query)}</output>
  <output data-select-virtual-events hidden>{JSON.stringify(events)}</output>
  <output data-select-virtual-offsets hidden>[]</output>
  <output data-select-virtual-renders hidden>[]</output>
  <div data-select-virtual-command hidden {@attach node => {
    const onUpdate = (event: Event) => update((event as CustomEvent<SelectVirtualEdgeAction>).detail);
    const onRefs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('virtualupdate', onUpdate);
    node.addEventListener('virtualrefs', onRefs);
    return () => {
      node.removeEventListener('virtualupdate', onUpdate);
      node.removeEventListener('virtualrefs', onRefs);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
