import fs from 'node:fs';
import vm from 'node:vm';
import { format } from 'node:util';
import { createHash } from 'node:crypto';
import { createMaskSourceApp } from './source-case.mjs';
import { sourceSharedScript } from '../homepage-five-source-review-v1/shared.mjs';

export const maskUMDScripts = [
  '.upstream/artifacts/react-18.3.1/umd/react.production.min.js',
  '.upstream/artifacts/react-dom-18.3.1/umd/react-dom.production.min.js',
  'node_modules/dayjs/dayjs.min.js',
  'node_modules/dayjs/locale/en-gb.js',
  '.upstream/artifacts/antd-6.6.8/dist/antd.js'
];

/** Same DOM-free VM mechanism as Source v2; this counter uses its own public factory. */
export function renderMaskSource(sample) {
  const serializations = {};
  const diagnostics = [];
  for (const formatProfile of ['string', 'object', 'mask']) for (const method of ['renderToString', 'renderToStaticMarkup']) {
    const resources = { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 };
    const forbidden = (kind, name) => () => {
      resources[kind]++;
      throw Error('Original mask SSR ' + name);
    };
    const context = vm.createContext({
      TextEncoder, TextDecoder, ReadableStream, TransformStream, AbortController, performance,
      console: Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map(level => [
        level, (...args) => diagnostics.push({ formatProfile, method, level, message: format(...args) })
      ])),
      setTimeout: forbidden('timers', 'setTimeout'),
      clearTimeout() {},
      setInterval: forbidden('timers', 'setInterval'),
      clearInterval() {},
      requestAnimationFrame: forbidden('frames', 'requestAnimationFrame'),
      cancelAnimationFrame() {},
      queueMicrotask: forbidden('microtasks', 'queueMicrotask'),
      getComputedStyle: forbidden('measurements', 'getComputedStyle'),
      ResizeObserver: class {
        constructor() {
          resources.measurements++;
          throw Error('Original mask SSR ResizeObserver');
        }
      },
      MutationObserver: class {
        constructor() {
          resources.measurements++;
          throw Error('Original mask SSR MutationObserver');
        }
      }
    });
    context.self = context;
    let html;
    let state;
    let refs;
    let fatal;
    try {
      for (const file of [...maskUMDScripts,
        '.upstream/artifacts/react-dom-18.3.1/umd/react-dom-server-legacy.browser.production.min.js']) {
        vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
      }
      context.MessageChannel = class {
        constructor() {
          resources.ports++;
          throw Error('Original mask SSR MessageChannel');
        }
      };
      const raw = {};
      const shared = vm.runInContext(sourceSharedScript(), context);
      const factory = vm.runInContext(
        '(' + createMaskSourceApp.toString() + ')', context
      );
      html = context.ReactDOMServer[method](factory(context.React, context.antd, { ...sample, initialFormatProfile: formatProfile }, raw, shared));
      state = JSON.parse(JSON.stringify({ owner: raw.current.read(), producers: raw.current.readProducers(0) }));
      refs = Object.fromEntries(
        Object.entries(raw.current.readRefs()).map(([key, ref]) => [key, ref == null])
      );
    } catch (error) {
      fatal = { name: error.name, message: error.message, stack: error.stack };
    }
    serializations[formatProfile + '-' + method] = {
      formatProfile, method,
      rawHtml: html ?? null,
      htmlSha256: html === undefined ? null : createHash('sha256').update(html).digest('hex'),
      state: state ?? null,
      environment: {
        timezone: vm.runInContext('Intl.DateTimeFormat().resolvedOptions().timeZone', context),
        dateNow: vm.runInContext('Date.now()', context),
        dayjsLocale: vm.runInContext('dayjs.locale()', context)
      },
      refs: refs ?? null,
      resources,
      fatal: fatal ?? null,
      initialClosedOnly: true,
      domFree: !('window' in context) && !('document' in context),
      messageChannelEnvironment: {
        availableDuringUMDLoad: false,
        forbiddenDuringRender: true
      }
    };
  }
  return { serializations, diagnostics };
}
