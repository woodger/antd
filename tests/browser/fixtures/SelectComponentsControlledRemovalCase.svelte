<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, type SelectRef, type SelectInputOwnProps } from 'antd-svelte';
  import { controlledRemovalFrames, readControlledRemovalNode, type ControlledRemovalSample,
    type ControlledRemovalPhase, type ControlledRemovalCapture, type ControlledRemovalNode } from '../select-components-controlled-removal-cases';
  let { sample, capture }: { sample: ControlledRemovalSample; capture: ControlledRemovalCapture } = $props();
  const initial = untrack(() => sample), owner = untrack(() => capture), frames = controlledRemovalFrames(initial);
  type Editor = HTMLInputElement | HTMLTextAreaElement;
  interface Option { value: string; label: string }
  const Multiple = Select<string, 'multiple', Option, false, HTMLDivElement, Editor>;
  const Completion = AutoComplete<Option, HTMLDivElement, Editor>;
  let phase = $state<ControlledRemovalPhase>('owned');
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<Editor>();
  let authored: Editor | null = null, firstRef: ControlledRemovalNode | null = null;
  const reference = (node: Editor | null) => { authored = node; if (node && !firstRef) firstRef = readControlledRemovalNode(node); };
  const elements = new WeakMap<object, { element: string; props: SelectInputOwnProps<Editor>; ref: typeof reference }>();
  function component(frame: object) {
    if (!elements.has(frame)) {
      // Null is an intentional JS-runtime compatibility input; public types stay unchanged.
      const props = { 'data-controlled-removal-editor': '', ...frame } as unknown as SelectInputOwnProps<Editor>;
      elements.set(frame, { element: initial.tag, props, ref: reference });
    }
    return elements.get(frame)!;
  }
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  let own = $derived(frames.get(phase)!);
  let ownerProps = $derived({ id: 'controlled-removal-field', open: false, virtual: false, options,
    components: { input: component(own) }, 'aria-label': 'Controlled removal editor',
    showSearch: { filterOption: false, ...(initial.control === 'select' ? { searchValue: 'generated', autoClearSearchValue: false } : {}) } });
  owner.read = () => {
    const frame = frames.get(phase)!;
    return { phase, ownKeys: Object.keys(frame), hasOwnValue: Object.hasOwn(frame, 'value'), hasOwnDefaultValue: Object.hasOwn(frame, 'defaultValue'), hasOwnChecked: Object.hasOwn(frame, 'checked'),
      valueKind: frame.value === undefined ? 'undefined' : frame.value === null ? 'null' : frame.value,
      checkedKind: frame.checked === undefined ? 'undefined' : frame.checked === null ? 'null' : String(frame.checked), firstRef,
      refs: { control: Boolean(control), root: Boolean(root), editor: Boolean(editor), authored: Boolean(authored) } };
  };
  owner.readRefs = () => ({ editor });
  owner.update = next => { phase = next; };
  onMount(() => { owner.onCommit?.(); });
</script>

<section data-controlled-removal-case={initial.id} style="width:280px">
  <ConfigProvider theme={{ token: { motion: false }, cssVar: { key: 'controlled-removal' } }}>
    {#if initial.control === 'select'}<Multiple {...ownerProps} value={['a']} mode="multiple" bind:this={control} bind:nativeElement={root} bind:inputElement={editor}/>
    {:else}<Completion {...ownerProps} value="generated" bind:this={control} bind:nativeElement={root} bind:inputElement={editor}/>{/if}
  </ConfigProvider>
</section>
