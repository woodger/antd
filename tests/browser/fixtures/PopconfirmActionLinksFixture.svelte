<script lang="ts">
  import { ConfigProvider, Popconfirm } from '@woodger/antd';

  const profiles = ['links', 'disabled', 'empty', 'pending', 'native', 'switch'];
  let profile = $state('links');
  let href = $state<string>();
  let events = $state<Array<string | [string, string, string]>>([]);
  let resolveAction: (() => void) | undefined;
  let okHref = $derived.by(() => {
    if (profile === 'switch') return href;
    return profile === 'empty' ? '' : '#confirmed';
  });

  /** Сбрасывает историю и условный href перед следующим сценарием. */
  function select(next: string) {
    profile = next;
    href = undefined;
    events = [];
  }

  /** Записывает действие и оставляет Promise открытым до сигнала теста. */
  function confirm() {
    events.push('confirm');
    if (profile === 'pending') {
      return new Promise<void>(resolve => { resolveAction = resolve; });
    }
  }

  /** Завершает ожидающее подтверждение, если оно ещё открыто. */
  function finish() {
    resolveAction?.();
    resolveAction = undefined;
  }

  /** Читает свойство ссылки с фактического currentTarget. */
  function recordLink(part: string, target: HTMLAnchorElement) {
    events.push([part, target.localName, target.hash]);
  }

  /** Записывает цель, когда условный href может создавать кнопку или ссылку. */
  function recordOk(part: string, target: HTMLButtonElement | HTMLAnchorElement) {
    if (target instanceof HTMLAnchorElement) {
      recordLink(part, target);
      return;
    }
    events.push([part, target.localName, '']);
  }
</script>

<style>
  .stage { margin: 160px 0 70px 110px; }
</style>

<section id="popconfirm-action-links-fixture">
  <label>Link profile <select value={profile} onchange={event => select(event.currentTarget.value)}>
    {#each profiles as option}<option value={option}>{option}</option>{/each}
  </select></label>
  {#if profile === 'pending'}<button type="button" onclick={finish}>Resolve link action</button>{/if}
  {#if profile === 'switch'}
    <button type="button" onclick={() => { href = '#confirmed'; }}>Set href</button>
  {/if}
  <output data-testid="popconfirm-link-events" hidden>{JSON.stringify(events)}</output>
  <ConfigProvider theme={{ token: { motion: false } }}>
    <div class="stage">
      {#key profile}
        <Popconfirm title="Review links" okText="Confirm link" cancelText="Cancel link"
          okButtonProps={{
            href: okHref,
            disabled: profile === 'disabled',
            target: '_self',
            rel: 'bookmark',
            onClick: event => {
              recordOk('ok', event.currentTarget);
              if (profile === 'pending') event.preventDefault();
            },
            onclick: profile === 'native' ? event => {
              recordOk('ok-native', event.currentTarget);
              event.preventDefault();
            } : undefined
          }}
          cancelButtonProps={{
            href: '#cancelled',
            target: '_self',
            rel: 'bookmark',
            onClick: event => recordLink('cancel-button', event.currentTarget)
          }}
          onConfirm={confirm}
          onCancel={() => { events.push('cancel'); }}
          onOpenChange={open => events.push(open ? 'open' : 'close')}
          onPopupClick={event => events.push(event.defaultPrevented ? 'popup-prevented' : 'popup')}>
          <button type="button">Open links</button>
        </Popconfirm>
      {/key}
    </div>
  </ConfigProvider>
  <div id="confirmed"></div>
  <div id="cancelled"></div>
</section>
