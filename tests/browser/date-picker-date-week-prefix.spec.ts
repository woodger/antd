import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples } from './date-picker-date-week-prefix-cases.mjs';
import {
  readDateWeekPrefixSourceCase, readDateWeekPrefixSourceInitial, readDateWeekPrefixSourceStep,
  readDateWeekPrefixSourceClosed, readDateWeekPrefixSourceCleanup
} from './date-picker-date-week-prefix-reference.mjs';
import type { DateWeekPrefixSourcePoint, DateWeekPrefixSourceVariant }
  from './date-picker-date-week-prefix-reference.mjs';
import {
  createDateWeekPrefixProof, createDateWeekPrefixProducerProof, verifyDateWeekPrefixPoint,
  verifyDateWeekPrefixInputPhase, verifyDateWeekPrefixProducerChunk,
  verifyDateWeekPrefixProducerPublicAliases, type NativeDateWeekPrefixPoint
} from './date-picker-date-week-prefix-assertions';
import {
  openDateWeekPrefix, readDateWeekPrefix, settleDateWeekPrefix, actDateWeekPrefix,
  readDateWeekPrefixProducers, disposeDateWeekPrefix
} from './date-picker-date-week-prefix-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`DatePicker ${sample.id} preserves Source date week-prefix rows and callbacks`,
    async ({ page }, testInfo) => {
      // Both immutable Source captures are compared; complete actual Native observations stay attached.
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
      const proof = createDateWeekPrefixProof(), producers = createDateWeekPrefixProducerProof(sample);
      const sourceCase = readDateWeekPrefixSourceCase(sample.id);
      const verifyAccessibleToday = async (source: DateWeekPrefixSourcePoint, label: string) => {
        const original = source.popups.filter(popup => popup.visible)
          .flatMap(popup => popup.footerControls);
        const controls = page.locator('[data-picker-popup]:visible [data-picker-current]');
        try {
          await expect(controls).toHaveCount(original.length);
          for (const [index, control] of original.entries()) {
            assert.equal(control.tag, 'A');
            assert.equal(control.disabled, null);
            assert(typeof control.text === 'string' && control.text.length > 0);
            await expect(controls.nth(index)).toHaveRole('button');
            await expect(controls.nth(index)).toHaveAccessibleName(control.text);
          }
        }
        catch (error) {
          semanticFailures.push({ label, assertion: 'Actual Native Today button accessible name',
            message: String(error) });
        }
      };
      const verify = (actual: NativeDateWeekPrefixPoint,
        source: (variant: DateWeekPrefixSourceVariant) => DateWeekPrefixSourcePoint, label: string) => {
        for (const variant of ['first', 'repeat'] as const) {
          try { verifyDateWeekPrefixPoint(actual, source(variant), proof, variant, label); }
          catch (error) {
            semanticFailures.push({ label, variant, message: String(error),
              stack: error instanceof Error ? error.stack : null });
          }
        }
      };
      const verifyPhase = (actual: NativeDateWeekPrefixPoint, source: DateWeekPrefixSourcePoint,
        variant: DateWeekPrefixSourceVariant, label: string) => {
        try { verifyDateWeekPrefixInputPhase(actual, source, proof, variant, label); }
        catch (error) {
          semanticFailures.push({ label, variant, message: String(error),
            stack: error instanceof Error ? error.stack : null });
        }
      };
      const collect = async (phase: string, owner: NativeDateWeekPrefixPoint['owner'],
        boundaries: Record<string, number>, phaseOwners: readonly NativeDateWeekPrefixPoint['owner'][] = [owner]) => {
        const chunk = await readDateWeekPrefixProducers(page, producers.cursor);
        await attach(phase + '-whole-producer-delta', { phase, boundaries,
          observationEnd: chunk.next, ...chunk });
        verifyDateWeekPrefixProducerChunk(chunk, producers, owner, boundaries, sample, phaseOwners);
      };
      let disposed = false;
      let closedIndex = 0, actions = 0;
      try {
        assert.deepEqual(sourceCase.sample, sample);
        await openDateWeekPrefix(page, sample);
        const initial = await settleDateWeekPrefix(page);
        await attach('initial-complete-scoped-raw', initial);
        await collect('initial', initial.owner, { initial: initial.owner.producerCount });
        verify(initial, variant => readDateWeekPrefixSourceInitial(sample.id, variant), 'initial');
        await verifyAccessibleToday(readDateWeekPrefixSourceInitial(sample.id), 'initial');
        for (const [index, action] of sample.actions.entries()) {
          assert.deepEqual(readDateWeekPrefixSourceStep(sample.id, index).action, action);
          const actionRead = await actDateWeekPrefix(page, action, index);
          const actual = await settleDateWeekPrefix(page);
          await attach('step-' + index + '-complete-scoped-raw', { ...actionRead, actual });
          await collect('step-' + index, actual.owner, {
            before: actionRead.before.owner.producerCount,
            ...(actionRead.actionEvidence.afterFocusPointer ? {
              afterFocusPointer: actionRead.actionEvidence.afterFocusPointer.owner.producerCount
            } : {}),
            afterCall: actionRead.afterCall.owner.producerCount, settled: actual.owner.producerCount
          }, [actionRead.before.owner,
            ...(actionRead.actionEvidence.afterFocusPointer
              ? [actionRead.actionEvidence.afterFocusPointer.owner] : []),
            actionRead.afterCall.owner, actual.owner]);
          for (const variant of ['first', 'repeat'] as const) {
            const original = readDateWeekPrefixSourceStep(sample.id, index, variant);
            verifyPhase(actionRead.before, original.before, variant, 'step-' + index + ':before');
            const afterFocus = actionRead.actionEvidence.afterFocusPointer;
            if (afterFocus) {
              assert(original.actionEvidence.afterFocusPointer);
              verifyPhase(afterFocus, original.actionEvidence.afterFocusPointer, variant,
                'step-' + index + ':afterFocusPointer');
            }
            try {
              verifyDateWeekPrefixPoint(actual, original.actual, proof, variant, 'step-' + index);
            }
            catch (error) {
              semanticFailures.push({ label: 'step-' + index, variant, message: String(error),
                stack: error instanceof Error ? error.stack : null });
            }
          }
          await verifyAccessibleToday(
            readDateWeekPrefixSourceStep(sample.id, index).actual,
            'step-' + index
          );
          actions++;
          if (action.type === 'input-escape') {
            assert.equal(readDateWeekPrefixSourceClosed(sample.id, closedIndex).actionIndex, index);
            await page.waitForTimeout(1000);
            const after1000 = await readDateWeekPrefix(page);
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
              readDateWeekPrefixSourceClosed(sample.id, closedIndex, variant).after1000, 'closed-' + index);
            await verifyAccessibleToday(readDateWeekPrefixSourceClosed(sample.id, closedIndex).after1000,
              'closed-' + index);
            closedIndex++;
          }
        }
        assert.equal(actions, sample.actions.length);
        assert.equal(closedIndex, sourceCase.closed.length);
        const disposal = await disposeDateWeekPrefix(page, {
          async beforeUnmount(point) {
            await attach('before-unmount-complete-scoped-raw', point);
            await collect(
              'before-unmount',
              point.owner,
              { beforeUnmount: point.owner.producerCount }
            );
            verify(point, variant => readDateWeekPrefixSourceCleanup(
              sample.id,
              'beforeUnmount',
              variant
            ),
              'beforeUnmount');
          },
          async afterCleanup(point) {
            await attach('cleanup-complete-scoped-raw', point);
            await collect('cleanup', point.owner, { cleanup: point.owner.producerCount });
            verify(
              point,
              variant => readDateWeekPrefixSourceCleanup(sample.id, 'cleanup', variant),
              'cleanup'
            );
          },
          async afterLate(point) {
            await attach('late-1000-complete-scoped-raw', point);
            await collect('late', point.owner, { late: point.owner.producerCount });
            verify(
              point,
              variant => readDateWeekPrefixSourceCleanup(sample.id, 'late', variant),
              'late'
            );
            await collect('terminal-tail', point.owner, {
              afterLateRead: point.owner.producerCount, previousCollectedCursor: producers.cursor
            });
          }
        });
        disposed = true;
        await attach('whole-actual-disposal', disposal);
        assert.deepEqual(disposal.trace, ['beforeUnmount-read', 'dispose-start', 'dispose-finished',
          'cleanup-read', 'late-1000-read']);
        verifyDateWeekPrefixProducerPublicAliases(producers, proof);
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
          try { await attach('finally-whole-actual-disposal', await disposeDateWeekPrefix(page)); }
          catch (error) { errors.push({ phase: 'finally-dispose', message: String(error) }); }
        }
        await attach('diagnostics-and-comparison-scope', {
          sample, proof: { ...proof, variants: [...proof.variants].map(([variant, mappings]) => ({
            variant, dates: [...mappings.dates], modes: [...mappings.modes]
          })) }, producers: { ...producers, witnesses: [...producers.witnesses].map(([variant, values]) => ({
            variant, models: [...values].map(([model, signatures]) => ({
              model,
              signatures: [...signatures]
            }))
          })) }, semanticFailures, errors, diagnostics, requests, responses, failedRequests
        });
      }
    });
}
