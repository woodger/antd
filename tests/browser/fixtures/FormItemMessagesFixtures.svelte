<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, Form, FormItem, Input, createForm } from '@woodger/antd';

  type Profile = 'default' | 'extra-and-prefix' | 'without-motion';

  let { initialProfile = 'default', initialMessages = false }: {
    initialProfile?: Profile;
    initialMessages?: boolean;
  } = $props();

  const model = createForm({
    initialValues: { title: 'Text', child: '' },
    // A model-owned field can receive metadata before its editor is registered.
    rules: { title: [{}] }
  });
  let profile = $state(untrack(() => initialProfile));
  let prefix = $derived(profile === 'extra-and-prefix' ? 'probe' : 'ant');
  let hasExtra = $derived(profile !== 'default');
  let mounted = $state(true);
  let hasHelp = $state(false);
  let nested = $state(false);

  function setMessages(errors: string[], warnings: string[] = []) {
    model.setFields([{ name: 'title', errors, warnings }]);
  }

  function showMessages() {
    setMessages(['Alpha', 'Beta'], ['Warning']);
  }

  function showNestedMessages() {
    model.setFields([{ name: 'child', errors: ['Invalid child'] }]);
  }

  untrack(() => {
    if (initialMessages) showMessages();
  });
</script>

<section id="form-item-messages-fixture" aria-label="Form item messages">
  <label>Message profile
    <select bind:value={profile}>
      <option value="default">Default</option>
      <option value="extra-and-prefix">Extra and prefix</option>
      <option value="without-motion">Without motion</option>
    </select>
  </label>
  <button type="button" onclick={showMessages}>Show validation messages</button>
  <button type="button" onclick={() => setMessages(['Beta', 'Gamma'])}>Replace validation messages</button>
  <button type="button" onclick={() => setMessages([], ['Warning'])}>Warn without errors</button>
  <button type="button" onclick={() => setMessages([])}>Clear validation messages</button>
  <button type="button" onclick={() => { hasHelp = true; }}>Enable fallback help</button>
  <button type="button" onclick={() => { nested = true; }}>Mount nested field</button>
  <button type="button" onclick={showNestedMessages}>Show nested message</button>
  <button type="button" onclick={() => { nested = false; }}>Remove nested field</button>
  <button type="button" onclick={() => { mounted = false; }}>Remove message field</button>

  <ConfigProvider prefixCls={prefix} theme={{ cssVar: {}, token: { motion: profile !== 'without-motion' } }}>
    <div style="width:450px">
      <Form form={model} layout="vertical" name="motion-probe">
        {#if mounted}
          <FormItem name="title" label="Title" class="motion-probe-item" style="margin-bottom:31px"
            help={hasHelp ? 'Fallback help' : undefined} extra={hasExtra ? 'More details' : undefined}>
            <Input value={model.values.title} onValueChange={(value) => model.setFieldValue('title', value)} />
            {#if nested}<FormItem name="child" noStyle><Input aria-label="Nested" /></FormItem>{/if}
          </FormItem>
        {/if}
        <div id="item-message-sibling">Sibling</div>
      </Form>
    </div>
  </ConfigProvider>
</section>
