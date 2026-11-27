<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, Popconfirm, Popover, Tooltip, type PopoverRef } from '@woodger/antd';
  import reference from './ant-design-tooltip-unique-delegates-reference.json';

  let { initialMode = 'popover-default' }: { initialMode?: string; } = $props();
  let mode = $state(untrack(() => initialMode));
  let events = $state<Array<{ id: string; type: string; open: boolean; }>>([]);
  let getterCalls = $state(0);
  let openA = $state(false);
  let openB = $state(false);
  let refA = $state<PopoverRef>();
  let refB = $state<PopoverRef>();
  let resolveConfirm: (() => void) | undefined;

  function select(nextMode: string) {
    mode = nextMode;
    events = [];
    getterCalls = 0;
    openA = false;
    openB = false;
  }

  function container(trigger: HTMLElement) {
    untrack(() => getterCalls++);
    return trigger.ownerDocument.querySelector<HTMLElement>('#delegate-requested-container')
      ?? trigger.ownerDocument.body;
  }

  function record(id: string, type: string, open: boolean) {
    events.push({ id, type, open });
  }

  function confirm() {
    return new Promise<void>(resolve => { resolveConfirm = resolve; });
  }

  function finish() {
    resolveConfirm?.();
    resolveConfirm = undefined;
  }

  function writeRef(id: 'a' | 'b', ref: PopoverRef | undefined) {
    if (id === 'a') {
      refA = ref;
    }
    else {
      refB = ref;
    }
  }
</script>

{#snippet item(id: 'a' | 'b')}
  {@const click = mode === 'keyboard' || mode === 'pending' || mode === 'default-open'}
  {@const controlled = mode === 'controlled'}
  {@const options = {
    id: `external-id-${id}`,
    rootClassName: 'study-delegate-popup',
    placement: id === 'a' ? 'top' as const : 'bottom' as const,
    color: mode === 'mixed-opt-in' && id === 'a' ? undefined : id === 'a' ? 'blue' : '#8030a0',
    trigger: controlled ? [] : click ? 'click' as const : 'hover' as const,
    mouseEnterDelay: 0,
    mouseLeaveDelay: 0,
    getPopupContainer: container,
    onOpenChange: (open: boolean) => record(id, 'request', open),
    afterOpenChange: (open: boolean) => record(id, 'settled', open)
  }}
  {#snippet trigger()}<button id={`unique-delegate-${id}`} type="button">Trigger {id}</button>{/snippet}
  {#snippet payload()}
    <span data-study-content={id}>Payload {id}</span>
    {#if mode === 'keyboard' || mode === 'default-open' || controlled}
      <label>Value {id}<input value={`draft ${id}`} /></label>
    {/if}
  {/snippet}
  {#if mode === 'mixed-opt-in' && id === 'a'}
    <Tooltip {...options} title={payload} children={trigger} />
  {:else if mode === 'popconfirm-opt-in' || mode === 'pending'}
    <Popconfirm {...options}
      unique
      title={payload}
      description={`Confirm description ${id}`}
      okText={`Confirm ${id}`}
      cancelText={`Cancel ${id}`}
      onConfirm={mode === 'pending' && id === 'a' ? confirm : undefined}
      bind:ref={() => id === 'a' ? refA : refB, ref => writeRef(id, ref)}
      children={trigger} />
  {:else}
    <Popover {...options}
      unique={mode === 'popover-default' ? undefined : true}
      open={controlled ? id === 'a' ? openA : openB : undefined}
      defaultOpen={mode === 'default-open' && id === 'a'}
      title={`Dialog ${id}`}
      content={payload}
      bind:ref={() => id === 'a' ? refA : refB, ref => writeRef(id, ref)}
      children={trigger} />
  {/if}
{/snippet}

<style>
  .triggers {
    display: flex;
    gap: 160px;
    margin: 160px 0 120px 90px;
  }
</style>

<section id="tooltip-unique-delegate-fixture">
  <label>Delegate case <select value={mode} onchange={event => select(event.currentTarget.value)}>
    {#each reference.cases as { profile }}<option value={profile.mode}>{profile.mode}</option>{/each}
    <option value="keyboard">keyboard</option>
    <option value="pending">pending</option>
    <option value="default-open">default-open</option>
    <option value="controlled">controlled</option>
  </select></label>
  {#if mode === 'controlled'}
    <button type="button" onclick={() => { openA = true; }}>Open A</button>
    <button type="button" onclick={() => { openB = true; }}>Open B</button>
  {:else if mode === 'pending'}<button type="button" onclick={finish}>Resolve confirmation</button>{/if}
  <button id="unique-delegate-outside" type="button">Outside</button>
  <output data-testid="delegate-events" hidden>{JSON.stringify(events)}</output>
  <output data-testid="delegate-getters" hidden>{getterCalls}</output>
  <output data-testid="delegate-refs" hidden>{JSON.stringify([
    refA?.popupElement?.id ?? null, refB?.popupElement?.id ?? null
  ])}</output>
  <div id="delegate-requested-container"></div>

  {#key mode}
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Tooltip.UniqueProvider>
        <div class="triggers">{@render item('a')}{@render item('b')}</div>
      </Tooltip.UniqueProvider>
    </ConfigProvider>
  {/key}
</section>
