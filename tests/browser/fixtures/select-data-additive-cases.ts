import { selectDataSamples, selectDataDiagnosticSamples, type SelectDataSample } from './select-data-cases';

/** Separate public group-attribute inputs, the original forty scenarios are unchanged. */
export const selectDataGroupAttributeSamples: readonly SelectDataSample[] = (['select', 'auto-complete'] as const)
  .map(family => ({ ...selectDataSamples.find(sample => sample.id === `${family}-empty-disabled-groups`)!,
    id: `${family}-group-attribute-probe`, scenario: 'group-attribute-probe' }));
export const selectDataFixtureSamples = [...selectDataSamples, ...selectDataDiagnosticSamples, ...selectDataGroupAttributeSamples];
