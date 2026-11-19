<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import type { SelectTagInfo } from 'antd-svelte';
  import { customTagPrefixContext, type CustomTagPrefixContext } from '../select-components-responsive-tag-prefix-context';
  let { info }: { info: SelectTagInfo<string> } = $props();
  const caller = getContext<CustomTagPrefixContext>(customTagPrefixContext);
  let fragment = $derived(caller.sample.tagShape.startsWith('fragment'));
  function observe(content: Snippet) {
    const context = caller.current;
    caller.bodyActivity.push({ kind: 'tag', value: caller.recorder.encode(info.value), isMaxTag: info.isMaxTag,
      context: caller.recorder.encode(context), rawContext: caller.recorder.raw(context) });
    caller.recorder.register(
      content,
      { node: 'custom-tag-body-' + (info.isMaxTag ? 'rest' : info.value) }
    );
    return caller.recorder.record('tagBody', 'own', { info, context }, content);
  }
  function closeHandler() {
    return caller.handler('tag-close-' + info.value, (event: MouseEvent) => {
      caller.event('tag-close-before', info.value, caller.project(event));
      info.onClose?.(event);
      caller.event('tag-close-after', info.value, caller.project(event));
    });
  }
</script>
{#snippet label()}<span data-custom-tag-label={info.isMaxTag ? 'rest' : String(info.value)} style={fragment
  ? `display:inline-block;width:${info.isMaxTag ? caller.current.restWidth : caller.current.tagWidth}px;height:24px;line-height:24px;font-size:14px;white-space:nowrap`
  : 'flex:1 1 auto;min-width:0;overflow:hidden'}>{@render info.label()}</span>{/snippet}
{#snippet button()}{#if info.closable}{@const click = closeHandler()}<button type="button" data-custom-tag-close={String(info.value)} aria-label={'Remove ' + info.value}
  style="display:inline-block;flex:0 0 auto;box-sizing:border-box;width:{caller.current.closeWidth}px;height:18px;line-height:18px;margin:0;padding:0;border:0;font-size:10px;background:transparent"
  onclick={click}>×</button>{/if}{/snippet}
{#snippet fragmentBody()}{@render label()}{@render button()}{/snippet}
{#snippet spanBody()}<span data-custom-tag={info.isMaxTag ? 'rest' : String(info.value)} style="display:inline-flex;align-items:center;width:{info.isMaxTag ? caller.current.restWidth : caller.current.tagWidth}px;height:24px;line-height:24px;font-size:14px;white-space:nowrap">{@render label()}{@render button()}</span>{/snippet}
{#snippet renderedBody()}{@const content = observe(fragment ? fragmentBody : spanBody)}{@render content()}{/snippet}
{@render renderedBody()}
