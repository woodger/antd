<script lang="ts">
  // Публикует группу для дочерних Tooltip. Держит один экземпляр панели между выборами целей.
  import type { Snippet } from 'svelte';
  import NoCompactStyle from './NoCompactStyle.svelte';
  import TooltipPopup from './TooltipPopup.svelte';
  import { provideTooltipUnique, type TooltipUniqueSurface } from './tooltip-unique.model.svelte';
  import type { TooltipPopupProps } from './tooltip-popup.types';

  let { children }: { children: Snippet; } = $props();
  let surface = $state<TooltipUniqueSurface>();
  const group = provideTooltipUnique(() => surface);
  // Во время cleanup слот NoCompactStyle ещё может прочитать входы демонтированной панели.
  const inactive: TooltipPopupProps = { title: '', open: false, onDismiss: () => {} };
</script>

{@render children()}{#if group.owner}<NoCompactStyle><TooltipPopup bind:this={surface}
  {...group.owner?.props ?? inactive} presentation={group} open={group.open} /></NoCompactStyle>{/if}
