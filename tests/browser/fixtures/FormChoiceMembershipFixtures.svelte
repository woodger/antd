<script lang="ts">
  import { Checkbox, ConfigProvider, Form, FormItem, Radio, RadioButton } from '@woodger/antd';

  const controls = ['checkbox', 'radio', 'radio-button'] as const;
  type Control = typeof controls[number];
  let prefix = $state('audit');
</script>

{#snippet choice(control: Control)}
  {#if control === 'checkbox'}<Checkbox>Choice</Checkbox>
  {:else if control === 'radio'}<Radio>Choice</Radio>
  {:else}<RadioButton>Choice</RadioButton>{/if}
{/snippet}

<div id="form-choice-membership-fixture">
  <button type="button" onclick={() => { prefix = 'alternate'; }}>Change prefix</button>
  <ConfigProvider prefixCls={prefix}>
    <Form>
      {#each controls as control}
        {@const valuePropName = control === 'checkbox' ? 'checked' : 'value'}
        <section data-case={`${control}:outside`}>{@render choice(control)}</section>
        <section data-case={`${control}:named`}>
          <FormItem name={`${control}-named`} {valuePropName}>{@render choice(control)}</FormItem>
        </section>
        <section data-case={`${control}:nameless`}>
          <FormItem label="Layout only">{@render choice(control)}</FormItem>
        </section>
        <section data-case={`${control}:bare-no-style`}>
          <FormItem name={`${control}-bare`} {valuePropName} noStyle>
            {@render choice(control)}
          </FormItem>
        </section>
        <section data-case={`${control}:nested-no-style`}>
          <FormItem label="Owner">
            <FormItem name={`${control}-nested`} {valuePropName} noStyle>
              {@render choice(control)}
            </FormItem>
          </FormItem>
        </section>
        <section data-case={`${control}:hidden-no-style`}>
          <FormItem name={`${control}-hidden`} {valuePropName} noStyle hidden>
            {@render choice(control)}
          </FormItem>
        </section>
      {/each}
    </Form>
  </ConfigProvider>
</div>
