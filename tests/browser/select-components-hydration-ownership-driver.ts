import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { describeOwnershipNode, initializeHydrationOwnershipProbe, readHydrationOwnership,
  type HydrationOwnershipPoint } from './select-components-hydration-ownership-metrics.mjs';
import type { HydrationOwnershipOwnerKey } from './select-components-hydration-ownership-cases.mjs';
import type { HydrationOwnershipSourceCase } from './select-components-hydration-ownership-reference';
import { verifyHydrationOwnershipPoint } from './select-components-hydration-ownership-assertions';
import { verifyHydrationOwnershipSSR, type HydrationOwnershipNativeSSR } from './select-components-hydration-ownership-ssr-assertions';
import { drainSelectSurface } from './select-surface-driver';

export async function captureHydrationOwnership(
  page: Page,
  source: HydrationOwnershipSourceCase,
  renderOwner: (key: HydrationOwnershipOwnerKey) => Promise<HydrationOwnershipNativeSSR>
) {
  const scenario = source.scenario, trace: Array<{
    phase: string;
    actual: HydrationOwnershipPoint;
    action?: unknown;
    boundaries?: string[]
  }> = [];
  const failures: string[] = [], diagnostics: unknown[] = [], pageErrors: unknown[] = [], network = {
    requests: [] as unknown[],
    requestFailures: [] as unknown[],
    responses: [] as unknown[]
  };
  const servers: Partial<Record<HydrationOwnershipOwnerKey, HydrationOwnershipNativeSSR>> = {};
  let fatal: { name: string; message: string; stack?: string } | null = null, completedActions = 0, peerCleanups = 0;
  const record = (phase: string, actual: HydrationOwnershipPoint, action?: unknown) => {
    const boundaries = new Set<string>();
    const expected = source.trace.find(row => row.phase === phase);
    // hydrate-return is an actual asynchronous-framework observation, retained
    // raw independently. Commit and settled phases remain strict.
    if (expected && !phase.endsWith('-hydrate-return')) {
      failures.push(...verifyHydrationOwnershipPoint(
        actual,
        expected.actual,
        source,
        phase,
        boundaries
      ));
    }
    trace.push({ phase, actual, ...(action ? { action } : {}), boundaries: [...boundaries] });
  };
  const snapshot = async (phase: string, action?: unknown) => record(
    phase,
    await page.evaluate(readHydrationOwnership),
    action
  );
  const settled = async (phase: string, action?: unknown) => {
    await drainSelectSurface(page);
    await snapshot(phase, action);
  };
  page.on(
    'console',
    message => diagnostics.push({
      type: message.type(),
      message: message.text(),
      location: message.location()
    })
  );
  page.on(
    'pageerror',
    error => pageErrors.push({ name: error.name, message: error.message, stack: error.stack })
  );
  page.on(
    'request',
    request => network.requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    })
  );
  page.on(
    'requestfailed',
    request => network.requestFailures.push({ url: request.url(), failure: request.failure() })
  );
  page.on(
    'response',
    response => network.responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    })
  );
  // Trying to read the condition after the error, fixing the failure of the measurement itself.
  async function observeFailedAction() {
    try {
      await snapshot('failure-observation');
    }
    catch (observationError) {
      failures.push('failure-observation: ' + String(observationError));
    }
  }

  // Removes all remaining instances and keeps clearing diagnostics.
  async function disposeLiveOwners() {
    try {
      await page.evaluate(async () => { for (const key of window.hydrationOwnershipProbe?.scenario.environment.owners ?? [])
        if (window.hydrationOwnershipProbe.roots[key]?.app) await window.hydrationOwnershipNative.dispose(key); });
      if (fatal) await snapshot('failure-cleanup');
    }
    catch (cleanupError) { failures.push('failure-cleanup: ' + String(cleanupError)); }
  }

  try {
    await page.goto('/select-components-hydration-ownership.html');
    await page.addScriptTag({
      type: 'module',
      url: '/select-components-hydration-ownership.styles.client.ts'
    });
    await page.evaluate(() => document.fonts.ready);
    for (const key of scenario.environment.owners) {
      const rendered = await renderOwner(key);
      servers[key] = rendered;
      for (const [method, state] of Object.entries(source.server.serializations)) {
        // Adds the discrepancy of a particular SSR-serializer in the magazine.
        function verifyServerSerialization() {
          try {
            verifyHydrationOwnershipSSR(
              rendered,
              state.owners[key]!,
              scenario.id + '/' + method + '/' + key
            );
          }
          catch (error) { failures.push('public-SSR/' + method + '/' + key + ': ' + String(error)); }
        }

        verifyServerSerialization();
      }
    }
    await page.addScriptTag({ content: 'window.describeOwnershipNode=' + describeOwnershipNode.toString() });
    await page.addScriptTag({ content: 'window.readHydrationOwnership=' + readHydrationOwnership.toString() });
    await page.evaluate(records => {
      for (const value of Object.values(records)) {
        document.head.insertAdjacentHTML(
          'beforeend',
          value!.head
        );
      }
    }, servers);
    await page.evaluate(initializeHydrationOwnershipProbe, { scenario,
      htmlByOwner: Object.fromEntries(Object.entries(servers).map(([key, value]) => [key, value.body])),
      serverCallerUIDs: Object.fromEntries(Object.entries(servers).map(([key, value]) => [key, value.state.callerUID])) });
    await snapshot('parsed');
    await page.evaluate(prehydrate => {
      const editor = window.hydrationOwnershipProbe.roots.B!.parsed.editor;
      if (!editor) {
        throw Error('Actual parsed target editor missing');
      }
      if (prehydrate.dirty) editor.value = prehydrate.value!;
      editor.focus();
      if (prehydrate.dirty) editor.setSelectionRange(...prehydrate.selection!);
    }, scenario.prehydrate);
    await snapshot('beforeHydration');
    await page.addScriptTag({
      type: 'module',
      url: '/select-components-hydration-ownership.client.ts'
    });
    await page.waitForFunction(() => window.hydrationOwnershipNative?.ready === true);
    for (const key of scenario.environment.hydrationOrder) {
      record(
        key + '-hydrate-return',
        await page.evaluate(key => window.hydrationOwnershipNative.hydrate(key), key)
      );
      await page.waitForFunction(
        key => window.hydrationOwnershipProbe.roots[key]!.raw.hydrationCommitted === true,
        key
      );
      record(
        key + '-first-owner-commit',
        await page.evaluate(key => window.hydrationOwnershipProbe.roots[key]!.committed!, key)
      );
      await settled(key + '-settled');
    }
    for (const [index, action] of scenario.actions.entries()) {
      if (action.type === 'controlled-query' || action.type === 'intrinsic-tag-replacement') {
        if (action.type === 'intrinsic-tag-replacement') {
          assert.equal(
            (await page.evaluate(readHydrationOwnership)).roots.B!.focus.editorIsScopeActive,
            false
          );
        }
        await page.evaluate(action => window.hydrationOwnershipNative.update('B', action), action);
        await snapshot('action-' + index + '-immediate', action);
      }
      else if (action.type === 'real-keyboard-replace') {
        const handle = await page.evaluateHandle(() => window.hydrationOwnershipProbe.roots.B!.raw.current!.readRefs().editor);
        // Introduces the text through the retained editor and releases the link to it.
        const replaceThroughEditor = async () => {
          try {
            const editor = handle.asElement();
            assert(editor);
            await editor.focus();
            await editor.press('ControlOrMeta+A');
            await page.keyboard.insertText(action.text);
          }
          finally { await handle.dispose(); }
        };

        await replaceThroughEditor();
      }
      else if (action.type === 'outside-focus') {
        const handle = await page.evaluateHandle(() => window.hydrationOwnershipProbe.roots.B!.raw.current!.readRefs().outside);
        // Presses the external button and releases it DOM handle.
        async function clickOutsideControl() {
          try {
            const button = handle.asElement();
            assert(button);
            await button.click();
          } finally {
            await handle.dispose();
          }
        }

        await clickOutsideControl();
      }
      else if (action.type === 'target-dispose') {
        await snapshot('target-before-dispose');
        await page.evaluate(() => window.hydrationOwnershipNative.dispose('B'));
        await snapshot('target-dispose-immediate');
      }
      else {
        throw Error('Unknown frozen ownership action');
      }
      completedActions++;
      await page.mouse.move(0, 0);
      await settled('action-' + index + '-settled', action);
      if (action.type === 'target-dispose') {
        await page.waitForTimeout(action.lateMilliseconds);
        await snapshot('target-late');
      }
    }
    if (scenario.environment.owners.includes('A')) {
      await snapshot('peer-before-dispose');
      await page.evaluate(() => window.hydrationOwnershipNative.dispose('A'));
      peerCleanups++;
      await settled('peer-disposed');
      await page.waitForTimeout(1000);
      await snapshot('peer-late');
    }
  }
  catch (error) {
    const value = error as Error;
    fatal = { name: value.name, message: value.message, stack: value.stack };
    await observeFailedAction();
  } finally {
    await disposeLiveOwners();
  }
  return {
    id: scenario.id,
    scenario,
    servers,
    trace,
    failures,
    fatal,
    completedActions,
    peerCleanups,
    diagnostics,
    pageErrors,
    network
  };
}
