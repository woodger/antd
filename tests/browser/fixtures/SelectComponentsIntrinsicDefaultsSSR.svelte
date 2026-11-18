<script lang="ts">
  import { untrack } from 'svelte';
  import { Select, AutoComplete } from 'antd-svelte';

  let { control, kind, capture }: {
    control: 'select' | 'autocomplete';
    kind: 'input-default' | 'checkbox-default' | 'textarea-leading-lf';
    capture?: { readRefs?: () => ReturnType<typeof readRefs> };
  } = $props();
  const initialCapture = untrack(() => capture);
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let authored: HTMLInputElement | HTMLTextAreaElement | undefined;
  const reference = (node: HTMLInputElement | HTMLTextAreaElement | null) => { authored = node ?? undefined; };
  const options = [{ value: 'a', label: 'Alpha' }];
  const editors = {
    'input-default': { element: 'input', ref: reference,
      props: { 'data-intrinsic-defaults-editor': 'input-default', value: undefined, defaultValue: 'Native draft' } },
    'checkbox-default': { element: 'input', ref: reference,
      props: { 'data-intrinsic-defaults-editor': 'checkbox-default', type: 'checkbox', value: undefined, defaultChecked: true } },
    'textarea-leading-lf': { element: 'textarea', ref: reference,
      props: { 'data-intrinsic-defaults-editor': 'textarea-leading-lf', value: '\nNative draft' } }
  };
  let input = $derived(editors[kind]);
  function readRefs() { return { root, editor, authored }; }
  if (initialCapture) initialCapture.readRefs = readRefs;
</script>

{#if control === 'select'}
  <Select value="a" {options} open={false} components={{ input }} bind:nativeElement={root} bind:inputElement={editor} />
{:else}
  <AutoComplete value="Library value" {options} open={false} components={{ input }} bind:nativeElement={root} bind:inputElement={editor} />
{/if}
