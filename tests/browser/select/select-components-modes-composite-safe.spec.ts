import type { SelectRef } from '@woodger/antd';
import { test, expect } from '../test';
import { drainSelectSurface } from '../select-surface-driver';

interface Bridge {
  read(): { model: string[]; query: string; handleKeys: string[]; rootTag?: string; editorTag?: string; value?: string;
    focused: boolean; connected?: boolean; physicalStyle: string; width?: number; widthVar?: string };
  focus(): void;
  readRefs(): { control?: SelectRef; root?: HTMLDivElement; editor?: HTMLTextAreaElement };
}
// Source bug, intentionally not reproduced: unmodified official Antd6.6.8 UMD
// at .upstream/artifacts/antd-6.6.8/dist/antd.js:29619 (rc-select1.10.1
// es/SelectInput/Input.js:137) dereferences handle.style when syncWidth is on.
// Both complete Original CSR failure captures live in the separate portable
// composite reference; these two cases verify Native safety, not Source CSR parity.
for (const mode of ['multiple', 'tags'] as const) test(`Native mode measures the physical textarea behind a style-less composite ${mode}`, async ({ page }) => {
  await page.goto('/?fixture=select-components-modes-composite-safe');
  const owner = page.locator(`[data-modes-composite-safe=${mode}]`);

  await expect(owner).toHaveCount(1);
  const capture = await owner.evaluateHandle(node => {
    const bridge = {} as Bridge;
    node.dispatchEvent(new CustomEvent('modescompositesafecapture', { detail: bridge }));
    if (!bridge.read || !bridge.readRefs || !bridge.focus) {
      throw Error('Real composite owner required');
    }
    return bridge;
  });
  try {
    await drainSelectSurface(page);
    const initial = await capture.evaluate(bridge => bridge.read());
    expect(initial.handleKeys).toEqual(['nativeElement', 'focus', 'blur']);
    expect(initial.handleKeys).not.toContain('style');
    expect(initial.handleKeys).not.toContain('scrollWidth');
    expect(initial.editorTag).toBe('TEXTAREA');
    expect(initial.rootTag).toBe('DIV');
    expect(initial.physicalStyle).toBe('object');
    expect(initial.connected).toBe(true);
    const initialMeasure = Number(initial.widthVar);
    expect(Number.isFinite(initialMeasure)).toBe(true);
    expect(initialMeasure).toBeGreaterThan(0);
    expect(initial.width!).toBeGreaterThan(0);
    await capture.evaluate(bridge => bridge.focus());
    await expect.poll(() => capture.evaluate(bridge => bridge.read().focused)).toBe(true);
    const textarea = owner.locator(`[data-modes-composite-safe-editor=${mode}]`);
    const query = 'WMWMWMWMWMWMWMWMWMWMWMWMWMWM';
    await textarea.fill(query);
    await drainSelectSurface(page);
    const typed = await capture.evaluate(bridge => bridge.read());
    expect(typed.model).toEqual(['a']);
    expect(typed.query).toBe(query);
    expect(typed.value).toBe(query);
    const typedMeasure = Number(typed.widthVar);
    expect(Number.isFinite(typedMeasure)).toBe(true);
    expect(typedMeasure).toBeGreaterThan(initialMeasure);
    expect(typed.width!).toBeGreaterThan(initial.width!);
    expect(typed.handleKeys).toEqual(initial.handleKeys);
    expect(typed.connected).toBe(true);
    expect(typed.focused).toBe(true);
    const physical = await capture.evaluate((bridge, expectedMode) => bridge.readRefs().editor === document.querySelector(
      `[data-modes-composite-safe-editor=${expectedMode}]`), mode);
    expect(physical).toBe(true);
  } finally { await capture.dispose(); }
});
