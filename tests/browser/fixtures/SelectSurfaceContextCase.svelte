<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { AutoComplete, Button, ConfigProvider, Form, FormItem, Input, Select, SpaceCompact,
    createForm, enUS, type SelectPopupRender, type SelectRef } from '@woodger/antd';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { type SelectSurfaceContextAction, type SelectSurfaceContextSample } from '../select-surface-context-cases';
  import SelectSurfaceContextProbe from './SelectSurfaceContextProbe.svelte';

  let { sample, capture }: { sample: SelectSurfaceContextSample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [];
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const form = createForm<{ field: string }>({ initialValues: { field: 'a' } });
  const theme = { token: { motion: false }, cssVar: { key: 'select-surface-context' } };
  let open = $state(false);
  let disabled = $state(false);
  let variant = $state<'underlined' | 'borderless' | 'filled'>('underlined');
  let control = $state<SelectRef>();
  let root = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoCompleteEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let editor = $derived(sample.control === 'autocomplete' ? autoCompleteEditor : selectEditor);
  let alive = true;
  onDestroy(() => { alive = false; });

  function callback<Value>(name: string, value: Value): Value {
    return recorder.register(value, { callback: name });
  }
  const onOpenChange = callback('context-open', (value: boolean) => {
    open = value;
    events.push(recorder.encode(['open', value]));
  });
  const onFieldChange = callback('public-Form-field-onChange', (value: string | undefined) => {
    form.setFieldValue('field', value ?? '');
  });
  function semantic(side: 'parent' | 'nested') {
    return callback('context-classNames-' + side, (info: {
      props: { size?: unknown; status?: unknown; disabled?: unknown; variant?: unknown }
    }) => recorder.record('classNames', side, info, {
      root: `surface-context-${side}-${info.props.size ?? 'unset'}-${info.props.status ?? 'unset'}-${info.props.disabled ? 'disabled' : 'enabled'}-${info.props.variant ?? 'unset'}`
    }));
  }
  const parentSemantic = semantic('parent');
  const nestedSemantic = semantic('nested');
  recorder.register(customPopup, { node: 'context-popup-wrap', origin: 'same-argument' });
  const popupRender: SelectPopupRender = callback('context-popup', origin => {
    recorder.register(origin, { node: 'origin-menu' });
    return recorder.record('popupRender', 'parent', origin, customPopup,
      { originIdentity: recorder.identity(origin) });
  });
  const initialId = untrack(() => sample.id);
  export function update(action: SelectSurfaceContextAction) {
    if (action.type === 'fields') {
      form.setFields([
        { name: 'field', errors: ['Authored error'], warnings: ['Authored warning'] }
      ]);
    }
    if (action.type === 'contexts') {
      disabled = action.disabled;
      variant = action.variant;
    }
  }
  export function readRefs() {
    return { root, editor, control, publicRoot: root, publicEditor: editor };
  }
  export function read() {
    return { open, disabled, variant, events: [...events], calls: [...recorder.calls], alive,
      fieldErrors: recorder.encode(form.getFieldError('field')),
      fieldWarnings: recorder.encode(form.getFieldWarning('field')),
      fieldValue: form.getFieldValue('field') };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
  }
</script>

{#snippet customPopup(origin: Snippet)}
  <div data-surface-context-popup>{@render origin()}
    <SelectSurfaceContextProbe side="inside" {recorder} />
    <div data-surface-context-slot="inside-input"><Input defaultValue="Inside" aria-label="Inside context input" /></div>
    <div data-surface-context-slot="inside-select"><Select value="a" {options} open={false}
      classNames={nestedSemantic} class="surface-context-nested" style={{ width: 160 }} aria-label="Inside context select" /></div>
    <div data-surface-context-slot="inside-button"><Button htmlType="button">Inside button</Button></div>
  </div>
{/snippet}
{#snippet parentControl()}
  {#if sample.control === 'autocomplete'}
    <AutoComplete value={form.values.field} {options} {open} {onOpenChange} onChange={onFieldChange}
      {popupRender} classNames={parentSemantic} class="surface-context-parent" showSearch
      style={{ width: 220 }} aria-label="Parent context value" bind:this={control}
      bind:nativeElement={root} bind:inputElement={autoCompleteEditor} />
  {:else}
    <Select value={form.values.field} {options} {open} {onOpenChange} onChange={onFieldChange}
      {popupRender} classNames={parentSemantic} class="surface-context-parent" showSearch
      style={{ width: 220 }} aria-label="Parent context value" bind:this={control}
      bind:nativeElement={root} bind:inputElement={selectEditor} />
  {/if}
{/snippet}
{#snippet outsideInput()}
  <div data-surface-context-slot="outside-input"><Input defaultValue="Outside" aria-label="Outside context input" /></div>
{/snippet}
{#snippet outsideButton()}
  <div data-surface-context-slot="outside-button"><Button htmlType="button">Outside button</Button></div>
{/snippet}

<section data-surface-context-case={initialId} data-surface-context-bound={Boolean(control)}
  style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {theme} locale={enUS} componentDisabled={false} variant="filled">
    <!-- Восстанавливаем заданный родителю Source font поверх provider reset. -->
    <div style="position:absolute;left:300px;top:200px;width:700px;font-family:initial;font-size:16px;line-height:normal">
      <Form {form} name="surface-context-form" {disabled} {variant}>
        <FormItem name="field" validateStatus="error" hasFeedback>
          <SpaceCompact size="small" items={[parentControl, outsideInput, outsideButton]} />
          <SelectSurfaceContextProbe side="outside" {recorder} />
        </FormItem>
      </Form>
    </div>
  </ConfigProvider>
  <button type="button" data-surface-context-outside style="position:fixed;left:16px;top:80px">Outside context</button>
  <output hidden data-surface-context-owner>{JSON.stringify(read())}</output>
  <div hidden data-surface-context-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<SelectSurfaceContextAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('contextupdate', updating);
    node.addEventListener('contextread', reading);
    node.addEventListener('contextrefs', refs);
    return () => {
      node.removeEventListener('contextupdate', updating);
      node.removeEventListener('contextread', reading);
      node.removeEventListener('contextrefs', refs);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
