import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { samples, counts, storage, expandAction } from './cases.mjs';
import { createMaskSourceApp } from './source-case.mjs';
import { readWeekSource } from '../date-picker-week-source-proposal-v1/reader.mjs';
import { sourceSharedScript } from '../homepage-five-source-review-v1/shared.mjs';

export const base = '.upstream/artifacts/date-picker-mask-source-proposal-v1/';
export const sourceScripts = [
  '.upstream/artifacts/react-18.3.1/umd/react.production.min.js',
  '.upstream/artifacts/react-dom-18.3.1/umd/react-dom.production.min.js',
  'node_modules/dayjs/dayjs.min.js', 'node_modules/dayjs/locale/en-gb.js',
  '.upstream/artifacts/antd-6.6.8/dist/antd.js'
];
export const environment = { browserExecutable: '/usr/lib64/chromium-browser/chromium-browser',
  chromium: '157.0.8103.78', viewport: { width: 1440, height: 1000 },
  locale: 'en-US', timezone: 'UTC', fixedDate: '2024-06-10T08:23:45.678Z',
  clock: 'CSR Date-only fixed time, real timers/RAF; SSR actual VM wall clock.',
  clipboard: 'Excluded; no confirmed real roundtrip, permissions unchanged.' };
const scripts = ['cases', 'source-case', 'capture', 'server', 'capture-ssr', 'protocol']
  .map(name => base + name + '.mjs');
const dependencies = [base + 'plan.md',
  '.upstream/artifacts/date-picker-week-source-proposal-v1/reader.mjs',
  '.upstream/artifacts/homepage-five-source-review-v1/shared.mjs',
  '.upstream/artifacts/date-picker-presets-source-v2/json-stream.mjs',
  'tests/browser/select-surface-producers.mjs', ...sourceScripts,
  '.upstream/artifacts/react-dom-18.3.1/umd/react-dom-server-legacy.browser.production.min.js',
  environment.browserExecutable, process.execPath,
  'node_modules/@playwright/test/package.json', 'node_modules/playwright-core/package.json',
  'node_modules/dayjs/package.json',
  '.upstream/artifacts/date-picker-next-slice-proposal-v1/proposal.md',
  '.upstream/artifacts/date-picker-next-slice-proposal-v1/next-source-observation.md',
  '.upstream/ant-design/components/date-picker/index.en-US.md',
  '.upstream/ant-design/components/date-picker/generatePicker/interface.ts',
  '.upstream/ant-design/components/date-picker/generatePicker/generateSinglePicker.tsx',
  '.upstream/ant-design/components/date-picker/generatePicker/generateRangePicker.tsx',
  '.upstream/ant-design/components/date-picker/demo/mask.tsx',
  '.upstream/ant-design/components/date-picker/demo/mask.md',
  '.upstream/ant-design/components/time-picker/index.tsx',
  '.upstream/ant-design/components/time-picker/index.en-US.md',
  '.upstream/artifacts/date-picker-render-hooks-source-v2/upstream/es--interface.d.ts',
  '.upstream/artifacts/date-picker-render-hooks-source-v2/upstream/picker-1.12.2.tgz'];
const oldWeek = '.upstream/artifacts/date-picker-week-source-proposal-v1/';
const oldPrefix = '.upstream/artifacts/date-picker-date-week-prefix-source-proposal-v1/';
const sourceCode = ['cases.mjs', 'source-case.mjs', 'capture.mjs', 'server.mjs',
  'capture-ssr.mjs', 'protocol.mjs', 'plan.md'];
const manifests = ['csr-source-first.json', 'csr-source-repeat.json',
  'ssr-source-first.json', 'ssr-source-repeat.json'];
const preserved = [...sourceCode.map(name => oldWeek + name),
  oldWeek + 'protocol-freeze.json', ...manifests.map(name => oldWeek + name),
  ...['release.json', 'semantic-review.json', 'all-point-stability.json']
    .map(name => '.upstream/artifacts/date-picker-week-source-review-v1/' + name),
  ...sourceCode.map(name => oldPrefix + name), oldPrefix + 'protocol-proposal.json',
  oldPrefix + 'protocol-freeze.json', oldPrefix + 'source-process-release.json',
  ...manifests.map(name => oldPrefix + name),
  ...['csr-first-audit', 'csr-repeat-audit', 'ssr-first-audit', 'ssr-repeat-audit',
    'semantic-review', 'selected-facts-variances', 'producer-variances',
    'action-phase-stability', 'all-point-stability']
    .map(name => '.upstream/artifacts/date-picker-date-week-prefix-source-review-v1/' + name + '.json')];
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pin = file => ({ bytes: fs.statSync(file).size, sha256: digest(file) });
const validSHA = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const validLease = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(value)
  && !/placeholder|replace|example|pending/i.test(value);
const commands = () => samples.flatMap(sample => sample.actions.flatMap(expandAction));
const keyFrequency = () => Object.fromEntries([...new Set(commands().filter(row => row.type === 'key-press')
  .map(row => row.key))].sort().map(key => [key, commands().filter(row => row.type === 'key-press' && row.key === key).length]));
function verifyContents(protocol) {
  assert.equal(protocol.source.node, process.version);
  assert.deepEqual(protocol.source.environment, environment);
  assert.deepEqual(protocol.samples, samples); assert.deepEqual(protocol.counts, counts);
  assert.deepEqual(protocol.storage, storage); assert.deepEqual(protocol.physicalKeyPlan, keyFrequency());
  assert.deepEqual(Object.keys(protocol.inputPins), [...scripts, ...dependencies]);
  assert.deepEqual(Object.keys(protocol.preservedPriorSource), preserved);
  for (const [file, expected] of Object.entries(protocol.inputPins)) assert.deepEqual(pin(file), expected, file);
  for (const [file, expected] of Object.entries(protocol.preservedPriorSource)) assert.deepEqual(pin(file), expected, file);
}
export function verifyPins(reviewedFreezeSHA256, rootLease) {
  assert(validSHA(reviewedFreezeSHA256) && validLease(rootLease), 'Exact Root-reviewed freeze SHA and separate exclusive lease required');
  const file = base + 'protocol-freeze.json';
  const execution = JSON.parse(fs.readFileSync(base + 'execution-freeze.json'));
  assert.equal(digest(file), reviewedFreezeSHA256); assert.equal(execution.sha256, reviewedFreezeSHA256);
  assert.equal(execution.rootLease, rootLease);
  const protocol = JSON.parse(fs.readFileSync(file));
  assert.equal(protocol.status, 'Root-reviewed-frozen-before-numeric-mask-Source-execution');
  assert.equal(protocol.rootLease, rootLease);
  assert.equal(digest(base + 'protocol-proposal.json'), protocol.reviewedProposalSHA256);
  verifyContents(protocol); return { protocol, sha256: reviewedFreezeSHA256 };
}
function preflight() {
  assert.deepEqual(samples.map(sample => sample.actions.length), [15, 15, 15, 15, 15]);
  assert.equal(samples.length, 5); assert(samples.every(sample => sample.initialFormatProfile === 'string'));
  assert.equal(counts.authoredMacroActions, 75); assert.equal(counts.explicitSubsteps, 287);
  assert.equal(counts.keyboardPressCalls, 167); assert.equal(counts.inputMouseDowns, 35);
  assert.equal(counts.inputMouseUps, 35); assert.equal(counts.inputMouseMoves, 35);
  assert.equal(counts.authoredDOMControlClicks, 15);
  assert.equal(counts.retainedFullPhasePoints, 1111); assert.equal(counts.distinctRetainedFullReads, 1036);
  assert.equal(counts.macroAfterCallReferencesToChildSnapshot, 75);
  assert.equal(counts.initialClosedSSRSerializations, 30);
  assert.equal(storage.totalPartsPerCSR, 779); assert.equal(storage.originalPartsAcrossFourRuns, 1618);
  for (const file of scripts) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.ifError(result.error); assert.equal(result.status, 0, file + '\n' + result.stderr);
  }
  new vm.Script('(' + createMaskSourceApp.toString() + ')');
  new vm.Script('(' + readWeekSource.toString() + ')'); new vm.Script(sourceSharedScript());
  return { authoredMatrixAndSyntax: 'passed', SourceExecution: false, NativeDataRead: false,
    browserRuns: 0, SSRRuns: 0, builds: 0, permissionsChanged: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, reviewed, rootLease] = process.argv.slice(2);
  const proposalFile = base + 'protocol-proposal.json';
  if (command === 'prepare') {
    for (const file of [proposalFile, base + 'protocol-freeze.json', base + 'execution-freeze.json'])
      assert(!fs.existsSync(file), 'Fresh preparation only: ' + file);
    const validation = preflight();
    const protocol = {
      status: 'prepared-awaiting-Root-review-week-commit-freeze-and-exclusive-lease-no-execution',
      subject: 'public-date-datetime-range-Time-TimeRange-scalar-object-format-and-seven-numeric-mask-input',
      source: { version: '6.6.8', revision: '984592267de88fbf9cdaecc96a56629e721c709d',
        react: '18.3.1', rcPicker: '1.12.2', node: process.version, environment, scripts: sourceScripts },
      samples, counts, storage, physicalKeyPlan: keyFrequency(),
      caller: {
        publicOnly: 'Five ordinary React public owners, stable authored Date/tuple/panel/format/style/theme/id/clock/function refs. String, object without type, mask are actual ordinary format props. No private picker calls, Native code/outcomes or pre-authored Source results.',
        value: 'Actual onChange payload objects become controlled model unchanged. A distinct value-only public owner control restores the same original authored Date/tuple before pristine mask Enter. Format controls change only format; value reset is never described as a format-only update.',
        precision: 'Pristine string/object hide HMS/ms or date/seconds/ms. Datetime field mask covers all seven numeric tokens. Source fields/locale/epoch/ISO/raw IDs and actual candidate/calendar/change/model sharing remain observations; no normalization to midnight or replacement parsed value.',
        validation: 'Stable disabledDate false for every real invocation; time/datetime disabledTime returns stable authored empty object. Complete real arguments/receiver/Date paths/from/return graphs recorded. No user producer is manually invoked. Default millisecondStep100 remains; no new plugin.',
        input: 'Actual input center click for pristine; mask edit/incomplete use physical text-start coordinates from box/CSS+2px with actual hit check. No selection injection, setSelectionRange, force, fake events or permissions. Every mouse down/up and explicit keypress has independent full phases.',
        clipboard: 'Not in the matrix: unconfirmed real roundtrip, no permission grants or fabricated paste. Passive paste/composition observation does not imply tested support.'
      },
      observation: {
        full: 'Unchanged physical reader retains full scoped DOM/HTML/ordered attrs/CSS/rects/rows/columns, props/model/callback raw and encoded graphs/arity/receiver/Date fields/locale/aliases, field value/defaultValue/caret/focus/refs/connectivity and actual resource/network/errors.',
        hierarchy: 'Every macro references each original child UI part. Every child stores full before/immediate-afterCall/settled. Macro.afterCall copies the actual last child immediate snapshot with afterCallSource reference; it is not a second observation or a settled replacement. 1111 retained phase positions include75 such repeated references;1036 distinct retained full reads. Stability polls outside retained counts are not compared as if retained.',
        producers: 'All complete rows retain monotonic indices, contiguous cursor deltas and full encoded/raw return graphs. Child/lifecycle boundaries bind local windows. Macro tail explicitly marks aggregate window covering earlier child parts; its before/afterCall markers may precede its delta.cursor, without duplicating any producer row. All source counts/order/timing are actual, never Native parity expectations.',
        events: 'Removable document capture observer records actual pointer/mousedown/mouseup/keyDown/keyUp/beforeinput/input/change/selectionchange/focus/paste/composition events, trust/modifiers/text/coordinates, input value/caret at capture and producer/callback cursors. Event capture is before target handlers; full before/afterCall/settled reads remain separate.',
        settling: 'Known complete scoped stable4 actual doubleRAF+25ms polls, bound70; mouse-down is observed while held. Real timers/RAF; no global patches.',
        lifecycle: 'Each explicit Escape gets+1000 regardless of actual outcome. Whole public unmount, frame drain, cleanup, quiet+1000 late, final complete producer tail, then event-observer disposal.',
        resources: 'CSR private timers/frames/observers unmeasured. ResourceTiming/network/errors/console actual. SSR measured forbidden operations as in the unchanged original VM mechanism.'
      },
      SSR: { owners: 5, initialFormatProfiles: ['string', 'object', 'mask'], locale: 'US only',
        methods: ['renderToString', 'renderToStaticMarkup'], serializationsPerRun: 30,
        baseline: '15 separately declared initial closed public props profiles, fresh original DOM-free VM per serializer/profile. Only authoring override initialFormatProfile; no open popup or simulated focus/selection. Actual VM wall clock, not CSR fixed Date.',
        retained: 'Whole HTML/hash/state/model/format/callbacks/producers/refs/resources/fatal. No initial-empty-ledger assumption.' },
      inputPins: Object.fromEntries([...scripts, ...dependencies].map(file => [file, pin(file)])),
      preservedPriorSource: Object.fromEntries(preserved.map(file => [file, pin(file)])),
      outputMap: Object.fromEntries(['csr', 'ssr'].flatMap(kind => ['first', 'repeat'].map(variant => [
        kind + '-' + variant, { manifest: base + kind + '-source-' + variant + '.json',
          gzip: base + kind + '-source-' + variant + '.json.gz',
          parts: base + kind + '-source-' + variant + '.json.parts/' }
      ]))),
      implementationPlan: base + 'plan.md', validation,
      plannedCommands: ['node ' + base + 'protocol.mjs freeze <ROOT_REVIEWED_PROPOSAL_SHA> <ROOT_EXCLUSIVE_LEASE>',
        ...['csr', 'ssr'].flatMap(kind => ['first', 'repeat'].map(variant => 'node ' + base
          + (kind === 'csr' ? 'capture' : 'capture-ssr') + '.mjs ' + variant
          + ' <ROOT_REVIEWED_FROZEN_SHA> <ROOT_EXCLUSIVE_LEASE>'))],
      lease: 'Prepare grants no execution. Root finishes current week stage/commit, reviews exact proposal, freezes and separately grants exclusive lease. Actual first/repeat CSR then first/repeat SSR strictly serial, exact frozen SHA/lease required. Each actual terminal0/complete/unchanged pins before next; browsers awaited closed. All failures/raw parts/frozen inputs retained without automatic retry/amend. Root records actual release after four terminals.',
      exclusions: ['multiple', 'generatePicker', 'custom editors', 'paste', 'clipboard permission changes',
        'IME execution', 'preserveInvalidOnBlur=true matrix', 'all locales/unsupported-token combinations',
        'new native focus/calendar/Today boundaries', 'whole DatePicker family parity claim']
    };
    verifyContents(protocol);
    fs.writeFileSync(proposalFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ file: proposalFile, sha256: digest(proposalFile), counts, storage,
      inputs: Object.keys(protocol.inputPins).length, priorSourcePins: preserved.length,
      validation, freeze: 'not-run', browser: 'not-run', SSR: 'not-run' }));
  } else if (command === 'freeze') {
    assert(validSHA(reviewed) && validLease(rootLease)); assert.equal(digest(proposalFile), reviewed);
    for (const file of [base + 'protocol-freeze.json', base + 'execution-freeze.json'])
      assert(!fs.existsSync(file), 'Fresh Root freeze only: ' + file);
    const protocol = JSON.parse(fs.readFileSync(proposalFile)); verifyContents(protocol);
    protocol.status = 'Root-reviewed-frozen-before-numeric-mask-Source-execution';
    protocol.reviewedProposalSHA256 = reviewed; protocol.rootLease = rootLease;
    const file = base + 'protocol-freeze.json';
    fs.writeFileSync(file, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
    const execution = { file, sha256: digest(file), proposalSHA256: reviewed, rootLease,
      frozenBeforeSourceExecution: true };
    fs.writeFileSync(base + 'execution-freeze.json', JSON.stringify(execution, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify(execution));
  } else throw Error('Use prepare or exact Root-reviewed freeze; neither executes Source.');
}
