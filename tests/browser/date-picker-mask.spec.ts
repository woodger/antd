import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { test, expect } from './test';
import { samples, expandAction } from './date-picker-mask-cases.mjs';
import { readMaskSourceCase, readMaskSourceInitial, readMaskSourceStep, readMaskSourceSubstep,
  readMaskSourceClosed, readMaskSourceCleanup } from './date-picker-mask-reference.mjs';
import type { MaskSourcePoint, MaskSourceVariant, MaskSourceProducerChunk, MaskSourceSubstep }
  from './date-picker-mask-reference.mjs';
import { createMaskProof, verifyMaskLocalPoint, compareMaskPoint, createMaskProducerProof,
  compareMaskProducerChunk, verifyMaskProducerPublicAliases, maskComparisonBoundaries,
  type NativeMaskPoint, type MaskDifference } from './date-picker-mask-assertions';
import { openMask, readMask, settleMask, actMask, readMaskProducers, disposeMask } from './date-picker-mask-driver';

test.use({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 });
for (const sample of samples) {
  test(`DatePicker ${sample.id} preserves Source numeric mask editing and full callback arguments`,
    async ({ page }, testInfo) => {
      // Full physical substeps, stable reads, both Source runs and strict raw ledgers need time beyond the action calls.
      test.setTimeout(600000);
      const errors: unknown[] = [], semanticFailures: MaskDifference[] = [];
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
      page.on(
        'requestfailed',
        request => failedRequests.push({ url: request.url(), failure: request.failure() })
      );
      const attach = (label: string, value: unknown) => testInfo.attach(label + '.json.gz', {
        contentType: 'application/gzip', body: gzipSync(Buffer.from(JSON.stringify(value, null, 2)))
      });
      const proof = createMaskProof(), producers = createMaskProducerProof(sample);
      const sourceCase = readMaskSourceCase(sample.id);
      let pointParts = 0, producerParts = 0, completedActions = 0, completedSubsteps = 0, closedOrdinal = 0;
      let captureCursor = 0;
      const ledgerQueue: Array<{
        chunk: MaskSourceProducerChunk;
        owners: readonly NativeMaskPoint['owner'][]
      }> = [];
      const sourceParts = new Map<MaskSourceVariant, { key: string; value: MaskSourceSubstep }>();
      const sourceChild = (index: number, substep: number, variant: MaskSourceVariant) => {
        const key = index + '/' + substep, previous = sourceParts.get(variant);
        if (previous?.key === key) {
          return previous.value;
        }
        const value = readMaskSourceSubstep(sample.id, index, substep, variant);
        sourceParts.set(variant, { key, value });
        return value;
      };
      const local = (point: NativeMaskPoint, label: string) => {
        try { verifyMaskLocalPoint(point, proof); }
        catch (error) {
          semanticFailures.push({ label, field: 'Native local integrity', message: String(error) });
        }
      };
      const verify = (
        actual: NativeMaskPoint,
        source: (variant: MaskSourceVariant) => MaskSourcePoint,
        label: string
      ) => {
        for (const variant of ['first', 'repeat'] as const)
          semanticFailures.push(...compareMaskPoint(actual, source(variant), proof, variant, label));
      };
      const collect = async (phase: string, owners: readonly NativeMaskPoint['owner'][],
        boundaries: Record<string, number>, aggregate = false) => {
        const delta = await readMaskProducers(page, captureCursor);
        assert.equal(delta.cursor, captureCursor);
        assert.equal(delta.next - delta.cursor, delta.rows.length);
        delta.rows.forEach((call, index) => assert.equal(call.index, captureCursor + index));
        captureCursor = delta.next;
        const chunk = { phase, boundaryScope: aggregate ? 'aggregate-macro-window-covering-earlier-child-parts'
          : 'local-substep-or-lifecycle-window', boundaries, observationEnd: delta.next, ...delta } as MaskSourceProducerChunk;
        await attach(phase + '-whole-producer-delta', chunk);
        producerParts++;
        // Full public model/callback bindings are established before matching pure-call witnesses.
        // Each queued phase still admits Source witnesses only from its own executed prefix.
        ledgerQueue.push({ chunk, owners });
      };
      const verifyAccessibleFooter = async (source: MaskSourcePoint, label: string) => {
        const controls = source.popups.filter(popup => popup.visible).flatMap(popup => popup.footerControls);
        const actual = page.locator('[data-picker-popup]:visible .ant-picker-footer button');
        try {
          await expect(actual).toHaveCount(controls.length);
          for (const [index, control] of controls.entries()) {
            assert(typeof control.text === 'string' && control.text.trim().length > 0);
            await expect(actual.nth(index)).toHaveRole('button');
            await expect(actual.nth(index)).toHaveAccessibleName(control.text);
          }
        }
        catch (error) {
          semanticFailures.push({
            label,
            field: 'Actual footer accessible name',
            message: String(error)
          });
        }
      };
      let disposed = false;
      // Saves the result of spare removal and adds an error to the diagnosis of the test.
      async function attachFallbackDisposal() {
        try { await attach('finally-whole-actual-disposal', await disposeMask(page)); }
        catch (error) { errors.push({ phase: 'finally-dispose', message: String(error) }); }
      }

      try {
        assert.deepEqual(sourceCase.sample, sample);
        await openMask(page, sample);
        const initial = await settleMask(page);
        await attach('initial-complete-scoped-raw', initial);
        pointParts++;
        local(initial, 'initial');
        verify(initial, variant => readMaskSourceInitial(sample.id, variant), 'initial');
        await collect('initial', [initial.owner], { initial: initial.owner.producerCount });
        await verifyAccessibleFooter(readMaskSourceInitial(sample.id), 'initial');
        for (const [index, action] of sample.actions.entries()) {
          assert.deepEqual(readMaskSourceStep(sample.id, index).action, action);
          let lastChildImmediate: NativeMaskPoint | null = null;
          const macro = await actMask(page, action, index, {
            beforeMacro(point) {
              local(point, 'step-' + index + ':before');
              verify(
                point,
                variant => readMaskSourceStep(sample.id, index, variant).before,
                'step-' + index + ':before'
              );
            },
            beforeSubstep(point, substepIndex, command) {
              assert.deepEqual(command, expandAction(action)[substepIndex]);
              local(point, 'step-' + index + '-substep-' + substepIndex + ':before');
              verify(point, variant => sourceChild(index, substepIndex, variant).before,
                'step-' + index + '-substep-' + substepIndex + ':before');
            },
            async afterSubstep(child) {
              const phase = 'step-' + index + '-substep-' + child.substepIndex;
              await attach(phase + '-complete-scoped-raw', child);
              pointParts++;
              local(child.afterCall, phase + ':afterCall-local-only');
              local(child.actual, phase + ':settled');
              verify(child.actual, variant => sourceChild(index, child.substepIndex, variant).actual,
                phase + ':settled');
              await collect(phase, [child.before.owner, child.afterCall.owner, child.actual.owner], {
                before: child.before.owner.producerCount, afterCall: child.afterCall.owner.producerCount,
                settled: child.actual.owner.producerCount
              });
              lastChildImmediate = child.afterCall;
              completedSubsteps++;
              await verifyAccessibleFooter(
                sourceChild(index, child.substepIndex, 'first').actual,
                phase
              );
            }
          });
          assert.equal(macro.substeps.length, expandAction(action).length);
          assert(
            Object.is(macro.afterCall, lastChildImmediate),
            'Parent retains exactly the last child immediate object'
          );
          assert.deepEqual(
            macro.afterCallSource,
            { substep: macro.substeps.at(-1), field: 'afterCall' }
          );
          await attach('step-' + index + '-complete-scoped-raw', macro);
          pointParts++;
          local(macro.actual, 'step-' + index + ':settled');
          verify(
            macro.actual,
            variant => readMaskSourceStep(sample.id, index, variant).actual,
            'step-' + index + ':settled'
          );
          await collect('step-' + index, [macro.before.owner, macro.afterCall.owner, macro.actual.owner], {
            before: macro.before.owner.producerCount, afterCall: macro.afterCall.owner.producerCount,
            settled: macro.actual.owner.producerCount
          }, true);
          completedActions++;
          await verifyAccessibleFooter(readMaskSourceStep(sample.id, index).actual, 'step-' + index);
          if (action.type === 'input-escape') {
            assert.equal(readMaskSourceClosed(sample.id, closedOrdinal).actionIndex, index);
            await page.waitForTimeout(1000);
            const point = await readMask(page);
            await attach(
              'closed-' + index + '-complete-scoped-raw',
              { actionIndex: index, after1000: point }
            );
            pointParts++;
            local(point, 'closed-' + index);
            verify(
              point,
              variant => readMaskSourceClosed(sample.id, closedOrdinal, variant).after1000,
              'closed-' + index
            );
            await collect(
              'closed-' + index,
              [point.owner],
              { after1000: point.owner.producerCount }
            );
            closedOrdinal++;
          }
        }
        assert.equal(completedActions, sample.actions.length);
        assert.equal(
          completedSubsteps,
          sample.actions.reduce((count, action) => count + expandAction(action).length, 0)
        );
        assert.equal(closedOrdinal, sourceCase.closed.length);
        let cleanup: NativeMaskPoint | null = null;
        const disposal = await disposeMask(page, {
          async beforeUnmount(point) {
            await attach('before-unmount-complete-scoped-raw', point);
            pointParts++;
            local(point, 'beforeUnmount');
            verify(
              point,
              variant => readMaskSourceCleanup(sample.id, 'beforeUnmount', variant),
              'beforeUnmount'
            );
            await collect(
              'before-unmount',
              [point.owner],
              { beforeUnmount: point.owner.producerCount }
            );
          },
          async afterCleanup(point) {
            await attach('cleanup-complete-scoped-raw', point);
            pointParts++;
            local(point, 'cleanup');
            verify(
              point,
              variant => readMaskSourceCleanup(sample.id, 'cleanup', variant),
              'cleanup'
            );
            await collect('cleanup', [point.owner], { cleanup: point.owner.producerCount });
            cleanup = point;
          },
          async afterLate(point) {
            await attach('late-1000-complete-scoped-raw', point);
            pointParts++;
            local(point, 'late');
            verify(point, variant => readMaskSourceCleanup(sample.id, 'late', variant), 'late');
            assert(cleanup);
            assert.deepEqual(
              point.owner.callbacks,
              cleanup.owner.callbacks,
              'No callbacks after real disposal'
            );
            assert.equal(
              point.owner.producerCount,
              cleanup.owner.producerCount,
              'No producer invocations after real disposal'
            );
            await collect('late', [point.owner], { late: point.owner.producerCount });
            await collect('terminal-tail', [point.owner], { afterLate: point.owner.producerCount });
          }
        });
        disposed = true;
        await attach('whole-actual-disposal', disposal);
        assert.deepEqual(
          disposal.trace,
          ['beforeUnmount-read', 'dispose-start', 'dispose-finished', 'cleanup-read', 'late-1000-read']
        );
        for (const { chunk, owners } of ledgerQueue) {
          semanticFailures.push(...compareMaskProducerChunk(
            chunk,
            owners,
            producers,
            proof,
            chunk.phase
          ));
        }
        assert.equal(
          producers.cursor,
          captureCursor,
          'All actual producer calls checked through terminal tail'
        );
        semanticFailures.push(...verifyMaskProducerPublicAliases(producers, proof));
        assert.equal(pointParts, 1 + completedActions + completedSubsteps + closedOrdinal + 3);
        assert.equal(producerParts, pointParts + 1);
        expect(errors).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(responses.filter(response => response.status >= 400)).toEqual([]);
        expect(diagnostics.filter(message => ['warning', 'warn', 'error'].includes(message.type))).toEqual([]);
        expect(
          semanticFailures,
          'Both Source captures, exact public Date aliases and actual caret; afterCall retained locally'
        ).toEqual([]);
      } finally {
        if (!disposed) {
          await attachFallbackDisposal();
        }
        await attach('diagnostics-and-comparison-scope', { sample, boundaries: maskComparisonBoundaries,
          proof: { points: proof.points, root: proof.root, owner: proof.owner, inputs: proof.inputs,
            variants: [...proof.variants].map(([variant, mappings]) => ({
              variant,
              identities: [...mappings.forward]
            })) },
          producers: { cursor: producers.cursor, chunks: producers.chunks, localCalls: producers.localCalls,
            matchesAcrossBothVariants: producers.matchedCalls },
          pointParts, producerParts, completedActions, completedSubsteps, closedOrdinal,
          semanticFailures, errors, diagnostics, requests, responses, failedRequests });
      }
    });
}
