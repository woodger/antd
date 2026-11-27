import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { selectDataAriaReference, type SelectDataView } from './select-data-reference';
import type { SelectDataSample } from './fixtures/select-data-cases';

const referenceUrl = new URL(
  './fixtures/select-virtual-query-native-baseline.json',
  import.meta.url
);
const queryBytes = readFileSync(referenceUrl);
if (createHash('sha256').update(queryBytes).digest('hex') !== '1c91bc9788bb65152c14011977abfdf178d74cd6e387c5bd35958ee379bf0228') {
  throw Error('Historical Native controlled-query baseline changed');
}
const queryProof = JSON.parse(queryBytes.toString('utf8')) as { cases: Array<{ id: string;
  trace: Array<{ query: string; editor: { value: string; caret: number[] }; events: unknown[][] }> }> };
const keptQuery = queryProof.cases.find(entry => entry.id === 'select-controlled-query-Kept query')!;
if (keptQuery.trace[1].query !== 'Kept query' || keptQuery.trace[1].editor.value !== ''
  || keptQuery.trace[1].editor.caret.some(value => value !== 0)) {
  throw Error('Historical Native closed editor proof changed');
}

function scalar(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const tagged = value as { type?: unknown; value?: unknown };
  return tagged.type === 'string' && typeof tagged.value === 'string' ? tagged.value : undefined;
}
function field(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const tagged = value as { type?: unknown; entries?: unknown };
  if (tagged.type !== 'object' || !Array.isArray(tagged.entries)) {
    return undefined;
  }
  const match = tagged.entries.find((entry: unknown) => Array.isArray(entry) && entry[0] === key);
  return match?.[1];
}
function names(view: SelectDataView) {
  const map = view.receipts.fieldNames.value;
  return {
    value: scalar(field(map, 'value')) || 'value',
    label: scalar(field(map, 'label')) || 'label'
  };
}
function inputRows(view: SelectDataView) {
  return view.receipts.options.rows as Array<{ common: {
    data: unknown;
    originalToken: string | null
  } }>;
}
function selectedLabel(view: SelectDataView) {
  const value = scalar(view.model);
  if (value === undefined) {
    return undefined;
  }
  const mapping = names(view);
  const row = inputRows(view).findLast(row => scalar(field(row.common.data, mapping.value)) === value);
  if (!row) {
    throw Error('Closed selected editor input no longer has a frozen raw option');
  }
  const label = scalar(field(row.common.data, mapping.label));
  if (label === undefined) {
    throw Error('Closed selected editor guard requires the proven string-label contract');
  }
  return label;
}
export function selectDataMappedAriaFields(view: SelectDataView, sample: SelectDataSample) {
  const mapping = names(view);
  if (mapping.value === 'value' || !view.popup || view.receipts.virtual.value?.value === false) {
    return [];
  }
  if (!selectDataAriaReference.cases.some(entry => entry.id.startsWith(sample.family + '-'))) {
    throw Error('Missing actual Source paired ARIA proof');
  }
  const changes: Array<{ listbox: string; id: string; source: string; native: string }> = [];
  for (const listbox of view.popup.viewport.aria) {
    for (const option of listbox.options) {
      if (option.selected !== 'false' || !option.label) continue;
      const physical = view.popup.viewport.rows.find(row => !row.group && row.text === option.label);
      const raw = inputRows(view).find(row => scalar(field(row.common.data, mapping.label)) === option.label);
      const value = raw ? scalar(field(raw.common.data, mapping.value)) : undefined;
      const logical = sample.family === 'select' ? physical?.selected === true
        : value !== undefined && value.toLowerCase() === String(view.query).toLowerCase();
      if (logical) {
        changes.push({
          listbox: listbox.id,
          id: option.id,
          source: 'false',
          native: 'true'
        });
      }
    }
  }
  return changes;
}
/** Bottomed proven Native fields; all Source events/model/query remains in its entirety. */
export function selectDataNativeView(
  view: SelectDataView,
  sample: SelectDataSample
): SelectDataView {
  let result = view;
  const editor = view.editor;
  if (editor?.expanded === 'true' && editor.controls && editor.activeDescendant === `${editor.controls}_-1`) {
    const active = view.events.findLast((entry: unknown) => Array.isArray(entry) && entry[0] === 'active');
    const targets = view.popup?.viewport.aria.flatMap(listbox => listbox.options) ?? [];
    if (!Array.isArray(active) || active[1]?.type !== 'null' || targets.some(row => row.id === editor.activeDescendant)) {
      throw Error('Source inactive -1 ARIA guard changed');
    }
    result = { ...result, editor: { ...editor, activeDescendant: null } };
  }
  if (sample.family === 'select' && !sample.mode && editor?.expanded === 'false') {
    if (view.query !== '') {
      if (editor.value !== view.query || view.receipts.searchOwner.whileClosedOwnUndefined !== true) {
        throw Error('Controlled-query closed Source editor guard changed');
      }
      const label = scalar(view.model) === undefined ? '' : selectedLabel(view)!;
      result = {
        ...result,
        editor: { ...result.editor!, value: label, caret: [label.length, label.length] }
      };
    }
    else if (scalar(view.model) !== undefined) {
      if (view.query !== '' || editor.value !== '' || editor.caret.some(value => value !== 0)) {
        throw Error('Selected closed Source editor guard changed');
      }
      const label = selectedLabel(view)!;
      result = {
        ...result,
        editor: { ...result.editor!, value: label, caret: [label.length, label.length] }
      };
    }
  }
  const corrections = selectDataMappedAriaFields(view, sample);
  if (corrections.length) {
    result = { ...result, popup: { ...result.popup!, viewport: { ...result.popup!.viewport,
      aria: result.popup!.viewport.aria.map(listbox => ({ ...listbox, options: listbox.options.map(option => {
        const correction = corrections.find(change => change.listbox === listbox.id && change.id === option.id);
        return correction ? { ...option, selected: correction.native } : option;
      }) })) } } };
  }
  return result;
}
/** Any link published by Native active-descendant links to the real option. */
export function readSelectDataAriaIntegrity() {
  const refs: { editor?: HTMLInputElement | HTMLTextAreaElement } = {};
  document.querySelector('[data-select-data-command]')!
    .dispatchEvent(new CustomEvent('datarefs', { detail: refs }));
  const id = refs.editor?.getAttribute('aria-activedescendant');
  if (!id) {
    return true;
  }
  const target = document.getElementById(id);
  return target?.getAttribute('role') === 'option';
}
