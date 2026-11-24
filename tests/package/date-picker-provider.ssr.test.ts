import registry from '@woodger/antd/porting/registry.json';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import {
  authoredClasses, projectPickerStyle, readPickerProviderBrowser, readPickerProviderServer
} from '../browser/date-picker-provider-reference';
import DatePickerProviderFixtures from '../browser/fixtures/DatePickerProviderFixtures.svelte';

const source = readPickerProviderServer();
const classPattern = new RegExp(authoredClasses);

/** Считывает открывающие теги и атрибуты из серверного HTML обоих пакетов. */
function readElements(body: string) {
  return Array.from(body.matchAll(/<(div|span|input|button)\s+([^>]+)>/g), ([, tag, raw]) => {
    const attributes = Object.fromEntries(Array.from(
      raw.matchAll(/([^\s=]+)="([^"]*)"/g), ([, name, value]) => [name, value]
    ));

    return { tag, attributes, classes: attributes.class?.split(/\s+/) ?? [] };
  });
}

/** Сравнивает разметку закрытого picker, исключая внутренние hash и ARIA framework. */
function project(body: string) {
  const elements = readElements(body);
  const root = elements.find(node => node.classes.includes('ant-picker'));
  if (!root) {
    throw Error('No SSR picker root');
  }

  const roles = elements.filter(node => node === root || node.tag === 'input'
    || node.classes.some(token => ['ant-picker-prefix', 'ant-picker-suffix'].includes(token)));

  return {
    roles: roles.map(node => ({
      classes: node.classes.filter(token => classPattern.test(token)).sort(),
      styles: projectPickerStyle(node.attributes.style ?? null),
      value: node.attributes.value
    })),
    markers: elements.map(node => node.attributes['data-marker']).filter(Boolean),
    clear: elements.filter(node => node.classes.includes('ant-picker-clear')).length,
    open: elements.some(node => node.classes.includes('ant-picker-dropdown'))
  };
}

describe('DatePicker provider public package SSR', () => {
  it('pins the browser and server captures to the registry and checks both repeats', () => {
    const browser = readPickerProviderBrowser();
    expect(browser).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      react: '18.3.1'
    });
    expect(browser.passes).toHaveLength(2);
    expect(browser.passes[0]).toHaveLength(28);
    expect(browser.passes[0]).toEqual(browser.passes[1]);
    expect(browser.passes[0].flatMap(sample => sample.frames)).toHaveLength(112);
    expect(browser.passes[0].flatMap(sample => sample.diagnostics)).toEqual([]);

    expect(source).toMatchObject({
      revision: registry.upstream.revision, archiveSha256: registry.upstream.archiveSha256
    });
    expect(source.passes).toHaveLength(2);
    expect(source.passes[0]).toEqual(source.passes[1]);
    expect(source.passes[0]).toMatchObject({
      version: registry.upstream.version, react: '18.3.1', diagnostics: []
    });
    expect(source.passes[0].packets).toHaveLength(18);
    expect(source.passes[0].packets.flatMap(packet => packet.events)).toEqual([]);
  });

  for (const { profile, mode, html } of source.passes[0].packets) {
    it(`renders ${profile.id} with ${mode} configuration without DOM or timers`, () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T12:00:00Z'));
      try {
        const { body } = render(DatePickerProviderFixtures, {
          props: { profile, initialMode: mode, openOnMount: false, verifyServer: true }
        });

        expect(project(body)).toEqual(project(html));
        expect(body).not.toContain('[object Object]');
        expect(vi.getTimerCount()).toBe(0);
      }
      finally {
        vi.useRealTimers();
      }
    });
  }
});
