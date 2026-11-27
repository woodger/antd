// Reading two independent runs of the official UMD with the original DOM and events.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { DatePickerMode, RangePickerMode } from '@woodger/antd';
import type { PickerModeProfile } from './fixtures/DatePickerPanelModeFixtures.svelte';

export type PickerModeAction = 'start' | 'end' | 'cell' | 'outside' | 'year-header'
  | 'second-month-header' | 'advance' | 'hour' | 'ok' | 'first-cell'
  | ['mode', DatePickerMode | RangePickerMode | null] | ['view', string];

export interface PickerModeState {
  fields: string[];
  tags?: string[];
  focused: number;
  panels: {
    class: string;
    header?: string;
    columns?: { length: number; text?: string; }[];
    disabled: number;
    navigation?: [label: string, disabled: boolean][];
  }[];
  inputsRetained: boolean;
  events: unknown[][];
}

interface PickerModeCapture {
  profile: PickerModeProfile;
  steps: { action: PickerModeAction; state: PickerModeState; }[];
}

const sourceHashes = {
  browser: '538a01499e4e4e8177ff254d719479a798447e3f10a1efbe67b4262a621c5c68',
  supplement: '33db860b68d856c277b1ba2585d6f3c37dc854af3dae74d29fd17a7b654a9ea1',
  bounds: '491a9932ae33158e7737991bd885c5b416ffd3add698ade5439624dd1d4b1f66',
  ssr: 'cc9a1e93bf8556a69d8b901bd0dce3efe3a6eb8748ce4939806e9f2a35087e56'
};

interface ServerPass {
  version: string;
  react: string;
  packets: { profile: PickerModeProfile; html: string; lifecycle: string[]; footer: string[]; }[];
  diagnostics: string[][];
}

interface ModeReference<Pass> {
  revision: string;
  archiveSha256: string;
  passes: [Pass, Pass];
}

/** Checks the hash of the original bytes before reading unchanged events and DOM. */
function readCapture<Pass>(suffix: keyof typeof sourceHashes): ModeReference<Pass> {
  const file = new URL(`./fixtures/ant-design-date-picker-panel-mode-${suffix}.json.gz`, import.meta.url);
  const raw = gunzipSync(readFileSync(file));
  const hash = createHash('sha256').update(raw).digest('hex');
  if (hash !== sourceHashes[suffix]) {
    throw Error('Invalid Ant Design DatePicker mode reference');
  }
  return JSON.parse(raw.toString('utf8'));
}

/** Returns both browser runs through the public API. */
export function readPickerModeReference(suffix: 'browser' | 'supplement' | 'bounds') {
  return readCapture<PickerModeCapture[]>(suffix).passes;
}

/** Retrieves SSR with DOM and timers disabled. */
export function readPickerModeServer() {
  return readCapture<ServerPass>('ssr');
}

/** A single Native callback preserves an additional source field. */
export function comparablePanelModeEvents(events: unknown[][], range: boolean | undefined) {
  return events.map(event => !range && event[0] === 'calendar' ? event.slice(0, 3) : event);
}
