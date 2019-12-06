const { SEARCH_TYPES } = require("~/src/constants.js");

class RadixNode {
  /**
   * @param {boolean}                [b] - whether or not this is a leaf node, i.e. a node containing a value
   * @param {any}                    [v] - the Value to associate to the key got you to this node
   * @param {Map(string->RadixNode)} [c] - a map storing the Children of this node
   */
  constructor({ b, v, c }={}) {
    this.b = b || false;
    this.v = v || undefined;
    this.c = c || new Map();
  }


  /**
   * Add intermediary node between this node and existing child. Use prefix as key to intermediary, and
   * update intermediary's key to current child as needed
   *
   * @param {string} prefix - the prefix of child to act as key to new intermediary node. length > 0
   * @param {string} child  - the existing child key. length > 0 and child.startsWith(prefix)
   */
  addPrefixToChild(prefix, child) {
    const childNode = this.c.get(child);
    this.c.delete(child);
    this.c.set(prefix, new RadixNode({
      c: new Map([ [child.slice(prefix.length), childNode] ])
    }));
  }

}

module.exports = { RadixNode };
