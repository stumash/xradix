import { Pruner } from "./constants"

const defaultPruner: Pruner<any> = () => true;

/**
 * Get all prefixes of a given string in descending order of length.
 *
 * @example
 * for (const s of utils.decreasingPrefixesOf("abc")) {
 *    console.log(s); // prints "abc", "ab", "a"
 * }
 *
 * @example
 * for (const s of utils.decreasingPrefixesOf("")) { } // loop never entered
 */
function* decreasingPrefixesOf(s: string): IterableIterator<string> {
  for (let i = s.length; i > 0; i--) {
    yield s.slice(0, i);
  }
};

/**
 * Get all prefixes of a given string in ascending order of length.
 *
 * @example
 * for (const s of utils.increasingPrefixesOf("abc")) {
 *    console.log(s); // prints "a", "ab", "abc"
 * }
 *
 * @example
 * for (const s of utils.increasingPrefixesOf("")) { } // never enters loops
 */
function* increasingPrefixesOf(s: string): IterableIterator<string> {
  const slength = s.length;
  for (let i = 1; i <= slength; i++) {
    yield s.slice(0, i);
  }
};

/**
 * Get the longest shared prefix of two strings.
 *
 * @param {string} s1 - the first string
 * @param {string} s2 - the second string
 *
 * @returns {string} - the longest shared prefix of s1 and s2, undefined if no shared prefix
 *
 * @example
 * utils.longestSharedPrefix("abc", "ab"); // "ab"
 *
 * @example
 * utils.longestSharedPrefix("abc", "xx"); // undefined
 *
 * @example
 * utils.longestSharedPrefix("abc", "")
 */
function longestSharedPrefix(s1: string, s2: string): string|undefined {
  const maxLen = Math.max(s1.length, s2.length);
  for (var i = 0; i < maxLen; i++)
    if (s1[i] != s2[i])
      break;
  return i > 0 ? s1.slice(0, i) : undefined;
};

/**
 * The number of leading characters shared between an edge label and a key, where the comparison of
 * the key begins at index keyStart. Allocation-free: compares UTF-16 code units directly so that a
 * tree descent never has to build intermediate substrings.
 *
 * @param label    - the edge label to compare against
 * @param key      - the full key being inserted/looked up
 * @param keyStart - the index in key at which to start comparing
 *
 * @returns the count of shared leading characters (0 if none)
 *
 * @example
 * sharedPrefixLength("abc", "xxabd", 2); // 2  (compares "abc" against "abd")
 */
function sharedPrefixLength(label: string, key: string, keyStart: number): number {
  const max = Math.min(label.length, key.length - keyStart);
  let i = 0;
  while (i < max && label.charCodeAt(i) === key.charCodeAt(keyStart + i)) {
    i++;
  }
  return i;
};

/**
 * Some utility functions and type definitions.
 */
export {
  decreasingPrefixesOf,
  increasingPrefixesOf,
  longestSharedPrefix,
  sharedPrefixLength,
  defaultPruner,
};

