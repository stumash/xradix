/**
 * A special map data structure where keys are strings and values can be anything (though RadixTree uses
 * this class only to store RadixNode objects).
 *
 * For any given character c, only a single key whose first character is c can be in the map at once.
 *
 * This allows for O(1) lookup for keys that share a first letter with any given input key.
 */
class RadixNodeEdges {

  /**
   * @param {[string,RadixNode][]} [knpairs] - key,node pairs to initialize the edge list
   */
  constructor(knpairs) {
    this.m = new Map(); //                {string -> RadixNode}
    this.firstCharToKeyMap = new Map() // {string -> string}

    if (knpairs) {
      knpairs.forEach(([k,n]) => {
        this.set(k, n)
      });
    }
  }

  /**
   * @param {string} prefix
   *
   * @returns {string} - either the matching key or undefined if no matching key
   */
  findKeyHavingSharedPrefix(prefix) {
    return this.firstCharToKeyMap.get(prefix[0]);
  }

  /**
   * @param {string} k    - the key to find in the edge list
   *
   * @returns {RadixNode} - the node found or undefined if key not in edge list
   */
  get(k) {
    return this.m.get(k);
  }

  /**
   * Set an association between a key k and a RadixNode
   *
   * @param {string}    k - the key to associate to the child RadixNode
   * @param {RadixNode} v - the child RadixNode
   */
  set(k, v) {
    if (this.firstCharToKeyMap.has(k[0])) {
      this.m.delete( this.firstCharToKeyMap.get(k[0]) );
    }
    this.firstCharToKeyMap.set(k[0], k);
    this.m.set(k, v);
  }

  /**
   * @param {string} k - the key to use to delete
   *
   * @returns {boolean} - true if the deletion succeeded, else false
   */
  delete(k) {
    return this.m.delete(k) && this.firstCharToKeyMap.delete(k[0]);
  }

  /**
   * Check if a there are is an edge associated to a particular key.
   *
   * @param {string} k - check edge with key k is in map
   *
   * @returns {boolean}
   */
  has(k) { return this.m.has(k); }

  /**
   * get the number of elements (edges to other RadixNodes) in the map
   */
  get size() { return this.m.size }

  /**
   * A generator over all [key, node] pairs in the map. Returns pairs of values of the same type as those
   * that were added to the map via set(k, v)
   *
   * @returns {*[[string, RadixNode]]} - [key, node] pairs that were inserted into the map via set(k, v)
   */
  *entries() { yield* this.m.entries(); }

  /**
   * A generator over all keys inserted into the map via set(k, v)
   *
   * @returns {*[string]} - generator over all keys inserted inserted into the map
   */
  *keys() { yield* this.m.keys(); }

  /**
   * A generator over all values inserted into the map via set(k, v)
   *
   * @returns {*[RadixNode]} - all nodes inserted into the map via set(k, v)
   */
  *values() { yield* this.m.values(); }
}

module.exports = { RadixNodeEdges };
