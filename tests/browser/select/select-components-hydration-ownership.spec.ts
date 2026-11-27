import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from '../test';
import { ownershipScenarios, ownershipGeometry } from '../select-components-hydration-ownership-cases.mjs';
import { readSelectComponentsHydrationOwnershipCase } from '../select-components-hydration-ownership-reference';
import { captureHydrationOwnership } from '../select-components-hydration-ownership-driver';
let server: ViteDevServer, cache: string;
test.use({ viewport: ownershipGeometry.viewport });
test.setTimeout(180000);
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../../.upstream/artifacts/', import.meta.url)),
    'select-ownership-ssr-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    '../vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});
for (const scenario of ownershipScenarios) test(`hydration ownership ${scenario.id}`, async (
  { page },
  testInfo
) => {
  const source = readSelectComponentsHydrationOwnershipCase(scenario.id);
  let result: Awaited<ReturnType<typeof captureHydrationOwnership>> | undefined;
  try {
    const ssr = await server.ssrLoadModule(fileURLToPath(new URL(
      '../fixtures/select-components-hydration-ownership.server.ts',
      import.meta.url
    )));
    result = await captureHydrationOwnership(
      page,
      source,
      async key => ssr.renderHydrationOwnership(scenario.id, key)
    );
    expect(result.fatal).toBeNull();
    expect(result.completedActions).toBe(source.completedActions);
    expect(result.peerCleanups).toBe(source.peerCleanups);
    expect(result.trace.map(row => row.phase)).toEqual(source.trace.map(row => row.phase));
    expect(result.pageErrors).toEqual([]);
    expect(result.network.requestFailures).toEqual([]);
    expect(result.network.responses.filter(value => (value as { status: number }).status >= 400)).toEqual([]);
    expect(result.diagnostics.filter((value: unknown) => ['warning', 'error'].includes((value as { type: string }).type))).toEqual([]);
    expect(result.failures).toEqual([]);
  } finally {
    await testInfo.attach('hydration-ownership-raw.json.gz', { contentType: 'application/gzip',
      body: gzipSync(
        JSON.stringify({ scenario, source, actual: result }, null, 2) + '\n',
        { level: 9 }
      ) });
  }
});
