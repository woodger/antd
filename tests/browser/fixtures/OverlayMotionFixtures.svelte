<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, Popconfirm, Popover, Tooltip } from '@woodger/antd';
  import reference from './ant-design-overlay-motion-reference.json';

  let { initialCase = 0 }: { initialCase?: number } = $props();
  let index = $state(untrack(() => initialCase));
  let ownerOpen = $state<boolean>();
  let disabled = $state(false);
  let mounted = $state(true);
  let events = $state.raw<Array<{ type: string; open: boolean } & ReturnType<typeof snapshot>>>([]);
  let animation = $state.raw<{ name: string; duration: number | undefined }>();
  let interrupted = $state.raw<ReturnType<typeof snapshot> & { events: typeof events }>();
  const profile = $derived(reference.cases[index].profile);

  const options = $derived({
    trigger: 'click' as const,
    placement: 'bottom' as const,
    rootClassName: 'motion-study-popup',
    defaultOpen: profile.mode === 'initial',
    forceRender: profile.mode === 'forced',
    destroyOnHidden: profile.mode === 'destroy',
    motion: profile.motionName !== undefined ? { motionName: profile.motionName } : undefined,
    onOpenChange: request,
    afterOpenChange: settled
  });

  function select(next: number) {
    index = next;
    disabled = false;
    mounted = true;
    events = [];
    animation = undefined;
    interrupted = undefined;
    ownerOpen = ['controlled', 'ignored', 'interrupted'].includes(profile.mode) ? false : undefined;
  }

  // Getter/setter binding allows the owner to reject requests to change the open.
  function ignoreOpenRequest() {}

  function snapshot() {
    const popup = document.querySelector('.motion-study-popup');
    return {
      mounted: Boolean(popup),
      visible: Boolean(popup?.matches(':popover-open')),
      payload: Boolean(popup?.querySelector('[data-motion-payload]'))
    };
  }

  function request(open: boolean) {
    events = [...events, { type: 'request', open, ...snapshot() }];
  }

  function settled(open: boolean) {
    events = [...events, { type: 'settled', open, ...snapshot() }];
  }

  function start(event: AnimationEvent) {
    const popup = event.target;
    if (animation || !(popup instanceof HTMLElement)
      || !popup.matches('.motion-study-popup:not([inert])')) {
      return;
    }

    const running = popup.getAnimations().find(item =>
      item instanceof CSSAnimation && item.animationName === event.animationName);
    const duration = running?.effect?.getTiming().duration;
    animation = { name: event.animationName, duration: typeof duration === 'number' ? duration : undefined };
    if (profile.mode === 'interrupted') {
      interrupted = { ...snapshot(), events };
      ownerOpen = false;
    }
  }
</script>

<style>
  :global(.study-pulse-enter-active), :global(.study-pulse-appear-active) {
    animation: studyPulseIn 160ms both;
  }

  :global(.study-pulse-leave-active) {
    animation: studyPulseOut 160ms both;
  }

  @keyframes -global-studyPulseIn {
    from {
      opacity: 0.3;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes -global-studyPulseOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.3;
    }
  }
</style>

{#snippet payload()}
  <span data-motion-payload>Panel payload</span>
  {#if profile.family === 'Popover'}<input aria-label="Popover editor" />{/if}
{/snippet}

{#snippet trigger()}
  <button type="button" id="motion-trigger">Toggle overlay</button>
{/snippet}

<section id="overlay-motion-fixture" onanimationstart={start}>
  <label>Overlay motion case
    <select onchange={event => select(Number(event.currentTarget.value))}>
      {#each reference.cases as sample, number}
        <option value={number}>{sample.profile.family} {sample.profile.mode}</option>
      {/each}
    </select>
  </label>
  <button type="button" onclick={() => { ownerOpen = true; }}>Open from owner</button>
  <button type="button" onclick={() => { ownerOpen = false; }}>Close from owner</button>
  <button type="button" onclick={() => { disabled = true; }}>Disable from owner</button>
  <button type="button" onclick={() => { mounted = false; }}>Remove overlay</button>
  <output hidden data-testid="motion-events">{JSON.stringify(events)}</output>
  <output hidden data-testid="motion-animation">{JSON.stringify(animation ?? null)}</output>
  <output hidden data-testid="motion-interrupted">{JSON.stringify(interrupted ?? null)}</output>

  <div style="margin:120px">
    {#if mounted}
      {#key index}
        <ConfigProvider theme={{ token: { motion: Boolean(profile.motion) } }}>
          {#if profile.family === 'Tooltip'}
            <Tooltip {...options} title={payload} {disabled}
              bind:open={() => ownerOpen, ignoreOpenRequest} children={trigger} />
          {:else if profile.family === 'Popover'}
            <Popover {...options} title="Popover panel" content={payload} {disabled}
              bind:open={() => ownerOpen, ignoreOpenRequest} children={trigger} />
          {:else}
            <Popconfirm {...options} title={payload} {disabled}
              bind:open={() => ownerOpen, ignoreOpenRequest} children={trigger} />
          {/if}
        </ConfigProvider>
      {/key}
    {/if}
  </div>
</section>
