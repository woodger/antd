<script lang="ts">
  import { ConfigProvider, Popconfirm, type PopconfirmProps } from '@woodger/antd';
  import type { Snippet } from 'svelte';
  import reference from './ant-design-popconfirm-action-content-reference.json';

  type Appearance = Pick<PopconfirmProps, 'okText' | 'cancelText' | 'icon' | 'okType' | 'okButtonProps'>;
  const appearances: Partial<Record<string, Appearance>> = {
    null: { okText: null, cancelText: null, icon: null },
    empty: { okText: '', cancelText: '', icon: '' },
    zero: { okText: 0, cancelText: 0, icon: 0 },
    boolean: { okText: false, cancelText: true, icon: false },
    numeric: { okText: 42, cancelText: -1, icon: 7 },
    danger: { okType: 'danger', icon: '!' },
    'danger-primary': { okType: 'danger', okButtonProps: { type: 'primary' } },
    'danger-override': { okType: 'danger', okButtonProps: { danger: false, type: 'dashed' } },
    'danger-pair': { okType: 'danger', okButtonProps: { color: 'purple', variant: 'filled' } }
  };
  const defaultAppearance: Appearance = {};
  const profiles = [
    ...reference.cases.map(sample => sample.profile),
    'events', 'pending', 'native-events', 'failure', 'cache', 'fresh'
  ];
  const locale = { popconfirm: { okText: 'Locale confirm', cancelText: 'Locale cancel' } };

  let profile = $state('defaults');
  let updated = $state(false);
  let events = $state<string[]>([]);
  let resolveAction: (() => void) | undefined;
  let actionProfile = $derived(['events', 'pending', 'native-events', 'failure'].includes(profile));
  let cacheProfile = $derived(profile === 'cache' || profile === 'fresh');
  let nativeEvents = $derived(profile === 'native-events');
  let appearance = $derived(appearances[profile] ?? defaultAppearance);

  /** Начинает следующий сценарий с новым экземпляром Popconfirm и чистым журналом. */
  function changeProfile(next: string) {
    profile = next;
    updated = false;
    events = [];
  }

  /** Записывает вызов до ожидания или передачи ошибки контроллеру Popconfirm. */
  function confirm() {
    events.push('confirm');
    if (profile === 'failure') {
      throw new Error('Fixture failure');
    }
    if (profile === 'pending') {
      return new Promise<void>(resolve => { resolveAction = resolve; });
    }
  }

  /** Завершает подтверждение только по сигналу теста. */
  function finish() {
    resolveAction?.();
    resolveAction = undefined;
  }

  /** Помечает фазу обработчика и позволяет проверить defaultPrevented на корне. */
  function recordButton(event: MouseEvent, name: string) {
    events.push(name);
    event.preventDefault();
  }

  /** Выбирает другой Snippet при обновлении содержимого скрытой карточки. */
  function selectLabel(original: Snippet, replacement: Snippet) {
    if (profile === 'rich') {
      return original;
    }
    if (cacheProfile) {
      return updated ? replacement : original;
    }
    return appearance.okText;
  }

  let okEvents: NonNullable<PopconfirmProps['okButtonProps']> = $derived({
    onClick: event => recordButton(event, 'ok-button'),
    onclick: nativeEvents ? event => recordButton(event, 'ok-native') : undefined
  });
  let cancelEvents: NonNullable<PopconfirmProps['cancelButtonProps']> = $derived({
    onClick: event => recordButton(event, 'cancel-button'),
    onclick: nativeEvents ? event => recordButton(event, 'cancel-native') : undefined
  });
</script>

<style>
  .stage { margin: 160px 0 70px 110px; }
</style>

{#snippet richOk()}<strong data-action-rich="ok">Keep changes</strong>{/snippet}
{#snippet richCancel()}<em data-action-rich="cancel">Discard changes</em>{/snippet}
{#snippet richIcon()}<small data-action-rich="icon">!</small>{/snippet}
{#snippet changedOk()}<strong data-action-rich="updated">Save draft</strong>{/snippet}

<section id="popconfirm-action-content-fixture">
  <label>Action profile <select value={profile} onchange={event => changeProfile(event.currentTarget.value)}>
    {#each profiles as option}<option value={option}>{option}</option>{/each}
  </select></label>
  {#if profile === 'pending'}<button type="button" onclick={finish}>Resolve action</button>{/if}
  {#if cacheProfile}
    <button type="button" onclick={() => { updated = true; }}>Replace action content</button>
  {/if}
  <output data-testid="popconfirm-action-events" hidden>{JSON.stringify(events)}</output>

  <ConfigProvider {locale} theme={{ token: { motion: false } }}>
    <div class="stage">
      {#key profile}
        <Popconfirm title="Review fixture changes" defaultOpen={!actionProfile}
          okText={selectLabel(richOk, changedOk)}
          cancelText={profile === 'rich' ? richCancel : appearance.cancelText}
          icon={profile === 'rich' ? richIcon : appearance.icon}
          okType={appearance.okType} okButtonProps={actionProfile ? okEvents : appearance.okButtonProps}
          cancelButtonProps={actionProfile ? cancelEvents : undefined}
          fresh={profile === 'fresh'} onConfirm={confirm}
          onCancel={() => { events.push('cancel'); }}
          onError={() => { events.push('error'); }}
          onOpenChange={open => events.push(open ? 'open' : 'close')}
          onPopupClick={event => events.push(event.defaultPrevented ? 'popup-prevented' : 'popup')}>
          <button type="button">Open review</button>
        </Popconfirm>
      {/key}
    </div>
  </ConfigProvider>
</section>
