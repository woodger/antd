<script lang="ts">
  import {
    ConfigProvider, TreeSelect, type TreeSelectRef, type TreeSelectRootContext
  } from '@woodger/antd';
  import {
    treeSelectAlignFrameSamples,
    type TreeSelectAlignFrameAction
  } from './tree-select-align-frame-cases';

  let selected = $state(treeSelectAlignFrameSamples[0].id);
  let sample = $derived(treeSelectAlignFrameSamples.find(sample => sample.id === selected)!);
  let hostTop = $state(treeSelectAlignFrameSamples[0].top);
  let transform = $state('none');
  let rootKind = $state<'A' | 'B'>('A');
  let events = $state<unknown[][]>([]);
  let host = $state<HTMLDivElement>();
  let defaultRoot = $state<HTMLDivElement>();
  let buttonRoot = $state<HTMLButtonElement>();
  let control = $state<TreeSelectRef>();
  let root = $derived(buttonRoot ?? defaultRoot);
  const popupAlign = {};

  $effect(() => {
    hostTop = sample.top;
    transform = 'none';
    rootKind = 'A';
    events = [];
  });

  function record(...entry: unknown[]) {
    events = [...events, entry];
  }

  function update(action: TreeSelectAlignFrameAction) {
    if (action.type === 'transform') {
      transform = action.value;
    }
    else {
      rootKind = action.kind;
      hostTop = action.top;
    }
  }

  let common = $derived({
    value: null,
    open: true,
    style: 'width:220px',
    popupAlign,
    popupMatchSelectWidth: 300,
    treeData: [{ value: 'a', title: 'Alpha' }, { value: 'b', title: 'Beta' }],
    getPopupContainer: sample.container === 'host' ? () => host! : undefined,
    onOpenChange: (next: boolean) => record('open', next),
    onFocus: () => record('focus'),
    onBlur: () => record('blur'),
    onChange: (next: unknown) => record('change', next)
  });
  let hostStyle = $derived([
    'position:fixed;left:300px',
    `top:${hostTop}px`,
    'width:420px;height:160px;box-sizing:content-box',
    `transform:${transform};transform-origin:50% 50%`,
    'direction:ltr;font-family:initial;font-size:16px;line-height:normal'
  ].join(';'));
</script>

{#snippet buttonA(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-align-frame-root="A"
    {@attach context.register}>Root A</button>
{/snippet}
{#snippet buttonB(context: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} type="button" data-align-frame-root="B"
    {@attach context.register}>Root B</button>
{/snippet}

<div id="tree-select-align-frame-fixture">
  <label style="position:fixed;left:0;top:0;font:14px Arial;z-index:1">
    TreeSelect frame sample
    <select bind:value={selected}>
      {#each treeSelectAlignFrameSamples as sample}<option value={sample.id}>{sample.id}</option>{/each}
    </select>
  </label>
  <ConfigProvider
    style="direction:ltr;font-family:initial;font-size:16px;line-height:normal"
    theme={{ token: { motion: false }, cssVar: { key: 'tree-select-align-frame' } }}>
    {#key selected}
      <div data-align-frame-case={sample.id} data-align-frame-bound={Boolean(root && control)}
        bind:this={host} style={hostStyle}>
        {#if sample.slot === 'button'}
          <TreeSelect {...common}
            components={{ root: {
              render: rootKind === 'A' ? buttonA : buttonB,
              props: { style: 'width:220px;height:40px' }
            } }}
            bind:this={control} bind:nativeElement={buttonRoot} />
        {:else}
          <TreeSelect {...common} bind:this={control} bind:nativeElement={defaultRoot} />
        {/if}
        <output data-align-frame-events hidden>{JSON.stringify(events)}</output>
        <div data-align-frame-command hidden {@attach node => {
          const command = (event: Event) => update(
            (event as CustomEvent<TreeSelectAlignFrameAction>).detail
          );
          const refs = (event: Event) => Object.assign(
            (event as CustomEvent).detail, { root, control }
          );
          node.addEventListener('alignframeupdate', command);
          node.addEventListener('alignframerefs', refs);
          return () => {
            node.removeEventListener('alignframeupdate', command);
            node.removeEventListener('alignframerefs', refs);
          };
        }}></div>
      </div>
    {/key}
  </ConfigProvider>
  <div style="position:absolute;left:0;top:0;height:1600px;width:1px" aria-hidden="true"></div>
</div>

<style>
  :global(body) { margin:0;min-height:1600px; }
</style>
