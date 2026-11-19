<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, TreeSelect, type TreeSelectInputContext, type TreeSelectTagInfo } from 'antd-svelte';
  import type { TreeSelectSuffixLayoutEdgeSample } from './tree-select-suffix-layout-edge-cases';
  let { sample }: { sample: TreeSelectSuffixLayoutEdgeSample } = $props();
  const keys = ['a', 'b', 'c', 'd'];
  let values = $state(untrack(() => keys.slice(0, sample.initialCount)));
  let events = $state<unknown[][]>([]);
  let rootWidth = $state(untrack(() => sample.width + 34));
  let top = $state(0), left = $state(0);
  let host = $state<HTMLDivElement>();
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement>();
  function record(...entry: unknown[]) { events = [...events, entry]; }
  $effect(() => {
    if (root) {
      untrack(() => {
        const content = root!.querySelector<HTMLElement>('.ant-select-content')!;
        rootWidth = sample.width + root!.getBoundingClientRect().width - content.clientWidth;
      });
    }
  });
</script>

{#snippet input(context: TreeSelectInputContext)}
  <input {...context.attributes} {@attach context.register} data-suffix-edge-editor />
{/snippet}
{#snippet summary()}
  <span data-suffix-edge-rest style="display:inline-flex;width:64px;height:22px;box-sizing:border-box">Rest</span>
{/snippet}
{#snippet tag(_info: TreeSelectTagInfo)}
  <span data-suffix-edge-tag style="display:inline-flex;width:64px;height:22px;box-sizing:border-box">Choice</span>
{/snippet}
<div data-suffix-edge-host={sample.id} data-suffix-edge-bound={Boolean(root && editor)} bind:this={host}
  style={`margin:${64 + top}px 64px 64px ${64 + left}px;${sample.willChange ? 'will-change:transform' : ''}`}>
  <ConfigProvider direction={sample.direction} style="direction:ltr;font-family:initial;font-size:16px;line-height:normal"
    theme={{ cssVar: { key: 'tree-select-suffix-layout-edges' }, token: { motion: false } }}>
    <TreeSelect id="suffix-edge-control" multiple value={values} style={`width:${rootWidth}px`}
      maxTagCount="responsive" components={{ input }} maxTagPlaceholder={summary} tagRender={tag}
      getPopupContainer={sample.willChange ? () => host! : undefined}
      treeData={[{ value: 'a', title: 'One' }, { value: 'b', title: 'Two' }, { value: 'c', title: 'Three' }, { value: 'd', title: 'Four' }]}
      showSearch={{ filterTreeNode: false, onSearch: text => record('search', text) }}
      onOpenChange={open => record('open', open)} onFocus={() => record('focus')} onBlur={() => record('blur')}
      onChange={next => {
        values = next;
        record('change', next);
      }}
      bind:nativeElement={root} bind:inputElement={editor} />
  </ConfigProvider>
  <output hidden data-suffix-edge-model>{JSON.stringify(values)}</output>
  <output hidden data-suffix-edge-events>{JSON.stringify(events)}</output>
  <div hidden data-suffix-edge-command {@attach node => {
    const update = (event: Event) => {
      const action = (event as CustomEvent<{ type: string; count?: number; top?: number; left?: number }>).detail;
      if (action.type === 'count') values = keys.slice(0, action.count);
      else if (action.type === 'move-host') { top = action.top!; left = action.left!; }
    };
    node.addEventListener('suffixedgeupdate', update);
    return () => node.removeEventListener('suffixedgeupdate', update);
  }}></div>
</div>
