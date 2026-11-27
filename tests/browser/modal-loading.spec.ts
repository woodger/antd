import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import { modalLoadingSamples, modalLoadingGeometry } from './modal-loading-cases.mjs';
import { readModalLoadingSourceCase } from './modal-loading-reference';
import { readModalLoading } from './modal-loading-metrics.mjs';
import type { ModalLoadingCleanup, ModalLoadingPoint } from './modal-loading-metrics.mjs';
import { openNativeModalLoading, settleNativeModalLoading, actNativeModalLoading, readNativeModalLoadingCleanup } from './modal-loading-driver';
import { verifyModalLoadingPoint, verifyModalLoadingCleanup, verifyModalLoadingDiagnostics } from './modal-loading-assertions';
test.use({ viewport: modalLoadingGeometry.viewport });
for (const sample of modalLoadingSamples) test(`Modal loading follows full Source body/footer lifecycle ${sample.id}`, async (
  { page },
  testInfo
) => {
  test.setTimeout(120000);
  const source = readModalLoadingSourceCase(sample.id), trace: unknown[] = [], failures: string[] = [];
  const errors: unknown[] = [], diagnostics: Array<{ type: string; text: string; location: unknown }> = [], requests: unknown[] = [], responses: unknown[] = [], requestFailures: unknown[] = [];
  page.on(
    'pageerror',
    error => errors.push({ name: error.name, message: error.message, stack: error.stack })
  );
  page.on(
    'console',
    message => diagnostics.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    })
  );
  page.on(
    'request',
    request => requests.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType()
    })
  );
  page.on(
    'response',
    response => responses.push({ url: response.url(), status: response.status() })
  );
  page.on(
    'requestfailed',
    request => requestFailures.push({ url: request.url(), failure: request.failure() })
  );
  let initial: ModalLoadingPoint | null = null, previous: ModalLoadingPoint | undefined, beforeUnmount: ModalLoadingPoint | null = null;
  let cleanup: ModalLoadingCleanup | null = null, late: ModalLoadingCleanup | null = null, disposed = false;
  const observe = async (point: ModalLoadingPoint, label: string) => {
    const actual = await settleNativeModalLoading(page), applied = new Set<string>();
    initial ??= actual;
    failures.push(...verifyModalLoadingPoint(actual, point, initial, label, previous, applied));
    trace.push({ label, actual, appliedBoundaries: [...applied] });
    previous = actual;
  };
  // Readers the state of the modal window if the script was interrupted before removal.
  async function readBeforeUnmount() {
    try { if (!beforeUnmount) beforeUnmount = await page.evaluate(readModalLoading); }
    catch (error) { errors.push({ phase: 'finally-read', error: String(error) }); }
  }

  // Removes the remaining window and reads the condition after clearing.
  async function disposeAfterFailure() {
    try {
      if (!disposed) {
      await page.evaluate(() => window.modalLoadingNative.dispose());
      disposed = true;
      await drainSelectSurface(page);
      cleanup = await readNativeModalLoadingCleanup(page);
    }
    }
    catch (error) { errors.push({ phase: 'finally-dispose', error: String(error) }); }
  }

  // Measures the state a second after clearing if the main measurement is not performed.
  async function readLateCleanup() {
    try {
      if (!late) {
      await page.waitForTimeout(1000);
      late = await readNativeModalLoadingCleanup(page);
    }
    }
    catch (error) { errors.push({ phase: 'finally-late1000', error: String(error) }); }
  }

  try {
    await openNativeModalLoading(page, sample);
    await observe(source.initial, 'initial');
    for (const [index, step] of source.steps.entries()) {
      expect(sample.actions[index]).toEqual(step.action);
      await actNativeModalLoading(page, sample, step.action);
      await observe(step.actual, 'action-' + index + '/' + step.action.type);
    }
    beforeUnmount = await page.evaluate(readModalLoading);
    await page.evaluate(() => window.modalLoadingNative.dispose());
    disposed = true;
    await drainSelectSurface(page);
    cleanup = await readNativeModalLoadingCleanup(page);
    await page.waitForTimeout(1000);
    late = await readNativeModalLoadingCleanup(page);
    const applied = new Set<string>();
    failures.push(...verifyModalLoadingCleanup(
      cleanup,
      late,
      source,
      sample.id + '/disposal',
      applied
    ));
    trace.push({ label: 'disposal', cleanup, late, appliedBoundaries: [...applied] });
    failures.push(...verifyModalLoadingDiagnostics(errors, diagnostics, requestFailures, sample.id));
  } finally {
    await readBeforeUnmount();
    await disposeAfterFailure();
    await readLateCleanup();
    await testInfo.attach('modal-loading-complete-source-native-raw.json.gz', { body: gzipSync(Buffer.from(JSON.stringify({ sample, source, trace,
      beforeUnmount, cleanup, late, failures, errors, diagnostics, network: {
        requests,
        responses,
        requestFailures
      } }, null, 2))), contentType: 'application/gzip' });
  }
  expect(errors).toEqual([]);
  expect(requestFailures).toEqual([]);
  expect(failures).toEqual([]);
});
