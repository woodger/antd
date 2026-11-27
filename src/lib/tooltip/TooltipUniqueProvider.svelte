<script lang="ts">
  // Provides a group for child overlays. Keeps one panel instance across owner changes.
  import type { Snippet } from 'svelte';
  import TooltipUniquePopup from './TooltipUniquePopup.svelte';
  import { provideTooltipUnique, type TooltipUniqueSurface } from './tooltip-unique.model.svelte';

  let { children }: { children: Snippet; } = $props();
  let surface = $state<TooltipUniqueSurface>();
  const group = provideTooltipUnique(() => surface);
</script>

{@render children()}{#if group.owner}<TooltipUniquePopup bind:this={surface} {group} />{/if}
