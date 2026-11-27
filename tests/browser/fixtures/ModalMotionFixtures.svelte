<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import {
    ConfigProvider, Modal, ModalHolder, createModal, type ModalConfirmHandle,
    type ModalMousePosition
  } from '@woodger/antd';
  import reference from './ant-design-modal-motion-reference.json';

  let {
    profile = 'pointer', lifetime = false, initiallyOpen = false
  }: { profile?: string; lifetime?: boolean; initiallyOpen?: boolean; } = $props();

  interface Profile {
    id: string;
    delay?: number;
    motion?: boolean;
    transitionName?: string;
    maskTransitionName?: string;
    mousePosition?: ModalMousePosition | null;
    forceRender?: boolean;
    destroyOnHidden?: boolean;
    inline?: boolean;
  }
  const sample: Profile | undefined = untrack(() => {
    const cases = lifetime ? reference.lifetimes : [...reference.cases, ...reference.special];
    return cases.find(item => item.profile.id === profile)?.profile;
  });
  const withUpper = $derived(profile === 'covered' || profile === 'raised');
  const hasCustomNames = untrack(() =>
    ['confirm', 'nested', 'live-mask', 'covered', 'raised'].includes(profile));
  const confirmation = untrack(() => profile === 'confirm' || profile === 'confirm-stock');
  let transitionName = $state(sample?.transitionName ?? (hasCustomNames ? 'probe-panel' : undefined));
  let maskTransitionName = $state(sample?.maskTransitionName
    ?? (hasCustomNames ? 'probe-mask' : undefined));
  let motion = $state(sample?.motion ?? true);
  let maskEnabled = $state(untrack(() => profile !== 'raised'));
  let open = $state(untrack(() => initiallyOpen));
  let upperOpen = $state(false);
  let mounted = $state(true);
  let openerClicks = $state(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let handle: ModalConfirmHandle | undefined;
  const modal = createModal();
  type AnimationRecord = { name: string; role: 'panel' | 'mask'; duration: string | number | null; };
  type MotionEvent = 'close' | [boolean, string | null, boolean] | ['close', boolean, boolean, boolean];
  let callbacks = $state<MotionEvent[]>([]);
  let animations = $state<AnimationRecord[]>([]);
  let point = $state<[number, number]>();

  onDestroy(() => clearTimeout(timer));

  function confirm() {
    handle = modal.confirm({
      class: 'motion-probe',
      title: 'Motion probe',
      centered: false,
      width: 520,
      content: body,
      transitionName,
      maskTransitionName,
      mousePosition: sample?.mousePosition,
      afterClose,
      afterOpenChange
    });
  }

  function show(event: MouseEvent) {
    point = [event.pageX, event.pageY];
    openerClicks++;
    if (confirmation) {
      confirm();
    }
    else if (sample?.delay) {
      clearTimeout(timer);
      timer = setTimeout(() => { open = true; }, sample.delay);
    }
    else {
      open = true;
    }
  }

  function requestClose() {
    if (confirmation) handle?.destroy();
    else open = false;
  }

  function changeNames() {
    transitionName = 'probe-swap';
    maskTransitionName = 'probe-mask';
    handle?.update({ transitionName, maskTransitionName });
  }

  function visibleMask() {
    return document.querySelector('dialog.motion-probe [data-ant-modal-mask]');
  }

  function afterClose() {
    if (lifetime) {
      callbacks.push(['close', Boolean(document.getElementById('motion-editor')),
        Boolean(visibleMask()), document.activeElement?.id === 'motion-probe-open']);
    }
    else {
      callbacks.push('close');
    }
  }

  function afterOpenChange(visible: boolean) {
    const dialog = document.querySelector('dialog.motion-probe');
    const panel = dialog?.querySelector<HTMLElement>('[data-ant-modal-panel]');
    const mask = visibleMask();
    const moving = mask ? mask.getAnimations().length > 0
      : Boolean(dialog?.getAnimations({ subtree: true }).some(animation => {
        const effect = animation.effect;
        return effect instanceof KeyframeEffect && effect.pseudoElement === '::backdrop';
      }));

    callbacks.push([visible, panel?.style.transformOrigin ?? null, moving]);
  }

  function recordMotion(event: AnimationEvent | TransitionEvent) {
    const node = event.target;
    if (!(node instanceof HTMLElement) || !node.closest('dialog.motion-probe')) {
      return;
    }
    const role = node.hasAttribute('data-ant-modal-panel') ? 'panel'
      : node.hasAttribute('data-ant-modal-mask') ? 'mask' : undefined;
    if (!role) {
      return;
    }
    const cssName = 'animationName' in event ? event.animationName : event.propertyName;
    const animation = node.getAnimations().find(item =>
      (item instanceof CSSAnimation && item.animationName === cssName)
      || (item instanceof CSSTransition && item.transitionProperty === cssName));
    const duration = animation?.effect?.getTiming().duration;
    const recordedDuration = typeof duration === 'number' ? duration : duration?.toString() ?? null;
    const name = cssName.match(/ant(?:Zoom|Fade)(In|Out)$/)?.[0] ?? cssName;
    animations.push({ name, role, duration: recordedDuration });
  }
</script>

<style>
  #motion-probe-open {
    position: fixed;
    left: 60px;
    top: 180px;
  }
  :global(.probe-panel-appear-active), :global(.probe-panel-enter-active) {
    animation: panel-slide .18s linear both;
  }
  :global(.probe-panel-leave-active) { animation: panel-end .12s linear both; }
  /* Разводим окончания панели и штатной маски на несколько кадров браузера. */
  :global(.probe-panel-long-appear-active), :global(.probe-panel-long-enter-active) {
    animation: panel-slide .36s linear both;
  }
  :global(.probe-panel-long-leave-active) { animation: panel-end .08s linear both; }
  :global(.probe-mask-appear-active), :global(.probe-mask-enter-active) {
    animation: mask-enter .26s linear both;
  }
  :global(.probe-mask-leave-active) { animation: mask-end .30s linear both; }
  :global(.probe-swap-leave-active) { animation: panel-swap .24s linear both; }
  :global(.probe-transition-appear), :global(.probe-transition-enter) { opacity: 0; }
  :global(.probe-transition-appear-active), :global(.probe-transition-enter-active) {
    opacity: 1;
    transition: opacity .18s linear;
  }
  :global(.probe-transition-leave) { opacity: 1; }
  :global(.probe-transition-leave-active) {
    opacity: 0;
    transition: opacity .12s linear;
  }
  @keyframes -global-panel-slide {
    from {
      transform: translateY(-30px);
    }
    to {
      transform: translateY(0);
    }
  }
  @keyframes -global-panel-end {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-30px);
    }
  }
  @keyframes -global-mask-enter {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes -global-mask-end {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes -global-panel-swap {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(40px);
    }
  }
</style>

<svelte:document onanimationstart={recordMotion} ontransitionstart={recordMotion} />

{#snippet body()}
  <input id="motion-editor" aria-label="Motion editor" value="Seed" />
  {#if withUpper}
    <button type="button" onclick={() => upperOpen = true}>Open upper dialog</button>
  {/if}
{/snippet}

{#snippet opener()}
  <button id="motion-probe-open" type="button" onclick={show}>Open motion</button>
{/snippet}

{#snippet panel()}
  <Modal
    bind:open title="Motion probe" footer={null} class="motion-probe" centered={false}
    {transitionName} {maskTransitionName} mousePosition={sample?.mousePosition}
    mask={maskEnabled}
    forceRender={sample?.forceRender} destroyOnHidden={sample?.destroyOnHidden}
    getContainer={sample?.inline ? false : undefined} {afterClose} {afterOpenChange}
  >
    {@render body()}
  </Modal>
{/snippet}

<button id="motion-close-request" type="button" onclick={requestClose}>Request close</button>
<button id="motion-reset-names" type="button" onclick={changeNames}>Change motion name</button>
<button id="motion-disable" type="button" onclick={() => motion = false}>Disable motion</button>
<button id="motion-mask-toggle" type="button" onclick={() => maskEnabled = !maskEnabled}>Toggle mask</button>
<button id="motion-unmount" type="button" onclick={() => mounted = false}>Unmount motion</button>
<output id="motion-callbacks">{JSON.stringify(callbacks)}</output>
<output id="motion-animations">{JSON.stringify(animations)}</output>
<output id="motion-point">{JSON.stringify(point ?? null)}</output>
<output id="motion-opener-clicks">{openerClicks}</output>
<ConfigProvider theme={{ token: { motion } }}>
  {#if profile === 'nested'}
    <Modal open title="Motion host" footer={null} class="motion-host">
      {@render opener()}
      {#if mounted}{@render panel()}{/if}
    </Modal>
  {:else}
    {@render opener()}
    {#if mounted}
      {#if confirmation}
        <ModalHolder {modal} />
      {:else if profile !== 'conditional' || open}
        {@render panel()}
      {/if}
    {/if}
  {/if}
  {#if withUpper}
    <Modal open={upperOpen} title="Upper dialog" class="motion-upper" closable={false} footer={null}>
      <input aria-label="Upper editor" />
    </Modal>
  {/if}
</ConfigProvider>
