import { gzipSync } from 'node:zlib';
import { test, expect } from '../test';
import { drainSelectSurface } from '../select-surface-driver';
import { selectTagCloseHandleSamples, selectTagCloseHandleGeometry } from '../select-components-tag-close-handles-cases.mjs';
import { cachedOptionSamples } from '../select-components-tag-close-handles-cached-option-cases.mjs';
import { readSelectTagCloseHandlesCase } from '../select-components-tag-close-handles-reference';
import { readSelectTagCloseHandlesCachedOptionCase } from '../select-components-tag-close-handles-cached-option-reference';
import { createTagCloseIdentityProof, verifyTagCloseHandlePoint, verifyTagCloseHandleLedger } from '../select-components-tag-close-handles-assertions';
import { verifyTagCloseHandleDisposal } from '../select-components-tag-close-handles-disposal-assertions';
import { openTagCloseHandles, settleTagCloseHandles, clickTagCloseHandleButton, readTagCloseHandleLedger, readTagCloseHandleCleanup } from '../select-components-tag-close-handles-driver';
test.use({ viewport: selectTagCloseHandleGeometry.viewport });
for (const sample of [...selectTagCloseHandleSamples, ...cachedOptionSamples]) test(`Select actual retained onClose matches Original ${sample.id}`, async (
  { page },
  testInfo
) => {
  test.setTimeout(180000);
  const source = sample.id === 'select-close-handles-cached-option' ? readSelectTagCloseHandlesCachedOptionCase() : readSelectTagCloseHandlesCase(sample.id);
  const trace: unknown[] = [], diagnostics: unknown[] = [], errors: unknown[] = [], requests: unknown[] = [], responses: unknown[] = [], requestFailures: unknown[] = [];
  page.on(
    'console',
    message => diagnostics.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    })
  );
  page.on(
    'pageerror',
    error => errors.push({ name: error.name, message: error.message, stack: error.stack })
  );
  page.on(
    'request',
    request => requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    })
  );
  page.on(
    'requestfailed',
    request => requestFailures.push({ url: request.url(), failure: request.failure() })
  );
  page.on(
    'response',
    response => responses.push({ url: response.url(), status: response.status() })
  );
  let ledger = null as Awaited<ReturnType<typeof readTagCloseHandleLedger>> | null, cleanup = null as Awaited<ReturnType<typeof readTagCloseHandleCleanup>> | null,
    late = null as Awaited<ReturnType<typeof readTagCloseHandleCleanup>> | null, disposed = false;
  const identities = createTagCloseIdentityProof();
  // Reads the journal and deletes the remaining component in an interrupted scenario.
  async function captureRemainingCleanup() {
    try {
      ledger = await readTagCloseHandleLedger(page);
      if (!disposed) {
      await page.evaluate(() => window.tagCloseHandlesNative.dispose());
      await drainSelectSurface(page);
      cleanup = await readTagCloseHandleCleanup(page);
      await page.waitForTimeout(1000);
      late = await readTagCloseHandleCleanup(page);
    }
    }
    catch (error) { errors.push({ phase: 'finally', message: String(error) }); }
  }

  try {
    await openTagCloseHandles(page, sample);
    if (sample.retentionSetup) {
      const before = await settleTagCloseHandles(page);
      await clickTagCloseHandleButton(page, sample.retentionSetup.id, -1);
      trace.push({ label: 'setup-before', actual: before });
    }
    const observe = async (point: typeof source.initial, label: string) => {
      const actual = await settleTagCloseHandles(page);
      ledger = await readTagCloseHandleLedger(page);
      trace.push({ label, actual });
      verifyTagCloseHandlePoint(actual, point, label, 'vite-hmr', identities);
      verifyTagCloseHandleLedger(ledger, source, point, label);
    };
    await observe(source.initial, 'initial');
    for (const [index, step] of source.steps.entries()) {
      expect(step.action).toEqual(sample.actions[index]);
      await clickTagCloseHandleButton(page, step.action.id, index);
      await observe(step, 'action-' + index + '/' + step.action.id);
    }
    await page.evaluate(() => window.tagCloseHandlesNative.dispose());
    disposed = true;
    await drainSelectSurface(page);
    cleanup = await readTagCloseHandleCleanup(page);
    trace.push({ label: 'cleanup', actual: cleanup });
    await page.waitForTimeout(1000);
    late = await readTagCloseHandleCleanup(page);
    trace.push({ label: 'late-1000ms', actual: late });
    verifyTagCloseHandleDisposal(cleanup, late, source, sample.id);
    expect(errors).toEqual([]);
    expect(requestFailures).toEqual([]);
    expect(responses.filter(row => (row as { status: number }).status >= 400)).toEqual([]);
  } finally {
    await captureRemainingCleanup();
    await testInfo.attach('tag-close-handles-complete-raw.json.gz', { contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify({ sample, source, trace, ledger, cleanup, late,
      errors, diagnostics, network: { requests, responses, requestFailures }, renderer: 'vite-hmr' }, null, 2))) });
  }
});
