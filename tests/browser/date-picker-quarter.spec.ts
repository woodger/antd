import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples } from './date-picker-quarter-cases.mjs';
import {
  readQuarterSourceCase, readQuarterSourceInitial, readQuarterSourceStep,
  readQuarterSourceClosed, readQuarterSourceCleanup
} from './date-picker-quarter-reference.mjs';
import type { QuarterSourcePoint, QuarterSourceVariant }
  from './date-picker-quarter-reference.mjs';
import {
  createQuarterProof, createQuarterProducerProof, verifyQuarterPoint,
  verifyQuarterInputPhase, verifyQuarterProducerChunk, type NativeQuarterPoint
} from './date-picker-quarter-assertions';
import {
  openQuarter, readQuarter, settleQuarter, actQuarter,
  readQuarterProducers, disposeQuarter
} from './date-picker-quarter-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`DatePicker ${sample.id} preserves Source terminal selection and callbacks`,
    async ({ page }, testInfo) => {
      // Both immutable Source captures are compared; complete actual Native observations stay attached.
      test.setTimeout(300000);
      const errors: unknown[] = [], semanticFailures: unknown[] = [];
      const diagnostics: Array<{ type: string; text: string }> = [];
      const requests: unknown[] = [], failedRequests: unknown[] = [];
      const responses: Array<{ url: string; status: number }> = [];
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
      const proof = createQuarterProof(), producers = createQuarterProducerProof(sample);
      const sourceCase = readQuarterSourceCase(sample.id);
      const verifyAccessibleFooter = async (source: QuarterSourcePoint, label: string) => {
        for (const control of source.popups.filter(popup => popup.visible)
          .flatMap(popup => popup.footerControls)) {
          assert.equal(control.tag, 'BUTTON');
          assert(typeof control.text === 'string' && control.text.length > 0);
          const button = page.locator('[data-picker-popup]:visible .ant-picker-footer')
            .getByRole('button', { name: control.text, exact: true });
          try {
            await expect(button).toHaveCount(1, { timeout: 1000 });
            await expect(button).toHaveAccessibleName(control.text, { timeout: 1000 });
          } catch (error) {
            semanticFailures.push({ label, assertion: 'Actual accessible footer name',
              sourceRecordedLabel: control.text, message: String(error) });
          }
        }
      };
      const verify = (actual: NativeQuarterPoint,
        source: (variant: QuarterSourceVariant) => QuarterSourcePoint, label: string) => {
        for (const variant of ['first', 'repeat'] as const) {
          try { verifyQuarterPoint(actual, source(variant), proof, variant, label); }
          catch (error) {
            semanticFailures.push({ label, variant, message: String(error),
              stack: error instanceof Error ? error.stack : null });
          }
        }
      };
      const verifyPhase = (actual: NativeQuarterPoint, source: QuarterSourcePoint,
        variant: QuarterSourceVariant, label: string) => {
        try { verifyQuarterInputPhase(actual, source, proof, variant, label); }
        catch (error) {
          semanticFailures.push({ label, variant, message: String(error),
            stack: error instanceof Error ? error.stack : null });
        }
      };
      const collect = async (phase: string, owner: NativeQuarterPoint['owner'],
        boundaries: Record<string, number>) => {
        const chunk = await readQuarterProducers(page, producers.cursor);
        await attach(phase + '-whole-producer-delta', { phase, boundaries,
          observationEnd: chunk.next, ...chunk });
        verifyQuarterProducerChunk(chunk, producers, owner, boundaries, sample);
      };
      let disposed = false;
      let closedIndex = 0, actions = 0;
      try {
        assert.deepEqual(sourceCase.sample, sample);
        await openQuarter(page, sample);
        const initial = await settleQuarter(page);
        await attach('initial-complete-scoped-raw', initial);
        await collect('initial', initial.owner, { initial: initial.owner.producerCount });
        verify(initial, variant => readQuarterSourceInitial(sample.id, variant), 'initial');
        await verifyAccessibleFooter(readQuarterSourceInitial(sample.id), 'initial');
        for (const [index, action] of sample.actions.entries()) {
          assert.deepEqual(readQuarterSourceStep(sample.id, index).action, action);
          const actionRead = await actQuarter(page, action, index);
          const actual = await settleQuarter(page);
          await attach('step-' + index + '-complete-scoped-raw', { ...actionRead, actual });
          await collect('step-' + index, actual.owner, {
            before: actionRead.before.owner.producerCount,
            ...(actionRead.actionEvidence.afterFocusPointer ? {
              afterFocusPointer: actionRead.actionEvidence.afterFocusPointer.owner.producerCount
            } : {}),
            afterCall: actionRead.afterCall.owner.producerCount, settled: actual.owner.producerCount
          });
          for (const variant of ['first', 'repeat'] as const) {
            const original = readQuarterSourceStep(sample.id, index, variant);
            verifyPhase(actionRead.before, original.before, variant, 'step-' + index + ':before');
            const afterFocus = actionRead.actionEvidence.afterFocusPointer;
            if (afterFocus) {
              assert(original.actionEvidence.afterFocusPointer);
              verifyPhase(afterFocus, original.actionEvidence.afterFocusPointer, variant,
                'step-' + index + ':afterFocusPointer');
            }
            try { verifyQuarterPoint(actual, original.actual, proof, variant, 'step-' + index); }
            catch (error) {
              semanticFailures.push({ label: 'step-' + index, variant, message: String(error),
                stack: error instanceof Error ? error.stack : null });
            }
          }
          await verifyAccessibleFooter(readQuarterSourceStep(sample.id, index).actual,
            'step-' + index);
          actions++;
          if (action.type === 'input-escape') {
            const original = readQuarterSourceClosed(sample.id, closedIndex);
            assert.equal(original.actionIndex, index);
            await page.waitForTimeout(1000);
            const after1000 = await readQuarter(page);
            await attach('closed-' + index + '-complete-scoped-raw', { actionIndex: index, after1000 });
            await collect('closed-' + index, after1000.owner, { after1000: after1000.owner.producerCount });
            verify(after1000, variant =>
              readQuarterSourceClosed(sample.id, closedIndex, variant).after1000, 'closed-' + index);
            await verifyAccessibleFooter(original.after1000, 'closed-' + index);
            closedIndex++;
          }
        }
        assert.equal(actions, sample.actions.length);
        assert.equal(closedIndex, sourceCase.closed.length);
        const disposal = await disposeQuarter(page, {
          async beforeUnmount(point) {
            await attach('before-unmount-complete-scoped-raw', point);
            await collect('before-unmount', point.owner, { beforeUnmount: point.owner.producerCount });
            verify(point, variant => readQuarterSourceCleanup(sample.id, 'beforeUnmount', variant),
              'beforeUnmount');
          },
          async afterCleanup(point) {
            await attach('cleanup-complete-scoped-raw', point);
            await collect('cleanup', point.owner, { cleanup: point.owner.producerCount });
            verify(point, variant => readQuarterSourceCleanup(sample.id, 'cleanup', variant), 'cleanup');
          },
          async afterLate(point) {
            await attach('late-1000-complete-scoped-raw', point);
            await collect('late', point.owner, { late: point.owner.producerCount });
            verify(point, variant => readQuarterSourceCleanup(sample.id, 'late', variant), 'late');
            await collect('terminal-tail', point.owner, {
              afterLateRead: point.owner.producerCount, previousCollectedCursor: producers.cursor
            });
          }
        });
        disposed = true;
        await attach('whole-actual-disposal', disposal);
        assert.deepEqual(disposal.trace, ['beforeUnmount-read', 'dispose-start', 'dispose-finished',
          'cleanup-read', 'late-1000-read']);
        expect(errors).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(responses.filter(response => response.status >= 400)).toEqual([]);
        expect(diagnostics.filter(message => ['warning', 'warn', 'error'].includes(message.type)))
          .toEqual([]);
        expect(semanticFailures, 'Full Source comparisons; original complete ledgers remain attached')
          .toEqual([]);
      } finally {
        if (!disposed) {
          try { await attach('finally-whole-actual-disposal', await disposeQuarter(page)); }
          catch (error) { errors.push({ phase: 'finally-dispose', message: String(error) }); }
        }
        await attach('diagnostics-and-comparison-scope', {
          sample, proof: { ...proof, variants: [...proof.variants].map(([variant, mappings]) => ({
            variant, dates: [...mappings.dates], modes: [...mappings.modes]
          })) }, producers: { ...producers, witnesses: [...producers.witnesses].map(([variant, values]) => ({
            variant, signatures: [...values]
          })) }, semanticFailures, errors, diagnostics, requests, responses, failedRequests
        });
      }
    });
}
