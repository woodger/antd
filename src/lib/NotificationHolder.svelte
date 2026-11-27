<script lang="ts">
  // One surface and one timer owner serve all placements. Changing the portal target recreates
  // lists while retaining the outer instance and its queue.
  import { untrack } from 'svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getNotificationPrefixCss } from './notification-prefix.engine';
  import NotificationList from './NotificationList.svelte';
  import { useConfig } from './config-context';
  import { useComponentTheme } from './theme-component.svelte';
  import { connectInlineStyle } from './inline-style.dom';
  import { serializeInlineStyleLayers, type InlineStyleLayer } from './inline-style.engine';
  import { notificationHolderKey, notificationPlacements } from './notification.model.svelte.js';
  import { createNoticeContainer } from './notice-container.model.svelte';
  import { createNoticeClock } from './notice.dom';
  import { resolveNoticeAppearance } from './notice-semantic.engine';
  import type {
    NotificationHolderProps, NotificationSemanticName, NotificationSemanticProps
  } from './notification.types';

  let {
    notification,
    id,
    class: className = '',
    style,
    ...overrides
  }: NotificationHolderProps = $props();
  const config = useConfig();
  let runtime = $derived(notification[notificationHolderKey]);
  let options = $derived({ ...runtime.options, ...overrides });
  let componentPrefix = $derived(config.getPrefixCls('notification', options.prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getNotificationPrefixCss(componentPrefix, rootPrefix));
  const componentTheme = useComponentTheme('Notification');
  let anchor = $state<HTMLSpanElement>();
  let surface = $state<HTMLDivElement>();
  let notices = $derived(runtime.notices);
  const slots: readonly NotificationSemanticName[] = [
    'list', 'listContent', 'root', 'wrapper', 'icon', 'section', 'title',
    'description', 'actions', 'close', 'progress'
  ];
  let appearance = $derived(resolveNoticeAppearance<NotificationSemanticName, NotificationSemanticProps>(
    slots, options, options, config.notification
  ));
  let rtl = $derived(options.rtl ?? config.direction === 'rtl');
  let resolvedTop = $derived(resolveOffset(options.top));
  let resolvedBottom = $derived(resolveOffset(options.bottom));
  let placementStyle = $derived(serializeInlineStyleLayers([
    appearance.styles.list,
    [
      ['--notification-top', options.top === undefined ? '' : `${resolvedTop}px`],
      ['--notification-bottom', options.bottom === undefined ? '' : `${resolvedBottom}px`]
    ]
  ]));
  let rootLayers = $derived<readonly InlineStyleLayer[]>([
    componentTheme.style,
    style,
    [
      ['--notification-top', `${resolvedTop}px`],
      ['--notification-bottom', `${resolvedBottom}px`]
    ]
  ]);
  let rootStyle = $derived(serializeInlineStyleLayers(rootLayers));
  const container = createNoticeContainer(
    () => anchor,
    () => ({ getContainer: options.getContainer, getPopupContainer: config.getPopupContainer }),
    () => ({ node: surface, onVisible: runtime.setVisible }),
    () => rootLayers
  );
  let observedRuntime: typeof runtime | undefined;
  let hadNotices = false;

  function resolveOffset(value: number | undefined) {
    return value !== undefined && Number.isFinite(value) && value >= 0 ? value : 24;
  }

  function connectRootStyle(node: HTMLDivElement) {
    const update = connectInlineStyle(node);
    $effect(() => {
      update(rootLayers);
      container.syncTheme();
    });
  }

  function connectHost(node: HTMLSpanElement) {
    const clock = createNoticeClock(node);
    return runtime.connect(clock);
  }

  $effect(() => {
    const current = runtime;
    if (observedRuntime !== current) {
      observedRuntime = current;
      hadNotices = false;
    }

    if (notices.length) {
      hadNotices = true;
    }
    else if (hadNotices) {
      hadNotices = false;
      untrack(() => options.onAllRemoved?.());
    }
  });
</script>

<style>
  .ant-notification-anchor {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    visibility: hidden;
  }
  .ant-notification-surface {
    position: fixed;
    inset: auto;
    top: var(--ant-svelte-notice-viewport-top, 0px);
    left: 0;
    width: 100%;
    height: var(--ant-svelte-notice-viewport-height, 100dvh);
    max-width: 100vw;
    max-height: none;
    margin: 0;
    border: 0;
    padding: 0;
    overflow: hidden;
    background: transparent;
    pointer-events: none;
    outline: none;
  }
  .ant-notification-surface:not(:popover-open) { display: none; }
  .ant-notification-surface::backdrop {
    pointer-events: none;
    background: transparent;
  }
  .ant-notification-surface > :global([data-ant-notification-root][data-ant-notification-list]) {
    position: absolute;
    height: auto;
    max-width: 100%;
    max-height: calc(100% - max(0px, var(--notification-top) - var(--ant-margin-lg)));
  }
  .ant-notification-surface > :global([data-ant-notification-root][data-ant-notification-list][data-placement^='bottom']) { max-height: calc(100% - max(0px, var(--notification-bottom) - var(--ant-margin-lg))); }
  .ant-notification-surface :global([data-ant-notification-content]) { pointer-events: none; }
</style>

<span bind:this={anchor} class="ant-notification-anchor" aria-hidden="true" {@attach connectHost}></span>
{#key notification}
  {#if notices.length}
    {#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`notification-prefix:${componentPrefix}:${rootPrefix}`} />{/if}
    {#key container.key}
      <div bind:this={surface}
        data-ant-notification-prefix={componentPrefix} data-ant-notification-root-prefix={rootPrefix}
        popover="manual" {id} dir={rtl ? 'rtl' : 'ltr'}
        class={['ant-notification-surface ant-notification-css-var', componentTheme.className, className]}
        style={untrack(() => rootStyle)} {@attach connectRootStyle}>
        {#each notificationPlacements as placement}
          {@const items = notices.filter(notice => notice.placement === placement)}
          {#if items.length}
            <NotificationList {notification} notices={items} {placement} prefixCls={componentPrefix}
              {rootPrefix} {rtl} {options} provider={config.notification} {appearance}
              listStyle={placementStyle}
            />
          {/if}
        {/each}
      </div>
    {/key}
  {/if}
{/key}
