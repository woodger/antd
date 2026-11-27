<script lang="ts">
  import { ConfigProvider, Popconfirm, Tooltip } from '@woodger/antd';

  type Profile = 'default' | 'custom' | 'shared';
  type Click = {
    target: string;
    currentTargetIsPopup: boolean;
    defaultPrevented: boolean;
  };

  let profile = $state<Profile>('default');
  let target = $state<HTMLDivElement>();
  const events = $state<Array<string | Click>>([]);

  /** Fixes the nested handler and result preventDefault before revolving. */
  function preventDefault(event: MouseEvent) {
    events.push('prevented');
    event.preventDefault();
  }

  /** Stops the click on the child, keeping his own action. */
  function stopPropagation(event: MouseEvent) {
    events.push('stopped');
    event.stopPropagation();
  }

  /** Removes the delegated click and notes the owner when changing the common panel. */
  function recordClick(event: MouseEvent, second: boolean) {
    const clicked = event.target instanceof Element
      ? event.target.closest('[data-click-role]') : null;
    const popup = event.currentTarget;

    if (second) events.push('second-owner');
    events.push({
      target: clicked?.getAttribute('data-click-role') ?? 'container',
      currentTargetIsPopup: popup instanceof Element && popup.classList.contains('click-study-popup'),
      defaultPrevented: event.defaultPrevented
    });
  }

  /** An explicit container is located outside the first Popconfirm. */
  function container(trigger: HTMLElement) {
    return target ?? trigger.ownerDocument.body;
  }
</script>

<style>
  .triggers {
    display: flex;
    gap: 120px;
    margin: 170px 0 40px 80px;
  }
</style>

{#snippet confirmation(second = false)}
  {#snippet title()}<span data-click-role={second ? 'second-title' : 'title'}>
    {second ? 'Second fixture action' : 'Confirm fixture action'}
  </span>{/snippet}
  {#snippet description()}
    <div>
      <button type="button" data-click-role="prevented" onclick={preventDefault}>Prevent default</button>
      <button type="button" data-click-role="stopped" onclick={stopPropagation}>Stop propagation</button>
    </div>
  {/snippet}
  <Popconfirm {title} {description} rootClassName="click-study-popup"
    unique={profile === 'shared'} getPopupContainer={profile === 'custom' ? container : undefined}
    onOpenChange={open => events.push(open ? 'open' : 'close')}
    onConfirm={() => { events.push('confirm'); }}
    onCancel={() => { events.push('cancel'); }}
    onPopupClick={event => recordClick(event, second)}
    okText="Confirm action" cancelText="Cancel action"
    okButtonProps={{ 'data-click-role': 'confirm' }}
    cancelButtonProps={{ 'data-click-role': 'cancel' }}>
    <button type="button">{second ? 'Open second confirmation' : 'Open confirmation'}</button>
  </Popconfirm>
{/snippet}

<section id="popconfirm-popup-click-fixture">
  <label>Popup click profile <select bind:value={profile}>
    <option value="default">Default</option>
    <option value="custom">Custom</option>
    <option value="shared">Shared</option>
  </select></label>
  <output data-testid="popup-click-events" hidden>{JSON.stringify(events)}</output>
  <div id="click-study-target" bind:this={target}></div>

  <ConfigProvider theme={{ token: { motion: false } }}>
    <div class="triggers">
      {#if profile === 'shared'}
        <Tooltip.UniqueProvider>
          {@render confirmation()}
          {@render confirmation(true)}
        </Tooltip.UniqueProvider>
      {:else}
        {@render confirmation()}
      {/if}
    </div>
  </ConfigProvider>
</section>
