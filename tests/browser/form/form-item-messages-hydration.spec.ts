import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { test, expect } from '../test';

const profiles = [
  { label: 'Title', text: 'Text', description: 'Alpha Beta Warning More details',
    prefix: 'probe-form', kind: 'field' as const },
  { label: 'first', text: 'Alpha', description: 'Invalid',
    prefix: 'ant-form', kind: 'nested' as const },
  { label: /\bName$/, text: 'Ada', description: 'Enter a name Keep it concise',
    prefix: 'ant-form', kind: 'rich' as const }
];

for (const profile of profiles) {
  const rich = profile.kind === 'rich';
  const name = rich ? 'rich messages' : profile.kind === 'nested'
    ? 'messages from a noStyle child' : 'messages for the field';
  test(`FormItem hydrates ${name} with the existing editor and description`, async ({ page }) => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-item-messages-hydration-'));
    const server = await createServer({
      appType: 'custom', cacheDir,
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
    });

    try {
      const fixture = new URL('../fixtures/form-item-messages-hydration.server.ts', import.meta.url);
      const { renderFormItemMessages } = await server.ssrLoadModule(fileURLToPath(fixture));
      const { head, body } = renderFormItemMessages(profile.kind);
      await page.goto('/tree-select-surface-hydration.html');
      await page.evaluate(({ head, body }) => {
        const target = document.getElementById('root');
        if (!target) {
          throw new Error('The hydration host is missing');
        }

        document.head.insertAdjacentHTML('beforeend', head);
        target.innerHTML = body;
      }, { head, body });
      const input = page.getByRole('textbox', { name: profile.label, exact: true });
      const holderSelector = `.${profile.prefix}-item-explain-connected`;
      const holder = page.locator(rich ? `.rich-name-item ${holderSelector}` : holderSelector);
      const message = rich ? holder.locator('strong[data-message="rich-error"]') : undefined;
      const renderedMessage = await message?.elementHandle();
      await expect(input).toHaveAccessibleDescription(profile.description);
      await input.focus();
      await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(1, 3));

      await page.addScriptTag({ type: 'module', url: '/form-item-messages-hydration.client.ts' });
      await page.waitForFunction(() => window.formItemMessagesHydration !== undefined);

      await expect(input).toBeFocused();
      await expect(input).toHaveValue(profile.text);
      await expect(input).toHaveAccessibleDescription(profile.description);
      expect(await input.evaluate((element: HTMLInputElement) => ({
        sameEditor: element === window.formItemMessagesHydration?.input,
        selection: [element.selectionStart, element.selectionEnd]
      }))).toEqual({ sameEditor: true, selection: [1, 3] });
      expect(await holder.evaluate(element => element === window.formItemMessagesHydration?.holder))
        .toBe(true);
      if (message) {
        expect(await message.evaluate((element, previous) => element === previous, renderedMessage))
          .toBe(true);
      }
      const offset = `.${profile.prefix}-item-margin-offset`;
      await expect(page.locator(rich ? `.rich-name-item ${offset}` : offset)).toHaveCount(1);

      await page.evaluate(() => window.formItemMessagesHydration?.dispose());

      await expect(holder).toHaveCount(0);
    }
    finally {
      await server.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
}
