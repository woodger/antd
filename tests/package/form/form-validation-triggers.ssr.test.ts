import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import type {
  FormItemProps, FormProps, FormValidateTrigger, FormListRule, ValidationRule
} from '@woodger/antd';
import FormValidationTriggerFixtures from '../../browser/fixtures/FormValidationTriggerFixtures.svelte';
import observation from '../../browser/fixtures/ant-design-form-validation-trigger-observation.json';
import registry from '../../porting-registry';

it('renders field values with validation wiring scoped to the model', () => {
  const triggers: FormValidateTrigger = ['onChange', 'onBlur'] as const;
  const props: Pick<FormProps<{ name: string }>, 'validateTrigger'> = { validateTrigger: false };
  const rule: ValidationRule = { validateTrigger: ['onBlur'] };
  const listRule: FormListRule = { validateTrigger: 'onChange', validator: () => undefined };
  const item: Pick<FormItemProps, 'dependencies' | 'validateTrigger' | 'rules'> = {
    validateTrigger: triggers, dependencies: [['rows', 0, 'title']], rules: [rule]
  };

  const { body } = render(FormValidationTriggerFixtures);

  expect(observation.upstream).toMatchObject({
    release: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(props.validateTrigger).toBe(false);
  expect(item).toMatchObject({ validateTrigger: ['onChange', 'onBlur'], rules: [rule] });
  expect(listRule.validateTrigger).toBe('onChange');
  expect(body.match(/<form\b/g)).toHaveLength(3);
  expect(body).toMatch(/<input[^>]*id="row-0"[^>]*value="first"/);
  expect(body).not.toMatch(/<(?:form|input|div)\b[^>]*\s(?:validateTrigger|dependencies)=/i);
  expect(body).toContain('<pre id="validation-trigger-trace">[]</pre>');
});
