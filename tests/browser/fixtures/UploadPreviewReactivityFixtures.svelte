<script lang="ts">
  import { onMount } from 'svelte';
  import { ConfigProvider, Upload, enUS, type UploadFile, type UploadProps } from 'antd-svelte';

  const image = (color: string) => 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="${color}"/></svg>`);
  const fallback = image('gray'), explicit = image('gold');
  let ready = $state(false), mounted = $state(false), deferred = $state(false);
  let listType = $state<'picture' | 'text'>('picture');
  let callback = $state(0), calls = $state(0), resolutions = $state(0);
  let thumbMode = $state('generated');
  let file = $state<UploadFile>({ uid: 'preview', name: 'alpha.png', type: 'image/png',
    status: 'done', url: fallback });
  const files = $derived([file]);
  const options = { showRemoveIcon: false };
  let origins: NonNullable<UploadFile['originFileObj']>[] = [];
  const ids = new WeakMap<object, number>();
  let nextId = 0, actualCalls = 0;
  const identity = (value: object | undefined) => {
    if (!value) {
      return null;
    }
    if (!ids.has(value)) ids.set(value, ++nextId);
    return ids.get(value)!;
  };
  const ledger: Array<{ callback: string; file: string; originalIdentity: number | null }> = [];
  const pending: Array<{ resolve: (value: string) => void; result: string; resolved: boolean }> = [];
  function generator(name: 'A' | 'B'): NonNullable<UploadProps['previewFile']> {
    return function previewFile(original) {
      actualCalls++;
      // Лимит инкрементов позволяет проверить число вызовов без бесконечного цикла.
      // Callback читает и меняет реактивное состояние без untrack у потребителя.
      if (calls < 4) calls++;
      const fileName = original instanceof File ? original.name : 'blob';
      ledger.push({ callback: name, file: fileName, originalIdentity: identity(original) });
      const result = image(name === 'B' ? 'blue'
        : fileName === 'beta.png' ? 'green' : fileName === 'gamma.png' ? 'purple' : 'red');
      return deferred ? new Promise<string>(resolve => {
        pending.push({ resolve, result, resolved: false });
      }) : Promise.resolve(result);
    };
  }
  const callbacks = [generator('A'), generator('B')];
  const previewFile = $derived(callbacks[callback]);
  const pendingCount = $derived.by(() => {
    void calls;
    void resolutions;
    return pending.filter(entry => !entry.resolved).length;
  });
  function resolvePreview(newest: boolean) {
    const entry = newest ? pending.findLast(value => !value.resolved)
      : pending.find(value => !value.resolved);
    if (!entry) {
      return;
    }
    entry.resolved = true;
    entry.resolve(entry.result);
    resolutions++;
  }
  function replaceOrigin() { file.originFileObj = origins[1]; }
  function replaceFile() {
    file = { ...file, name: 'gamma.png', originFileObj: origins[2] };
  }
  function setThumb(mode: string) {
    thumbMode = mode;
    if (mode === 'generated') delete file.thumbUrl;
    else file.thumbUrl = mode === 'empty' ? '' : explicit;
  }
  onMount(() => {
    origins = ['alpha.png', 'beta.png', 'gamma.png'].map(name =>
      Object.assign(new File([name], name, { type: 'image/png' }), { uid: name }));
    file.originFileObj = origins[0];
    ready = true;
    const api = { read: () => ({ actualCalls, increments: calls,
      fileIdentity: identity(file), originalIdentity: identity(file.originFileObj),
      callbackIdentity: identity(previewFile), fileListIdentity: identity(files),
      ledger: ledger.map(entry => ({ ...entry })), pending: pendingCount }) };
    Object.assign(window, { uploadPreviewReactivity: api });
    return () => {
      if ((window as Window & { uploadPreviewReactivity?: unknown }).uploadPreviewReactivity === api)
        delete (window as Window & { uploadPreviewReactivity?: unknown }).uploadPreviewReactivity;
    };
  });
</script>

<section id="upload-preview-reactivity-fixture">
  <label><input type="checkbox" bind:checked={deferred} /> Delay preview results</label>
  <label>Preview list type<select bind:value={listType}>
    <option value="picture">picture</option><option value="text">text</option>
  </select></label>
  <label>Explicit thumbnail<select value={thumbMode}
    onchange={event => setThumb(event.currentTarget.value)}>
    <option value="generated">not supplied</option><option value="explicit">own thumbnail</option>
    <option value="empty">empty thumbnail</option>
  </select></label>
  <button type="button" disabled={!ready || mounted} onclick={() => { mounted = true; }}>Mount preview Upload</button>
  <button type="button" disabled={!mounted} onclick={() => { mounted = false; }}>Unmount preview Upload</button>
  <button type="button" onclick={() => { callback = callback === 0 ? 1 : 0; }}>Replace preview callback</button>
  <button type="button" disabled={!ready} onclick={replaceOrigin}>Replace origin file</button>
  <button type="button" disabled={!ready} onclick={replaceFile}>Replace owner file</button>
  <button type="button" onclick={() => resolvePreview(false)}>Resolve oldest preview</button>
  <button type="button" onclick={() => resolvePreview(true)}>Resolve newest preview</button>
  <output aria-label="Preview reactive counter">{calls}</output>
  <output aria-label="Pending preview results">{pendingCount}</output>
  <ConfigProvider locale={enUS}>
    {#if mounted}<Upload fileList={files} {listType} {previewFile} showUploadList={options}>
      <button type="button">Choose preview file</button>
    </Upload>{/if}
  </ConfigProvider>
</section>
