import RadixNode from "./radix-node";

/**
 * The set of edges from a RadixNode to its children. Maintains a single invariant:
 *  - Only a single edge label can start with a particular character
 *
 * Because of that invariant, children are indexed by the first character (code) of their edge label,
 * which makes finding the edge that shares a prefix with a given key an O(1) lookup keyed by a single
 * char code -- never a hash of the whole label, and never a scan of the children.
 *
 * The backing Map is allocated lazily: leaf nodes (the majority in most trees) hold no Map at all.
 * Each slot stores the full edge label alongside its child node, so no second map is needed to recover
 * the label from the first character.
 */
export default class RadixNodeEdges<T> {
  // first-char-code -> [edgeLabel, childNode]. Lazily created on first set().
  m: Map<number, [string, RadixNode<T>]> | undefined;

  /**
   * @example
   * const rne = new RadixNodeEdges([
   *   ["aaa", new RadixNode()],
   *   ["bbb", new RadixNode()]
   * ]);
   */
  constructor(knpairs?: Array<[string, RadixNode<T>]>) {
    if (knpairs) {
      knpairs.forEach(([k, n]) => {
        this.set(k, n);
      });
    }
  }

  /**
   * Find the edge label sharing a prefix with key, comparing from key[start] onwards.
   *
   * @param key   - the key whose first (unconsumed) character selects the edge
   * @param start - the index in key at which the relevant character begins
   *
   * @returns the [edgeLabel, childNode] pair for the matching edge, or undefined
   */
  getChild(key: string, start: number = 0): [string, RadixNode<T>] | undefined {
    return this.m === undefined ? undefined : this.m.get(key.charCodeAt(start));
  }

  /**
   * @param prefix
   *
   * @returns either the matching edge label or undefined if no matching label
   */
  findKeyHavingSharedPrefix(prefix: string): string | undefined {
    const entry = this.getChild(prefix, 0);
    return entry === undefined ? undefined : entry[0];
  }

  /**
   * Get the RadixNode associated to an edge label k
   */
  get(k: string): RadixNode<T> | undefined {
    if (this.m === undefined) return undefined;
    const entry = this.m.get(k.charCodeAt(0));
    return entry !== undefined && entry[0] === k ? entry[1] : undefined;
  }

  /**
   * Set an association between an edge label k and a RadixNode. Because edges are keyed by first
   * character, any existing edge starting with the same character is transparently replaced -- which
   * is exactly the invariant we want to maintain.
   */
  set(k: string, v: RadixNode<T>) {
    if (this.m === undefined) this.m = new Map();
    this.m.set(k.charCodeAt(0), [k, v]);
  }

  /**
   * Delete an edge label from this RadixNodeEdges. Cannot corrupt the state of the edges list.
   */
  delete(k: string): boolean {
    if (this.m === undefined) return false;
    const code = k.charCodeAt(0);
    const entry = this.m.get(code);
    if (entry !== undefined && entry[0] === k) {
      return this.m.delete(code);
    }
    return false;
  }

  /**
   * Check if there is an edge associated to a particular label.
   */
  has(k: string): boolean {
    if (this.m === undefined) return false;
    const entry = this.m.get(k.charCodeAt(0));
    return entry !== undefined && entry[0] === k;
  }

  /**
   * get the number of edges to other RadixNodes
   */
  get size(): number { return this.m === undefined ? 0 : this.m.size; }

  /**
   * A generator over all [edgeLabel, node] pairs.
   */
  *entries(): IterableIterator<[string, RadixNode<T>]> {
    if (this.m !== undefined) yield* this.m.values();
  }

  /**
   * A generator over all edge labels.
   */
  *keys(): IterableIterator<string> {
    if (this.m !== undefined) for (const [k] of this.m.values()) yield k;
  }

  /**
   * A generator over all child RadixNodes.
   */
  *values(): IterableIterator<RadixNode<T>> {
    if (this.m !== undefined) for (const [, n] of this.m.values()) yield n;
  }
}
