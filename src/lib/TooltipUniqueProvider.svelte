<script lang="ts">
  // Публикует группу для дочерних overlay. Держит один экземпляр панели при смене владельца.
  import type { Snippet } from 'svelte';
  import TooltipUniquePopup from './TooltipUniquePopup.svelte';
  import { provideTooltipUnique, type TooltipUniqueSurface } from './tooltip-unique.model.svelte';

  let { children }: { children: Snippet; } = $props();
  let surface = $state<TooltipUniqueSurface>();
  const group = provideTooltipUnique(() => surface);
</script>

{@render children()}{#if group.owner}<TooltipUniquePopup bind:this={surface} {group} />{/if}
