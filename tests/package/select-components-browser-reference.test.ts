import { expect, it } from 'vitest';
import { readSelectComponentsBrowserReference } from '../browser/select-components-browser-reference';
import { readSelectComponentsChromium157Source, selectComponentsSourceCaseSHA256 } from '../browser/select-components-chromium157-reference';
import { selectComponentsModesSamples, readSelectComponentsModesCase, type ModesCase } from '../browser/select-components-modes-reference';
import { selectComponentsACStyleSamples, readSelectComponentsACStyleCase, type ACStyleCase } from '../browser/select-components-ac-style-reference';

for (const sample of selectComponentsModesSamples) it(`selects exact browser Source without mutating ${sample.id}`, () => {
  const canonical = readSelectComponentsModesCase(sample.id), before = selectComponentsSourceCaseSHA256(canonical);

  expect(readSelectComponentsBrowserReference('modes', sample.id).source).toBe(canonical);
  expect(readSelectComponentsBrowserReference('modes', sample.id, '156.0.8078.79').source).toBe(canonical);
  const selected = readSelectComponentsBrowserReference('modes', sample.id, '157.0.8103.78');
  if (sample.id === 'select-components-modes-multiple-element-input') {
    const complete = readSelectComponentsChromium157Source<ModesCase>('modes').cases.find(value => value.id === sample.id);
    expect(selected.source).toBe(complete);
    expect(selected.referenceVariant.oracleChromiumVersion).toBe('157.0.8103.78');
    expect(selected.source.initial.icons.current.editor!.metrics.clientWidth).not.toBe(canonical.initial.icons.current.editor!.metrics.clientWidth);
  }
  else {
    expect(selected.source).toBe(canonical);
    expect(selected.referenceVariant.completeCaseEquivalentUnder157).toBe(true);
  }
  expect(selectComponentsSourceCaseSHA256(canonical)).toBe(before);
});
for (const sample of selectComponentsACStyleSamples) it(`selects complete measured browser Source ${sample.id}`, () => {
  const canonical = readSelectComponentsACStyleCase(sample.id), before = selectComponentsSourceCaseSHA256(canonical);

  expect(readSelectComponentsBrowserReference('ac-style', sample.id).source).toBe(canonical);
  expect(readSelectComponentsBrowserReference('ac-style', sample.id, '156.0.8078.79').source).toBe(canonical);
  const selected = readSelectComponentsBrowserReference('ac-style', sample.id, '157.0.8103.78');
  if (sample.id === 'select-components-ac-style-input') {
    const complete = readSelectComponentsChromium157Source<ACStyleCase>('ac-style').cases.find(value => value.id === sample.id);
    expect(selected.source).toBe(complete);
    expect(selected.referenceVariant.measured157Input).toBe(true);
  }
  else {
    expect(selected.source).toBe(canonical);
    expect(selected.referenceVariant.oracleChromiumVersion).toBe('156.0.8078.79');
  }
  expect(selectComponentsSourceCaseSHA256(canonical)).toBe(before);
});
it('rejects unmeasured Chromium versions instead of silently falling back', () => {
  for (const version of ['', '157', '156.0.8078.80', '157.0.8103.79', '158.0.0.0']) {
    expect(() => readSelectComponentsBrowserReference(
      'modes',
      selectComponentsModesSamples[0].id,
      version
    )).toThrow('Unmeasured Chromium Source oracle');
  }
});
