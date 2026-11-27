import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import { selectCustomTagPrefixSamples, selectCustomTagPrefixGeometry } from './select-components-responsive-tag-prefix-cases.mjs';
import { readSelectComponentsResponsiveTagPrefixCase } from './select-components-responsive-tag-prefix-reference';
import { openNativeResponsiveTagPrefix, actNativeResponsiveTagPrefix, settleNativeResponsiveTagPrefix,
  readNativeResponsiveTagPrefixLedger, readNativeResponsiveTagPrefixCleanup, installNativeResponsiveTagPrefixFocusoutProbe,
  readNativeResponsiveTagPrefixFocusoutProbe, releaseNativeResponsiveTagPrefixFocusoutProbe } from './select-components-responsive-tag-prefix-driver';
import { verifyResponsiveTagPrefixPoint, verifyResponsiveTagPrefixLedger } from './select-components-responsive-tag-prefix-assertions';
import { verifyResponsiveTagPrefixDisposal, type ResponsiveTagPrefixDisposalOwner } from './select-components-responsive-tag-prefix-disposal-assertions';
test.use({ viewport: selectCustomTagPrefixGeometry.viewport });
for (const sample of selectCustomTagPrefixSamples) test(`Select responsive custom tag/prefix full Original ${sample.id}`, async (
  { page },
  testInfo
) => {
  test.setTimeout(180000);
  const source = readSelectComponentsResponsiveTagPrefixCase(sample.id), failures: string[] = [], trace: unknown[] = [];
  const diagnostics: unknown[] = [], errors: unknown[] = [], requests: unknown[] = [], responses: unknown[] = [], requestFailures: unknown[] = [];
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
      resourceType: request.resourceType()
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
  let ledger: Awaited<ReturnType<typeof readNativeResponsiveTagPrefixLedger>> | null = null;
  let cleanup: Awaited<ReturnType<typeof readNativeResponsiveTagPrefixCleanup>> | null = null;
  let late: Awaited<ReturnType<typeof readNativeResponsiveTagPrefixCleanup>> | null = null, disposed = false;
  let before: ResponsiveTagPrefixDisposalOwner | null = null;
  const observe = async (point: typeof source.initial, label: string, index: number) => {
    const actual = await settleNativeResponsiveTagPrefix(page), observed = await readNativeResponsiveTagPrefixLedger(page);
    const applied = new Set<string>();
    ledger = observed;
    failures.push(...verifyResponsiveTagPrefixPoint(
      actual,
      point,
      label,
      { id: sample.id, index, path: 'csr', applied }
    ),
      ...verifyResponsiveTagPrefixLedger(observed, source, point, label, applied));
    trace.push({ label, actual, appliedBoundaries: [...applied] });
  };
  // Saves the last magazine even after the interrupted scenario.
  async function readFinalLedger() {
    try {
      ledger = await readNativeResponsiveTagPrefixLedger(page);
    }
    catch (error) {
      errors.push({ phase: 'finally-ledger', error: String(error) });
    }
  }

  // Removes the remaining component and reads the clearing and delayed state.
  async function disposeRemainingOwner() {
    try { if (!disposed) {
      await page.evaluate(() => window.customTagPrefixNative.dispose());
      await drainSelectSurface(page);
      cleanup = await readNativeResponsiveTagPrefixCleanup(page);
      await page.waitForTimeout(1000);
      late = await readNativeResponsiveTagPrefixCleanup(page);
    } }
    catch (error) { errors.push({ phase: 'finally-cleanup', error: String(error) }); }
  }

  // Relieves the delayed state if the clearing has passed and there is no re-measuring.
  async function readMissingLateState() {
    try {
      if (cleanup && !late) {
      await page.waitForTimeout(1000);
      late = await readNativeResponsiveTagPrefixCleanup(page);
    }
    }
    catch (error) { errors.push({ phase: 'finally-late', error: String(error) }); }
  }

  try {
    await openNativeResponsiveTagPrefix(page, sample);
    await installNativeResponsiveTagPrefixFocusoutProbe(page);
    await observe(source.initial, 'initial', 0);
    for (const [index, step] of source.steps.entries()) {
      const action = sample.actions[index];
      expect(action).toEqual(step.action);
      await actNativeResponsiveTagPrefix(page, sample, action, index);
      await observe(step, 'action-' + index + '/' + action.type, index + 1);
    }
    before = await page.evaluate(() => window.customTagPrefixNative.read());
    await page.evaluate(() => window.customTagPrefixNative.dispose());
    disposed = true;
    await drainSelectSurface(page);
    cleanup = await readNativeResponsiveTagPrefixCleanup(page);
    trace.push({ label: 'cleanup', actual: cleanup });
    await page.waitForTimeout(1000);
    late = await readNativeResponsiveTagPrefixCleanup(page);
    trace.push({ label: 'late1000', actual: late });
    const applied = new Set<string>(), focusoutProbe = await readNativeResponsiveTagPrefixFocusoutProbe(page);
    verifyResponsiveTagPrefixDisposal(
      before,
      cleanup,
      late,
      focusoutProbe,
      source,
      sample.id + '/disposal',
      applied
    );
    trace.push({ label: 'disposal-boundary', appliedBoundaries: [...applied] });
    expect(requestFailures).toEqual([]);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    await readFinalLedger();
    await disposeRemainingOwner();
    await readMissingLateState();
    const focusoutProbe = await readNativeResponsiveTagPrefixFocusoutProbe(page);
    await testInfo.attach('responsive-custom-tag-prefix-complete-raw.json.gz', { body: gzipSync(Buffer.from(JSON.stringify({ sample, source, trace, ledger,
      before, cleanup, late, focusoutProbe, failures, diagnostics, errors, network: {
        requests,
        responses,
        requestFailures
      } }, null, 2))), contentType: 'application/gzip' });
    await releaseNativeResponsiveTagPrefixFocusoutProbe(page);
  }
});
