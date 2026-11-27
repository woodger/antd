<script lang="ts">
  import type { TreeSelectRootContext } from '@woodger/antd';
  let { context, onInput, nativeElement = $bindable(), inputElement = $bindable() }: {
    context: TreeSelectRootContext<HTMLSpanElement>;
    onInput: (text: string) => void;
    nativeElement?: HTMLSpanElement;
    inputElement?: HTMLInputElement;
  } = $props();
  let register = $derived(context.register);
  let attributes = $derived.by(() => {
    const { style: _style, ...attributes } = context.attributes;
    return attributes;
  });
  $effect(() => {
    const root = nativeElement, editor = inputElement;
    if (!root || !editor) {
      return;
    }
    return register({
      nativeElement: root,
      focus: options => editor.focus(options),
      blur: () => editor.blur()
    });
  });
</script>

<span data-align-root bind:this={nativeElement} style={[context.attributes.style, 'display:inline-flex'].filter(Boolean).join(';')}>
  <span style={'display:inline-flex;'
    + 'width:64px;'
    + 'flex:none'}>Root prefix</span>
  <input {...attributes} bind:this={inputElement} data-align-editor style={'width:156px;'
    + 'height:40px;'
    + 'box-sizing:border-box'}
    oninput={event => onInput(event.currentTarget.value)} />
</span>
<output data-align-received hidden>{JSON.stringify({ keys: ['popupAlign', 'builtinPlacements'].filter(key => Object.hasOwn(context.attributes, key)) })}</output>
