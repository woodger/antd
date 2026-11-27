import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import AuxiliaryFixture from '../browser/fixtures/AuxiliaryZIndexContextFixture.svelte';
import InputFixture from '../browser/fixtures/InputZIndexContextFixture.svelte';
import Fixture from '../browser/fixtures/ZIndexContextFixture.svelte';
import auxiliary from '../browser/fixtures/ant-design-auxiliary-z-index-context-reference.json';
import inputs from '../browser/fixtures/ant-design-input-z-index-context-reference.json';
import source from '../browser/fixtures/ant-design-z-index-context-reference.json';

/** Reads the last numeric declaration without important in the SSR profiles. */
function inlineLayer(body: string, ...classNames: string[]) {
  for (const [tag, classes] of body.matchAll(/<[^>]+\sclass="([^"]*)"[^>]*>/g)) {
    const tokens = classes.split(/\s+/);
    if (!classNames.every(className => tokens.includes(className))) {
      continue;
    }

    const style = tag.match(/\sstyle="([^"]*)"/)?.[1] ?? '';
    const layers = Array.from(style.matchAll(/(?:^|;)\s*z-index:\s*([+-]?\d+)\s*(?=;|$)/g));
    return layers.at(-1)?.[1] ?? null;
  }

  return undefined;
}

it('pins the auxiliary surface layers to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(auxiliary.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(auxiliary.cases).toHaveLength(12);
});

const auxiliaryProfiles = new Set(['root', 'modal', 'modal-zero', 'modal-local-zero']);
for (const { profile, initial } of auxiliary.cases.filter(entry =>
  auxiliaryProfiles.has(entry.profile.id))) {
  it(`renders available auxiliary layers on the server in ${profile.id}`, () => {
    const { body } = render(AuxiliaryFixture, { props: { profileId: profile.id } });

    expect(inlineLayer(body, 'zi-color')).toBe(initial.color.inline);
    expect(inlineLayer(body, 'zi-float')).toBe(initial.float.inline);
    expect(inlineLayer(body, 'zi-float-semantic')).toBe(String(profile.child ?? 1660));
    expect(inlineLayer(body, 'zi-float-group')).toBe(initial.floatGroup.inline);
    expect(inlineLayer(body, 'zi-float-item')).toBe(initial.floatItem.inline);
    expect(inlineLayer(body, 'ant-float-btn-group-trigger')).toBe(initial.floatTrigger.inline);
    expect(inlineLayer(body, 'zi-float-back-top')).toBe(initial.floatBackTop.inline);
    expect(inlineLayer(body, 'zi-table-default', 'filter-popover')).toBe(initial.tableDefault.inline);
    expect(inlineLayer(body, 'zi-table-icon-tooltip')).toBe(initial.tableTriggerTip.inline);
    expect(inlineLayer(body, 'zi-tour')).toBeUndefined();
    expect(inlineLayer(body, 'zi-image')).toBeUndefined();
    expect(inlineLayer(body, 'zi-image-group')).toBeUndefined();
  });
}

it('pins the overlay layers to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(26);
});

const serverProfiles = new Set(['root', 'root-local-child', 'modal', 'modal-zero', 'drawer-zero']);
for (const { profile, initial } of source.cases.filter(entry => serverProfiles.has(entry.profile.id))) {
  it(`renders inline popup layers for ${profile.id} on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(inlineLayer(body, 'zi-child-dropdown')).toBe(initial.dropdown.inline);
    expect(inlineLayer(body, 'zi-child-tooltip')).toBe(initial.tooltip.inline);
    expect(inlineLayer(body, 'zi-child-popover')).toBe(initial.popover.inline);
    expect(inlineLayer(body, 'zi-child-popconfirm')).toBe(initial.popconfirm.inline);
    if (profile.id === 'drawer-zero') {
      expect(inlineLayer(body, 'zi-owner-drawer')).toBe('0');
    }
    else if (initial.modal) {
      expect(inlineLayer(body, 'zi-owner-modal')).toBe(initial.modal.inline);
    }
  });
}

it('pins the input popup layers to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(inputs.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(inputs.cases).toHaveLength(12);
});

const inputProfiles = new Set(['root', 'modal', 'modal-zero', 'modal-local-zero']);
for (const { profile, initial } of inputs.cases.filter(entry => inputProfiles.has(entry.profile.id))) {
  it(`renders open input panels with the expected inline layer in ${profile.id}`, () => {
    const { body } = render(InputFixture, { props: { profileId: profile.id } });

    expect(inlineLayer(body, 'zi-tree-select')).toBe(initial.treeSelect.inline);
    expect(inlineLayer(body, 'zi-cascader')).toBe(initial.cascader.inline);
    expect(inlineLayer(body, 'zi-date')).toBe(initial.date.inline);
    expect(inlineLayer(body, 'zi-range')).toBe(initial.range.inline);
    expect(inlineLayer(body, 'zi-time')).toBe(initial.time.inline);
    expect(inlineLayer(body, 'zi-time-range')).toBe(initial.timeRange.inline);
    expect(inlineLayer(body, 'zi-select')).toBeUndefined();
    expect(inlineLayer(body, 'zi-autocomplete')).toBeUndefined();
    expect(inlineLayer(body, 'zi-mentions-popup')).toBeUndefined();
  });
}
