<script lang="ts">
  import {
    Select, AutoComplete, type SelectInputContext, type SelectLabelValue,
    type SelectRef, type SelectRootContext, type AutoCompleteInput, type SelectInputOwnProps
  } from '@woodger/antd';

  interface Entry { value: number; label: string; audit: { owner: string }; }
  interface CompletionEntry { value: string; label: string; audit: { owner: string }; }
  const options: readonly Entry[] = [{ value: 1, label: 'Alpha', audit: { owner: 'source' } }];
  const completions: readonly CompletionEntry[] = [{
    value: 'a',
    label: 'Alpha',
    audit: { owner: 'source' }
  }];
  const LabeledMultipleSelect = Select<number, 'multiple', Entry, true, HTMLButtonElement, HTMLTextAreaElement>;
  const TextareaSelect = Select<number, undefined, Entry, false, HTMLDivElement, HTMLTextAreaElement>;
  const CustomCompletion = AutoComplete<CompletionEntry, HTMLButtonElement, HTMLTextAreaElement>;
  const editorProps: SelectInputOwnProps<HTMLTextAreaElement> = { rows: 2, type: 'text',
    style: { width: 83, fontSize: 17, paddingInline: 7 } };
  let selected = $state<SelectLabelValue<number>[]>([{ value: 1 }]);
  let selectedRoot = $state<HTMLButtonElement | HTMLDivElement>();
  let selectedEditor = $state<HTMLTextAreaElement | HTMLInputElement>();
  let completionRoot = $state<HTMLButtonElement | HTMLDivElement>();
  let completionEditor = $state<HTMLTextAreaElement | HTMLInputElement>();
  let completionValue = $state('a');
  let inputRoot = $state<HTMLInputElement | HTMLDivElement>();
  let defaultRoot = $state<HTMLDivElement>();
  let defaultInput = $state<HTMLInputElement>();
  let defaultCompletionInput = $state<HTMLInputElement | HTMLTextAreaElement>();
  let control = $state<SelectRef>();
</script>

{#snippet buttonRoot(context: SelectRootContext<HTMLButtonElement>)}
  <button {...context.attributes} {@attach context.register}>Choose</button>
{/snippet}
{#snippet inputRootSnippet(context: SelectRootContext<HTMLInputElement>)}
  <input {...context.attributes} {@attach context.register} />
{/snippet}
{#snippet textareaInput(context: SelectInputContext<HTMLTextAreaElement>)}
  <textarea {...context.attributes} {@attach context.register}></textarea>
{/snippet}
{#snippet legacyInput(context: AutoCompleteInput)}
  <input {...context.attributes} use:context.register />
{/snippet}

<LabeledMultipleSelect mode="multiple" labelInValue {options} bind:value={selected}
  components={{ root: buttonRoot, input: textareaInput }}
  bind:nativeElement={selectedRoot} bind:inputElement={selectedEditor} bind:this={control}
  onChange={(value, records) => {
    const payload: SelectLabelValue<number>[] = value;
    const owner: string | undefined = records[0]?.audit.owner;
    void [payload, owner];
  }} />
<CustomCompletion options={completions} value={completionValue} onChange={value => {
  completionValue = value ?? '';
}}
  components={{ root: { render: buttonRoot, props: { type: 'button' } },
    input: { render: textareaInput, props: editorProps } }}
  bind:nativeElement={completionRoot} bind:inputElement={completionEditor}
  onSelect={(value, record) => {
    const text: string = value;
    const owner: string = record.audit.owner;
    void [text, owner];
  }} />
<Select {options} components={{ root: inputRootSnippet }} bind:nativeElement={inputRoot} />
<AutoComplete options={completions} components={{ input: textareaInput }} bind:inputElement={completionEditor} />
<TextareaSelect {options} components={{ input: { element: 'textarea', props: editorProps,
  ref: node => {
    const textarea: HTMLTextAreaElement | null = node;
    void textarea;
  } } }} />
<AutoComplete options={completions} components={{ root: 'button', input: 'textarea' }} />
<Select {options} bind:nativeElement={defaultRoot} bind:inputElement={defaultInput} />
<AutoComplete options={completions} bind:nativeElement={defaultRoot} bind:inputElement={defaultCompletionInput} />
<AutoComplete options={completions} children={legacyInput} components={{ input: textareaInput }} />
