<script lang="ts">
  // The owner changes the editor's options and records the order of public events.
  import {
    AutoComplete, ConfigProvider, type AutoCompleteOption, type SelectInputContext
  } from '@woodger/antd';
  import { untrack } from 'svelte';

  let { initial = 'standard' }: { initial?: string } = $props();
  let sample = $state(untrack(() => initial));
  let ownerValue = $state('');
  let events = $state.raw<Array<[string, string | boolean]>>([]);
  let root = $state<HTMLDivElement>();
  let input = $state<HTMLInputElement>();
  let textarea = $state<HTMLTextAreaElement>();
  const InputCompletion = AutoComplete<AutoCompleteOption, HTMLDivElement, HTMLInputElement>;
  const TextAreaCompletion = AutoComplete<AutoCompleteOption, HTMLDivElement, HTMLTextAreaElement>;
  const options = [{ value: 'Alpha' }, { value: 'Beta' }];
  const theme = { token: { motion: false }, cssVar: { key: 'auto-complete-editor-height' } };
  const compactRtl = $derived(sample === 'compact-rtl');
  const textareaSample = $derived(['textarea', 'initial-value', 'compact-rtl'].includes(sample));
  const activeEditor = $derived(input ?? textarea);
  const refsConnected = $derived(Boolean(activeEditor && root?.contains(activeEditor)));
  const defaultValue = $derived(sample === 'initial-value' ? 'Saved draft' : undefined);
  const valueProps = $derived(sample === 'controlled' ? { value: ownerValue } : { defaultValue });
  const editorProps = $derived({
    'aria-label': 'Editor',
    options,
    style: { width: '100%' },
    size: compactRtl ? 'small' as const : undefined,
    ...valueProps,
    styles: sample === 'author-height' ? { content: { minHeight: '40px' } } : undefined,
    showSearch: { onSearch: (next: string) => record('search', next) },
    onChange: change,
    onOpenChange: (open: boolean) => record('open', open)
  });

  /** Opens an independent state for the next scenario. */
  function choose(event: Event & { currentTarget: HTMLSelectElement }) {
    events = [];
    ownerValue = '';
    sample = event.currentTarget.value;
  }

  /** In the managed scenario, the owner takes the entered value. */
  function change(next: string | undefined) {
    ownerValue = next ?? '';
    record('change', ownerValue);
  }

  /** Keeps the order of events without reference to the internal states of the editor. */
  function record(name: string, next: string | boolean) {
    events = [...events, [name, next]];
  }
</script>

{#snippet customInput({ attributes, register }: SelectInputContext<HTMLInputElement>)}
  <input {...attributes} {@attach register} />
{/snippet}

{#snippet customTextarea({ attributes, register }: SelectInputContext<HTMLTextAreaElement>)}
  {@const { value, ...rest } = attributes}
  <textarea {...rest} {value} rows={3} {@attach register}></textarea>
{/snippet}

<section id="auto-complete-editor-height-fixture" data-refs-connected={refsConnected}>
  <select aria-label="Editor sample" value={sample} onchange={choose}>
    <option value="standard">Standard input</option>
    <option value="input">Custom input</option>
    <option value="textarea">Custom textarea</option>
    <option value="controlled">Controlled input</option>
    <option value="initial-value">Initially filled textarea</option>
    <option value="compact-rtl">Small RTL textarea</option>
    <option value="author-height">Author minimum height</option>
  </select>
  {#key sample}
    <ConfigProvider {theme} prefixCls={compactRtl ? 'catalog' : undefined}
      direction={compactRtl ? 'rtl' : 'ltr'}>
      <div style:width="320px">
        {#if textareaSample}
          <TextAreaCompletion {...editorProps} components={{ input: customTextarea }}
            bind:nativeElement={root} bind:inputElement={textarea} />
        {:else}
          <InputCompletion {...editorProps} components={sample === 'standard' ? undefined : { input: customInput }}
            bind:nativeElement={root} bind:inputElement={input} />
        {/if}
      </div>
    </ConfigProvider>
  {/key}
  <output id="editor-height-events">{JSON.stringify(events)}</output>
</section>
