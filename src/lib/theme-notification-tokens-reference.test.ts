import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { componentThemeVariables } from './theme-component-style.engine';
import {
  createDesignTokenState,
  defaultThemeConfig,
  mergeThemeConfig
} from './theme-config.engine';
import {
  resolveThemeTokenReference,
  type ThemeTokenReferenceConfig
} from './theme-reference-config.test.helpers';
import type { ThemeConfig } from './types';

interface NotificationTokenCase {
  name: string;
  config: ThemeTokenReferenceConfig;
  variables: Record<string, string>;
}
const reference: {
  reference: { version: string; revision: string; archiveSha256: string; source: string; };
  cases: NotificationTokenCase[];
} = JSON.parse(readFileSync(
  new URL('../../tools/fixtures/ant-design-notification-tokens-reference.json', import.meta.url),
  'utf8'
));

describe('Ant Design 6.6.8 official UMD Notification CSS-token conformance', () => {
  it('keeps explicitly supplied status backgrounds when they equal global aliases', () => {
    const config: ThemeConfig = {
      components: { Notification: { colorSuccessBg: '#f6ffed', colorWarningBg: '#fffbe6' } }
    };
    const state = createDesignTokenState(mergeThemeConfig(config, defaultThemeConfig, 'explicit'));
    const variables = componentThemeVariables('Notification', state.token, 'ant', [
      'colorSuccessBg', 'colorWarningBg'
    ]);

    expect(variables['--ant-notification-color-success-bg']).toBe('#f6ffed');
    expect(variables['--ant-notification-color-warning-bg']).toBe('#fffbe6');
  });

  it('pins declarations from the official archive', () => {
    expect(reference.reference).toMatchObject({
      version: '6.6.8',
      revision: '984592267de88fbf9cdaecc96a56629e721c709d',
      archiveSha256: '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa',
      source: 'package/dist/antd.min.js'
    });
  });

  for (const sample of reference.cases) {
    it(`matches every source Notification declaration for ${sample.name}`, () => {
      const state = createDesignTokenState(mergeThemeConfig(
        resolveThemeTokenReference(sample.config),
        defaultThemeConfig,
        'reference'
      ));
      const variables = componentThemeVariables('Notification', state.token, state.prefix);

      expect(Object.fromEntries(Object.entries(variables).map(([key, value]) => [
        key,
        value.trim()
      ]))).toStrictEqual(sample.variables);
      expect(Object.keys(variables)).toStrictEqual(Object.keys(sample.variables));
    });
  }
});
