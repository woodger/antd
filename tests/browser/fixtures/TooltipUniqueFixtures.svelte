<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Popover, Slider, Tooltip, TypographyText, type TooltipRef
  } from '@woodger/antd';
  import reference from './ant-design-tooltip-unique-reference.json';

  let { initialMode = 'switch' }: { initialMode?: string; } = $props();
  let mode = $state(untrack(() => initialMode));
  let target = $state('none');
  let removed = $state(false);
  let alternateTheme = $state(false);
  let refA = $state<TooltipRef>();
  let refB = $state<TooltipRef>();
  let getterCalls = $state(0);
  let events = $state<Array<{ id: string; type: string; open: boolean; }>>([]);

  const controlled = $derived(mode === 'controlled' || mode === 'nested-providers');
  const motion = $derived(mode === 'animated-switch' || mode === 'animated-cancel');
  const enter = $derived(mode === 'delays' ? 0.12 : 0);
  const leave = $derived(mode === 'delays' ? 0.07 : 0);

  function record(id: string, type: string, open: boolean) {
    events.push({ id, type, open });
  }

  function container(trigger: HTMLElement) {
    untrack(() => getterCalls++);
    return trigger.ownerDocument.querySelector<HTMLElement>('#unique-requested-container')
      ?? trigger.ownerDocument.body;
  }

  function inspectRef(ref: TooltipRef | undefined) {
    return ref?.popupElement?.id ?? null;
  }

  function select(next: string) {
    mode = next;
    target = 'none';
    removed = false;
    alternateTheme = false;
    getterCalls = 0;
    events = [];
  }
</script>

{#snippet item(id: 'a' | 'b')}
  {#if !removed || id !== 'a'}
    {#snippet title()}<span data-study-content={id}>Payload {id}</span>{/snippet}
    <Tooltip {title}
      bind:ref={() => id === 'a' ? refA : refB, value => { if (id === 'a') refA = value; else refB = value; }}
      id={`external-id-${id}`}
      rootClassName="study-unique-popup"
      placement={id === 'a' ? 'top' : 'bottom'}
      color={id === 'a' ? 'blue' : '#8030a0'}
      prefixCls={mode === 'prefix' && id === 'a' ? 'owner-tip' : undefined}
      unique={mode === 'opt-out' && id === 'b' ? false : undefined}
      open={controlled ? target === id || target === 'both' : undefined}
      defaultOpen={mode === 'default-open' && id === 'a'}
      mouseEnterDelay={enter} mouseLeaveDelay={leave}
      getPopupContainer={container}
      onOpenChange={open => record(id, 'request', open)}
      afterOpenChange={open => record(id, 'settled', open)}>
      <button type="button" id={`unique-trigger-${id}`}>Trigger {id}</button>
    </Tooltip>
  {/if}
{/snippet}

{#snippet themed(id: 'a' | 'b')}
  {#snippet title()}<TypographyText>Theme for {id}</TypographyText>{/snippet}
  <ConfigProvider prefixCls={id === 'a' ? 'inner-a' : 'inner-b'}
    theme={{ token: { motion: false, colorBgSpotlight: id === 'b' ? '#39a344'
      : alternateTheme ? '#ba4554' : '#374293' } }}>
    <Tooltip {title} mouseEnterDelay={0} mouseLeaveDelay={0}
      id={`theme-popup-${id}`} rootClassName="study-unique-popup">
      <button type="button" id={`unique-trigger-${id}`}>Trigger {id}</button>
    </Tooltip>
  </ConfigProvider>
{/snippet}

<style>
  .triggers { display: flex; gap: 160px; margin: 160px 0 120px 90px; }
</style>

<section id="tooltip-unique-fixture">
  <label>Unique case <select value={mode} onchange={event => select(event.currentTarget.value)}>
    {#each reference.cases as { profile }}<option value={profile.mode}>{profile.mode}</option>{/each}
    <option value="theme">theme</option>
    <option value="consumers">consumers</option>
    <option value="consumers-opt-out">consumers-opt-out</option>
  </select></label>
  <button type="button" onclick={() => { target = 'a'; }}>Open A</button>
  <button type="button" onclick={() => { target = 'b'; }}>Open B</button>
  <button type="button" onclick={() => { target = 'both'; }}>Open both</button>
  <button type="button" onclick={() => { target = 'none'; }}>Close both</button>
  <button type="button" onclick={() => { removed = true; }}>Remove A</button>
  <button type="button" onclick={() => { alternateTheme = true; }}>Retheme A</button>
  <button type="button" id="unique-outside">Outside</button>
  <output data-testid="unique-events" hidden>{JSON.stringify(events)}</output>
  <output data-testid="unique-getters" hidden>{getterCalls}</output>
  <output data-testid="unique-refs" hidden>{JSON.stringify([inspectRef(refA), inspectRef(refB)])}</output>
  <div id="unique-requested-container"></div>

  {#key mode}
    <ConfigProvider prefixCls={mode === 'prefix' ? 'suite' : undefined} theme={{ token: { motion } }}
      tooltip={{ mouseEnterDelay: enter, mouseLeaveDelay: leave }}>
      <Tooltip.UniqueProvider>
        <div class="triggers">
          {#if mode === 'nested-providers'}
            {@render item('a')}
            <Tooltip.UniqueProvider>{@render item('b')}</Tooltip.UniqueProvider>
          {:else if mode === 'nested-popup'}
            {#snippet panel()}{@render item('a')}{/snippet}
            <Popover trigger="click" title="Parent overlay" content={panel}>
              <button type="button" id="unique-parent">Parent trigger</button>
            </Popover>
          {:else if mode === 'theme'}
            {@render themed('a')}{@render themed('b')}
          {:else if mode === 'consumers' || mode === 'consumers-opt-out'}
            {@const unique = mode === 'consumers-opt-out' ? false : undefined}
            <TypographyText class="unique-ellipsis-trigger" style="display:block;width:65px"
              ellipsis={{ tooltip: { title: 'Text payload', unique } }}>
              This label visibly overflows
            </TypographyText>
            <Slider defaultValue={34} tooltip={{ open: true, unique }} />
          {:else}
            {@render item('a')}{@render item('b')}
          {/if}
        </div>
      </Tooltip.UniqueProvider>
    </ConfigProvider>
  {/key}
</section>
