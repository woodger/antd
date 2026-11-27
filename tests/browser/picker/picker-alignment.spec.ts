import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-picker-alignment-reference.json' with { type: 'json' };

type ReferenceCase = (typeof reference.cases)[number];
type SourceState = ReferenceCase['initial'];
const surface = '[data-picker-popup]';

/** Selects the point or percentage of height that changes the vertical binding of the panel. */
function heightWeight(sample: ReferenceCase['sample'], source: SourceState) {
  if (sample.id === 'date-percent') {
    return 0.05;
  }
  if (sample.id === 'custom-empty') {
    return -0.5;
  }
  if (sample.id === 'date-shift') {
    return -1;
  }
  return source.placement.some(name => name.includes('-placement-top')) ? -1 : 0;
}

/** Reads the physical attachment of popup and its final placement class. */
async function readFrame(page: Page, weight: number) {
  return page.locator(surface).evaluate((popup, ratio) => {
    const bounds = popup.getBoundingClientRect();
    const placement = [...popup.classList].filter(name => name.includes('-placement-'));
    const trigger = document.querySelector('.ant-picker');
    if (!trigger) {
      throw new Error('Missing picker trigger');
    }
    const anchor = trigger.getBoundingClientRect();

    return {
      anchor: [anchor.x, anchor.y, anchor.width, anchor.height],
      position: [bounds.x, bounds.y - Math.floor(bounds.height * ratio)],
      placement
    };
  }, weight);
}

/** Compares the binding coordinates, taking into account the difference in the height of the calendar panels. */
function frameExpectation(sample: ReferenceCase['sample'], source: SourceState) {
  const [left, top, , height] = source.popup;
  const weight = heightWeight(sample, source);

  return {
    weight,
    expected: {
      anchor: source.reference,
      position: [left, top - Math.floor(height * weight)],
      placement: source.placement
    }
  };
}

/** Is waiting for several frames to distinguish the delayed replacement of props from the delay of the frame. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 8; frame++) {
      await new Promise(requestAnimationFrame);
    }
  });
}

/** Starts a separate measurement after changing props the open panel. */
async function remeasure(page: Page, sample: ReferenceCase['sample']) {
  if (sample.resizeAnchor) {
    await page.getByRole('button', { name: 'Resize picker trigger' })
      .evaluate(button => (button as HTMLButtonElement).click());
  }
  else if (sample.scroll) {
    await page.locator('#clip').evaluate((node, top) => { node.scrollTop = top; }, sample.scroll);
  }
  else {
    await page.setViewportSize({ width: 1442, height: 1002 });
  }
}

for (const { sample, initial, updated, resized } of reference.cases) {
  test(`Picker alignment matches Ant Design for ${sample.id}`, async ({ page }) => {
    await page.setViewportSize({ width: sample.narrow ? 320 : 1440, height: 1000 });
    await page.clock.setFixedTime(new Date(reference.reference.now));
    await page.goto('/?fixture=picker-alignment&profile=' + sample.id);
    const popup = page.locator(surface);

    await expect(popup).toBeVisible();
    const first = frameExpectation(sample, initial);
    await expect.poll(() => readFrame(page, first.weight)).toEqual(first.expected);
    await expect(page.locator('[popupalign],[builtinplacements]')).toHaveCount(0);
    if (sample.container) await expect(page.locator('#clip').locator(surface)).toBeVisible();
    if (!updated || !resized) {
      return;
    }

    const editor = page.locator('#start');
    const node = await popup.elementHandle();
    await editor.focus();
    await page.getByRole('button', { name: 'Update picker alignment' })
      .evaluate(button => (button as HTMLButtonElement).click());
    await settle(page);

    const next = frameExpectation(sample, updated);
    expect(await readFrame(page, next.weight)).toEqual(next.expected);

    await remeasure(page, sample);
    const measured = frameExpectation(sample, resized);
    await expect.poll(() => readFrame(page, measured.weight)).toEqual(measured.expected);
    await expect(editor).toBeFocused();
    expect(await popup.evaluate((element, original) => element === original, node)).toBe(true);
  });
}
