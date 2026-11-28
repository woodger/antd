<script lang="ts">
  import {
    ConfigProvider, Form, FormItem, Input, Upload, UploadDragger, Button, createForm,
    type FormInstance, type UploadFile, type UploadRef
  } from '@woodger/antd';

  type Receipt = { accepted: boolean };
  type Values = { files?: readonly UploadFile<Receipt>[]; };
  const fields = ['files', 'drop', 'display', 'aria'] as const;
  type Field = typeof fields[number];
  type Step = { el: Element; top: number; left: number; };

  let form = $state(createForm<Values>({ initialValues: {} }));
  let box = $state<HTMLDivElement>();
  let select = $state<Upload<Receipt>>();
  let dragger = $state<UploadDragger>();
  let display = $state<Upload>();
  let accessible = $state<Upload>();
  let withAttachments = $state(true);
  let disabled = $state(false);
  let customAssociation = $state(false);
  let editorTrigger = $state(false);
  let snapshot = $state('');
  let submission = $state<unknown[]>([]);
  let priorRef: UploadRef<Receipt> | undefined;
  let priorModel: FormInstance<Values> | undefined;

  function recordActions(steps: readonly Step[]) {
    return steps.map(({ el, top, left }) => ({ boundary: el.id, top, left }));
  }

  function capture(field: Field) {
    const binding = { files: select, drop: dragger, display, aria: accessible }[field];
    const instance = form.getFieldInstance<UploadRef<Receipt>>(field);
    const root = instance?.nativeElement;
    const input = instance?.inputElement;
    const doc = input?.ownerDocument;
    const descriptions = (input?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    let actions: ReturnType<typeof recordActions> = [];
    form.scrollToField(field, {
      boundary: box, behavior: steps => { actions = recordActions(steps); }
    });

    snapshot = JSON.stringify({
      rootTag: root?.tagName ?? null,
      sameNativeElements: Boolean(root && root === binding?.nativeElement
        && input && input === binding?.inputElement),
      fileName: input?.name ?? null,
      hasId: Boolean(input?.id),
      required: input?.getAttribute('aria-required') ?? null,
      disabled: input?.disabled ?? null,
      describedBy: descriptions.map(id => doc?.getElementById(id)?.textContent ?? null),
      labelMatches: Boolean(input?.id && input.labels?.length),
      actions
    });
  }

  function rememberForm() {
    priorRef = form.getFieldInstance<UploadRef<Receipt>>('files');
    priorModel = form;
  }

  function checkRef() {
    const current = form.getFieldInstance<UploadRef<Receipt>>('files');
    const oldInstance = priorModel?.getFieldInstance('files');

    snapshot = JSON.stringify({
      sameHandle: Boolean(current && current === priorRef),
      sameElement: Boolean(current && current.nativeElement === select?.nativeElement),
      sameAbort: Boolean(current && current.abort === select?.abort),
      sameTransport: Boolean(current && current.upload === select?.upload),
      sameProgress: Boolean(current && current.onProgress === select?.onProgress),
      oldInstance: Boolean(oldInstance),
      files: current?.fileList.map(file => [file.name, file.response?.accepted]) ?? []
    });
  }

  function replaceFiles() {
    form.setFieldValue('files', [
      { uid: 'receipt', name: 'receipt.txt', status: 'done', response: { accepted: true } }
    ]);
  }
</script>

<style>
  .viewport {
    height: 140px;
    width: 360px;
    overflow: auto;
  }
  .before {
    height: 240px;
  }
  .after {
    height: 400px;
  }
</style>

<section id="form-upload-fields-fixture" aria-label="Form Upload fields">
  <ConfigProvider theme={{ token: { motion: false } }}>
    <div id="upload-limit" class="viewport" bind:this={box}>
      <div class="before"></div>
      <Form
        {form}
        {disabled}
        name="upload-audit"
        layout="vertical"
        onFinishFailed={info => {
          submission.push({ field: info.errorFields[0]?.name, active: document.activeElement?.id });
        }}
        scrollToFirstError={{
          boundary: box,
          behavior: steps => { submission.push(recordActions(steps)); }
        }}
      >
        {#if withAttachments}
          <FormItem
            name="files"
            valuePropName="fileList"
            initialValue={[]}
            rules={[{ required: true, message: 'File required' }]}
          >
            <Upload bind:this={select} name="attachments" fileList={form.values.files}>
              <Button>Choose files</Button>
            </Upload>
          </FormItem>
          <FormItem name="drop" valuePropName="fileList" noStyle>
            <UploadDragger bind:this={dragger} name="drops" height={64}>
              <span>Drop files</span>
            </UploadDragger>
          </FormItem>
          <FormItem name="display" label="Display files">
            <Upload bind:this={display} name="display-file" />
          </FormItem>
          <FormItem
            name="aria"
            label="Accessible attachment"
            htmlFor={customAssociation ? 'manual-file' : undefined}
            extra="Maximum size"
            help="File instructions"
            required
            validateStatus="error"
            valuePropName="fileList"
          >
            <Upload
              bind:this={accessible}
              name="labelled-file"
              id={customAssociation ? 'manual-file' : undefined}
              aria-describedby={customAssociation ? 'manual-description' : undefined}
            >
              {#if editorTrigger}
                <Input aria-label="Trigger editor" />
              {:else}
                <Button>Choose labelled file</Button>
              {/if}
            </Upload>
          </FormItem>
        {/if}
      </Form>
      <div class="after"></div>
    </div>
  </ConfigProvider>
  <span id="manual-description">Local file note</span>
  {#each fields as field (field)}
    <button type="button" onclick={() => capture(field)}>Inspect {field}</button>
  {/each}
  <button type="button" onclick={() => { disabled = !disabled; }}>Toggle disabled</button>
  <button type="button" onclick={() => { customAssociation = true; }}>Set local association</button>
  <button type="button" onclick={() => { editorTrigger = true; }}>Use editor trigger</button>
  <button type="button" onclick={() => form.submit()}>Submit uploads</button>
  <button type="button" onclick={() => form.resetFields(['files'])}>Reset files</button>
  <button type="button" onclick={() => { withAttachments = false; }}>Remove uploads</button>
  <button type="button" onclick={rememberForm}>Remember upload</button>
  <button type="button" onclick={replaceFiles}>Replace files</button>
  <button type="button" onclick={checkRef}>Check ref</button>
  <button type="button" onclick={() => {
    form = createForm<Values>({ initialValues: {} });
  }}>Replace upload model</button>
  <output aria-label="Upload snapshot">{snapshot}</output>
  <output aria-label="Upload submission">{JSON.stringify(submission)}</output>
</section>
