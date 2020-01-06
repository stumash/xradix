/**
 * Some utility functions and type definitions.
 *
 * @module utils
 */

const defaultPruner = () => true;

module.exports = {

  /**
   * Get all prefixes of a given string in descending order of length.
   *
   * @generator
   *
   * @param {string} s - the string from which to draw prefixes of decreasing length
   *
   * @yields {string}
   *
   * @example
   * for (const s of utils.decreasingPrefixesOf("abc")) {
   *    console.log(s); // prints "abc", "ab", "a"
   * }
   *
   * @example
   * for (const s of utils.decreasingPrefixesOf("")) { } // loop never entered
   */
  decreasingPrefixesOf: function*(s) {
    for (let i = s.length; i > 0; i--) {
      yield s.slice(0, i);
    }
  },

  /**
   * Get all prefixes of a given string in ascending order of length.
   *
   * @generator
   *
   * @param {string} s - the string from which to draw prefixes of increasing length
   *
   * @yields string
   *
   * @example
   * for (const s of utils.increasingPrefixesOf("abc")) {
   *    console.log(s); // prints "a", "ab", "abc"
   * }
   *
   * @example
   * for (const s of utils.increasingPrefixesOf("")) { } // never enters loops
   */
  increasingPrefixesOf: function*(s) {
    const slength = s.length;
    for (let i = 1; i <= slength; i++) {
      yield s.slice(0, i);
    }
  },

  /**
   * Get the longest shared prefix of two strings.
   *
   * @function
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
  longestSharedPrefix: function (s1, s2) {
    const maxLen = Math.max(s1.length, s2.length);
    for (var i = 0; i < maxLen; i++)
      if (s1[i] != s2[i])
        break;
    return i > 0 ? s1.slice(0, i) : undefined;
  },

  /** @type {pruner} */
  defaultPruner
};

/**
 * @callback pruner
 *
 * @param {number}         depth    - the depth of the current node from the searchRoot
 * @param {string}         key      - the key associated with the current node
 * @param {boolean}        hasValue - whether or not there is a value associated to the key of the current node
 * @param {any}            value    - the value associated to the key of the current node
 * @param {RadixNodeEdges} edges    - edges to the child nodes
 *
 * @returns {boolean} - false to prune the node, true to keep it and its descendants in the search
 */

/**
 * @typedef {Object} kvpair
 * @property {string} 0
 * @property {any} 1
 *
 * @example
 * // an array of type [string, any] is a valid kvpair
 * const kvpair = ["hello", "there"];
 */

/**
 * @typedef {Object} knpair
 * @property {string}    0
 * @property {RadixNode} 1
 *
 * @example
 * // an array of size 2 is a valid knpair
 * const knpair = ["hello", new RadixNode()]
 */

/**
 * @typedef {Object} prefixMatch
 *
 * @property {number}         depth
 * @property {string}         prefix
 * @property {boolean}        hasValue
 * @property {any}            value
 * @property {RadixNodeEdges} edges
 */

/**
 * @typedef {Object} searchRootMatch
 *
 * @property {string}    extraPrefix
 * @property {RadixNode} searchRoot
 */
