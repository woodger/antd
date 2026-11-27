<script lang="ts">
  // The new owner mounts its own Snippet with its logical context. The surface stays shared.
  import { setContext, untrack } from 'svelte';
  import RenderContent from '../RenderContent.svelte';
  import { provideCompact } from '../space/space-compact-context';
  import { isolateTooltipUnique } from './tooltip-unique.model.svelte';
  import type { TooltipContent } from './tooltip.types';

  let { context, content, clearCompact }: {
    context?: Map<unknown, unknown>;
    content: TooltipContent;
    clearCompact: boolean;
  } = $props();

  const ownerContext = untrack(() => context);
  if (ownerContext) {
    for (const [key, value] of ownerContext) setContext(key, value);
  }
  // The card suppresses the trigger's compact context, just like a standalone Popover.
  if (untrack(() => clearCompact)) provideCompact(null);
  isolateTooltipUnique();
</script>

<RenderContent value={content} />
