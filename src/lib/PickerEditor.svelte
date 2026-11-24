<script lang="ts">
  import type { DatePickerEditor, DatePickerEditorContext } from './picker-components.types';

  let { editor, attributes, register, range }: DatePickerEditorContext & {
    editor: DatePickerEditor;
  } = $props();
</script>

{#if typeof editor === 'function'}
  {@render editor({ attributes, register, range })}
{:else if editor === 'textarea'}
  {@const { value, defaultValue, type, size, ...textareaAttributes } = attributes}
  <textarea {...textareaAttributes} {value} {@attach register}></textarea>
{:else}
  <input {...attributes} {@attach register} />
{/if}
