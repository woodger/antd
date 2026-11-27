<script lang="ts">
  // Resolves the Tooltip content and controlled state for one Menu row.
  import { useMenu } from './menu-context';
  import type { MenuItem } from './menu.types';
  import RenderContent from './RenderContent.svelte';
  import Tooltip, { provideTooltipAnchor } from './Tooltip.svelte';
  import type { TooltipSemanticProps } from './tooltip.types';

  let { element, item, firstLevel, connectClick }: {
    element?: HTMLElement;
    item: MenuItem;
    firstLevel: boolean;
    connectClick: (handler: (event: MouseEvent) => void) => () => void;
  } = $props();
  const context = useMenu();
  const config = $derived(context.tooltip || undefined);
  const collapsed = $derived(context.tooltipCollapsed);
  let ownOpen = $state(false);
  const open = $derived(collapsed && (config?.open ?? ownOpen));
  const placement = $derived(config?.placement ?? (context.direction === 'rtl' ? 'left' : 'right'));
  const title = $derived.by(() => {
    if (!collapsed) {
      return undefined;
    }
    if (config?.title !== undefined) {
      return config.title;
    }
    if (item.title !== undefined) {
      return item.title;
    }
    if (firstLevel) {
      return item.extra === undefined ? item.label : fullLabel;
    }

    return undefined;
  });

  provideTooltipAnchor({
    element: () => element,
    enabled: () => collapsed,
    connectClick: handler => connectClick(handler)
  });

  $effect.pre(() => {
    if (!collapsed) ownOpen = false;
  });

  // In a collapsed menu, the owner of the shared settings controls open.
  function requestOpen(next: boolean) {
    if (!collapsed) {
      return;
    }

    ownOpen = next;
    config?.onOpenChange?.(next);
  }

  // Adds the Menu class to the resolved custom Tooltip slots.
  function tooltipClasses(info: { props: TooltipSemanticProps; }) {
    const value = config?.classNames;
    const slots = typeof value === 'function' ? value(info) : value;
    const root = [`${context.prefixCls}-inline-collapsed-tooltip`, slots?.root];

    return { ...slots, root: root.filter(Boolean).join(' ') };
  }
</script>

{#snippet fullLabel()}
  <RenderContent value={item.label} /><span class={`${context.prefixCls}-item-extra`}><RenderContent
    value={item.extra} /></span>
{/snippet}

{#snippet noWrapper()}{/snippet}
<Tooltip {...config} {open} {placement} {title} overlay={collapsed ? config?.overlay : undefined}
  onOpenChange={requestOpen} classNames={tooltipClasses} children={noWrapper} />
