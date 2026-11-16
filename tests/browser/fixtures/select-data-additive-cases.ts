import { selectDataSamples, selectDataDiagnosticSamples, type SelectDataSample } from './select-data-cases';

/** Отдельные public group-attribute inputs, исходные сорок сценариев неизменны. */
export const selectDataGroupAttributeSamples: readonly SelectDataSample[] = (['select', 'auto-complete'] as const)
  .map(family => ({ ...selectDataSamples.find(sample => sample.id === `${family}-empty-disabled-groups`)!,
    id: `${family}-group-attribute-probe`, scenario: 'group-attribute-probe' }));
export const selectDataFixtureSamples = [...selectDataSamples, ...selectDataDiagnosticSamples, ...selectDataGroupAttributeSamples];
