<script lang="ts">
  import { untrack } from 'svelte';
  import { Select, type SelectInputContext, type SelectRef } from '@woodger/antd-svelte';
  let { mode }: { mode: 'multiple' | 'tags' } = $props();
  const initial = untrack(() => mode), options = [{ value: 'a', label: 'Alpha' }];
  let value = $state(['a']), query = $state('');
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let handleKeys: string[] = [];
  function register(context: SelectInputContext<HTMLTextAreaElement>, node: HTMLTextAreaElement) {
    const handle = { nativeElement: node, focus(...args: [FocusOptions?]) {
      node.focus(...args);
    }, blur() {
      node.blur();
    } };
    handleKeys = Reflect.ownKeys(handle).map(String);
    return context.register(handle);
  }
  function read() {
    return { model: [...value], query, handleKeys: [...handleKeys], rootTag: root?.tagName, editorTag: editor?.tagName,
      value: editor?.value, focused: editor === editor?.ownerDocument.activeElement, connected: editor?.isConnected,
      physicalStyle: typeof editor?.style, width: editor?.getBoundingClientRect().width,
      widthVar: editor?.style.getPropertyValue('--select-input-width') };
  }
</script>

{#snippet input(context: SelectInputContext<HTMLTextAreaElement>)}
  {@const { value, ...rest } = context.attributes}
  <textarea {...rest} value={value} data-modes-composite-safe-editor={initial}
    {@attach node => register(untrack(() => context), node)}></textarea>
{/snippet}
<section data-modes-composite-safe={initial} style="width:320px;margin:16px" {@attach node => {
  const capture = (event: Event) => Object.assign((event as CustomEvent).detail,
    { read, focus: () => control?.focus({ preventScroll: true }), readRefs: () => ({ control, root, editor }) });
  node.addEventListener('modescompositesafecapture', capture);
  return () => node.removeEventListener('modescompositesafecapture', capture);
}}>
  <Select {mode} {options} bind:value bind:this={control} bind:nativeElement={root} bind:inputElement={editor}
    components={{ input }} aria-label={initial + ' safe composite'}
    showSearch={{ filterOption: false, onSearch: next => { query = next; } }} />
</section>
