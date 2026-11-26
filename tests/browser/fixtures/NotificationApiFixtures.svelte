<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import {
    App, ConfigProvider, NotificationHolder, createNotification, enUS,
    type AppInstance, type NotificationOptions, type NotificationSemanticName,
    type NotificationSemanticProps
  } from '@woodger/antd';
  import AppConsumer from './AppConsumer.svelte';
  import type { NotificationProbe } from './notification-api-probe';

  let { kind: scenario }: { kind: string; } = $props();
  const kind = untrack(() => scenario);
  const motionless = { token: { motion: false } };
  let target = $state('target-one');
  let firstTarget = $derived(target === 'target-one');
  const slots: readonly NotificationSemanticName[] = [
    'list', 'listContent', 'root', 'wrapper', 'icon', 'section', 'title',
    'description', 'actions', 'close', 'progress'
  ];
  const options: NotificationOptions = {
    duration: false,
    top: kind === 'portal' ? 43 : undefined,
    bottom: kind === 'portal' ? 0 : undefined,
    prefixCls: kind === 'portal' ? 'portal-notification' : undefined,
    getContainer: kind === 'portal' ? readTarget : undefined,
    maxCount: kind === 'placement' ? 2 : undefined,
    showProgress: kind === 'progress' ? true : undefined,
    stack: kind === 'stack-disabled' ? false : undefined,
    ...(kind === 'semantics' && semantics('holder'))
  };
  const provider = kind === 'semantics'
    ? { ...semantics('provider'), class: 'provider-extra', style: '--inline-provider:root' }
    : kind === 'closable' ? { closeIcon: 'Provider' } : undefined;
  const api = createNotification(options);
  let instance = api;
  const probe: NotificationProbe = {
    events: [], containers: [], arguments: {},
    finish: () => instance.destroy(),
    move: () => { target = 'target-two'; }
  };
  window.notificationProbe = probe;
  onMount(() => {
    if (kind !== 'app') launch();
  });

  /** Замеряет arity обоих способов получить реальный DOM container. */
  function readTarget(...args: unknown[]) {
    probe.containers.push([target, args.length]);
    const node = document.getElementById(target);
    if (!node) {
      throw new Error(`Missing Notification fixture target: ${target}`);
    }
    return node;
  }

  /** Снимает только поля, которые участвуют в исходном замере props. */
  function record(name: string, props: NotificationSemanticProps) {
    probe.arguments[name] = {
      title: props.title, key: props.key, duration: props.duration,
      placement: props.placement, top: props.top, showProgress: props.showProgress
    };
  }

  /** У каждого слоя уникальные классы и значения, чтобы проверять их приоритет. */
  function semantics(layer: string) {
    return {
      classNames({ props }: { props: NotificationSemanticProps; }) {
        record(`${layer}Classes`, props);
        return Object.fromEntries(slots.map(slot => [slot, `${layer}-${slot}`]));
      },
      styles({ props }: { props: NotificationSemanticProps; }) {
        record(`${layer}Styles`, props);
        return Object.fromEntries(slots.map(slot => [slot, `--winner:${layer};--${layer}:${slot}`]));
      }
    };
  }

  /** Фиксирует callback конкретного владельца и не скрывает повторные вызовы. */
  function track(event: string) {
    return () => { probe.events.push(event); };
  }

  function launch() {
    if (kind === 'semantics') {
      api.warning({
        key: 0, title: 'Decorated', description: 'Description', icon: customIcon, actions,
        ...semantics('notice'), class: 'notice-extra',
        style: '--winner:inline;--inline-local:root',
        props: { id: 'semantic-notice', title: 'Native title', 'aria-label': 'Native name' },
        onClick: event => probe.events.push(['click', event.currentTarget.tagName]),
        onClose: track('notice-close')
      });
    }
    else if (kind === 'closable') {
      api.info({ title: 'Inherited' });
      api.open({ title: 'Without close', closable: false });
      api.open({
        title: 'Local close', closeIcon: 'Local', onClose: track('notice-close'),
        closable: { 'aria-label': 'Local close button', onClose: track('button-close') }
      });
    }
    else if (kind === 'placement') {
      api.info({ title: 'One', placement: 'topLeft', onClose: track('evicted') });
      api.info({ title: 'Two', placement: 'topRight' });
      api.open({ title: 'Three', placement: 'bottomLeft', role: 'status' });
    }
    else if (kind === 'stack-default' || kind === 'stack-disabled') {
      for (const title of ['One', 'Two', 'Three', 'Four']) api.info({ title });
    }
    else if (kind === 'progress') {
      api.info({
        title: 'Timed', duration: 2, onClose: track('timer-close'),
        classNames: { progress: 'notice-progress' }, styles: { progress: '--winner:bar' }
      });
      api.info({ title: 'No timeout', duration: false });
      api.info({ title: 'No progress', duration: 2, showProgress: false });
    }
    else if (kind === 'stack-focus') {
      for (const title of ['One', 'Two', 'Three', 'Four']) api.info({ title, duration: 2 });
      api.info({ title: 'Other placement', placement: 'bottomLeft', duration: 2 });
    }
    else {
      api.info({ title: 'Top', placement: 'topLeft' });
      api.info({ title: 'Bottom', placement: 'bottomRight' });
    }
  }

  /** После tick новые defaults применяются к следующему вызову уже полученного API. */
  function launchApp({ notification }: AppInstance) {
    untrack(() => {
      instance = notification;
      instance.open({ title: 'Old default' });
      probe.move = async () => {
        target = 'target-two';
        await tick();
        instance.open({ title: 'New default' });
      };
    });
  }
</script>

{#snippet customIcon()}<b>Custom</b>{/snippet}
{#snippet actions()}<button type="button" onclick={track('action')}>Action</button>{/snippet}

<input aria-label="Outside editor" value="Retain selection">
{#if kind === 'app'}
  <ConfigProvider theme={motionless} locale={enUS} getPopupContainer={readTarget}>
    <App component={false} notification={{
      getContainer: () => null, duration: false, showProgress: true, stack: false,
      placement: firstTarget ? 'topLeft' : 'bottomRight', rtl: firstTarget, top: 0, bottom: 52,
      prefixCls: 'app-notification', closeIcon: 'Shared', onAllRemoved: track('all-removed')
    }}>
      <AppConsumer onApi={launchApp} />
    </App>
  </ConfigProvider>
{:else}
  <ConfigProvider theme={motionless} locale={enUS} notification={provider}>
    <NotificationHolder notification={api} rtl={kind === 'portal' ? firstTarget : undefined} />
  </ConfigProvider>
{/if}
