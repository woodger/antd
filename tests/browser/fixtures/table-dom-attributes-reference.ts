import source from './ant-design-table-dom-attributes-reference.json' with { type: 'json' };

type Sample = (typeof source.cases)[number];
type Phase = 'ssr' | 'initial' | 'updated';

interface TableElementState {
  band: string;
  aria: Record<string, string | null>;
  data: Record<string, string | null>;
  id: string | null;
  customHeader: boolean;
  caption: { text: string; class: string; rich: string | null; } | null;
}

export const tableAriaNames = [
  'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-rowcount', 'aria-colcount',
  'aria-busy', 'aria-live', 'role'
];
export const tableDataNames = [
  'data-probe-owner', 'data-probe-count', 'data-probe-flag', 'data-probe-empty'
];

/** Сопоставляет атрибуты Source с нативной сеткой и подписью пользовательского тела. */
export function expectedTableDomAttributes(sample: Sample, phase: Phase) {
  const { profile } = sample;
  const state = sample[phase];
  const [ordinary] = source.cases[0][phase].tables;
  let tables: TableElementState[] = state.tables;
  if (profile.virtual && !profile.empty) {
    // Source использует div для данных. Native сохраняет table и его caption.
    tables = [ordinary];
  }
  else if (profile.customBody && !profile.headerless) {
    tables = tables.map(table => ({ ...table, caption: ordinary.caption }));
  }
  else if (!profile.header && !profile.customBody) {
    // При штатной прокрутке шапка и итог остаются в одном table с данными.
    tables = tables.filter(table => table.band === 'main');
  }

  if (profile.noAria) {
    tables = tables.map(table => table.caption?.text ? table : {
      ...table, aria: { ...table.aria, 'aria-label': 'Table' }
    });
  }

  return { ...state, tables };
}
