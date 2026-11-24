// Читает повторённые замеры неизменённого UMD без нормализации исходных файлов.
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

/** Распаковывает сохранённый результат с исходным порядком событий и DOM. */
function readSource<Pass>(name: 'browser' | 'ssr' | 'interactions' | 'mode'): Capture<Pass> {
  const file = new URL(`./fixtures/ant-design-date-picker-multiple-${name}.json.gz`, import.meta.url);

  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
}

/** Читает сценарии выбора, удаления, тегов и геометрии. */
export function readMultipleBrowser() {
  return readSource<MultipleBrowserProfile[]>('browser');
}

/** Читает серверные профили без обращения к DOM. */
export function readMultipleServer() {
  return readSource<{
    version: string; react: string; packets: MultipleServerSample[]; diagnostics: unknown[];
  }>('ssr');
}

/** Читает дополнительные события владельца и выбор терминальных периодов. */
export function readMultipleInteractions() {
  return readSource<MultipleInteraction[]>('interactions');
}

/** Читает переключения одного и того же экземпляра между одиночным и множественным режимами. */
export function readMultipleMode() {
  return readSource<ModeSwitch[]>('mode');
}

/** Убирает только дополнительное поле source существующего Svelte API. */
export function comparableMultipleEvents(events: unknown[][]) {
  return events.map(event => event[0] === 'calendar' ? event.slice(0, 3) : event);
}
