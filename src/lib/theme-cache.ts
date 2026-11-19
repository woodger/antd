// Переиспользует DerivativeTheme по упорядоченной цепочке алгоритмов.
// Ветви индексируются identity функций, а счётчик обновляется при каждом чтении.
import { DerivativeTheme } from './theme-derivative';
import type { MappingAlgorithm } from './theme-token.types';

interface ThemeCacheNode {
  map?: Map<MappingAlgorithm, ThemeCacheNode>;
  value?: [DerivativeTheme, number];
}

const cache = new Map<MappingAlgorithm, ThemeCacheNode>();
let keys: (readonly MappingAlgorithm[])[] = [];
let callCount = 0;

// Проходит вложенные карты до записи полной цепочки.
function getEntry(algorithms: readonly MappingAlgorithm[]) {
  let node: ThemeCacheNode | undefined = { map: cache };
  algorithms.forEach(algorithm => {
    node = node?.map?.get(algorithm);
  });

  return node?.value;
}

// Удаляет запись цепочки и освобождает пустые ветви, пока возвращается рекурсия.
function deletePath(
  current: Map<MappingAlgorithm, ThemeCacheNode>,
  path: readonly MappingAlgorithm[]
) {
  const node = current.get(path[0])!;
  if (path.length === 1) {
    if (!node.map) {
      current.delete(path[0]);
    }
    else {
      current.set(path[0], { map: node.map });
    }
    return;
  }

  deletePath(node.map!, path.slice(1));
  if ((!node.map || node.map.size === 0) && !node.value) current.delete(path[0]);
}

// Удаляет цепочку с наименьшим номером использования, сохраняя остальные ключи.
function evictOldestTheme() {
  const oldest = keys.reduce((oldestKey, candidateKey) => {
    const candidate = getEntry(candidateKey);
    const oldestEntry = getEntry(oldestKey);
    // Правило 2. Каждый ключ описывает сохранённый узел со значением.
    const candidateUsage = candidate![1];
    return candidateUsage < oldestEntry![1] ? candidateKey : oldestKey;
  });
  keys = keys.filter(key => key.length !== oldest.length
    || key.some((algorithm, index) => algorithm !== oldest[index]));
  deletePath(cache, oldest);
}

/** Кэш цепочек cssinjs 2.1.2. Новая запись сверх 25 вытесняет самую давнюю по использованию. */
export function createDerivativeTheme(
  derivatives: MappingAlgorithm | readonly MappingAlgorithm[]
): DerivativeTheme | undefined {
  const algorithms = typeof derivatives === 'function' ? [derivatives] : derivatives;
  let entry = getEntry(algorithms);
  if (!entry) {
    const theme = new DerivativeTheme(algorithms);
    // Сам объект темы хранит исходный массив, а индекс вытеснения хранит снимок пути.
    const path = algorithms.slice();
    if (!path.length) {
      return undefined;
    }
    if (keys.length + 1 > 25) {
      evictOldestTheme();
    }

    let current = cache;
    path.forEach((algorithm, index) => {
      let node = current.get(algorithm);
      if (!node) {
        node = {};
        current.set(algorithm, node);
      }

      if (index === path.length - 1) {
        // Префикс и продолжения одной цепочки используют общий узел.
        node.value = [theme, callCount++];
        return;
      }
      current = node.map ??= new Map();
    });

    keys.push(path);
    entry = getEntry(path);
  }

  if (entry) entry[1] = callCount++;

  return entry?.[0];
}
