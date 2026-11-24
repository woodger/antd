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
  ownerClass?: string;
  suffix?: string;
  panels?: string[];
  invalidFormats?: [locale: string, value: string, formatType: string][];
  events: unknown[][];
}

interface BrowserProfile<Id extends string = GeneratedPickerProfile> {
  profile: { id: Id; actions: string[]; };
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
function readReference<Pass>(
  kind: 'browser' | 'supplement' | 'root-time' | 'switch-time' | 'ssr', sha256: string
) {
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

/** Возвращает выбор времени у корневого пикера и фабричного TimePicker. */
export function readPickerGeneratorRootTime() {
  return readReference<BrowserProfile[]>(
    'root-time', '75ef1f1588ba2f68504e27a7f466d12541af240c60caca780b78fa42b52c5af7'
  );
}

/** Показывает вызовы формата и разметку при смене picker у Dayjs и пользовательской даты. */
export function readPickerGeneratorTimeSwitch() {
  return readReference<BrowserProfile<'switch-time-dayjs' | 'switch-time-opaque'>[]>(
    'switch-time', 'bf2d7a7dd990abb42b1af5071eb53cb783b49c503b42c75c56ddb5a0423608c0'
  );
}

/** Возвращает render-пакеты официального SSR без браузерных ресурсов. */
export function readPickerGeneratorServer() {
  return readReference<ServerPass>(
    'ssr', 'a107f6369ff473453f6d268874d8a56c92725e80686142d7ed9d756e0f3c1df0'
  );
}
