// Читает повторные замеры официальной сборки до сопоставления публичного API.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { PickerComponentsProfile } from './fixtures/PickerComponentsFixtures.svelte';

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
    producers: string[];
  }[];
  diagnostics: unknown[][];
}

interface PickerComponentsReference<Pass> {
  revision: string;
  archiveSha256: string;
  passes: [Pass, Pass];
}

const hashes = {
  browser: '6e9fb06e645e752b54672c1415a468f7b5f6dc086d4e1c221008de6b525ab210',
  editors: 'd6987e782e46f380e69382b2fdf7e07fb1777ca3747fcaea41d5855e04477258',
  ssr: '95261768158de95cdedef26e64a0225051b160484ef8b996b66c86fbd60db1b6'
};

/** Проверяет байты замера перед чтением DOM и событий. */
function readReference<Pass>(kind: keyof typeof hashes): PickerComponentsReference<Pass> {
  const file = new URL(`./fixtures/ant-design-picker-components-${kind}.json.gz`, import.meta.url);
  const raw = gunzipSync(readFileSync(file));
  const hash = createHash('sha256').update(raw).digest('hex');
  if (hash !== hashes[kind]) {
    throw Error('Invalid Ant Design picker components reference');
  }
  return JSON.parse(raw.toString('utf8'));
}

/** Возвращает оба независимых прогона для заданной группы браузерных сценариев. */
export function readPickerComponentsBrowser(kind: 'browser' | 'editors') {
  return readReference<PickerComponentsCapture[]>(kind);
}

/** Возвращает SSR с отключёнными DOM и таймерами. */
export function readPickerComponentsServer() {
  return readReference<ServerCapture>('ssr');
}
