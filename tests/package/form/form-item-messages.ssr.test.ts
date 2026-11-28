import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-form-item-messages-observation.json';
import FormItemMessagesFixtures from '../../browser/fixtures/FormItemMessagesFixtures.svelte';

describe('FormItem connected messages in the package', () => {
  it('pins the upstream captures of visibility, keyed replacement, and held spacing', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version, revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256
    });
    const profile = reference.captures.find(({ profile }) => profile.id === 'extra-and-prefix');
    const appeared = profile?.observations.find(({ id }) => id === 'appear')?.trace.at(-1);
    const cleared = profile?.observations.find(({ id }) => id === 'clear')?.trace;

    expect(appeared).toMatchObject({ minHeight: '55px', offset: '-31px', offsetAfterRow: true });
    expect(cleared).toEqual(expect.arrayContaining([
      expect.objectContaining({
        offset: '-31px', holderClass: expect.arrayContaining(['probe-form-show-help-leave-active'])
      })
    ]));
    expect(cleared?.at(-1)).toMatchObject({ holderCount: 0, offset: null, gapAfterRow: 31 });
  });

  it('links server-rendered messages and extra without browser measurements or timers', () => {
    vi.useFakeTimers();
    try {
      const { body } = render(FormItemMessagesFixtures, {
        props: { initialProfile: 'extra-and-prefix', initialMessages: true }
      });
      const html = body.replace(/<!--[\s\S]*?-->/g, '');
      const description = html.match(/<input[^>]*\saria-describedby="([^"]+)"/)?.[1];
      const rows = html.matchAll(
        /<div[^>]*class="probe-form-item-explain-(error|warning)"[^>]*>([^<]*)<\/div>/g
      );

      expect(description).toBeDefined();
      expect(body).toContain(`id="${description?.split(' ')[0]}"`);
      expect(body).toContain(`id="${description?.split(' ')[1]}"`);
      expect(body).toMatch(/class="[^"]*probe-form-item-additional/);
      expect(body).toMatch(/class="[^"]*probe-form-item-explain-connected/);
      expect(body).toMatch(/role="alert"/);
      expect(Array.from(rows, (row) => [row[1], row[2]])).toEqual([
        ['error', 'Alpha'], ['error', 'Beta'], ['warning', 'Warning']
      ]);
      expect(body).not.toMatch(/class="[^"]*probe-form-item-margin-offset/);
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
});
