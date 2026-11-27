import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeJSONPart } from '../date-picker-presets-source-v2/json-stream.mjs';
import { sourceSharedScript } from '../homepage-five-source-review-v1/shared.mjs';
import { readWeekSource } from '../date-picker-week-source-proposal-v1/reader.mjs';
import { samples, counts, storage, expandAction } from './cases.mjs';
import { createMaskSourceApp } from './source-case.mjs';
import { base, sourceScripts, environment, verifyPins } from './protocol.mjs';

const [variant, reviewedFreezeSHA256, rootLease] = process.argv.slice(2);
assert(['first', 'repeat'].includes(variant));
const frozen = verifyPins(reviewedFreezeSHA256, rootLease);
const output = base + 'csr-source-' + variant + '.json';
for (const suffix of ['', '.gz', '.parts']) assert(!fs.existsSync(output + suffix), 'Fresh output only');
fs.mkdirSync(output + '.parts');
const cases = [], errors = [], diagnostics = [];
const actualCounts = { owners: 0, authoredMacroActions: 0, initialAndMacroSettledPoints: 0,
  explicitSubsteps: 0, keyboardPressCalls: 0, inputMouseMoves: 0, inputMouseDowns: 0,
  inputMouseUps: 0, authoredDOMControlClicks: 0, declaredEscapeReadsAfter1000: 0,
  wholeUnmounts: 0, cleanupReads: 0, lateReads: 0, rawPointParts: 0, producerParts: 0,
  retainedFullPhasePoints: 0, producerInvocations: 0, rawParts: 0 };
actualCounts.macroAfterCallReferencesToChildSnapshot = 0;
actualCounts.distinctRetainedFullReads = 0;
const failure = error => ({ name: error.name, message: error.message, stack: error.stack });
let current = null, browserVersion = null, fatal = null;
const save = async (id, phase, value) => {
  const rawJSONPart = await writeJSONPart(output + '.parts/' + id + '-' + phase + '.json', value);
  actualCounts.rawParts++; return { rawJSONPart };
};
const browser = await chromium.launch({ executablePath: environment.browserExecutable });
try {
  browserVersion = browser.version(); assert.equal(browserVersion, environment.chromium);
  for (const sample of samples) {
    const page = await browser.newPage({ viewport: environment.viewport,
      locale: environment.locale, timezoneId: environment.timezone, deviceScaleFactor: 1 });
    page.setDefaultTimeout(10000);
    const row = { id: sample.id, sample, initial: null, steps: [], substeps: [], closed: [], producerParts: [],
      producerFinalCount: null, beforeUnmount: null, cleanup: null, late: null,
      failure: null, interruptedAction: null, interruptedSubstep: null, observationErrors: [],
      network: { requests: [], responses: [], failures: [] } };
    page.on('pageerror', error => errors.push({ current, ...failure(error) }));
    page.on('console', message => diagnostics.push({ current, type: message.type(),
      message: message.text(), location: message.location() }));
    page.on('request', request => row.network.requests.push({ url: request.url(),
      method: request.method(), type: request.resourceType() }));
    page.on('response', response => row.network.responses.push({ url: response.url(), status: response.status() }));
    page.on('requestfailed', request => row.network.failures.push({ url: request.url(), failure: request.failure() }));
    const read = () => page.evaluate(readWeekSource);
    const drain = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimeout(resolve, 25));
    })));
    async function settle() {
      let previous = '', stable = 0;
      for (let attempt = 0; attempt < 70; attempt++) {
        await drain(); const actual = await read(), encoded = JSON.stringify(actual);
        stable = encoded === previous ? stable + 1 : 0;
        if (stable >= 4) return actual;
        previous = encoded;
      }
      throw Error('Complete Source mask scoped observation did not settle');
    }
    let cursor = 0;
    async function saveProducers(phase, boundaries, boundaryScope = 'local-substep-or-lifecycle-window') {
      const delta = await page.evaluate(cursor => raw.current.readProducers(cursor), cursor);
      assert.equal(delta.cursor, cursor); assert.equal(delta.next - cursor, delta.rows.length);
      for (const [index, call] of delta.rows.entries()) assert.equal(call.index, cursor + index);
      for (const count of Object.values(boundaries)) assert(Number.isSafeInteger(count) && count <= delta.next);
      row.producerParts.push({ phase, cursor, next: delta.next,
        ...await save(sample.id, phase + '-producers', {
          phase, boundaryScope, boundaries, observationEnd: delta.next, ...delta }) });
      cursor = delta.next; actualCounts.producerParts++; actualCounts.producerInvocations += delta.rows.length;
    }
    async function savePoint(phase, value) {
      const boundaries = value.actual ? { before: value.before.owner.producerCount,
        afterCall: value.afterCall.owner.producerCount, settled: value.actual.owner.producerCount }
        : { [phase]: value.after1000?.owner.producerCount ?? value.owner.producerCount };
      const reference = await save(sample.id, phase, value);
      actualCounts.rawPointParts++; actualCounts.retainedFullPhasePoints += value.actual ? 3 : 1;
      actualCounts.distinctRetainedFullReads += value.scope === 'macro' ? 2 : value.actual ? 3 : 1;
      if (value.scope === 'macro') actualCounts.macroAfterCallReferencesToChildSnapshot++;
      await saveProducers(phase, boundaries, value.scope === 'macro'
        ? 'aggregate-macro-window-covering-earlier-child-parts' : 'local-substep-or-lifecycle-window');
      return reference;
    }
    let activeAction = null, activeSubstep = null, pointer = null;
    try {
      current = { id: sample.id, phase: 'mount' };
      await page.clock.setFixedTime(new Date(environment.fixedDate));
      await page.setContent('<!doctype html><html><head><meta charset="UTF-8">'
        + '<link rel="icon" href="data:,"></head><body style="margin:0;min-height:900px">'
        + '<div id="root"></div></body></html>');
      for (const file of sourceScripts) await page.addScriptTag({ path: file });
      assert.deepEqual(await page.evaluate(() => ({ react: React.version, antd: antd.version,
        dateNow: Date.now(), dayjsLocale: dayjs.locale() })), {
        react: '18.3.1', antd: '6.6.8', dateNow: Date.parse(environment.fixedDate), dayjsLocale: 'en' });
      await page.addScriptTag({ content: 'window.maskShared=' + sourceSharedScript() });
      await page.addScriptTag({ content: 'window.maskFactory=' + createMaskSourceApp.toString() });
      await page.evaluate(sample => {
        window.raw = { preMountNodes: new Set(document.querySelectorAll('*')),
          retainedNodes: new Set(), events: [] };
        const types = ['pointerdown', 'mousedown', 'mouseup', 'click', 'mouseover', 'mouseout',
          'keydown', 'keyup', 'beforeinput', 'input', 'change', 'selectionchange', 'focusin', 'focusout',
          'paste', 'compositionstart', 'compositionupdate', 'compositionend'];
        const listener = event => {
          const recorder = raw.current?.recorder; if (!recorder) return;
          const state = raw.current.read();
          const id = value => value == null ? null : recorder.identity(value);
          const input = event.target instanceof HTMLInputElement ? event.target
            : document.activeElement instanceof HTMLInputElement ? document.activeElement : null;
          raw.events.push({ actionIndex: state.actionIndex, substepIndex: state.substepIndex,
            producerCursorAtCapture: state.producerCount, callbackCountAtCapture: state.callbacks.length,
            type: event.type, isTrusted: event.isTrusted, timeStamp: event.timeStamp,
            phase: 'document-capture-before-target-handler', eventPhase: event.eventPhase,
            bubbles: event.bubbles, cancelable: event.cancelable,
            defaultPreventedAtCapture: event.defaultPrevented, key: event.key ?? null,
            code: event.code ?? null, repeat: event.repeat ?? null, isComposing: event.isComposing ?? null,
            altKey: event.altKey ?? null, ctrlKey: event.ctrlKey ?? null,
            metaKey: event.metaKey ?? null, shiftKey: event.shiftKey ?? null,
            inputType: event.inputType ?? null, data: event.data ?? null,
            button: event.button ?? null, buttons: event.buttons ?? null,
            clientX: event.clientX ?? null, clientY: event.clientY ?? null,
            targetIdentity: id(event.target), targetTag: event.target?.nodeName ?? null,
            currentTargetIdentity: id(event.currentTarget), relatedTargetIdentity: id(event.relatedTarget),
            inputAtCapture: input ? { identity: id(input), value: input.value,
              defaultValue: input.defaultValue, selectionStart: input.selectionStart,
              selectionEnd: input.selectionEnd, selectionDirection: input.selectionDirection,
              focused: input === document.activeElement, attributes: [...input.attributes].map(a => [a.name, a.value]) } : null });
        };
        for (const type of types) document.addEventListener(type, listener, true);
        raw.removeEventObserver = () => {
          for (const type of types) document.removeEventListener(type, listener, true);
        };
        window.app = ReactDOM.createRoot(document.getElementById('root'));
        ReactDOM.flushSync(() => app.render(maskFactory(React, antd, sample, raw, maskShared)));
      }, sample);
      await page.evaluate(() => document.fonts.ready); await page.mouse.move(1200, 800);
      row.initial = await savePoint('initial', await settle()); actualCounts.initialAndMacroSettledPoints++;
      for (const [index, action] of sample.actions.entries()) {
        await page.evaluate(index => raw.current.setActionIndex(index), index);
        current = { id: sample.id, phase: 'macro', index, action };
        activeAction = { scope: 'macro', index, action, before: await read(), substeps: [],
          afterCall: null, afterCallSource: null };
        const commands = expandAction(action);
        for (const [substepIndex, command] of commands.entries()) {
          await page.evaluate(index => raw.current.setSubstepIndex(index), substepIndex);
          current = { id: sample.id, phase: 'substep', index, substepIndex, command };
          activeSubstep = { index, substepIndex, command, before: await read(), evidence: null, afterCall: null };
          if (command.type === 'mouse-move-input') {
            const target = page.locator(command.index === 1 ? '#mask-end' : '#mask-input');
            assert.equal(await target.count(), 1);
            const geometry = await target.evaluate(node => {
              const box = node.getBoundingClientRect(), css = getComputedStyle(node);
              return { identity: raw.current.recorder.identity(node), tag: node.tagName,
                html: node.outerHTML, attributes: [...node.attributes].map(a => [a.name, a.value]),
                x: box.x, y: box.y, width: box.width, height: box.height,
                css: { paddingLeft: css.paddingLeft, borderLeftWidth: css.borderLeftWidth,
                  textIndent: css.textIndent, direction: css.direction, font: css.font, display: css.display } };
            });
            assert(geometry.width > 0 && geometry.height > 0);
            const offset = command.anchor === 'text-start'
              ? (parseFloat(geometry.css.borderLeftWidth) || 0) + (parseFloat(geometry.css.paddingLeft) || 0)
                + Math.max(0, parseFloat(geometry.css.textIndent) || 0) + 2
              : geometry.width / 2;
            const point = { x: geometry.x + offset, y: geometry.y + geometry.height / 2 };
            const hitBefore = await target.evaluate((node, point) => {
              const hit = document.elementFromPoint(point.x, point.y);
              return { identity: hit == null ? null : raw.current.recorder.identity(hit),
                tag: hit?.tagName ?? null, targetContainsHit: hit != null && node.contains(hit),
                attributes: hit ? [...hit.attributes].map(a => [a.name, a.value]) : null };
            }, point);
            assert.equal(hitBefore.targetContainsHit, true, 'Authored coordinate must hit the actual input');
            activeSubstep.evidence = { geometry, point, hitBefore };
            pointer = { index: command.index, anchor: command.anchor, point, hitBefore };
            await page.mouse.move(point.x, point.y); actualCounts.inputMouseMoves++;
          } else if (command.type === 'mouse-down') {
            assert(pointer); activeSubstep.evidence = { pointer };
            await page.mouse.down({ button: command.button }); actualCounts.inputMouseDowns++;
          } else if (command.type === 'mouse-up') {
            assert(pointer); activeSubstep.evidence = { pointer };
            await page.mouse.up({ button: command.button }); actualCounts.inputMouseUps++;
          } else if (command.type === 'key-press') {
            const target = page.locator('.ant-picker input:focus'); assert.equal(await target.count(), 1);
            activeSubstep.evidence = { focusedInput: await target.evaluate(node => ({
              identity: raw.current.recorder.identity(node), attributes: [...node.attributes].map(a => [a.name, a.value]),
              value: node.value, selectionStart: node.selectionStart, selectionEnd: node.selectionEnd,
              selectionDirection: node.selectionDirection })) };
            await page.keyboard.press(command.key); actualCounts.keyboardPressCalls++;
          } else if (command.type === 'owner-control-click') {
            const target = page.locator('[data-mask-control="' + command.value + '"]');
            assert.equal(await target.count(), 1);
            activeSubstep.evidence = await target.evaluate(button => {
              const active = document.activeElement; let click = null;
              button.addEventListener('click', event => { click = { type: event.type, isTrusted: event.isTrusted,
                targetMatches: event.target === button, currentTargetMatches: event.currentTarget === button }; },
              { once: true, capture: true });
              ReactDOM.flushSync(() => button.click());
              return { click, focusIdentityPreserved: active === document.activeElement };
            });
            actualCounts.authoredDOMControlClicks++;
          } else throw Error('Undeclared physical command');
          activeSubstep.afterCall = await read();
          const actual = await settle();
          const reference = await savePoint('step-' + index + '-substep-' + substepIndex,
            { ...activeSubstep, actual });
          activeAction.substeps.push(reference);
          row.substeps.push({ actionIndex: index, substepIndex, command, ...reference });
          // Preserve the actual last physical call's immediate read, never its settled replacement.
          activeAction.afterCall = activeSubstep.afterCall;
          activeAction.afterCallSource = { substep: reference, field: 'afterCall' };
          activeSubstep = null; actualCounts.explicitSubsteps++;
        }
        await page.evaluate(() => raw.current.setSubstepIndex(-1));
        const actual = await settle();
        row.steps.push(await savePoint('step-' + index, { ...activeAction, actual }));
        activeAction = null; actualCounts.authoredMacroActions++; actualCounts.initialAndMacroSettledPoints++;
        if (action.type === 'input-escape') {
          await page.waitForTimeout(1000);
          row.closed.push(await savePoint('closed-' + index, { actionIndex: index, after1000: await read() }));
          actualCounts.declaredEscapeReadsAfter1000++;
        }
      }
      row.beforeUnmount = await savePoint('before-unmount', await read());
    } catch (error) {
      row.failure = failure(error);
      if (activeSubstep) row.interruptedSubstep = await save(sample.id, 'interrupted-substep', activeSubstep);
      if (activeAction) row.interruptedAction = await save(sample.id, 'interrupted-action', activeAction);
      try { row.beforeUnmount = await savePoint('failure-before-unmount', await read()); }
      catch (caught) { row.observationErrors.push({ phase: 'before-unmount', ...failure(caught) }); }
    } finally {
      current = { id: sample.id, phase: 'unmount' };
      try {
        await page.evaluate(() => ReactDOM.flushSync(() => app.unmount())); actualCounts.wholeUnmounts++;
        await drain(); row.cleanup = await savePoint('cleanup', await read()); actualCounts.cleanupReads++;
        await page.waitForTimeout(1000); row.late = await savePoint('late', await read()); actualCounts.lateReads++;
        await saveProducers('terminal-tail', { afterLate: cursor }); row.producerFinalCount = cursor;
      } catch (error) { row.observationErrors.push({ phase: 'cleanup', ...failure(error) }); }
      try { await page.evaluate(() => raw.removeEventObserver()); }
      catch (error) { row.observationErrors.push({ phase: 'observer-dispose', ...failure(error) }); }
      cases.push(row); actualCounts.owners++; await page.close();
      console.log(JSON.stringify({ id: sample.id, macros: row.steps.length,
        producerCount: row.producerFinalCount, failure: row.failure, observationErrors: row.observationErrors }));
    }
    if (row.failure || row.observationErrors.length) break;
  }
} catch (error) { fatal = failure(error); }
finally { await browser.close(); }
let terminalInputVerification;
try { terminalInputVerification = { unchanged: true, sha256: verifyPins(reviewedFreezeSHA256, rootLease).sha256 }; }
catch (error) { terminalInputVerification = { unchanged: false, failure: failure(error) }; }
const completion = ['owners', 'authoredMacroActions', 'initialAndMacroSettledPoints', 'explicitSubsteps',
  'keyboardPressCalls', 'inputMouseMoves', 'inputMouseDowns', 'inputMouseUps', 'authoredDOMControlClicks',
  'declaredEscapeReadsAfter1000', 'wholeUnmounts', 'retainedFullPhasePoints'];
completion.push('macroAfterCallReferencesToChildSnapshot', 'distinctRetainedFullReads');
const failed = fatal !== null || !terminalInputVerification.unchanged || errors.length > 0
  || diagnostics.some(row => ['error', 'warning', 'warn'].includes(row.type))
  || cases.some(row => row.failure || row.observationErrors.length || row.network.failures.length
    || row.network.responses.some(response => response.status >= 400))
  || completion.some(key => actualCounts[key] !== counts[key])
  || actualCounts.cleanupReads !== counts.owners || actualCounts.lateReads !== counts.owners
  || actualCounts.rawPointParts !== storage.rawPointPartsPerCSR
  || actualCounts.producerParts !== storage.producerPartsPerCSR || actualCounts.rawParts !== storage.totalPartsPerCSR;
const receipt = await writeJSONPart(output, { status: failed ? 'failed' : 'complete', variant,
  sourceProtocol: { file: base + 'protocol-freeze.json', sha256: frozen.sha256,
    reviewedProposalSHA256: frozen.protocol.reviewedProposalSHA256, rootLease },
  browserVersion, counts, storage, actualCounts, cases, errors, diagnostics, fatal,
  clipboard: 'Excluded: no confirmed real clipboard roundtrip; no permission changes or fake paste.',
  terminalInputVerification });
console.log(JSON.stringify({ output: receipt, status: failed ? 'failed' : 'complete', actualCounts,
  errors: errors.length, diagnostics: diagnostics.length, fatal }));
if (failed) process.exitCode = 1;
