/**
 * @param {string} s - the string from which to draw prefixes of decreasing length
 *
 * example: "abc" -> *["abc", "ab", "a"]
 * example: ""    -> *[]
 */
function* decreasingPrefixesOf(s) {
  for (let i = s.length; i > 0; i--) {
    yield s.slice(0, i);
  }
}

/**
 * @param {string} s - the string from which to draw prefixes of increasing length
 *
 * example: "abc" -> *["a", "ab", "abc"]
 * example: ""    -> *[]
 */
function* increasingPrefixesOf(s) {
  const slength = s.length;
  for (let i = 1; i <= slength; i++) {
    yield s.slice(0, i);
  }
}

/**
 * @param {string} s1 - the first string
 * @param {string} s2 - the second string
 * @returns {string}  - the longest shared prefix of s1 and s2, undefined if no shared prefix
 */
function longestSharedPrefix(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  for (var i = 0; i < maxLen; i++)
    if (s1[i] != s2[i])
      break;
  return i > 0 ? s1.slice(0, i) : undefined;
}

/**
 * @param   {Map(string->any)} m - the Map from which to find a key that shares a prefix with k
 * @param   {string}           s - the string 
 * @returns {string}             - the first key in m that shares a prefix with s
 *
 * example:
 *  const m = new Map([ ['foobar', 17], ['alkdfjalskd', 49] ])
 *  findKeyHavingSharedPrefix(m, 'foox') // 'foobar'
 */
function findKeyHavingSharedPrefix(m, s) {
  for (let k of m.keys()) {
    if (longestSharedPrefix(k, s)) {
      return k
    }
  }
}

module.exports = {
  increasingPrefixesOf,
  decreasingPrefixesOf,
  longestSharedPrefix,
  findKeyHavingSharedPrefix,
};
