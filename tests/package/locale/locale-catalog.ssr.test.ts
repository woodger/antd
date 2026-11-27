import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { enUS, ruRU, type AntDesignLocale } from '@woodger/antd';
import registry from '../../porting-registry';
import { renderLocaleFixture } from '../../browser/fixtures/locale-catalog.server';
import catalog from '../fixtures/ant-design-locales-reference.json';

describe('Published Ant Design locale catalog', () => {
  it('records every dictionary from the pinned UMD', () => {
    expect(catalog).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd-with-locales.min.js',
      repeated: 2
    });
    expect(Object.keys(catalog.locales)).toHaveLength(73);
  });

  for (const [code, digest] of Object.entries(catalog.locales)) {
    it(`exports the pinned ${code} dictionary through the locale subpath`, async () => {
      const { default: locale }: { default: AntDesignLocale; } =
        await import(`@woodger/antd/locale/${code}`);
      const fingerprint = createHash('sha256').update(JSON.stringify(locale)).digest('hex');

      expect(fingerprint).toBe(digest);
      expect(locale.Calendar).toBe(locale.DatePicker);
      expect(locale.DatePicker?.lang).not.toHaveProperty('dayFormat');
    });
  }

  it('preserves the localized SSR field labels and initial formats', () => {
    const { body } = renderLocaleFixture('de_DE');

    expect(body).toContain('placeholder="Datum auswählen"');
    expect(body).toContain('value="19.06.2024"');
    expect(body).toContain('title="Vorherige Seite"');
  });

  it('preserves the Native English and Russian provider defaults', () => {
    expect(enUS.datePicker.lang.placeholder).toBe('Select date');
    expect(ruRU.datePicker.lang.placeholder).toBe('Выберите дату');
    expect(ruRU.okText).toBe('Подтвердить');
  });
});
