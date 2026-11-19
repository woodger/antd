import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples } from './date-picker-empty-datetime-cases.mjs';
import {
  readEmptyDatetimeSourceCase, readEmptyDatetimeSourceInitial, readEmptyDatetimeSourceStep,
  readEmptyDatetimeSourceClosed, readEmptyDatetimeSourceCleanup
} from './date-picker-empty-datetime-reference.mjs';
import {
  createEmptyDatetimeProof, verifyEmptyDatetimePoint, verifyEmptyDatetimeDisposal
} from './date-picker-empty-datetime-assertions';
import {
  openEmptyDatetime, readEmptyDatetime, settleEmptyDatetime, actEmptyDatetime, disposeEmptyDatetime
} from './date-picker-empty-datetime-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`empty ${sample.id} datetime uses calendar date with omitted and authored clock`,
    async ({ page }, testInfo) => {
      test.setTimeout(120000);
      const errors: unknown[] = [];
      const diagnostics: Array<{ type: string; text: string }> = [];
      const requests: unknown[] = [];
      const responses: Array<{ url: string; status: number }> = [];
      const failedRequests: unknown[] = [];
      page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
      page.on('console', message => diagnostics.push({ type: message.type(), text: message.text() }));
      page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
      page.on('response', response => responses.push({ url: response.url(), status: response.status() }));
      page.on('requestfailed', request => failedRequests.push({
        url: request.url(), failure: request.failure()
      }));
      const attach = (label: string, value: unknown) => testInfo.attach(label + '.json.gz', {
        contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify(value, null, 2)))
      });
      const source = readEmptyDatetimeSourceCase(sample.id);
      const proof = createEmptyDatetimeProof();
      let disposed = false;
      try {
        assert.deepEqual(source.sample, sample);
        await openEmptyDatetime(page, sample);
        const initial = await settleEmptyDatetime(page);
        await attach('initial-complete-scoped-raw', initial);
        verifyEmptyDatetimePoint(initial, readEmptyDatetimeSourceInitial(sample.id), proof, 'initial');
        let closedIndex = 0;
        for (const [index, action] of sample.actions.entries()) {
          const original = readEmptyDatetimeSourceStep(sample.id, index);
          assert.deepEqual(original.action, action);
          const actionRead = await actEmptyDatetime(page, action, index);
          await attach('action-' + index + '-after-call', actionRead);
          const actual = await settleEmptyDatetime(page);
          await attach('action-' + index + '-complete-scoped-raw', actual);
          verifyEmptyDatetimePoint(actual, original.actual, proof, 'action-' + index);
          if (action.type === 'input-escape') {
            assert.equal(actual.owner.open, false, 'Real input Escape closes the owner');
            const closed = readEmptyDatetimeSourceClosed(sample.id, closedIndex++);
            assert.equal(closed.actionIndex, index);
            await page.waitForTimeout(1000);
            const after1000 = await settleEmptyDatetime(page);
            await attach('action-' + index + '-closed-1000', after1000);
            verifyEmptyDatetimePoint(after1000, closed.after1000, proof, 'closed-' + index);
          }
        }
        assert.equal(closedIndex, source.closed.length);
        const beforeUnmount = await readEmptyDatetime(page);
        verifyEmptyDatetimePoint(beforeUnmount,
          readEmptyDatetimeSourceCleanup(sample.id, 'beforeUnmount'), proof, 'beforeUnmount');
        const disposal = await disposeEmptyDatetime(page);
        disposed = true;
        await attach('whole-actual-disposal', disposal);
        verifyEmptyDatetimeDisposal(disposal,
          readEmptyDatetimeSourceCleanup(sample.id, 'cleanup'),
          readEmptyDatetimeSourceCleanup(sample.id, 'late'));
        expect(errors).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(responses.filter(response => response.status >= 400)).toEqual([]);
        expect(diagnostics.filter(message => ['warning', 'warn', 'error'].includes(message.type)))
          .toEqual([]);
      } finally {
        if (!disposed) {
          try {
            await attach('finally-actual-disposal', await disposeEmptyDatetime(page));
          } catch (error) {
            errors.push({ phase: 'finally', message: String(error) });
          }
        }
        await attach('complete-diagnostics-and-comparison-scope', {
          sample, proof, errors, diagnostics, requests, responses, failedRequests
        });
      }
    });
}
