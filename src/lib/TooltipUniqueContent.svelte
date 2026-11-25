<script lang="ts">
  // Новый владелец монтирует свой Snippet с его логическим контекстом. Поверхность остаётся общей.
  import { setContext, untrack } from 'svelte';
  import RenderContent from './RenderContent.svelte';
  import { provideCompact } from './space-compact-context';
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
  // Карточка подавляет compact-контекст trigger так же, как отдельный Popover.
  if (untrack(() => clearCompact)) provideCompact(null);
  isolateTooltipUnique();
</script>

<RenderContent value={content} />
