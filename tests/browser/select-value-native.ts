import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readReferenceBytes } from './reference-bytes';
import type { SelectValueView } from './select-value-reference';
import type { SelectValueSample } from './fixtures/select-value-cases';

const referenceUrl = new URL(
  './fixtures/select-virtual-query-native-baseline.json',
  import.meta.url
);
const queryBytes = readFileSync(referenceUrl);
if (createHash('sha256').update(queryBytes).digest('hex') !== '1c91bc9788bb65152c14011977abfdf178d74cd6e387c5bd35958ee379bf0228') {
  throw Error('Historical Native query/caret baseline changed');
}
const queryProof = JSON.parse(queryBytes.toString('utf8')) as { cases: Array<{ id: string;
  trace: Array<{ query: string; editor: { value: string; caret: number[] } }> }> };
const closedQuery = queryProof.cases.find(entry => entry.id === 'select-controlled-query-Kept query')!.trace[1];
if (closedQuery.query !== 'Kept query' || closedQuery.editor.value !== '' || closedQuery.editor.caret.some(value => value !== 0)) {
  throw Error('Historical Native closed editor contract changed');
}

const mixedBytes = readReferenceBytes('select-value-native-mixed-baseline.json.gz');
if (createHash('sha256').update(mixedBytes).digest('hex') !== '4d212cd96aa18bb6babd5c0e516180d251539c570e1ba1788ff73d488cfdc391') {
  throw Error('Historical Native mixed-value baseline SHA256 changed');
}
const mixedProof = JSON.parse(mixedBytes.toString('utf8')) as {
  status: string;
  reference: { historicalCommit: string; selectSource: { sha256: string } };
  snapshots: Array<{ phase: string; snapshot: { modelType: string; selectedRows: string[] } }>;
  failure: null;
};
if (mixedProof.status !== 'captured' || mixedProof.failure !== null
  || mixedProof.reference.historicalCommit !== '656f8b7bd2023274434bc2a6d38e3eb40cde5f10'
  || mixedProof.reference.selectSource.sha256 !== '6e119d6abe2a4c23016c3b40b974904a145019825b4d4923d9d044f13b2b3511') {
  throw Error('Historical Native distinct number/string control proof changed');
}
const reopened = mixedProof.snapshots.find(entry => entry.phase === 'reopen-string-zero')!.snapshot;
if (reopened.modelType !== 'string' || JSON.stringify(reopened.selectedRows) !== '["String zero"]') {
  throw Error('Historical Native string zero physical selection changed');
}

function selected(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as { type?: string; entries?: Array<[string, unknown]> };
  if (item.type === 'string' || item.type === 'number') {
    return true;
  }
  if (item.type !== 'object') {
    return false;
  }
  return selected(item.entries?.find(([key]) => key === 'value')?.[1]);
}

/** Preserve the measured Native scalar editor/caret and closed-query display contract. */
export function selectValueNativeView(
  view: SelectValueView,
  sample: SelectValueSample,
  options: { hydratedInitial?: boolean } = {}
): SelectValueView {
  const model = view.model as {
    type: string;
    entries?: Array<[string, { type: string; value?: string }]>
  };
  const raw = model.type === 'object' ? model.entries?.find(([key]) => key === 'value')?.[1] : undefined;
  if (sample.id === 'select-value-mixed' && view.popup && raw?.type === 'string' && raw.value === '0') {
    const rows = view.popup.rows;
    if (JSON.stringify(rows.map(row => [row.text, row.selected])) !== '[["Number zero",true],["String zero",false],["Alpha",false]]') {
      throw Error('Original physical number/string selected-marker contradiction changed');
    }
    view = {
      ...view,
      popup: { ...view.popup, rows: rows.map((row, index) => ({ ...row, selected: index === 1 })) }
    };
  }
  if (sample.mode || view.editor.expanded !== 'false') {
    return view;
  }
  if (view.editor.value !== '' && view.editor.value !== view.query) {
    throw Error('Original closed editor no longer contains only the original query');
  }
  if (view.editor.value === '' && view.editor.caret.some(value => value !== 0)) {
    throw Error('Original empty closed editor caret changed');
  }
  // Rich children remain rendered DOM. Their text is never copied into the native input.
  const text = selected(view.model) && !view.rich.length ? view.content.text ?? '' : '';
  return { ...view, editor: { ...view.editor, value: text,
    caret: options.hydratedInitial ? [0, 0] : [text.length, text.length] },
    content: view.content.hasSearch && view.query !== '' ? { ...view.content, hasSearch: false } : view.content };
}

/** Compiler scoping is private; every authored class and computed style remains compared. */
export function selectValuePublicClasses(actual: ReturnType<typeof import('./select-value-metrics').readSelectValue>) {
  if (!actual.view.styledValue) {
    return actual.view;
  }
  const privateClasses = actual.view.styledValue.classes.filter(name => /^(?:s-|svelte-)[\w-]+$/.test(name));
  if (privateClasses.length !== 1) {
    throw Error('Expected one Svelte scoped stylesheet class');
  }
  for (const node of [actual.raw.root, actual.raw.editor, actual.raw.content]) {
    if (!node?.attributes.some(([name, value]) => name === 'class' && value.split(' ').includes(privateClasses[0]))) {
      throw Error('Only the actual shared Svelte scope class may be excluded');
    }
  }
  return { ...actual.view, styledValue: { ...actual.view.styledValue,
    classes: actual.view.styledValue.classes.filter(name => !privateClasses.includes(name)) } };
}
