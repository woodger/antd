<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import {
    App, ConfigProvider, MessageHolder, createMessage, type AppInstance,
    type MessageAppearance, type MessageConfig, type MessageHandle, type MessageKey,
    type MessageOptions, type MessageSemanticName, type MessageSemanticProps
  } from '@woodger/antd';
  import AppConsumer from './AppConsumer.svelte';
  import type { MessageProbe } from './message-api-probe';

  let { kind: scenario }: { kind: string; } = $props();
  const kind = untrack(() => scenario);
  const motion = kind === 'motion' || kind === 'motion-disabled';
  const theme = { token: { motion } };
  const slots: readonly MessageSemanticName[] = ['list', 'listContent', 'root', 'wrapper', 'icon', 'title'];
  let destination = $state('target-one');
  const contextProvider = kind === 'context-semantics' ? {
    ...semantics('provider'), class: 'provider-extra', style: '--extra:provider'
  } : undefined;
  const options: MessageOptions = {
    top: kind === 'context-semantics' ? 29 : undefined,
    duration: 0,
    ...(kind === 'context-semantics' && semantics('holder')),
    getContainer: kind === 'context-portal' ? (...args: unknown[]) => target(destination, args)
      : kind === 'provider-portal' ? (...args: unknown[]) => {
        probe.containerCalls.push(args.length);
        return null;
      } : undefined,
    stack: kind === 'stack' ? { threshold: 2 } : kind === 'stack-timeout' ? true : undefined,
    transitionName: kind === 'motion' ? 'observed' : kind === 'motion-disabled' ? '' : undefined
  };
  const api = createMessage(options);
  let instance = api;
  const probe: MessageProbe = {
    events: [], handles: {}, arguments: {}, containerCalls: [], motion: [], finish: closeScenario
  };
  window.messageProbe = probe;
  onMount(() => {
    if (motion) {
      document.addEventListener('animationstart', recordMotion);
    }
    if (kind !== 'app-message') launch();
    return () => document.removeEventListener('animationstart', recordMotion);
  });

  /** Retains only the fields measured in the standard, including the absence of each of them. */
  function record(name: string, props: MessageSemanticProps) {
    probe.arguments[name] = {
      content: props.content, duration: props.duration, top: props.top,
      type: props.type, rtl: props.rtl, prefixCls: props.prefixCls
    };
  }

  /** Each level has its own classes and CSS properties for checking the final combination. */
  function semantics(layer: string): Pick<MessageAppearance, 'classNames' | 'styles'> {
    return {
      classNames({ props }) {
        record(`${layer}Classes`, props);
        return Object.fromEntries(slots.map(slot => [slot, `${layer}-${slot}`]));
      },
      styles({ props }) {
        record(`${layer}Styles`, props);
        return Object.fromEntries(slots.map(slot => [slot, `--winner:${layer};`
          + `--${layer}:${slot}`]));
      }
    };
  }

  /** Measures arity getContainer while the actual goal changes between challenges. */
  function target(id: string, args: readonly unknown[]) {
    probe.containerCalls.push(args.length);
    const node = document.getElementById(id);
    if (!node) {
      throw new Error(`Missing Message fixture container: ${id}`);
    }
    return node;
  }

  /** Zero duration leaves the closing of the script. */
  function item(label: string, key: MessageKey = label): MessageConfig {
    return { content: label, key, duration: 0, onClose: () => probe.events.push([label, 'close']) };
  }

  /** Retains the same handle to observe Promise and explicit closure. */
  function store(name: string, handle: MessageHandle) {
    probe.handles[name] = handle;
    void handle.then(result => probe.events.push([name, 'then', result]));
    return handle;
  }

  function launch() {
    if (kind === 'context-family') {
      store('plain', api.open({ ...item('Plain'), type: null }));
      store('zero', api.open({ ...item('Zero'), content: 0, type: null }));
      store('blank', api.open({ ...item('Blank'), content: false, type: null }));
      const methods = ['info', 'success', 'warning', 'error', 'loading'] as const;
      for (const method of methods) store(method, api[method](item(method)));
    }
    else if (kind === 'context-queue') {
      store('same-first', api.loading(item('First', 0)));
      store('same-last', api.warning(item('Updated', 0)));
      store('removed', api.open(item('Removed', 'remove')));
      api.destroy('remove');
    }
    else if (kind === 'context-typed') {
      store('priority', api.success(item('Positional'), 1, () => {
        probe.events.push(['positional', 'close']);
      }));
    }
    else if (kind === 'context-timeout') {
      store('timed', api.info({ ...item('Timed'), duration: 1 }));
    }
    else if (kind === 'context-semantics') {
      store('semantic', api.warning({
        ...item('Decorated'), ...semantics('notice'), class: 'notice-extra',
        style: '--winner:noticeInline;'
          + '--extra:notice',
        onClick: event => probe.events.push(['click', event.currentTarget.tagName])
      }));
    }
    else if (kind === 'stack') {
      for (const label of ['One', 'Two', 'Three']) store(label, api.info(item(label)));
    }
    else if (kind === 'stack-timeout') {
      for (const label of ['One', 'Two', 'Three']) {
        store(label, api.info({ ...item(label), duration: 2, pauseOnHover: label !== 'Two' }));
      }
      store('Four', api.info(item('Four')));
    }
    else {
      probe.move = () => { destination = 'target-two'; };
      store('single', api.info(item('Visible')));
    }
  }

  /** Shifting App.message updates the current instance and its surface. */
  function launchApp({ message }: AppInstance) {
    untrack(() => {
      instance = message;
      for (const label of ['One', 'Two', 'Three']) store(label, instance.info(item(label)));
      probe.move = async () => {
        destination = 'target-two';
        await tick();
        store('Four', instance.success(item('Four')));
      };
    });
  }

  /** Observes an external CSS animation, so that the quiet cleanup does not pass for real motion. */
  function recordMotion(event: AnimationEvent) {
    if (event.animationName.startsWith('message-')) probe.motion.push(event.animationName);
  }

  /** Some of the scenarios are closed on the key, and the timer scenario awaits itself. */
  function closeScenario() {
    if (kind === 'context-queue') probe.handles['same-first']();
    else if (kind === 'context-typed') probe.handles.priority();
    else if (kind !== 'context-timeout') instance.destroy();
  }
</script>

<input id="outside-editor" aria-label="Outside editor" value="Retain selection">
{#if kind === 'app-message'}
  <ConfigProvider prefixCls="global" {theme}>
    <App component={false} message={{
      prefixCls: destination === 'target-one' ? 'app-message' : 'next-message',
      top: destination === 'target-one' ? 57 : 0,
      rtl: destination === 'target-one',
      duration: 0, maxCount: 2, getContainer: (...args) => target(destination, args)
    }}>
      <AppConsumer onApi={launchApp} />
    </App>
  </ConfigProvider>
{:else}
  <ConfigProvider {theme} message={contextProvider}
    getPopupContainer={kind === 'provider-portal' ? (...args) => target(destination, args) : undefined}
  >
    <MessageHolder message={api} />
  </ConfigProvider>
{/if}
