// Reads repeated measurements of the unchanged UMD without normalizing the original files.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { MultiplePickerProfile } from './fixtures/DatePickerMultipleFixtures.svelte';

type Choice = 'open' | 'blocked-click' | 'escape' | 'outside' | 'ok' | 'clear'
  | 'remove-first' | 'remove-custom' | 'accept' | ['day', string] | ['width', number];

interface MultipleSourceState {
  popup: boolean;
  input: { value: string; };
  tags: { text: string; hidden: boolean; }[];
  clear: boolean;
  events: unknown[][];
}

interface Capture<Pass> {
  revision: string;
  archiveSha256: string;
  passes: [Pass, Pass];
}

export interface MultipleBrowserProfile {
  profile: Omit<MultiplePickerProfile, 'ordered'> & { order?: boolean; };
  initial: MultipleSourceState;
  steps: { command: Choice; state: MultipleSourceState; }[];
  diagnostics: string[];
  errors: string[];
}

interface MultipleServerSample {
  id: string;
  options: Pick<MultiplePickerProfile, 'picker' | 'maxTagCount' | 'disabled' | 'prefixCls'>;
  html: string;
  producers: { label: string; valueIndex: number; disabled: boolean; closable: boolean; }[];
  lifecycle: unknown[];
}

interface MultipleInteraction {
  id: string;
  actions: { action: string; open: boolean; tags: string[]; input: string; events: unknown[][]; }[];
}

interface ModeSwitch {
  action: 'initial' | 'toggle' | 'open' | 'outside' | 'choose-20' | 'choose-21';
  state: {
    sameOwner: boolean;
    samePreviousInput: boolean;
    multiple: boolean;
    tags: string[];
    value: string;
    events: unknown[][];
  };
}

/** Unpacks the saved result with the original order of events and DOM. */
function readSource<Pass>(name: 'browser' | 'ssr' | 'interactions' | 'mode'): Capture<Pass> {
  const file = new URL(`./fixtures/ant-design-date-picker-multiple-${name}.json.gz`, import.meta.url);

  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
}

/** Reads scenarios of selection, removal, tags and geometries. */
export function readMultipleBrowser() {
  return readSource<MultipleBrowserProfile[]>('browser');
}

/** Reads server profiles without contacting DOM. */
export function readMultipleServer() {
  return readSource<{
    version: string; react: string; packets: MultipleServerSample[]; diagnostics: unknown[];
  }>('ssr');
}

/** Reads additional events of the owner and choice of terminal periods. */
export function readMultipleInteractions() {
  return readSource<MultipleInteraction[]>('interactions');
}

/** Reads switching the same instance between single and multiple modes. */
export function readMultipleMode() {
  return readSource<ModeSwitch[]>('mode');
}

/** Removes only the additional source field existing Svelte API. */
export function comparableMultipleEvents(events: unknown[][]) {
  return events.map(event => event[0] === 'calendar' ? event.slice(0, 3) : event);
}
