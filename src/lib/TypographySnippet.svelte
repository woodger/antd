<script lang="ts">
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { connectTypographyContent, type TypographySnippetContent } from './typography-content.dom';
  let { children, hidden = false, ariaHidden = false, onContent }: {
    children: Snippet;
    hidden?: boolean;
    ariaHidden?: boolean;
    onContent: (content: TypographySnippetContent) => void;
  } = $props();
</script>

<!-- The snippet stays mounted while truncated, so its reactive text keeps updating. -->
<span style:display={hidden ? 'none' : 'contents'} aria-hidden={ariaHidden || undefined}
  {@attach element => untrack(() => connectTypographyContent(element, onContent))}>{@render children()}</span>
