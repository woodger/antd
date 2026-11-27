<script lang="ts" generics="Props extends object = {}">
  // Owns the App context and queues. Changing the root reconnects the holders to the same APIs.
  import { untrack } from 'svelte';
  import MessageHolder from '../message/MessageHolder.svelte';
  import NotificationHolder from '../notification/NotificationHolder.svelte';
  import ModalHolder from '../modal/ModalHolder.svelte';
  import { createMessage, messageHolderKey } from '../message/message.model.svelte.js';
  import { createNotification, notificationOptionsKey } from '../notification/notification.model.svelte.js';
  import { createModal } from '../modal/modal.model.svelte.js';
  import { provideApp, useAppOptions } from './app-context';
  import { useConfig } from '../config-provider/config-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import type { AppComponentProps, AppOptions, AppRootProps } from './app.types';

  let {
    children,
    component = 'div',
    prefixCls,
    message,
    notification,
    class: className = '',
    rootClassName = '',
    style,
    nativeElement = $bindable(),
    ...rest
  }: AppComponentProps<Props> = $props();
  const config = useConfig();
  const parent = useAppOptions();
  const componentTheme = useComponentTheme('App');
  let componentPrefix = $derived(config.getPrefixCls('app', prefixCls));
  let messageOptions = $derived({ ...parent?.message, ...message });
  let notificationOptions = $derived({ ...parent?.notification, ...notification });
  const api = {
    message: createMessage(untrack(() => messageOptions)),
    notification: createNotification(untrack(() => notificationOptions)),
    modal: createModal()
  };
  const options: AppOptions = {
    get message() { return messageOptions; },
    get notification() { return notificationOptions; }
  };
  provideApp(api, options);

  let rootClasses = $derived([
    componentPrefix,
    'ant-app-css-var',
    componentTheme.className,
    config.direction === 'rtl' && `${componentPrefix}-rtl`,
    config.app?.class,
    className,
    rootClassName
  ]);
  let rootProps = $derived({
    ...rest,
    dir: config.direction,
    style: [componentTheme.style, config.app?.style, style].filter(Boolean).join(';')
  });
  let Root = $derived(typeof component === 'function' ? component : undefined);
  // The optional ref stays out of the DOM spread. The rest type loses its link to Props once App
  // settings and fields set by this component are omitted.
  let customProps = $derived(Object.defineProperty({
    ...rootProps,
    'data-ant-app-root': '',
    class: rootClasses.filter(Boolean).join(' '),
    children: content
  }, 'nativeElement', {
    get: () => nativeElement,
    set: (node: HTMLElement | undefined) => { nativeElement = node; },
    configurable: true
  }) as unknown as Props & AppRootProps);

  $effect.pre(() => {
    api.message[messageHolderKey].configure(messageOptions);
    api.notification[notificationOptionsKey](notificationOptions);
  });
</script>

<style>
  [data-ant-app-root],
  :global(.ant-app-css-var) {
    color: var(--ant-color-text);
    font-size: var(--ant-font-size);
    line-height: var(--ant-line-height);
    font-family: var(--ant-font-family);
  }
</style>

{#snippet content()}
  <ModalHolder modal={api.modal} />
  <MessageHolder message={api.message} />
  <NotificationHolder notification={api.notification} />
  {@render children?.()}
{/snippet}

{#if component === false}
  {@render content()}
{:else if typeof component === 'string'}
  <svelte:element this={component} {...rootProps} bind:this={nativeElement}
    data-ant-app-root="" class={rootClasses}>
    {@render content()}
  </svelte:element>
{:else if Root}
  <Root {...customProps} />
{/if}
