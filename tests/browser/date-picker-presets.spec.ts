import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { datePickerPresetSamples, datePickerPresetGeometry } from './date-picker-presets-cases.mjs';
import {
  readDatePickerPresetsCaseMetadata,
  readDatePickerPresetsInitial,
  readDatePickerPresetsStep,
  readDatePickerPresetsClosed,
  readDatePickerPresetsCleanup,
  readDatePickerPresetsPart
} from './date-picker-presets-reference';
import type { DatePickerPresetsSourcePoint } from './date-picker-presets-reference';
import { readDatePickerPresets } from './date-picker-presets-metrics.mjs';
import {
  createDatePickerPresetsIdentityProof,
  verifyDatePickerPresetsPoint,
  verifyDatePickerPresetsDisposal
} from './date-picker-presets-assertions';
import {
  openDatePickerPresets,
  settleDatePickerPresets,
  actDatePickerPresets,
  disposeDatePickerPresets
} from './date-picker-presets-driver';

test.use({ viewport: datePickerPresetGeometry.viewport });
for (const sample of datePickerPresetSamples) {
  test(`DatePicker presets match Original ${sample.id}`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
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
    const proof = createDatePickerPresetsIdentityProof();
    const metadata = readDatePickerPresetsCaseMetadata(sample.id);
    const attach = (label: string, value: unknown) => testInfo.attach(label + '.json.gz', {
      contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify(value, null, 2)))
    });
    let disposed = false;
    // Сохраняет результат запасного удаления и добавляет ошибку к диагностике теста.
    async function attachFallbackDisposal() {
      try {
        const before = await settleDatePickerPresets(page);
        await attach(
          'finally-disposal-complete-raw',
          await disposeDatePickerPresets(page, before)
        );
      }
      catch (error) {
        errors.push({ phase: 'finally', message: String(error) });
      }
    }

    try {
      await openDatePickerPresets(page, sample);
      let actual = await settleDatePickerPresets(page);
      await attach('initial-complete-raw', actual);
      verifyDatePickerPresetsPoint(actual, readDatePickerPresetsInitial(sample.id), sample,
        'initial', proof, 'vite-hmr');
      let previousOpen = actual.owner.open;
      let closedIndex = 0;
      for (const [index, action] of sample.actions.entries()) {
        const original = readDatePickerPresetsStep(sample.id, index);
        expect(original.action).toEqual(action);
        const evidence = await actDatePickerPresets(page, sample, action, index);
        const afterCall = await page.evaluate(readDatePickerPresets);
        await attach(
          'action-' + index + '-after-call-complete-raw',
          { action, evidence, afterCall }
        );
        actual = await settleDatePickerPresets(page);
        await attach('action-' + index + '-settled-complete-raw', actual);
        verifyDatePickerPresetsPoint(actual, original.actual, sample, 'action' + index,
          proof, 'vite-hmr');
        if (action.type === 'clear') {
          expect(evidence).toEqual({
            type: 'click', isTrusted: false, actualCurrentTarget: true, targetTag: 'BUTTON'
          });
        }
        if (previousOpen && !actual.owner.open) {
          const closed = readDatePickerPresetsClosed(sample.id, closedIndex++);
          expect(closed.actionIndex).toBe(index);
          await page.waitForTimeout(1000);
          const after1000 = await page.evaluate(readDatePickerPresets);
          await attach('action-' + index + '-closed-1000-complete-raw', after1000);
          verifyDatePickerPresetsPoint(after1000, closed.after1000, sample,
            'closed' + index + '/1000ms', proof, 'vite-hmr');
        }
        previousOpen = actual.owner.open;
      }
      expect(closedIndex).toBe(metadata.closed?.length);
      const beforeUnmount = await settleDatePickerPresets(page);
      await attach('before-unmount-complete-raw', beforeUnmount);
      const removal = await disposeDatePickerPresets(page, beforeUnmount);
      disposed = true;
      await attach('whole-disposal-complete-raw', removal);
      assert(metadata.beforeUnmount);
      const sourceBefore = readDatePickerPresetsPart(metadata.beforeUnmount) as DatePickerPresetsSourcePoint;
      verifyDatePickerPresetsDisposal(removal, {
        beforeUnmount: sourceBefore,
        cleanup: readDatePickerPresetsCleanup(sample.id),
        late: readDatePickerPresetsCleanup(sample.id, 'late')
      }, sample, sample.id, proof, 'vite-hmr');
      expect(errors).toEqual([]);
      expect(failedRequests).toEqual([]);
      expect(responses.filter(response => response.status >= 400)).toEqual([]);
      expect(diagnostics.filter(message => ['warning', 'error'].includes(message.type))).toEqual([]);
    } finally {
      if (!disposed) {
        await attachFallbackDisposal();
      }
      await attach('complete-diagnostics', {
        sample, renderer: 'vite-hmr', errors, diagnostics, requests, responses, failedRequests
      });
    }
  });
}
