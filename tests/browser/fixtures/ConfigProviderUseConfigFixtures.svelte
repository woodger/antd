<script lang="ts">
  // Exercises the public useConfig hook under each provider that changes the two settings.
  import { untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import {
    Button, ConfigProvider, createForm, Form, FormItem, Input, Modal, type ComponentSize
  } from '@woodger/antd';
  import Probe from './ConfigProviderUseConfigProbe.svelte';

  let { initialInherited = false }: { initialInherited?: boolean; } = $props();
  let size = $state<ComponentSize | undefined>(untrack(() => initialInherited ? 'small' : undefined));
  let disabled = $state<boolean | undefined>(untrack(() => initialInherited ? true : undefined));
  let modalOpen = $state(false);
  const inheritedForm = createForm({ initialValues: {} });
  const explicitForm = createForm({ initialValues: {} });
  const submittingForm = createForm({ initialValues: { sample: '' } });
  let release = $state.raw<() => void>();

  /** Changes the owner while all nested consumers stay mounted. */
  function setInheritedSettings() {
    size = 'small';
    disabled = true;
  }

  /** Removes the size setting and publishes an explicit enabled state. */
  function removeInheritedSettings() {
    size = undefined;
    disabled = false;
  }

  /** Keeps the native submission pending so the hook and controls can be read together. */
  function holdSubmission() {
    const pending = new Promise<void>(resolve => { release = resolve; });

    return pending;
  }

  /** Lets the held submission settle without changing the surrounding provider. */
  function finishSubmission() {
    const resolve = release;
    release = undefined;
    resolve?.();
  }
</script>

{#snippet help()}
  <Probe name="form-help" />
  <ConfigProvider><Probe name="form-help-provider" /></ConfigProvider>
  <Button id="form-help-button">Form help action</Button>
{/snippet}

{#snippet footer(original: Snippet)}
  <Probe name="modal-footer" />
  <Button id="modal-footer-button">Footer action</Button>
  <Button id="explicit-disabled-button" disabled>Explicit disabled action</Button>
  {@render original()}
{/snippet}

<section id="config-use-config-fixture">
  <button type="button" onclick={setInheritedSettings}>Apply inherited settings</button>
  <button type="button" onclick={removeInheritedSettings}>Remove inherited settings</button>
  <button type="button" onclick={() => { modalOpen = true; }}>Open configuration dialog</button>
  <button type="button" onclick={finishSubmission}>Finish form submission</button>
  <output aria-label="Submission pending">{String(release !== undefined)}</output>

  <Probe name="outside" />
  <ConfigProvider componentSize={size} componentDisabled={disabled}>
    <Probe name="outer" />
    <ConfigProvider><Probe name="inherited" /></ConfigProvider>
    <ConfigProvider componentSize="large" componentDisabled={false}>
      <Probe name="inner-explicit" />
    </ConfigProvider>
    <ConfigProvider componentSize="medium"><Probe name="inner-medium" /></ConfigProvider>
    <Form form={inheritedForm} disabled={false}><Probe name="form-inherits-size" /></Form>
    <Form form={explicitForm} size="large" disabled><Probe name="form-explicit" /></Form>

    <Modal bind:open={modalOpen} title="Config scope dialog" getContainer={false}
      transitionName="" maskTransitionName="" okText="Accept configuration"
      cancelText="Close configuration" {footer}>
      <Probe name="modal-body" />
      <Button id="modal-body-button">Body action</Button>
    </Modal>
  </ConfigProvider>

  <Form form={submittingForm} onFinish={holdSubmission}>
    <Probe name="form-submit" />
    <FormItem name="sample" {help}><Input aria-label="Sample" /></FormItem>
    <Button htmlType="submit">Hold form submission</Button>
  </Form>
</section>
