// Reads the repeated measurements of the official assembly before the comparison of public API.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { PickerComponentsProfile } from './fixtures/PickerComponentsFixtures.svelte';
import type { PickerPanelProfile } from './fixtures/PickerPanelFixtures.svelte';

interface SourceEditor {
  id: string;
  tag?: 'INPUT' | 'TEXTAREA';
  value: string;
  readonly: boolean;
  selection?: [number, number];
  active: boolean;
  same: boolean;
}

interface BrowserState {
  editors: SourceEditor[];
  events: unknown[][];
}

export interface PickerComponentsCapture {
  profile: PickerComponentsProfile;
  steps: { action: string; state: BrowserState; }[];
  unmounted: BrowserState;
  errors: string[];
}

interface ServerCapture {
  version: string;
  react: string;
  packets: {
    profile: PickerComponentsProfile;
    html: string;
    lifecycle: unknown[][];
    producers: unknown[][];
  }[];
  diagnostics: unknown[][];
}

interface PanelState {
  editors: { value: string; same: boolean; focus: boolean; }[];
  panels: { kind: string; keys: string[]; parent: string; }[];
  popup: boolean;
  fallback: string[];
  footer: string | null;
  events: unknown[][];
}

interface PanelCapture {
  profile: PickerPanelProfile;
  steps: { action: string; state: PanelState; }[];
  unmounted: PanelState;
  errors: string[];
}

interface PickerComponentsReference<Pass> {
  revision: string;
  archiveSha256: string;
  passes: [Pass, Pass];
}

const hashes = {
  browser: '6e9fb06e645e752b54672c1415a468f7b5f6dc086d4e1c221008de6b525ab210',
  editors: 'd6987e782e46f380e69382b2fdf7e07fb1777ca3747fcaea41d5855e04477258',
  ssr: '95261768158de95cdedef26e64a0225051b160484ef8b996b66c86fbd60db1b6',
  panels: '64dfc88ce4668537b0187202c64bc6f37a5aa73e6cf6fd7dee06a139834389f3',
  'panels-supplement': '87870fd015ca7859594ba2438bfa4edf122665a8c54ffaf6afcf09653205592c'
};

/** Checking measurement bytes before reading DOM and events. */
function readReference<Pass>(kind: keyof typeof hashes): PickerComponentsReference<Pass> {
  const file = new URL(`./fixtures/ant-design-picker-components-${kind}.json.gz`, import.meta.url);
  const raw = gunzipSync(readFileSync(file));
  const hash = createHash('sha256').update(raw).digest('hex');
  if (hash !== hashes[kind]) {
    throw Error('Invalid Ant Design picker components reference');
  }
  return JSON.parse(raw.toString('utf8'));
}

/** Returns both independent runs for a given group of browser scenarios. */
export function readPickerComponentsBrowser(kind: 'browser' | 'editors') {
  return readReference<PickerComponentsCapture[]>(kind);
}

/** Retrieves SSR with DOM and timers disabled. */
export function readPickerComponentsServer() {
  return readReference<ServerCapture>('ssr');
}

/** Returns both action sequences on the public components of the panels. */
export function readPickerPanelsReference(kind: 'panels' | 'panels-supplement' = 'panels') {
  return readReference<PanelCapture[]>(kind);
}
