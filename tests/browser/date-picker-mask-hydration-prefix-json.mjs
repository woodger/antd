import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const pointPaths = {
  'step-1-substep-0:settled': '/substeps/3/actual',
  'step-1:settled': '/steps/1/actual',
  'step-2:before': '/steps/2/before',
  'step-2-substep-0:before': '/substeps/4/before',
  'step-2-substep-0:settled': '/substeps/4/actual',
  'step-2:settled': '/steps/2/actual',
  'step-3:before': '/steps/3/before',
  'step-3-substep-0:before': '/substeps/5/before',
  'step-3-substep-0:settled': '/substeps/5/actual',
  'step-3-substep-1:before': '/steps/3/nextUnexecutedSubstepBefore/before'
};
export const factLeaves = ['/phase', '/environment', '/nodes', '/inputs', '/retainedParsedInputs',
  '/source/owner', '/source/refs', '/events', '/recoverableErrors'];
const unescape = token => token.replaceAll('~1', '/').replaceAll('~0', '~');
export function locateJSONRanges(bytes, pointers) {
  const tree = { children: new Map(), capture: [] }, ranges = {};
  for (const pointer of pointers) {
    assert(pointer.startsWith('/')); let node = tree;
    for (const token of pointer.slice(1).split('/').map(unescape)) {
      if (!node.children.has(token)) node.children.set(token, { children: new Map(), capture: [] });
      node = node.children.get(token);
    }
    node.capture.push(pointer);
  }
  const white = code => code === 32 || code === 10 || code === 13 || code === 9;
  const skipWhite = start => { while (white(bytes[start])) start++; return start; };
  function endString(start) {
    assert.equal(bytes[start], 34); let end = start;
    for (;;) {
      end = bytes.indexOf(34, end + 1); assert(end !== -1, 'Closed JSON string');
      let previous = end - 1; while (bytes[previous] === 92) previous--;
      if ((end - 1 - previous) % 2 === 0) return end + 1;
    }
  }
  function endValue(start) {
    start = skipWhite(start); const first = bytes[start];
    if (first === 34) return endString(start);
    if (first === 123 || first === 91) {
      let depth = 1, position = start + 1;
      while (depth) {
        const code = bytes[position]; assert(position < bytes.length);
        if (code === 34) position = endString(position);
        else { if (code === 123 || code === 91) depth++;
          else if (code === 125 || code === 93) depth--; position++; }
      }
      return position;
    }
    let end = start;
    while (end < bytes.length && !white(bytes[end]) && ![44, 125, 93].includes(bytes[end])) end++;
    assert(end > start); return end;
  }
  function visit(start, node) {
    start = skipWhite(start); let end;
    if (!node.children.size) end = endValue(start);
    else if (bytes[start] === 123) {
      let position = skipWhite(start + 1);
      while (bytes[position] !== 125) {
        const keyEnd = endString(position), key = JSON.parse(bytes.subarray(position, keyEnd).toString());
        position = skipWhite(keyEnd); assert.equal(bytes[position], 58);
        position = skipWhite(position + 1);
        const child = node.children.get(key);
        position = child ? visit(position, child) : endValue(position);
        position = skipWhite(position);
        if (bytes[position] === 44) position = skipWhite(position + 1);
        else assert.equal(bytes[position], 125);
      }
      end = position + 1;
    } else if (bytes[start] === 91) {
      let position = skipWhite(start + 1), index = 0;
      while (bytes[position] !== 93) {
        const child = node.children.get(String(index++));
        position = child ? visit(position, child) : endValue(position);
        position = skipWhite(position);
        if (bytes[position] === 44) position = skipWhite(position + 1);
        else assert.equal(bytes[position], 93);
      }
      end = position + 1;
    } else throw Error('JSON pointer ancestor is not a container');
    for (const pointer of node.capture) ranges[pointer] = {
      start, end, bytes: end - start, sha256: digest(bytes.subarray(start, end)) };
    return end;
  }
  const end = visit(0, tree); assert.equal(skipWhite(end), bytes.length);
  assert.deepEqual(Object.keys(ranges).sort(), [...new Set(pointers)].sort(), 'Every exact JSON pointer exists');
  return ranges;
}
export function extractFact(bytes, pointPointer, ranges) {
  const fact = {};
  for (const path of factLeaves) {
    const range = ranges[pointPointer + path];
    const value = JSON.parse(bytes.subarray(range.start, range.end).toString());
    const tokens = path.slice(1).split('/'); let target = fact;
    for (const token of tokens.slice(0, -1)) target = target[token] ??= {};
    target[tokens.at(-1)] = value;
  }
  return fact;
}
