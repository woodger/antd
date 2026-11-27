import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { componentThemeVariables } from './theme-component-style.engine';
import { createDesignTokenState, defaultThemeConfig, mergeThemeConfig } from './theme-config.engine';
import {
  resolveThemeReference,
  type ThemeReferenceConfig
} from './theme-reference-config.test.helpers';

interface ReferenceCase {
  name: string;
  config: ThemeReferenceConfig;
  variables: Record<'Avatar' | 'Badge', Record<string, string>>;
}
const reference: {
  reference: { version: string; revision: string; archiveSha256: string; source: string; };
  cases: ReferenceCase[];
} = JSON.parse(readFileSync(
  new URL('../../tools/fixtures/ant-design-avatar-badge-tokens-reference.json', import.meta.url), 'utf8'
));

describe('Ant Design 6.6.8 official UMD Avatar/Badge CSS-token conformance', () => {
  it('uses scoped declarations from the pinned official artifact', () => {
    expect(reference.reference).toMatchObject({
      version: '6.6.8', revision: '984592267de88fbf9cdaecc96a56629e721c709d',
      archiveSha256: '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa',
      source: 'package/dist/antd.min.js'
    });
    expect(reference.cases).toHaveLength(13);
  });

  for (const sample of reference.cases) {
    it(`reproduces every Avatar/Badge declaration for ${sample.name}`, () => {
      const state = createDesignTokenState(mergeThemeConfig(resolveThemeReference(sample.config),
        defaultThemeConfig, 'reference'));

      for (const component of ['Avatar', 'Badge'] as const) {
        const variables = componentThemeVariables(component, state.token, state.prefix);
        const trimmed = Object.fromEntries(Object.entries(variables)
          .map(([key, value]) => [key, value.trim()]));

        expect(trimmed, component).toStrictEqual(sample.variables[component]);
        expect(Object.keys(variables), component).toStrictEqual(Object.keys(sample.variables[component]));
      }
    });
  }
});
