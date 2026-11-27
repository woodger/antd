<script lang="ts">
  // The Drawer section manages the header, body, and footer. Loading replaces only children.
  import Icon from '../icon/Icon.svelte';
  import RenderContent from '../RenderContent.svelte';
  import Skeleton from '../skeleton/Skeleton.svelte';
  import { useConfig } from '../config-provider/config-context';
  import {
    getDrawerPanelSemanticProps, hasDrawerContent, resolveDrawerClose, resolveDrawerSemantics
  } from './drawer-panel.engine';
  import type { DrawerProps } from './drawer.types';

  let { props, prefix, titleId, requestClose }: {
    props: DrawerProps;
    prefix: string;
    titleId: string;
    requestClose: (event: Event) => void;
  } = $props();

  const config = useConfig();
  const close = $derived(resolveDrawerClose(props, config.drawer));
  const semanticProps = $derived(getDrawerPanelSemanticProps(props, prefix, config.drawer));
  const { classes, styles } = $derived(
    resolveDrawerSemantics(semanticProps, config.drawer, 'panel')
  );
  const { title, extra, footer, children, loading } = $derived(props);
  const hasTitle = $derived(hasDrawerContent(title));
  const hasExtra = $derived(hasDrawerContent(extra));
  const hasFooter = $derived(hasDrawerContent(footer));
  const closeOnly = $derived(close && !hasTitle && !hasExtra);
</script>

<style>
  [data-ant-drawer-header] { gap: var(--ant-margin-xs); }
  [data-ant-drawer-title], [data-ant-drawer-extra],
  [data-ant-drawer-body], [data-ant-drawer-footer] {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  [data-ant-drawer-title] { color: var(--ant-color-text-heading); }
  :global(.drawer-source-theme) [data-ant-drawer-title] { color: inherit; }
  [data-ant-drawer-extra] { max-width: 50%; }
  [data-ant-drawer-body] > :global(.ant-svelte-drawer-loading),
  [data-ant-drawer-body] > :global(.ant-svelte-drawer-loading .ant-skeleton-content) {
    height: 100%;
  }
  [data-ant-drawer-body] > :global(.ant-svelte-drawer-loading [data-ant-skeleton-main]) {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-ant-drawer-close] { transition: none; }
  }
</style>

{#snippet closeButton(control: NonNullable<ReturnType<typeof resolveDrawerClose>>)}
  <button type="button" aria-label={config.locale.closeText} {...control.attributes}
    data-ant-drawer-close
    class={[
      `${prefix}-close`,
      control.placement === 'end' && `${prefix}-close-end`,
      classes.close
    ]}
    style={styles.close}
    disabled={control.disabled}
    onclick={control.disabled ? undefined : requestClose}>
    {#if control.icon === undefined}<Icon name="close" />
    {:else}<RenderContent value={control.icon} />{/if}
  </button>
{/snippet}

{#if hasTitle || close || hasExtra}
  <div data-ant-drawer-header class={[
    `${prefix}-header`, closeOnly && `${prefix}-header-close-only`, classes.header
  ]} style={styles.header}>
    <div data-ant-drawer-header-title class={`${prefix}-header-title`}>
      {#if close?.placement === 'start' && close.icon !== null}{@render closeButton(close)}{/if}
      {#if hasTitle}
        <h2 id={titleId} data-ant-drawer-title
          class={[`${prefix}-title`, classes.title]} style={styles.title}>
          <RenderContent value={title} />
        </h2>
      {/if}
    </div>
    {#if hasExtra}<div data-ant-drawer-extra class={[`${prefix}-extra`, classes.extra]}
      style={styles.extra}><RenderContent value={extra} /></div>{/if}
    {#if close?.placement === 'end' && close.icon !== null}{@render closeButton(close)}{/if}
  </div>
{/if}
<div data-ant-drawer-body class={[`${prefix}-body`, classes.body]} style={styles.body}>
  {#if loading}
    <Skeleton active title={false} paragraph={{ rows: 5 }}
      class="ant-svelte-drawer-loading" rootClassName={`${prefix}-body-skeleton`} />
  {:else}{@render children?.()}{/if}
</div>
{#if hasFooter}<div data-ant-drawer-footer class={[`${prefix}-footer`, classes.footer]}
  style={styles.footer}><RenderContent value={footer} /></div>{/if}
