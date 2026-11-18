<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { customTagPrefixContext, type CustomTagPrefixContext } from '../select-components-responsive-tag-prefix-context';
  const caller = getContext<CustomTagPrefixContext>(customTagPrefixContext);
  function observe(content: Snippet) {
    const context = caller.current;
    caller.bodyActivity.push({ kind: 'prefix', context: caller.recorder.encode(context), rawContext: caller.recorder.raw(context) });
    caller.recorder.register(content, { node: 'custom-tags-leading-prefix' });
    return caller.recorder.record('prefixBody', 'own', context, content);
  }
</script>
{#snippet body()}<span data-custom-tag-prefix="" aria-hidden="true" style="display:inline-block;width:{caller.current.prefixWidth}px;height:16px;line-height:16px;font-size:12px">P</span>{/snippet}
{#snippet renderedBody()}{@const content = observe(body)}{@render content()}{/snippet}
{@render renderedBody()}
