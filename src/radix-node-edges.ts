import RadixNode from "./radix-node";

/**
 * A simple Map<string, RadixNode>, but also maintains a single invariant:
 *  - Only a single key can start with a particular character
 *
 * This invariant means that we can find the key that shares a prefix with a given string in O(1).
 */
export default class RadixNodeEdges<T> {
  m: Map<string, RadixNode<T>>;
  firstCharToKeyMap: Map<string, string>;

  /**
   * @example
   * const rne = new RadixNodeEdges([
   *   ["aaa", new RadixNode()],
   *   ["bbb", new RadixNode()]
   * ]);
   */
  constructor(knpairs?: Array<[string, RadixNode<T>]>) {
    this.m = new Map(); //                {string -> RadixNode}
    this.firstCharToKeyMap = new Map() // {string -> string}

    if (knpairs) {
      knpairs.forEach(([k,n]) => {
        this.set(k, n)
      });
    }
  }

  /**
   * @param prefix
   *
   * @returns either the matching key or undefined if no matching key
   */
  findKeyHavingSharedPrefix(prefix: string): string|undefined {
    return this.firstCharToKeyMap.get(prefix[0]);
  }


  /**
   * Get the RadixNode associated to a key k
   */
  get(k: string): RadixNode<T> {
    return this.m.get(k);
  }

  /**
   * Set an association between a key k and a RadixNode
   */
  set(k: string, v: RadixNode<T>) {
    if (this.firstCharToKeyMap.has(k[0])) {
      this.m.delete( this.firstCharToKeyMap.get(k[0]) );
    }
    this.firstCharToKeyMap.set(k[0], k);
    this.m.set(k, v);
  }

  /**
   * Delete a key from this RadixNodeEdges. Cannot corrupt the state of the edges list.
   */
  delete(k: string): boolean {
    if (this.m.has(k) && this.firstCharToKeyMap.has(k[0])) {
      const curr = this.m.get(k);
      if (this.m.delete(k)) {
        if (this.firstCharToKeyMap.delete(k[0])) {
          return true;
        }
        this.m.set(k, curr)
      }
    }
    return false;
  }

  /**
   * Check if a there are is an edge associated to a particular key.
   */
  has(k: string): boolean { return this.m.has(k); }

  /**
   * get the number of elements (edges to other RadixNodes) in the map
   */
  get size(): number { return this.m.size }

  /**
   * A generator over all [key, node] pairs in the map. Returns pairs of values of the same type as those
   * that were added to the map via set(k, v)
   */
  *entries(): IterableIterator<[string, RadixNode<T>]> { yield* this.m.entries(); }

  /**
   * A generator over all keys inserted into the map via set(k, v)
   */
  *keys(): IterableIterator<string> { yield* this.m.keys(); }

  /**
   * A generator over all values inserted into the map via set(k, v)
   */
  *values(): IterableIterator<RadixNode<T>> { yield* this.m.values(); }
}
