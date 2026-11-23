import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-menu-hover-reference.json' with { type: 'json' };
import portals from './fixtures/ant-design-menu-hover-portal-reference.json' with { type: 'json' };
import horizontal from './fixtures/ant-design-menu-hover-horizontal-reference.json'
  with { type: 'json' };

interface SourceEvent {
  name?: string;
  kind?: string;
  key?: string;
  event?: string;
  type?: string;
  currentTarget?: readonly (string | null)[] | null;
  current?: readonly (string | null)[] | null;
}

interface NativeEvent {
  name: string;
  key: string;
  event: string;
  native: boolean;
  tag: string;
  role: string;
  version: number;
}

// Сопоставляет получателя исходного callback с нативным button заголовка Menu.
function expected(events: readonly SourceEvent[]) {
  return events.flatMap(raw => {
    const name = raw.name ?? raw.kind;
    if (!name || name === 'openKeys') return [];

    const tag = raw.currentTarget?.[0] ?? raw.current?.[0];
    const role = raw.currentTarget?.[1] ?? raw.current?.[2];
    return [{
      name: name.startsWith('title-') ? `branch-${name}` : name,
      key: raw.key,
      event: raw.event ?? raw.type,
      native: true,
      tag: tag === 'DIV' && role === 'menuitem' ? 'BUTTON' : tag,
      role,
      version: 0
    }];
  });
}

// Принимает полный накопленный журнал, чтобы поймать дубли и лишние callbacks.
async function readEvents(page: Page): Promise<NativeEvent[]> {
  const value = await page.getByLabel('Menu hover events').textContent();
  return JSON.parse(value ?? '[]');
}

// Меняет настройки владельца без перемещения реального указателя.
function ownerAction(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
}

test.use({ viewport: { width: 1000, height: 720 } });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-hover');
  await page.mouse.move(0, 0);
  await expect(page.getByRole('menu', { name: 'Hover menu' })).toBeVisible();
});

for (const { profile, enter, child, leave } of reference.passes[0]) {
  test(`matches the pinned Menu hover callbacks for ${profile.id}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Menu hover sample' }).selectOption(profile.id);
    await page.getByTestId('hover-branch').hover();
    await expect.poll(() => readEvents(page)).toEqual(expected(enter));

    await page.getByTestId('hover-leaf').hover();
    await expect.poll(() => readEvents(page)).toEqual(expected([...enter, ...child]));

    await page.mouse.move(0, 0);
    await expect.poll(() => readEvents(page)).toEqual(expected([...enter, ...child, ...leave]));
  });
}

const external = portals.passes[0].find(({ profile }) => profile.id === 'external');
if (!external) throw new Error('The pinned Menu portal capture has no external profile');

for (const { profile, steps, data, click } of portals.passes[0]) {
  test(`matches logical hover ownership and metadata in ${profile.id}`, async ({ page }) => {
    // Source теряет enter листа и дважды сообщает leave ветки у границы ShadowRoot.
    // Логический маршрут в ShadowRoot сверяется с тем же внешним portal без ретаргетинга.
    const witness = profile.destination === 'shadow' ? external.steps : steps;
    await page.getByRole('combobox', { name: 'Menu hover sample' })
      .selectOption(`portal-${profile.id}`);
    const expectedLog = [];
    for (const step of witness) {
      const label = step.name === 'nest-label' ? 'nested' : step.name.replace(/-label$/, '');
      await page.getByTestId(`hover-${label}`).hover();
      expectedLog.push(...expected(step.state));
      await expect.poll(() => readEvents(page)).toEqual(expectedLog);
    }

    const leaf = page.getByRole('menuitem', { name: 'Leaf', exact: true });
    await expect(leaf).toHaveAttribute('data-extra-token', data.token);
    await expect(leaf).toHaveAttribute('data-extra-flag', data.flag);
    await expect(leaf).toHaveAttribute('data-extra-name', data.name);
    await expect(leaf).toHaveAttribute('data-menu-id', /-4$/);
    await expect(leaf).not.toHaveAttribute('custompayload');
    await expect(page.getByTestId('hover-branch').locator('xpath=ancestor::li[1]'))
      .not.toHaveAttribute('rootclassname');

    const sourceClick = click.find(event => event.kind === 'click');
    if (sourceClick) {
      await page.getByTestId('hover-leaf').click();
      const tracked = page.getByLabel('Menu hover selection');
      await expect.poll(async () => JSON.parse(await tracked.textContent() ?? 'null')).toMatchObject({
        key: sourceClick.key,
        keyPath: sourceClick.path,
        itemData: {
          key: sourceClick.data?.key,
          customPayload: sourceClick.data?.customPayload,
          'data-extra-token': sourceClick.data?.['data-extra-token']
        },
        hoverCallbackKeys: []
      });
    }
  });
}

for (const { id, steps, inPopup } of horizontal.passes[0]) {
  test(`matches hover of a ${id} branch exactly once`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Menu hover sample' }).selectOption(id);
    const branch = page.getByRole('menuitem', { name: 'Branch', exact: true })
      .getByTestId('hover-branch');
    await expect(branch).toBeVisible();
    expect(await branch.evaluate(node => Boolean(node.closest('.ant-menu-submenu-popup'))))
      .toBe(inPopup);

    const expectedLog = [];
    for (const step of steps) {
      if (step.name === 'outside') await page.mouse.move(0, 0);
      else if (step.name === 'branch-label') await branch.hover();
      else await page.getByTestId('hover-leaf').hover();

      expectedLog.push(...expected(step.state));
      await expect.poll(() => readEvents(page)).toEqual(expectedLog);
    }
  });
}

test('projects ancestors when the pointer enters a nested portal directly', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Menu hover sample' })
    .selectOption('portal-external-nested-rtl');
  await page.getByTestId('hover-leaf').hover();
  await page.getByTestId('hover-other').hover();

  const ledger = await readEvents(page);
  expect(ledger.map(record => [record.name, record.tag])).toEqual([
    ['branch-enter', 'LI'], ['nested-enter', 'LI'], ['leaf-enter', 'LI'],
    ['leaf-leave', 'LI'], ['nested-leave', 'LI'], ['branch-leave', 'LI']
  ]);
});

test('keeps one branch boundary when returning from Shadow DOM to its title', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Menu hover sample' }).selectOption('portal-shadow');
  await page.getByTestId('hover-branch').hover();
  await page.getByTestId('hover-leaf').hover();
  await page.getByTestId('hover-branch').hover();
  await page.mouse.move(0, 0);

  const ledger = await readEvents(page);
  expect(ledger.map(record => record.name)).toEqual([
    'branch-enter', 'branch-title-enter', 'branch-title-leave', 'leaf-enter', 'leaf-leave',
    'branch-title-enter', 'branch-title-leave', 'branch-leave'
  ]);
});

test('uses the latest callbacks and data without replacing the hovered row', async ({ page }) => {
  const leaf = page.getByRole('menuitem', { name: 'Leaf', exact: true });
  await page.getByTestId('hover-leaf').hover();
  const original = await leaf.elementHandle();
  await ownerAction(page, 'Replace menu hover callbacks');

  await expect(leaf).toHaveAttribute('data-extra-token', '91');
  expect(await leaf.evaluate((node, before) => node === before, original)).toBe(true);
  await page.getByTestId('hover-other').hover();
  const ledger = await readEvents(page);
  expect(ledger.map(record => [record.name, record.version])).toEqual([
    ['branch-enter', 0], ['leaf-enter', 0], ['leaf-leave', 1], ['branch-leave', 1]
  ]);

  await ownerAction(page, 'Unmount hover menu');
  await page.mouse.move(0, 0);
  await expect(page.getByRole('menu', { name: 'Hover menu' })).toHaveCount(0);
  expect(await readEvents(page)).toEqual(ledger);
});
