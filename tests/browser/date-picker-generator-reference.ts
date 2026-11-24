// Читает два независимых прогона официального UMD 6.6.8. Полная разметка,
// вызовы адаптера и хронология событий сохраняются до проекции теста.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { GeneratedPickerProfile } from './fixtures/GeneratedPickerFixtures.svelte';

interface SourceReference {
  version: string;
  revision: string;
  archiveSha256: string;
}

export interface GeneratedPickerState {
  fields: [value: string, sameInput: boolean, name: string][];
  open: boolean;
  events: unknown[][];
}

interface BrowserProfile {
  profile: { id: GeneratedPickerProfile; actions: string[]; };
  steps: { action: string; state: GeneratedPickerState; }[];
  errors: string[];
}

interface ServerPass {
  packets: {
    profile: { id: 'date' | GeneratedPickerProfile; };
    html: string;
    events: unknown[][];
    producers: [kind: 'input', field: string, value: string][];
  }[];
  diagnostics: string[];
}

/** Проверяет хеш оригинальных байтов перед разбором измерений. */
function readReference<Pass>(kind: 'browser' | 'supplement' | 'ssr', sha256: string) {
  const path = `./fixtures/ant-design-generated-picker-${kind}-reference.json.gz`;
  const capture = gunzipSync(readFileSync(new URL(path, import.meta.url)));
  const hash = createHash('sha256').update(capture).digest('hex');
  if (hash !== sha256) {
    throw Error(`Unexpected Ant Design generatePicker capture ${kind}: ${hash}`);
  }

  return JSON.parse(capture.toString('utf8')) as SourceReference & { passes: Pass[]; };
}

/** Возвращает полные состояния до и после каждого действия с полем. */
export function readPickerGeneratorBrowser() {
  return readReference<BrowserProfile[]>(
    'browser', 'eb29ccc7ff9bd5ab4f6ffe39ad4ae2a2eaefa89ce28123292d7c983dccb493a3'
  );
}

/** Возвращает прогоны колонок времени, панели диапазона и сетки месяцев. */
export function readPickerGeneratorSupplement() {
  return readReference<BrowserProfile[]>(
    'supplement', 'f443d509d072e39da2be43d71b4f547c70d7fc2bdcb32b56f13f771036bc4966'
  );
}

/** Возвращает render-пакеты официального SSR без браузерных ресурсов. */
export function readPickerGeneratorServer() {
  return readReference<ServerPass>(
    'ssr', 'a107f6369ff473453f6d268874d8a56c92725e80686142d7ed9d756e0f3c1df0'
  );
}
