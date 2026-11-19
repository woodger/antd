import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import {
  datePickerPresetTransitionSamples, datePickerPresetGeometry
} from './date-picker-preset-transitions-cases.mjs';
import {
  readDatePickerPresetTransitionsCaseMetadata, readDatePickerPresetTransitionsInitial,
  readDatePickerPresetTransitionsStep, readDatePickerPresetTransitionsClosed,
  readDatePickerPresetTransitionsCleanup, readDatePickerPresetTransitionsPart
} from './date-picker-preset-transitions-reference';
import type { DatePickerPresetTransitionsSourcePoint } from './date-picker-preset-transitions-reference';
import {
  createDatePickerPresetTransitionProof, verifyDatePickerPresetTransitionPoint,
  verifyDatePickerPresetTransitionActionEvidence, verifyDatePickerPresetTransitionDisposal
} from './date-picker-preset-transitions-assertions';
import {
  openDatePickerPresetTransitions, settleDatePickerPresetTransitions,
  actDatePickerPresetTransitions, disposeDatePickerPresetTransitions
} from './date-picker-preset-transitions-driver';

test.use({ viewport: datePickerPresetGeometry.viewport });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-09-15T03:00:00.000Z'));
});
for (const sample of datePickerPresetTransitionSamples) {
  test(`DatePicker preset transitions match Source ${sample.id}`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const errors: unknown[] = [], diagnostics: Array<{ type: string; text: string }> = [];
    const requests: unknown[] = [], responses: Array<{ url: string; status: number }> = [];
    const failedRequests: unknown[] = [];
    page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
    page.on('console', message => diagnostics.push({ type: message.type(), text: message.text() }));
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    page.on(
      'response',
      response => responses.push({ url: response.url(), status: response.status() })
    );
    page.on(
      'requestfailed',
      request => failedRequests.push({ url: request.url(), failure: request.failure() })
    );
    const proof = createDatePickerPresetTransitionProof();
    const metadata = readDatePickerPresetTransitionsCaseMetadata(sample.id);
    const attach = (label: string, value: unknown) => testInfo.attach(label + '.json.gz', {
      contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify(value, null, 2)))
    });
    let disposalStarted = false;
    try {
      await openDatePickerPresetTransitions(page, sample);
      let actual = await settleDatePickerPresetTransitions(page);
      await attach('initial-complete-raw', actual);
      verifyDatePickerPresetTransitionPoint(actual, readDatePickerPresetTransitionsInitial(sample.id),
        sample, proof, 'initial');
      let previousOpen = actual.owner.open, closedIndex = 0;
      for (const [index, action] of sample.actions.entries()) {
        const original = readDatePickerPresetTransitionsStep(sample.id, index);
        expect(original.action).toEqual(action);
        const evidence = await actDatePickerPresetTransitions(page, sample, action, index);
        const afterCall = await page.evaluate(() => window.datePickerPresetTransitionsNative.readDOM());
        await attach(
          'action-' + index + '-after-call-complete-raw',
          { action, evidence, afterCall }
        );
        // afterCall сохраняется целиком; семантически сравниваются установившиеся состояния.
        verifyDatePickerPresetTransitionActionEvidence(evidence, original.actionEvidence);
        actual = await settleDatePickerPresetTransitions(page);
        await attach('action-' + index + '-settled-complete-raw', actual);
        verifyDatePickerPresetTransitionPoint(
          actual,
          original.actual,
          sample,
          proof,
          'action' + index
        );
        if (previousOpen && !actual.owner.open) {
          const closed = readDatePickerPresetTransitionsClosed(sample.id, closedIndex++);
          expect(closed.actionIndex).toBe(index);
          verifyDatePickerPresetTransitionPoint(
            actual,
            closed.settled,
            sample,
            proof,
            'closed' + index
          );
          await page.waitForTimeout(1000);
          const after1000 = await page.evaluate(() => window.datePickerPresetTransitionsNative.readDOM());
          await attach('action-' + index + '-closed-1000-complete-raw', after1000);
          verifyDatePickerPresetTransitionPoint(
            after1000,
            closed.after1000,
            sample,
            proof,
            'closed' + index + '/1000ms'
          );
        }
        previousOpen = actual.owner.open;
      }
      expect(closedIndex).toBe(metadata.closed?.length);
      const beforeUnmount = await settleDatePickerPresetTransitions(page);
      await attach('before-unmount-complete-raw', beforeUnmount);
      disposalStarted = true;
      const disposal = await disposeDatePickerPresetTransitions(page, beforeUnmount);
      await attach('whole-disposal-complete-raw', disposal);
      assert(metadata.beforeUnmount);
      verifyDatePickerPresetTransitionDisposal(disposal, {
        beforeUnmount: readDatePickerPresetTransitionsPart(metadata.beforeUnmount) as DatePickerPresetTransitionsSourcePoint,
        cleanup: readDatePickerPresetTransitionsCleanup(sample.id),
        late: readDatePickerPresetTransitionsCleanup(sample.id, 'late')
      }, sample, proof, sample.id);
      expect(errors).toEqual([]);
      expect(failedRequests).toEqual([]);
      expect(responses.filter(response => response.status >= 400)).toEqual([]);
      expect(diagnostics.filter(message => ['warning', 'error'].includes(message.type))).toEqual([]);
    } finally {
      if (!disposalStarted) {
        try {
          const before = await settleDatePickerPresetTransitions(page);
          disposalStarted = true;
          await attach(
            'finally-disposal-complete-raw',
            await disposeDatePickerPresetTransitions(page, before)
          );
        }
        catch (error) { errors.push({ phase: 'finally', message: String(error) }); }
      }
      await attach(
        'complete-diagnostics',
        { sample, errors, diagnostics, requests, responses, failedRequests }
      );
    }
  });
}
