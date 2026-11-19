import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples } from './date-picker-month-year-cases.mjs';
import {
  readMonthYearSourceCase, readMonthYearSourceInitial, readMonthYearSourceStep,
  readMonthYearSourceClosed, readMonthYearSourceCleanup
} from './date-picker-month-year-reference.mjs';
import type { MonthYearSourcePoint, MonthYearSourceVariant }
  from './date-picker-month-year-reference.mjs';
import {
  createMonthYearProof, createMonthYearProducerProof, verifyMonthYearPoint,
  verifyMonthYearInputPhase, verifyMonthYearProducerChunk, type NativeMonthYearPoint
} from './date-picker-month-year-assertions';
import {
  openMonthYear, readMonthYear, settleMonthYear, actMonthYear,
  readMonthYearProducers, disposeMonthYear
} from './date-picker-month-year-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`DatePicker ${sample.id} preserves Source terminal selection and callbacks`,
    async ({ page }, testInfo) => {
      // Actual Range counter занимает до 120 s; добавлены оба Source replay и полные raw attachments.
      test.setTimeout(300000);
      const errors: unknown[] = [], semanticFailures: unknown[] = [];
      const diagnostics: Array<{ type: string; text: string }> = [];
      const requests: unknown[] = [], failedRequests: unknown[] = [];
      const responses: Array<{ url: string; status: number }> = [];
      page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
      page.on(
        'console',
        message => diagnostics.push({ type: message.type(), text: message.text() })
      );
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
      const proof = createMonthYearProof(), producers = createMonthYearProducerProof();
      const sourceCase = readMonthYearSourceCase(sample.id);
      const verifyAccessibleFooter = async (source: MonthYearSourcePoint, label: string) => {
        for (const control of source.popups.filter(popup => popup.visible)
          .flatMap(popup => popup.footerControls)) {
          assert.equal(control.tag, 'BUTTON');
          assert(typeof control.text === 'string' && control.text.length > 0);
          const button = page.locator('[data-picker-popup]:visible .ant-picker-footer')
            .getByRole('button', { name: control.text, exact: true });
          try {
            await expect(button).toHaveCount(1, { timeout: 1000 });
            await expect(button).toHaveAccessibleName(control.text, { timeout: 1000 });
          }
          catch (error) {
            semanticFailures.push({ label, assertion: 'Actual accessible footer name',
              sourceRecordedLabel: control.text, message: String(error) });
          }
        }
      };
      const verify = (actual: NativeMonthYearPoint,
        source: (variant: MonthYearSourceVariant) => MonthYearSourcePoint, label: string) => {
        for (const variant of ['first', 'repeat'] as const) {
          try { verifyMonthYearPoint(actual, source(variant), proof, variant, label); }
          catch (error) {
            semanticFailures.push({ label, variant, message: String(error),
              stack: error instanceof Error ? error.stack : null });
          }
        }
      };
      const verifyPhase = (actual: NativeMonthYearPoint, source: MonthYearSourcePoint,
        variant: MonthYearSourceVariant, label: string) => {
        try { verifyMonthYearInputPhase(actual, source, proof, variant, label); }
        catch (error) {
          semanticFailures.push({ label, variant, message: String(error),
            stack: error instanceof Error ? error.stack : null });
        }
      };
      const collect = async (phase: string, owner: NativeMonthYearPoint['owner'],
        boundaries: Record<string, number>) => {
        const chunk = await readMonthYearProducers(page, producers.cursor);
        await attach(phase + '-whole-producer-delta', { phase, boundaries,
          observationEnd: chunk.next, ...chunk });
        verifyMonthYearProducerChunk(chunk, producers, owner, boundaries, sample);
      };
      let disposed = false;
      let closedIndex = 0, actions = 0;
      // Сохраняет результат запасного удаления и добавляет ошибку к диагностике теста.
      async function attachFallbackDisposal() {
        try { await attach('finally-whole-actual-disposal', await disposeMonthYear(page)); }
        catch (error) { errors.push({ phase: 'finally-dispose', message: String(error) }); }
      }

      try {
        assert.deepEqual(sourceCase.sample, sample);
        await openMonthYear(page, sample);
        const initial = await settleMonthYear(page);
        await attach('initial-complete-scoped-raw', initial);
        await collect('initial', initial.owner, { initial: initial.owner.producerCount });
        verify(initial, variant => readMonthYearSourceInitial(sample.id, variant), 'initial');
        await verifyAccessibleFooter(readMonthYearSourceInitial(sample.id), 'initial');
        for (const [index, action] of sample.actions.entries()) {
          assert.deepEqual(readMonthYearSourceStep(sample.id, index).action, action);
          const actionRead = await actMonthYear(page, action, index);
          const actual = await settleMonthYear(page);
          await attach('step-' + index + '-complete-scoped-raw', { ...actionRead, actual });
          await collect('step-' + index, actual.owner, {
            before: actionRead.before.owner.producerCount,
            ...(actionRead.actionEvidence.afterFocusPointer ? {
              afterFocusPointer: actionRead.actionEvidence.afterFocusPointer.owner.producerCount
            } : {}),
            afterCall: actionRead.afterCall.owner.producerCount, settled: actual.owner.producerCount
          });
          for (const variant of ['first', 'repeat'] as const) {
            const original = readMonthYearSourceStep(sample.id, index, variant);
            verifyPhase(actionRead.before, original.before, variant, 'step-' + index + ':before');
            const afterFocus = actionRead.actionEvidence.afterFocusPointer;
            if (afterFocus) {
              assert(original.actionEvidence.afterFocusPointer);
              verifyPhase(afterFocus, original.actionEvidence.afterFocusPointer, variant,
                'step-' + index + ':afterFocusPointer');
            }
            // Записывает расхождение установившегося состояния с конкретным эталоном.
            function recordSettledComparison() {
              try { verifyMonthYearPoint(actual, original.actual, proof, variant, 'step-' + index); }
              catch (error) {
                semanticFailures.push({ label: 'step-' + index, variant, message: String(error),
                  stack: error instanceof Error ? error.stack : null });
              }
            }

            recordSettledComparison();
          }
          await verifyAccessibleFooter(readMonthYearSourceStep(sample.id, index).actual,
            'step-' + index);
          actions++;
          if (action.type === 'input-escape') {
            const original = readMonthYearSourceClosed(sample.id, closedIndex);
            assert.equal(original.actionIndex, index);
            await page.waitForTimeout(1000);
            const after1000 = await readMonthYear(page);
            await attach(
              'closed-' + index + '-complete-scoped-raw',
              { actionIndex: index, after1000 }
            );
            await collect(
              'closed-' + index,
              after1000.owner,
              { after1000: after1000.owner.producerCount }
            );
            verify(after1000, variant =>
              readMonthYearSourceClosed(sample.id, closedIndex, variant).after1000, 'closed-' + index);
            await verifyAccessibleFooter(original.after1000, 'closed-' + index);
            closedIndex++;
          }
        }
        assert.equal(actions, sample.actions.length);
        assert.equal(closedIndex, sourceCase.closed.length);
        const disposal = await disposeMonthYear(page, {
          async beforeUnmount(point) {
            await attach('before-unmount-complete-scoped-raw', point);
            await collect(
              'before-unmount',
              point.owner,
              { beforeUnmount: point.owner.producerCount }
            );
            verify(point, variant => readMonthYearSourceCleanup(sample.id, 'beforeUnmount', variant),
              'beforeUnmount');
          },
          async afterCleanup(point) {
            await attach('cleanup-complete-scoped-raw', point);
            await collect('cleanup', point.owner, { cleanup: point.owner.producerCount });
            verify(
              point,
              variant => readMonthYearSourceCleanup(sample.id, 'cleanup', variant),
              'cleanup'
            );
          },
          async afterLate(point) {
            await attach('late-1000-complete-scoped-raw', point);
            await collect('late', point.owner, { late: point.owner.producerCount });
            verify(point, variant => readMonthYearSourceCleanup(sample.id, 'late', variant), 'late');
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
        expect(
          semanticFailures,
          'Full Source comparisons; original complete ledgers remain attached'
        )
          .toEqual([]);
      } finally {
        if (!disposed) {
          await attachFallbackDisposal();
        }
        await attach('diagnostics-and-comparison-scope', {
          sample, proof: { ...proof, variants: [...proof.variants].map(([variant, mappings]) => ({
            variant, dates: [...mappings.dates], modes: [...mappings.modes]
          })) }, producers, semanticFailures, errors, diagnostics, requests, responses, failedRequests
        });
      }
    });
}
