// Reuses DerivativeTheme according to an ordered chain of algorithms. The branches are indexed
// functions, and the counter is updated at each reading.
import { DerivativeTheme } from './theme-derivative';
import type { MappingAlgorithm } from './theme-token.types';

interface ThemeCacheNode {
  map?: Map<MappingAlgorithm, ThemeCacheNode>;
  value?: [DerivativeTheme, number];
}

const cache = new Map<MappingAlgorithm, ThemeCacheNode>();
let keys: (readonly MappingAlgorithm[])[] = [];
let callCount = 0;

// Passes the nested cards before recording the full chain.
function getEntry(algorithms: readonly MappingAlgorithm[]) {
  let node: ThemeCacheNode | undefined = { map: cache };
  algorithms.forEach(algorithm => {
    node = node?.map?.get(algorithm);
  });

  return node?.value;
}

// Removes chain recording and releases empty branches while the recursion returns.
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

// Removes the chain with the smallest usage number, saving the other keys.
function evictOldestTheme() {
  const oldest = keys.reduce((oldestKey, candidateKey) => {
    const candidate = getEntry(candidateKey);
    const oldestEntry = getEntry(oldestKey);
    // Rule 2. Each key describes the saved node with the value.
    const candidateUsage = candidate![1];
    return candidateUsage < oldestEntry![1] ? candidateKey : oldestKey;
  });
  keys = keys.filter(key => key.length !== oldest.length
    || key.some((algorithm, index) => algorithm !== oldest[index]));
  deletePath(cache, oldest);
}

/** Cache chains cssinjs 2.1.2. The new entry over 25 displaces the longest in use. */
export function createDerivativeTheme(
  derivatives: MappingAlgorithm | readonly MappingAlgorithm[]
): DerivativeTheme | undefined {
  const algorithms = typeof derivatives === 'function' ? [derivatives] : derivatives;
  let entry = getEntry(algorithms);
  if (!entry) {
    const theme = new DerivativeTheme(algorithms);
    // The object of the theme stores the original array, and the displacement index stores a picture of the path.
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
        // The prefix and the continuation of a single chain use a common node.
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
