<script lang="ts">
  import { untrack } from 'svelte';
  import { Select, AutoComplete, Form, FormItem, createForm, type SelectRef,
    type SelectInputContext, type SelectRootContext } from '@woodger/antd';

  let { sample }: { sample: string } = $props();
  const initial = untrack(() => sample), autocomplete = initial.startsWith('ac-');
  const multiple = initial.includes('backspace'), slot = initial.includes('-root') || initial.startsWith('root-') ? 'root' : 'input';
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, {
    value: 'locked',
    label: 'Locked',
    disabled: true
  }];
  let single = $state<string | undefined>('a'), completion = $state('a');
  let values = $state(['a', 'b', 'locked']), open = $state(initial.endsWith('-open'));
  let control = $state<SelectRef>();
  const focusCalls: Array<[FocusOptions?]> = [], changes: unknown[] = [], deselections: string[] = [], searches: string[] = [];
  const focusOrder: string[] = [];
  const blurCalls: Array<{ type: string; tag: string | undefined }> = [], validatorCalls: unknown[] = [];
  let clears = 0;
  const form = createForm<{ choice: string }>({ initialValues: { choice: 'a' } });
  const search = { filterOption: false, onSearch: (value: string) => { searches.push(value); } };
  const clear = { clearIcon: '×', label: 'Regression clear' };
  function register(
    context: SelectInputContext<HTMLInputElement> | SelectRootContext<HTMLInputElement>,
    node: HTMLInputElement
  ) {
    return context.register({ nativeElement: node, inputElement: node,
      focus(...args: [FocusOptions?]) {
        focusOrder.push('composite-focus');
        focusCalls.push(args);
        node.focus(...args);
      },
      blur() { node.blur(); }
    });
  }
  function onBlur(event: FocusEvent) {
    blurCalls.push({ type: event.type, tag: (event.currentTarget as Element | null)?.tagName });
  }
  function onFocus() { focusOrder.push('public-focus'); }
  function read() {
    return { model: initial === 'default-blur' ? form.values.choice : multiple ? [...values] : autocomplete ? completion : single,
      open, focusCalls: focusCalls.map(args => [...args]), focusOrder: [...focusOrder], changes: [...changes], deselections: [...deselections], searches: [...searches],
      blurCalls: [...blurCalls], validatorCalls: [...validatorCalls], touched: form.isFieldTouched('choice'), clears };
  }
  function focus() {
    if (!control) {
      throw Error('Mounted public control required');
    }
    control.focus();
  }
</script>

{#snippet suffix()}<span data-component-regression-suffix style="pointer-events:auto">S</span>{/snippet}
{#snippet root(context: SelectRootContext<HTMLInputElement>)}
  <input {...context.attributes} data-component-regression-editor {@attach node => register(untrack(() => context), node)} />
{/snippet}
{#snippet input(context: SelectInputContext<HTMLInputElement>)}
  <input {...context.attributes} data-component-regression-editor {@attach node => register(untrack(() => context), node)} />
{/snippet}
<section data-component-regression={initial} style={'width:320px;'
  + 'padding:12px'} {@attach node => {
  const capture = (event: Event) => Object.assign((event as CustomEvent).detail, { read, focus });
  node.addEventListener('componentregressioncapture', capture);
  return () => node.removeEventListener('componentregressioncapture', capture);
}}>
  {#if initial === 'default-blur'}
    <Form {form}><FormItem name="choice" rules={[{ validator(value) { validatorCalls.push(value); } }]}>
      <Select {options} value={form.values.choice} aria-label="Regression value" allowClear={clear} showSearch={search}
        onChange={value => {
          changes.push(value);
          form.setFieldValue('choice', value ?? '');
        }}
        onClear={() => { clears++; }} {onBlur} />
    </FormItem></Form>
  {:else if autocomplete}
    <AutoComplete {options} value={completion} {open} onOpenChange={value => { open = value; }} bind:this={control}
      components={slot === 'root' ? { root } : { input }} aria-label="Regression value"
      allowClear={clear} suffix={() => suffix} showSearch={search} {onFocus}
      onChange={value => {
        completion = value ?? '';
        changes.push(value);
      }} onClear={() => {
        clears++;
      }} {onBlur} />
  {:else if multiple}
    <Select {options} mode="multiple" value={values} bind:open bind:this={control}
      components={slot === 'root' ? { root } : { input }} aria-label="Regression value" showSearch={search}
      onChange={value => {
        values = value;
        changes.push(value);
      }} onDeselect={value => {
        deselections.push(value);
      }} {onBlur} />
  {:else}
    <Select {options} value={single} bind:open bind:this={control}
      components={slot === 'root' ? { root } : { input }} aria-label="Regression value"
      allowClear={clear} suffix={() => suffix} showSearch={search} {onFocus}
      onChange={value => {
        single = value;
        changes.push(value);
      }} onClear={() => { clears++; }} {onBlur} />
  {/if}
  <button type="button" data-component-regression-outside>Outside</button>
</section>
