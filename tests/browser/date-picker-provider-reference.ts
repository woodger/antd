// He reads the initial measurements of the official UMD. HTML SSR and all browser states are stored
// in its entirety, including repeated independent run.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type {
  PickerProviderMode, PickerProviderProfile
} from './fixtures/DatePickerProviderFixtures.svelte';

interface ObservedSlot {
  tag: string;
  classes: string[];
  inline: string | null;
}

interface Producer {
  owner: string;
  role: string;
  props: Record<string, { own: boolean; value: unknown; }>;
  hasValue: boolean;
  value: unknown;
}

export interface PickerProviderState {
  sameRoot: boolean;
  sameInput: boolean;
  focused: boolean;
  clear: number;
  markers: string[];
  inputs: { value: string; disabled: boolean; }[];
  slots: Record<string, { count: number; semanticCount: number; all: ObservedSlot[]; }>;
  producers: Producer[];
}

interface ReactSource {
  version: string;
  react: string;
  revision: string;
  archiveSha256: string;
}

interface BrowserReference extends ReactSource {
  browser: string;
  passes: {
    profile: PickerProviderProfile;
    frames: { mode: PickerProviderMode; state: PickerProviderState; }[];
    diagnostics: string[];
  }[][];
}

interface ServerReference extends Pick<ReactSource, 'revision' | 'archiveSha256'> {
  passes: (Pick<ReactSource, 'react' | 'version'> & {
    packets: {
      profile: PickerProviderProfile;
      mode: PickerProviderMode;
      producers: Producer[];
      events: string[];
      html: string;
    }[];
    diagnostics: string[];
  })[];
}

/** Decompresses the exact JSON for one mode, retaining both React passes. */
function readReference<T>(mode: 'browser' | 'ssr'): T {
  const path = `./fixtures/ant-design-date-picker-provider-${mode}-reference.json.gz`;
  const fixtureUrl = new URL(path, import.meta.url);
  const bytes = readFileSync(fixtureUrl);
  return JSON.parse(gunzipSync(bytes).toString('utf8'));
}

/** Loads the matrix of live transitions with metadata versions and Chromium. */
export function readPickerProviderBrowser() {
  return readReference<BrowserReference>('browser');
}

/** Uploads server markup, semantics calculations and observed events. */
export function readPickerProviderServer() {
  return readReference<ServerReference>('ssr');
}

export const observedProperties = [
  'color', 'background-color', 'margin-inline-start', 'padding-inline-start'
] as const;

export const authoredClasses = '^(?:slot|plain)-|^ant-picker-(?:large|small|outlined|filled|borderless|underlined|status)';

/** Projects the CSS supplied by the profile separately from the computed panel coordinates. */
export function projectPickerStyle(css: string | null) {
  const declarations: Record<string, string> = {};
  for (const declaration of css?.split(';') ?? []) {
    const separator = declaration.indexOf(':');
    if (separator < 0) continue;

    const property = declaration.slice(0, separator).trim();
    const value = declaration.slice(separator + 1).trim();
    declarations[property] = value.replace(/\s*,\s*/g, ', ');
  }

  return observedProperties.map(property => declarations[property] ?? '');
}
