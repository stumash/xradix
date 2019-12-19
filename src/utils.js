/**
 * Some utility functions for the rest of the code to use.
 *
 * @module utils
 */
module.exports = {

  /**
   * @generator
   *
   * @param {string} s - the string from which to draw prefixes of decreasing length
   *
   * @example: "abc" -> *["abc", "ab", "a"]
   * @example: ""    -> *[]
   */
  decreasingPrefixesOf: function*(s) {
    for (let i = s.length; i > 0; i--) {
      yield s.slice(0, i);
    }
  },

  /**
   * @generator
   *
   * @param {string} s - the string from which to draw prefixes of increasing length
   *
   * @example: "abc" -> *["a", "ab", "abc"]
   * @example: ""    -> *[]
   */
  increasingPrefixesOf: function*(s) {
    const slength = s.length;
    for (let i = 1; i <= slength; i++) {
      yield s.slice(0, i);
    }
  },

  /**
   * @function
   *
   * @param {string} s1 - the first string
   * @param {string} s2 - the second string
   *
   * @returns {string} - the longest shared prefix of s1 and s2, undefined if no shared prefix
   */
  longestSharedPrefix: function (s1, s2) {
    const maxLen = Math.max(s1.length, s2.length);
    for (var i = 0; i < maxLen; i++)
      if (s1[i] != s2[i])
        break;
    return i > 0 ? s1.slice(0, i) : undefined;
  },

  /**
   * @function
   *
   * @param   {Map(string->any)} m - the Map from which to find a key that shares a prefix with k
   * @param   {string}           s - the string
   *
   * @returns {string} - the first key in m that shares a prefix with s
   *
   * @example
   *  const m = new Map([ ['foobar', 17], ['alkdfjalskd', 49] ])
   *  findKeyHavingSharedPrefix(m, 'foox') // 'foobar'
   */
  findKeyHavingSharedPrefix: function(m, s) {
    for (let k of m.keys()) {
      if (longestSharedPrefix(k, s)) {
        return k
      }
    }
  },

  /**
   * The default function used to prune nodes from the traversal during radix tree search. Note that
   * this default function always returns `true` - in other words, no nodes are pruned by default.
   *
   * @function
   * @callback pruner
   *
   * @param {number}    depth    - the depth of the current node from the searchRoot
   * @param {string}    key      - the key associated with the current node
   * @param {boolean}   hasValue - whether or not there is a value associated to the key of the current node
   * @param {any}       value    - the value (undefined if it doesn't exist) associated tot the key of the current node
   * @param {RadixNode} node     - the node itself
   *
   * @returns {boolean} - false to prune the node, true to keep it and its descendants in the search
   */
  defaultPruner: function(depth, key, hasValue, value, node) {
    return true;
  }
}
