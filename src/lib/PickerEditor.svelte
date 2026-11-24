<script lang="ts">
  import type { DatePickerEditor, DatePickerEditorContext } from './picker-components.types';
  import type { ComponentSize } from './types';

  let { editor, attributes, register, range, size: editorSize }: DatePickerEditorContext & {
    editor: DatePickerEditor;
    size?: ComponentSize;
  } = $props();
</script>

{#if typeof editor === 'function'}
  {@render editor({ attributes, register, range })}
{:else if editor === 'textarea'}
  {@const { value, defaultValue, type, size, ...textareaAttributes } = attributes}
  <textarea {...textareaAttributes} {value} data-picker-editor-size={editorSize}
    {@attach register}></textarea>
{:else}
  <input {...attributes} {@attach register} />
{/if}

<style>
  textarea {
    box-sizing: border-box;
    flex: auto;
    inline-size: 100%;
    min-inline-size: 1px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--ant-date-picker-input-font-size);
    line-height: var(--ant-line-height);
    resize: none;
  }

  textarea[data-picker-editor-size='small'] {
    font-size: var(--ant-date-picker-input-font-size-sm);
  }

  textarea[data-picker-editor-size='large'] {
    font-size: var(--ant-date-picker-input-font-size-lg);
    line-height: var(--ant-line-height-lg);
  }

  textarea::placeholder {
    color: var(--ant-color-text-placeholder);
    opacity: 1;
    user-select: none;
  }

  textarea:focus {
    outline: 0;
    box-shadow: none;
  }

  textarea:disabled {
    color: var(--ant-color-text-disabled);
    cursor: not-allowed;
  }
</style>
