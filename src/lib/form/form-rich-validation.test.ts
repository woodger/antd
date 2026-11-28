import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { createForm, type FormFieldMeta } from './form.model.svelte';

describe('Form validation with snippets', () => {
  it('keeps rich diagnostics in validateOnly and projects text only after visible validation', async () => {
    const template = vi.fn(() => ({ render: () => '<strong>Required</strong>' }));
    const snippet = createRawSnippet(template);
    const warning = { text: 'Check this name', content: snippet };
    const form = createForm({
      initialValues: { name: '' },
      rules: {
        name: [
          { required: true, message: snippet },
          { required: true, message: '${name} is required' },
          { required: true, warningOnly: true, message: warning }
        ]
      }
    });
    const field = {
      name: ['name'],
      errors: ['', 'name is required'],
      warnings: ['Check this name'],
      errorMessages: [snippet, 'name is required'],
      warningMessages: [warning]
    };

    await expect(form.validateFields(['name'], { validateOnly: true }))
      .rejects.toMatchObject({ errorFields: [field], outOfDate: false });

    expect(form.getFieldsError(['name'])).toEqual([{ name: ['name'], errors: [], warnings: [] }]);

    await expect(form.validateFields(['name'])).rejects.toMatchObject({ errorFields: [field] });

    expect(form.getFieldsError(['name'])).toEqual([field]);
    expect(form.getFieldError('name')).toEqual(field.errors);
    expect(form.getFieldWarning('name')).toEqual(field.warnings);
    expect(form.errors).toEqual({ name: field.errors });
    expect(template).not.toHaveBeenCalled();
  });

  it('copies injected messages and includes both representations in field metadata', () => {
    const snippet = createRawSnippet(() => ({ render: () => '<em>External</em>' }));
    const replacement = { text: 'External ${name}', content: snippet };
    const form = createForm({ initialValues: { name: 'Rose' }, rules: { name: [{}] } });

    form.setFields([{
      name: 'name',
      errors: ['Ignored'],
      errorMessages: ['Original text', replacement],
      warningMessages: [snippet]
    }]);
    replacement.text = 'Later edit';
    const [snapshot] = form.getFieldsError(['name']);
    const selected: FormFieldMeta[] = [];
    form.getFieldsValue({ filter: meta => {
      if (meta) selected.push(meta);
      return true;
    } });

    expect(snapshot).toEqual({
      name: ['name'],
      errors: ['Original text', 'External ${name}'],
      warnings: [''],
      errorMessages: ['Original text', { text: 'External ${name}', content: snippet }],
      warningMessages: [snippet]
    });
    expect(selected).toEqual([expect.objectContaining(snapshot)]);

    form.setFields([{ name: 'name', errors: ['Plain'], warningMessages: undefined }]);

    expect(form.getFieldsError(['name'])).toEqual([{
      name: ['name'], errors: ['Plain'], warnings: []
    }]);
  });

  it('keeps nested rich warnings without making the containing field invalid', async () => {
    const snippet = createRawSnippet(() => ({ render: () => '<em>Check the row</em>' }));
    const form = createForm({
      initialValues: { items: [{ name: '' }] },
      rules: {
        items: [{
          type: 'array',
          warningOnly: true,
          defaultField: { type: 'object', fields: { name: { required: true, message: snippet } } }
        }]
      }
    });

    await expect(form.validateFields()).resolves.toEqual({ items: [{ name: '' }] });

    expect(form.getFieldsError(['items'])).toEqual([{
      name: ['items'], errors: [], warnings: [''], warningMessages: [snippet]
    }]);
  });
});
