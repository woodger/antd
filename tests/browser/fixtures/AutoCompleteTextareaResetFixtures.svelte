<script lang="ts">
  import { AutoComplete, type AutoCompleteProps, type SelectRef } from 'antd-svelte';

  type ResetId = 'uncontrolled' | 'controlled' | 'cancelled';
  interface Field {
    id: ResetId;
    label: string;
    model: string | undefined;
    changes: Array<string | undefined>;
    resets: number;
    prevented: boolean;
    mounted: boolean;
    form?: HTMLFormElement;
    control?: SelectRef;
    root?: HTMLDivElement;
    editor?: HTMLInputElement | HTMLTextAreaElement;
  }
  let fields = $state<Field[]>([
    {
      id: 'uncontrolled',
      label: 'Uncontrolled textarea completion',
      model: 'seed',
      changes: [],
      resets: 0,
      prevented: false,
      mounted: true
    },
    {
      id: 'controlled',
      label: 'Controlled textarea completion',
      model: 'seed',
      changes: [],
      resets: 0,
      prevented: false,
      mounted: true
    },
    {
      id: 'cancelled',
      label: 'Cancelled textarea completion',
      model: 'seed',
      changes: [],
      resets: 0,
      prevented: false,
      mounted: true
    }
  ]);
  function props(field: Field): AutoCompleteProps {
    return {
      name: 'query', 'aria-label': field.label,
      ...(field.id === 'controlled' ? { value: field.model } : { defaultValue: 'seed' }),
      onChange: value => {
        field.changes.push(value);
        if (field.id === 'controlled') field.model = value;
      }
    };
  }
  function read(field: Field) {
    return { model: field.id === 'controlled' ? field.model : null, changes: [...field.changes],
      resets: field.resets, prevented: field.prevented, mounted: field.mounted };
  }
  function refs(field: Field) {
    return { form: field.form, control: field.control, root: field.root, editor: field.editor };
  }
</script>

<section id="autocomplete-textarea-reset-fixture">
  {#each fields as field (field.id)}
    <form data-textarea-reset-case={field.id} bind:this={field.form} onreset={event => {
      if (field.id === 'cancelled') event.preventDefault();
      field.resets += 1;
      field.prevented = event.defaultPrevented;
    }}>
      {#if field.mounted}
        <AutoComplete {...props(field)} bind:this={field.control} bind:nativeElement={field.root} bind:inputElement={field.editor}>
          {#snippet children(context)}<textarea {...context.attributes} use:context.register></textarea>{/snippet}
        </AutoComplete>
      {/if}
      <button type="reset">Reset {field.id} textarea</button>
    </form>
  {/each}
  <div hidden data-textarea-reset-command {@attach node => {
    const capture = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const field = fields.find(field => field.id === detail.id);
      if (!field) throw Error('Unknown textarea reset case');
      Object.assign(detail, { read: () => read(field), readRefs: () => refs(field), dispose: () => { field.mounted = false; } });
    };
    node.addEventListener('textarearesetcapture', capture);
    return () => node.removeEventListener('textarearesetcapture', capture);
  }}></div>
</section>
