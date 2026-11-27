// Reads two independent runs official UMD 6.6.8. Complete markings, adapter calls and event
// chronology are preserved until the test is projected.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type {
  GeneratedPickerProfile, GeneratedTimeSelectionProfile
} from './fixtures/GeneratedPickerFixtures.svelte';

interface SourceReference {
  version: string;
  revision: string;
  archiveSha256: string;
}

export interface GeneratedPickerState {
  fields: [value: string, sameInput: boolean, name: string][];
  open: boolean;
  ownerClass?: string;
  suffix?: string;
  panels?: string[];
  invalidFormats?: [locale: string, value: string, formatType: string][];
  tags?: string[];
  selectedUnits?: string[][];
  nowVisible?: boolean;
  events: unknown[][];
}

interface BrowserProfile<Id extends string = GeneratedPickerProfile> {
  profile: { id: Id; actions: string[]; };
  steps: { action: string; state: GeneratedPickerState; }[];
  errors: string[];
}

type TimeSelectionPass = Omit<BrowserProfile<string>, 'profile'> & {
  profile: GeneratedTimeSelectionProfile;
};

interface ServerPass {
  packets: {
    profile: { id: 'date' | GeneratedPickerProfile; };
    html: string;
    events: unknown[][];
    producers: [kind: 'input', field: string, value: string][];
  }[];
  diagnostics: string[];
}

/** Checks the hash of the original bytes before parsing the measurements. */
function readReference<Pass>(
  kind: string, sha256: string
) {
  const path = `./fixtures/ant-design-generated-picker-${kind}-reference.json.gz`;
  const fixtureUrl = new URL(path, import.meta.url);
  const capture = gunzipSync(readFileSync(fixtureUrl));
  const hash = createHash('sha256').update(capture).digest('hex');
  if (hash !== sha256) {
    throw Error(`Unexpected Ant Design generatePicker capture ${kind}: ${hash}`);
  }

  return JSON.parse(capture.toString('utf8')) as SourceReference & { passes: Pass[]; };
}

/** Brings back the full states before and after each action with the field. */
export function readPickerGeneratorBrowser() {
  return readReference<BrowserProfile[]>(
    'browser', 'eb29ccc7ff9bd5ab4f6ffe39ad4ae2a2eaefa89ce28123292d7c983dccb493a3'
  );
}

/** Brings back runs of time columns, range panels and meshes of months. */
export function readPickerGeneratorSupplement() {
  return readReference<BrowserProfile[]>(
    'supplement', 'f443d509d072e39da2be43d71b4f547c70d7fc2bdcb32b56f13f771036bc4966'
  );
}

/** Returns the choice of time at the root picker and factory TimePicker. */
export function readPickerGeneratorRootTime() {
  return readReference<BrowserProfile[]>(
    'root-time', '75ef1f1588ba2f68504e27a7f466d12541af240c60caca780b78fa42b52c5af7'
  );
}

/** Shows format calls and markup when you change picker at Dayjs and custom date. */
export function readPickerGeneratorTimeSwitch() {
  return readReference<BrowserProfile<'switch-time-dayjs' | 'switch-time-opaque'>[]>(
    'switch-time', 'bf2d7a7dd990abb42b1af5071eb53cb783b49c503b42c75c56ddb5a0423608c0'
  );
}

/** Reads the initial actions and images of a set of time for the root and factory TimePicker. */
export function readPickerGeneratorTimeSelections() {
  return [
    readReference<TimeSelectionPass[]>(
      'root-multiple-time', 'de84636df44895e70323ffe1e1f40bf4bbdbb5b36b09508c50aa702e47144c9d'
    ),
    readReference<TimeSelectionPass[]>(
      'root-multiple-time-edges', 'ecec4ea97cdcd2981a41ad51ba6af565177a333389ebb81a34bce741a195aa2e'
    ),
    readReference<TimeSelectionPass[]>(
      'multiple-time', 'c8f5d6182e41293f406a45335cef7a840171570649ec189ba864fd6d7aa1e997'
    )
  ];
}

/** Retains the displacement of the second click when automatically scrolling the clock. */
export function readPickerGeneratorTimeSelectionDoubleClick() {
  type Profile = TimeSelectionPass['profile'] & { delay: number; };
  type Capture = Omit<TimeSelectionPass, 'profile'> & { profile: Profile; };
  return readReference<Capture[]>(
    'root-multiple-time-doubleclick', '904f55ce05d820772f8a87bdd7495cfcdad0b52d00e11f74886b455335ae8e5f'
  );
}

/** Returns render results from the official SSR without browser resources. */
export function readPickerGeneratorServer() {
  return readReference<ServerPass>(
    'ssr', 'a107f6369ff473453f6d268874d8a56c92725e80686142d7ed9d756e0f3c1df0'
  );
}
