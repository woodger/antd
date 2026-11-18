<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import type { SelectTagInfo } from 'antd-svelte';
  import { selectTagCloseHandleGeometry } from '../select-components-tag-close-handles-cases.mjs';
  import { tagCloseHandlesContext, type TagCloseHandlesContext } from '../select-components-tag-close-handles-context';
  let { info }: { info: SelectTagInfo<string> } = $props();
  const caller = getContext<TagCloseHandlesContext>(tagCloseHandlesContext);
  const geometry = selectTagCloseHandleGeometry.tag;
  function observe(content: Snippet) {
    caller.bodyActivity.push({ info: caller.recorder.encode(info), rawInfo: caller.recorder.raw(info) });
    caller.recorder.register(content, { node: 'handles-tag-body-' + info.value });
    return caller.recorder.record('tagBody', 'own', info, content);
  }
</script>
{#snippet body()}<span data-handles-tag={String(info.value)} data-closable={String(info.closable)} data-item-disabled={String(info.disabled)}
  style="display:inline-flex;width:{geometry.width}px;height:{geometry.height}px;line-height:24px;font-size:14px;white-space:nowrap">{@render info.label()}</span>{/snippet}
{#snippet renderedBody()}{@const content = observe(body)}{@render content()}{/snippet}
{@render renderedBody()}
