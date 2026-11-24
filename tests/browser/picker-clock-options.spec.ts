import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-picker-clock-options-reference.json' with { type: 'json' };

type Sample = typeof reference.cases[number];
type ClockState = Sample['steps'][number]['state'];
const columns = '.ant-picker-time-panel-column';
const events = 'Picker clock events';

/** Снимает текст, состояние строк и историю публичных событий после действия. */
async function readClock(page: Page) {
  return page.evaluate(() => {
    const popup = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
    const inputs = document.querySelectorAll<HTMLInputElement>('#start, #end');
    const ledger = document.querySelector('[aria-label="Picker clock events"]');

    return {
      fields: [...inputs].map(input => [input.id, input.value]),
      open: Boolean(popup),
      columns: [...popup?.querySelectorAll('.ant-picker-time-panel-column') ?? []].map(column =>
        [...column.querySelectorAll('.ant-picker-time-panel-cell')].map(cell => [
          cell.textContent,
          cell.classList.contains('ant-picker-time-panel-cell-disabled'),
          cell.classList.contains('ant-picker-time-panel-cell-selected')
        ])
      ),
      events: JSON.parse(ledger?.textContent || '[]')
    };
  });
}

/** Прокручивает колонку на начало второго пункта после первоначального выравнивания. */
async function scrollToSecond(page: Page) {
  await page.clock.runFor(500);
  await page.locator(columns).first().evaluate(column => {
    const [first, next] = column.querySelectorAll<HTMLElement>('li');
    column.scrollTop = next.offsetTop - first.offsetTop;
    column.dispatchEvent(new Event('scroll'));
  });
}

/** Использует те же поля и пункты, что и независимый Source capture. */
async function act(page: Page, action: string) {
  const popup = page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  if (action === 'start') {
    await page.locator('#start').click();
  }
  else if (action === 'confirm') {
    await popup.locator('.ant-picker-ok button').click();
  }
  else if (action === 'choose-date' || action === 'next-date') {
    const day = action === 'choose-date' ? '19' : '21';
    await popup.locator('.ant-picker-panel').first().locator(`td[title="2024-06-${day}"] button`)
      .evaluate(button => (button as HTMLButtonElement).click());
  }
  else if (action === 'scroll') {
    await scrollToSecond(page);
    await page.clock.runFor(450);
  }
  else {
    const cell = popup.locator(columns).first().getByText(action, { exact: true });
    // Фокус и hover остаются на поле, чтобы измерить именно выбор этой строки.
    await cell.evaluate(button => (button as HTMLButtonElement).click());
  }
}

/** Сохраняет Native-контракт info.source и существующий порядок OK календарного пикера. */
function expectedEvents(sample: Sample, state: ClockState) {
  const source = sample.profile.actions.includes('choose-date') ? 'date' : 'time';
  const calls = state.events.map(event => event[0] === 'calendar' && !sample.profile.range
    ? [event[0], event[1], event[2], { source }]
    : event);

  if (!state.open && sample.profile.picker !== 'time' && calls.at(-1)?.[0] === 'open') {
    const close = calls.length - 1;
    const change = calls[close - 1]?.[0] === 'change';
    const confirm = change ? close - 2 : close - 1;
    if (calls[confirm]?.[0] === 'ok') {
      // Отличие существующего календарного режима записано в реестре.
      const [onOk] = calls.splice(confirm, 1);
      const position = sample.profile.range ? calls.length : calls.length - 1;
      calls.splice(position, 0, onOk);
    }
  }

  return calls;
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(reference.reference.now) });
  await page.goto('/?fixture=picker-clock-options');
});

for (const sample of reference.cases) {
  test(`Picker applies the clock settings of ${sample.profile.id}`, async ({ page }) => {
    await page.getByLabel('Picker clock options', { exact: true }).selectOption(sample.profile.id);

    for (const { action, state } of sample.steps) {
      await test.step(action, async () => {
        if (action !== 'initial') {
          await act(page, action);
        }

        await expect.poll(() => readClock(page)).toEqual({
          fields: state.fields,
          open: state.open,
          columns: state.columns,
          events: expectedEvents(sample, state)
        });
      });
    }
  });
}

test('Closing the calendar popup cancels delayed clock selection', async ({ page }) => {
  await page.getByLabel('Picker clock options', { exact: true }).selectOption('single-scroll');
  const input = page.locator('#start');
  await input.click();

  await scrollToSecond(page);
  await input.press('Escape');
  await page.clock.runFor(450);

  await expect(input).toHaveValue('2024-06-15 10');
  await expect(page.getByLabel(events, { exact: true })).toHaveText('[["open",true],["open",false]]');
});
