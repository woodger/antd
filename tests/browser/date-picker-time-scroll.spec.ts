import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples } from './date-picker-time-scroll-cases.mjs';
import type { SourceStep, SourceClosed } from './date-picker-time-scroll-reference.mjs';
import { readTimeScrollSourceCase, readTimeScrollSourcePart } from './date-picker-time-scroll-reference.mjs';
import {
  createTimeScrollProof,
  verifyTimeScrollPoint,
  verifyTimeScrollActionEvidence,
  verifyTimeScrollDisposal
} from './date-picker-time-scroll-assertions.mjs';
import {
  openTimeScroll,
  settleTimeScroll,
  actTimeScroll,
  readTimeScroll,
  disposeTimeScroll
} from './date-picker-time-scroll-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`DatePicker time scroll matches Original ${sample.id}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    const errors: unknown[] = [];
    const diagnostics: Array<{ type: string; text: string }> = [];
    const requests: unknown[] = [];
    const responses: Array<{ url: string; status: number }> = [];
    const failedRequests: unknown[] = [];
    page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
    page.on('console', message => diagnostics.push({ type: message.type(), text: message.text() }));
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    page.on(
      'response',
      response => responses.push({ url: response.url(), status: response.status() })
    );
    page.on('requestfailed', request => failedRequests.push({
      url: request.url(), failure: request.failure()
    }));
    const attach = (label: string, value: unknown) => testInfo.attach(label + '.json.gz', {
      contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify(value, null, 2)))
    });
    const source = readTimeScrollSourceCase(sample.id);
    const proof = createTimeScrollProof();
    let disposed = false;
    // Сохраняет результат запасного удаления и добавляет ошибку к диагностике теста.
    async function attachFallbackDisposal() {
      try {
        await attach('finally-actual-disposal', await disposeTimeScroll(page));
      }
      catch (error) {
        errors.push({ phase: 'finally', message: String(error) });
      }
    }

    try {
      await openTimeScroll(page, sample);
      const initial = await settleTimeScroll(page);
      await attach('initial-complete-scoped-raw', initial);
      verifyTimeScrollPoint(
        initial,
        readTimeScrollSourcePart(source.initial),
        sample,
        proof,
        'initial'
      );
      let closedIndex = 0;
      for (const [index, action] of sample.actions.entries()) {
        const original = readTimeScrollSourcePart<SourceStep>(source.steps[index]);
        assert.deepEqual(original.action, action);
        const evidence = await actTimeScroll(page, action, index);
        const afterCall = await readTimeScroll(page);
        await attach('action-' + index + '-after-call', { action, evidence, afterCall });
        const actual = await settleTimeScroll(page);
        await attach('action-' + index + '-complete-scoped-raw', actual);
        verifyTimeScrollActionEvidence(evidence, action);
        verifyTimeScrollPoint(actual, original.actual, sample, proof, 'action-' + index);
        if (action.type === 'owner-open' && action.value === false) {
          const closed = readTimeScrollSourcePart<SourceClosed>(source.closed[closedIndex++]);
          assert.equal(closed.actionIndex, index);
          await page.waitForTimeout(1000);
          const after1000 = await readTimeScroll(page);
          await attach('action-' + index + '-closed-1000', after1000);
          verifyTimeScrollPoint(after1000, closed.after1000, sample, proof, 'closed-' + index);
        }
      }
      assert.equal(closedIndex, source.closed.length);
      const disposal = await disposeTimeScroll(page);
      disposed = true;
      await attach('whole-actual-disposal', disposal);
      verifyTimeScrollDisposal(disposal,
        readTimeScrollSourcePart(source.beforeUnmount),
        readTimeScrollSourcePart(source.cleanup),
        readTimeScrollSourcePart(source.late));
      expect(errors).toEqual([]);
      expect(failedRequests).toEqual([]);
      expect(responses.filter(response => response.status >= 400)).toEqual([]);
      expect(diagnostics.filter(message => ['warning', 'warn', 'error'].includes(message.type)))
        .toEqual([]);
    } finally {
      if (!disposed) {
        await attachFallbackDisposal();
      }
      await attach('complete-diagnostics-and-boundaries', {
        sample, proof, errors, diagnostics, requests, responses, failedRequests
      });
    }
  });
}
