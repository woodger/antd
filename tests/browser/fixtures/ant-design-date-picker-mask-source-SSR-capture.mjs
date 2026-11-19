import fs from 'node:fs';
import assert from 'node:assert/strict';
import { writeJSONPart } from '../date-picker-presets-source-v2/json-stream.mjs';
import { samples, counts } from './cases.mjs';
import { renderMaskSource } from './server.mjs';
import { base, verifyPins } from './protocol.mjs';

const [variant, reviewedFreezeSHA256, rootLease] = process.argv.slice(2);
assert(['first', 'repeat'].includes(variant));
const frozen = verifyPins(reviewedFreezeSHA256, rootLease);
const output = base + 'ssr-source-' + variant + '.json';
for (const file of [output, output + '.gz', output + '.parts']) assert(!fs.existsSync(file), file);
fs.mkdirSync(output + '.parts');
const cases = [], diagnostics = [];
let serializations = 0, failures = 0;
for (const sample of samples) {
  const result = renderMaskSource(sample);
  diagnostics.push(...result.diagnostics.map(row => ({ id: sample.id, ...row })));
  for (const [key, actual] of Object.entries(result.serializations)) {
    serializations++;
    if (actual.fatal || Object.values(actual.resources).some(value => value !== 0)) failures++;
    cases.push({ id: sample.id, formatProfile: actual.formatProfile, method: actual.method,
      rawJSONPart: await writeJSONPart(
      output + '.parts/' + sample.id + '-' + key + '.json', actual
    ) });
  }
}
const terminal = verifyPins(reviewedFreezeSHA256, rootLease);
assert.equal(terminal.sha256, frozen.sha256);
const failed = failures > 0 || serializations !== counts.initialClosedSSRSerializations
  || diagnostics.some(row => ['warn', 'error'].includes(row.level));
const receipt = await writeJSONPart(output, {
  status: failed ? 'failed' : 'complete', variant,
  sourceProtocol: { file: base + 'protocol-freeze.json', sha256: frozen.sha256,
    reviewedProposalSHA256: frozen.protocol.reviewedProposalSHA256, rootLease },
  scope: 'Initial closed five public date/datetime/range/time owners; separate string/object-without-type/mask format profiles, US only. Fresh original DOM-free VM for each profile/method; no simulated popup or private calls.',
  counts: { owners: samples.length, serializations }, cases, diagnostics, failures,
  terminalInputVerification: { unchanged: true, sha256: terminal.sha256 }
});
console.log(JSON.stringify({ output: receipt, owners: samples.length, serializations,
  diagnostics: diagnostics.length, failures, failed }));
if (failed) process.exitCode = 1;
