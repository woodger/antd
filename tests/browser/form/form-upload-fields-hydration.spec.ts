import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { test, expect } from '../test';

test('Form hydrates existing Upload controls and registers their server-rendered elements', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-upload-fields-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixture = new URL('../fixtures/form-upload-fields-hydration.server.ts', import.meta.url);
    const { renderFormUploadFields } = await server.ssrLoadModule(fileURLToPath(fixture));
    const { head, body } = renderFormUploadFields();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      const host = document.getElementById('root');
      if (!host) {
        throw new Error('Missing upload hydration host');
      }

      document.head.insertAdjacentHTML('beforeend', head);
      host.innerHTML = body;
    }, { head, body });
    const inputs = page.locator('input[type="file"]');
    const labelled = page.locator('input[name="labelled-file"]');
    const caption = page.locator('label', { hasText: 'Accessible attachment' });
    const fieldId = await caption.getAttribute('for');
    if (!fieldId) {
      throw new Error('Missing server-rendered field id');
    }

    await expect(labelled).toHaveAttribute('id', fieldId);
    await expect(inputs).toHaveCount(4);

    await page.addScriptTag({ type: 'module', url: '/form-upload-fields-hydration.client.ts' });
    await page.waitForFunction(() => window.formUploadFieldsHydration !== undefined);

    expect(await inputs.evaluateAll((elements) => elements.every(
      (element, index) => element === window.formUploadFieldsHydration?.inputs[index]
    ))).toBe(true);
    await expect(labelled).toHaveAttribute('id', fieldId);
    await page.getByRole('button', { name: 'Inspect aria', exact: true }).click();
    const status = page.getByRole('status', { name: 'Upload snapshot' });
    await expect.poll(async () => JSON.parse(await status.innerText())).toMatchObject({
      rootTag: 'SPAN', sameNativeElements: true, labelMatches: true,
      describedBy: ['File instructions', 'Maximum size']
    });

    await page.evaluate(() => window.formUploadFieldsHydration?.dispose());

    await expect(inputs).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
