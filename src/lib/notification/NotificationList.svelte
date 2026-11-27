<script lang="ts">
  // Each placement owns its list layout and hover pause. CSS aligns cards of different heights to
  // the last entry without measuring or reordering the DOM.
  import { on } from 'svelte/events';
  import NotificationNotice from './NotificationNotice.svelte';
  import { notificationHolderKey, type NotificationNotice as Notice } from './notification.model.svelte.js';
  import { serializeInlineStyleLayers } from '../inline-style.engine';
  import type {
    NotificationInstance, NotificationOptions, NotificationPlacement, NotificationProviderConfig,
    NotificationSemanticSlots
  } from './notification.types';

  let {
    notification, notices, placement, prefixCls, rootPrefix, rtl, options, provider,
    appearance, listStyle
  }: {
    notification: NotificationInstance;
    notices: readonly Notice[];
    placement: NotificationPlacement;
    prefixCls: string;
    rootPrefix: string;
    rtl: boolean;
    options: NotificationOptions;
    provider?: NotificationProviderConfig;
    appearance: { classes: NotificationSemanticSlots; styles: NotificationSemanticSlots; };
    listStyle?: string;
  } = $props();

  let hovering = $state(false);
  let focused = $state(false);
  let stack = $derived(options.stack !== false);
  let threshold = $derived(typeof options.stack === 'object' ? options.stack?.threshold ?? 3 : 3);
  let active = $derived(notices.filter(notice => !notice.closing));
  let expanded = $derived(stack && (hovering || focused || active.length <= threshold));
  let collapsed = $derived(stack && !expanded);
  let newestFirst = $derived(options.stack !== undefined || stack && active.length > threshold);
  let bottom = $derived(placement.startsWith('bottom'));
  let depth = $derived(Math.max(0, Math.min(active.length, threshold) - 1) * 8);
  let ranks = $derived(new Map(active.map((notice, index) => [notice.id, active.length - index - 1])));
  let contentStyle = $derived(serializeInlineStyleLayers([
    appearance.styles.listContent, [['--ant-svelte-notification-stack-depth', `${depth}px`]]
  ]));

  function connectInteraction(node: HTMLDivElement) {
    const runtime = notification[notificationHolderKey];
    const list = placement;

    function setHover(next: boolean) {
      hovering = next;
      runtime.hoverList(next, list);
    }

    const listeners = [
      on(node, 'pointerenter', event => {
        if (event.pointerType !== 'touch') setHover(true);
      }),
      on(node, 'pointerleave', () => setHover(false)),
      on(node, 'focusin', () => { focused = true; }),
      on(node, 'focusout', event => {
        focused = event.relatedTarget instanceof Node && node.contains(event.relatedTarget);
      })
    ];

    return () => {
      for (const remove of listeners) remove();
      setHover(false);
      focused = false;
    };
  }
</script>

<div data-ant-notification-root data-ant-notification-list
  data-ant-notification-prefix={prefixCls}
  data-ant-notification-root-prefix={rootPrefix}
  data-placement={placement}
  class={[
    `${prefixCls} ${prefixCls}-list ${prefixCls}-${placement}`,
    rtl && `${prefixCls}-rtl`,
    stack && `${prefixCls}-stack`,
    expanded && `${prefixCls}-stack-expanded`,
    hovering && `${prefixCls}-list-hovered`,
    appearance.classes.list
  ]} style={listStyle}>
  <div data-ant-notification-content
    data-ant-notification-folded={collapsed || undefined}
    data-ant-notification-reverse={(bottom !== newestFirst) || undefined}
    class={[`${prefixCls}-list-content`, appearance.classes.listContent]}
    style={contentStyle} {@attach stack ? connectInteraction : undefined}>
    {#each notices as notice (notice.id)}
      {@const rank = ranks.get(notice.id)}
      <NotificationNotice {notice} {notification} {prefixCls} {appearance}
        providerClass={provider?.class} providerCloseIcon={provider?.closeIcon}
        holderCloseIcon={options.closeIcon}
        stackRank={stack ? rank : undefined}
        stackThreshold={threshold}
        {collapsed}
      />
    {/each}
  </div>
</div>

<style>
  [data-ant-notification-content][data-ant-notification-reverse] { flex-direction: column-reverse; }
  [data-placement^='top'] > [data-ant-notification-folded] {
    padding-block-end: var(--ant-svelte-notification-stack-depth);
  }
  [data-placement^='bottom'] > [data-ant-notification-folded] {
    padding-block-start: var(--ant-svelte-notification-stack-depth);
  }
</style>
