import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { controlledRemovalSamples, type ControlledRemovalPhase, type ControlledRemovalPoint,
  type ControlledRemovalNode, type ControlledRemovalSample } from './select-components-controlled-removal-cases';
let server: ViteDevServer, cache: string;
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'controlled-removal-ssr-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    './vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});
function controlledAttributes(node: ControlledRemovalNode) {
  return node.attributes.filter(([name]) => name === 'value' || name === 'checked');
}
function initialNode(node: ControlledRemovalNode | null, sample: ControlledRemovalSample) {
  expect(node).not.toBeNull();
  const actual = node!;
  expect(actual.tag).toBe(sample.tag.toUpperCase());
  expect(actual.value).toBe('owned');
  expect(actual.defaultValue).toBe('owned');
  expect(actual.checked).toBe(sample.tag === 'input' ? true : null);
  expect(actual.defaultChecked).toBe(sample.tag === 'input' ? true : null);
  expect(actual.connected).toBe(true);
  expect(actual.focused).toBe(false);
  expect(actual.selection).toEqual(sample.tag === 'input' && sample.entry === 'csr' ? [5, 5, 'forward'] : [0, 0, 'forward']);
  // Initial React INPUT hydration keeps its measured checked relocation.
  expect(controlledAttributes(actual)).toEqual(sample.tag === 'textarea' ? [] : sample.entry === 'csr'
    ? [['checked', ''], ['value', 'owned']] : [['value', 'owned'], ['checked', '']]);
  expect(actual.innerHTML).toBe(sample.tag === 'textarea' ? 'owned' : '');
  expect(actual.textContent).toBe(sample.tag === 'textarea' ? 'owned' : '');
}
function current(
  point: ControlledRemovalPoint,
  phase: ControlledRemovalPhase,
  sample: ControlledRemovalSample,
  focused: boolean
) {
  const removed = phase === 'undefined' || phase === 'null', textarea = sample.tag === 'textarea';
  const value = removed ? textarea && sample.defaultValuePresent ? 'fallback' : '' : phase === 'owned' ? 'owned' : 'next';
  // These cases preserve the actual old CSR/HYDR difference in textarea body updates.
  const body = !textarea ? '' : !removed ? value : sample.defaultValuePresent && sample.entry === 'csr' ? 'fallback' : 'owned';
  const fallback = textarea ? body : removed ? sample.defaultValuePresent ? 'fallback' : 'null' : value;
  expect(point.node).not.toBeNull();
  const node = point.node!;
  expect(node.tag).toBe(sample.tag.toUpperCase());
  expect(node.value).toBe(value);
  expect(node.defaultValue).toBe(fallback);
  expect(node.checked).toBe(textarea ? null : sample.axis === 'value-checked' && removed ? false : true);
  expect(node.defaultChecked).toBe(textarea ? null : true);
  const checkedFirst = phase === 'owned' ? sample.entry === 'csr'
    : sample.axis === 'value' || phase === 'undefined';
  expect(controlledAttributes(node)).toEqual(textarea ? [] : checkedFirst
    ? [['checked', ''], ['value', fallback]] : [['value', fallback], ['checked', '']]);
  expect(node.innerHTML).toBe(body);
  expect(node.textContent).toBe(body);
  expect(node.focused).toBe(focused);
  expect(node.connected).toBe(true);
  expect(point.sameMountedEditor).toBe(true);
  expect(point.owner).not.toBeNull();
  const owner = point.owner!;
  expect(owner.ownKeys).toEqual(['value', ...(sample.defaultValuePresent ? ['defaultValue'] : []),
    ...(textarea ? [] : ['checked', 'defaultChecked'])]);
  expect(owner.hasOwnValue).toBe(true);
  expect(owner.hasOwnDefaultValue).toBe(sample.defaultValuePresent);
  expect(owner.hasOwnChecked).toBe(!textarea);
  expect(owner.phase).toBe(phase);
  expect(owner.valueKind).toBe(removed ? phase : value);
  expect(owner.checkedKind).toBe(textarea ? 'undefined' : sample.axis === 'value-checked' && removed ? phase : 'true');
  expect(Object.values(owner.refs)).toEqual([true, true, true, true]);
  if (removed) expect(node.selection).toEqual(textarea && sample.defaultValuePresent ? [8, 8, 'forward'] : [0, 0, 'forward']);
  else if (phase === 'next') expect(node.selection).toEqual([4, 4, 'forward']);
}
for (const sample of controlledRemovalSamples) test(`preserves Native controlled removal ${sample.id}`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [], diagnostics: unknown[] = [];
  const network = { failures: [] as unknown[], responses: [] as { url: string; status: number }[] };
  page.on(
    'console',
    message => diagnostics.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    })
  );
  page.on(
    'requestfailed',
    request => network.failures.push({ url: request.url(), failure: request.failure() })
  );
  page.on(
    'response',
    response => network.responses.push({ url: response.url(), status: response.status() })
  );
  try {
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      './fixtures/select-components-controlled-removal.server.ts',
      import.meta.url
    )));
    const rendered = sample.entry === 'hydrate' ? module.renderControlledRemoval(sample) : null;
    await page.goto('/select-components-controlled-removal.html');
    await page.addScriptTag({
      type: 'module',
      url: '/select-components-controlled-removal.client.ts'
    });
    await page.waitForFunction(() => window.controlledRemoval?.ready === true);
    if (rendered?.head) {
      await page.evaluate(
        head => document.head.insertAdjacentHTML('beforeend', head),
        rendered.head
      );
    }
    trace.push({
      phase: 'parsed',
      actual: await page.evaluate(
        ({ sample, body }) => window.controlledRemoval.initialize(sample, body),
        { sample, body: rendered?.body ?? '' }
      )
    });
    trace.push({
      phase: 'framework-return',
      actual: await page.evaluate(() => window.controlledRemoval.start())
    });
    await page.evaluate(() => window.controlledRemoval.tick());
    const initial = await page.evaluate(() => window.controlledRemoval.read());
    trace.push({ phase: 'owned', actual: initial });
    const commit = await page.evaluate(() => window.controlledRemoval.firstCommit);
    trace.push({ phase: 'first-commit', actual: commit });
    current(initial, 'owned', sample, false);
    initialNode(initial.node, sample);
    const otherAttributes = initial.node!.attributes.filter(([name]) => name !== 'value' && name !== 'checked');
    initialNode(initial.owner!.firstRef, sample);
    expect(commit).toBeDefined();
    initialNode(commit!.node, sample);
    if (sample.entry === 'hydrate') expect(initial.sameParsedEditor).toBe(true);
    await page.evaluate(() => window.controlledRemoval.focus());
    await page.evaluate(() => window.controlledRemoval.tick());
    expect((await page.evaluate(() => window.controlledRemoval.read())).node?.selection).toEqual([1, 4, 'backward']);
    // This protects measured Native/Svelte removal. Separate Source INPUT value-only controls
    // retain owned/defaultowned; checked has no Source parity claim.
    for (const phase of ['undefined', 'null', 'next'] as const) {
      const immediate = await page.evaluate(phase => window.controlledRemoval.update(phase), phase);
      trace.push({ phase: phase + '-immediate', actual: immediate });
      current(immediate, phase, sample, true);
      expect(immediate.node!.attributes.filter(([name]) => name !== 'value' && name !== 'checked')).toEqual(otherAttributes);
      await page.evaluate(() => window.controlledRemoval.tick());
      const settled = await page.evaluate(() => window.controlledRemoval.read());
      trace.push({ phase: phase + '-settled', actual: settled });
      current(settled, phase, sample, true);
      expect(settled.node!.attributes.filter(([name]) => name !== 'value' && name !== 'checked')).toEqual(otherAttributes);
      if (sample.entry === 'hydrate') expect(settled.sameParsedEditor).toBe(true);
    }
    const removed = await page.evaluate(() => window.controlledRemoval.dispose());
    trace.push({ phase: 'removed', actual: removed });
    expect(removed.node).toBeNull();
    expect(removed.owner).not.toBeNull();
    expect(Object.values(removed.owner!.refs)).toEqual([false, false, false, false]);
    expect(network.failures).toEqual([]);
    expect(network.responses.filter(value => value.status >= 400)).toEqual([]);
  } finally {
    await testInfo.attach(
      'controlled-removal-native-raw.json',
      {
        contentType: 'application/json',
        body: JSON.stringify({ sample, trace, diagnostics, network }, null, 2)
      }
    );
  }
});
