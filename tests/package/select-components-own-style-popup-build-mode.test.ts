import { expect, it } from 'vitest';
import { verifyOwnStylePopupClassNames } from '../browser/select-components-own-style-init-assertions';

// Exact recorded popup classes from both frozen ordinary owners in the own-style
// Source corpus and Native second capture. No layout fixture or generated CSS.
const dev = 'css-dev-only-do-not-override-1y106cm', prod = 'css-1y106cm';
const source = ['ant-select-dropdown', 'select-icons', 'ant-select-css-var', dev, 'ant-select-dropdown-placement-bottomLeft'];
const native = {
  select: ['popup', 'ant-select-dropdown', 'ant-select-css-var', 'ant-select-source-popup', 'ant-select-dropdown-placement-bottomLeft', 'select-icons', dev],
  autocomplete: ['popup', 'ant-select-dropdown', 'ant-select-css-var', 'select-icons', dev, 'ant-select-source-popup', 'ant-select-dropdown-placement-bottomLeft']
};
for (const control of ['select', 'autocomplete'] as const) {
  const development = native[control], production = development.map(name => name === dev ? prod : name);
  it(`requires the explicitly selected Native build class for ${control}`, () => {
    expect(() => verifyOwnStylePopupClassNames(development, source, control, 'default DEV')).not.toThrow();
    expect(() => verifyOwnStylePopupClassNames(
      development,
      source,
      control,
      'explicit DEV',
      'development'
    )).not.toThrow();
    expect(() => verifyOwnStylePopupClassNames(
      production,
      source,
      control,
      'explicit PROD',
      'production'
    )).not.toThrow();
    expect(() => verifyOwnStylePopupClassNames(production, source, control, 'PROD in DEV')).toThrow();
    expect(() => verifyOwnStylePopupClassNames(
      development,
      source,
      control,
      'DEV in PROD',
      'production'
    )).toThrow();
  });
  it(`rejects unknown hashes, duplicate/missing classes and changed order for ${control}`, () => {
    const swapped = [...production];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const invalid = [production.map(name => name === prod ? 'css-otherhash' : name),
      production.map(name => name === prod ? 'css-dev-only-do-not-override-otherhash' : name),
      production.map(name => name === prod ? 'unknown-1y106cm' : name),
      production.filter(name => name !== prod), [...production, prod], [...production, dev], swapped];
    for (const classes of invalid)
      expect(() => verifyOwnStylePopupClassNames(
        classes,
        source,
        control,
        'invalid PROD',
        'production'
      )).toThrow();
    // @ts-expect-error Unmeasured build modes must also fail for JavaScript callers.
    expect(() => verifyOwnStylePopupClassNames(production, source, control, 'unmeasured', 'staging')).toThrow();
  });
  it(`keeps the independent Source DEV classes and order strict for ${control}`, () => {
    const before = [...source], changed = [...source];
    [changed[0], changed[1]] = [changed[1], changed[0]];

    expect(() => verifyOwnStylePopupClassNames(
      production,
      source.map(name => name === dev ? prod : name),
      control,
      'Source PROD',
      'production'
    )).toThrow();
    expect(() => verifyOwnStylePopupClassNames(
      production,
      changed,
      control,
      'Source order',
      'production'
    )).toThrow();
    expect(source).toEqual(before);
  });
}
