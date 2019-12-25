const { RadixTree } = require("~/src/radix-tree.js");
const { SEARCH_TYPES } = require("~/src/constants.js")

/**
 * `xradix`: An e**X**tensible **RADIX** tree implementation.
 * 
 * @example
 * const rt = new RadixTree();
 *
 * @example
 * const rt2 = new RadixTree();
 * const x = 5;
 */
module.exports = {
  RadixTree,
  SEARCH_TYPES,
}
