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
 * Some utility functions and type definitions.
 */
export {
  decreasingPrefixesOf,
  increasingPrefixesOf,
  longestSharedPrefix,
  defaultPruner,
};

