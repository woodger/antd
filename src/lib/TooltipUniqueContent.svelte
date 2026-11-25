<script lang="ts">
  // Новый владелец монтирует свой Snippet с его логическим контекстом. Поверхность остаётся общей.
  import { setContext, untrack } from 'svelte';
  import RenderContent from './RenderContent.svelte';
  import { isolateTooltipUnique } from './tooltip-unique.model.svelte';
  import type { TooltipContent } from './tooltip.types';

  let { context, content }: {
    context?: Map<unknown, unknown>;
    content: TooltipContent;
  } = $props();

  const ownerContext = untrack(() => context);
  if (ownerContext) {
    for (const [key, value] of ownerContext) setContext(key, value);
  }
  isolateTooltipUnique();
</script>

<RenderContent value={content} />
