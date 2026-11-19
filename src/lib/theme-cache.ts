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
    // Правило 2: исходный LRU ожидает записи для сохранённых ключей. Если
    // цепочка уже вытеснена записью общего префикса, сохраняется прежняя ошибка.
    const candidateUsage = candidate![1];
    const oldestEntry = getEntry(oldestKey);
    return candidateUsage < oldestEntry![1] ? candidateKey : oldestKey;
  });
  keys = keys.filter(key => key.length !== oldest.length
    || key.some((algorithm, index) => algorithm !== oldest[index]));
  deletePath(cache, oldest);
}

/** Кэш cssinjs 2.1.2 по цепочке функций; после 25 записей удаляет самую давнюю по использованию. */
export function createDerivativeTheme(
  derivatives: MappingAlgorithm | readonly MappingAlgorithm[]
): DerivativeTheme | undefined {
  const algorithms = typeof derivatives === 'function' ? [derivatives] : derivatives;
  let entry = getEntry(algorithms);
  if (!entry) {
    const theme = new DerivativeTheme(algorithms);
    if (keys.length + 1 > 25) {
      evictOldestTheme();
    }

    keys.push(algorithms);
    let current = cache;
    algorithms.forEach((algorithm, index) => {
      if (index === algorithms.length - 1) {
        current.set(algorithm, { value: [theme, callCount++] });
      }
      else {
        const node = current.get(algorithm);
        if (!node) {
          const childMap = new Map<MappingAlgorithm, ThemeCacheNode>();
          current.set(algorithm, { map: childMap });
          current = childMap;
        }
        else {
          current = node.map ??= new Map();
        }
      }
    });
    entry = getEntry(algorithms);
  }

  if (entry) entry[1] = callCount++;

  return entry?.[0];
}
