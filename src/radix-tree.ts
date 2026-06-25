import RadixNode from "./radix-node";
import { defaultPruner, sharedPrefixLength } from "./utils";
import { SearchType, Pruner, KeyMatch, SearchRootMatch } from "./constants";

/**
 * The RadixTree class
 */
export default class RadixTree<T> {
  root: RadixNode<T>;

  /**
   * Create a new RadixTree.
   *
   * @param kvpairs the [key, value] pairs with which to initialize the radix tree
   */
  constructor(kvpairs?: Array<[string, T]>) {
    this.root = new RadixNode<T>();

    if (kvpairs) {
      for (const [k, v] of kvpairs) {
        this.set(k, v);
      }
    }
  }

  /**
   * Add a [key, value] pair to the RadixTree.
   *
   * @param k the key to insert into the radix tree. must have length > 0
   * @param v the value to associate to the key in the radix tree
   */
  set(k: string, v: T) {
    if (k.length > 0) {
      this._set(k, v, this.root, 0);
    }
  }

  private _set(k: string, v: T, currNode: RadixNode<T>, start: number) {
    if (start === k.length) {
      currNode.b = true;
      currNode.v = v;
    } else {
      const entry = currNode.c.getChild(k, start);
      if (entry === undefined) {
        currNode.c.set(k.slice(start), new RadixNode(true, v));
      } else {
        const [label, child] = entry;
        const n = sharedPrefixLength(label, k, start);
        const next =
          n < label.length
            ? currNode.addPrefixToChild(label.slice(0, n), label)
            : child;
        this._set(k, v, next, start + n);
      }
    }
  }

  /**
   * Return the value associated to a key in the RadixTree.
   *
   * @param k                       the key to look for. must have length > 0
   * @param allNodes
   *
   * @returns the keyMatch for the given key k. if k not found, return undefined
   */
  get(k: string, allNodes?: boolean): KeyMatch<T> | undefined {
    if (k.length > 0) {
      return this._get(k, this.root, 0, 0, allNodes || false);
    }
  }

  private _get(
    fullKey: string,
    currNode: RadixNode<T>,
    start: number,
    depth: number,
    allNodes: boolean
  ): KeyMatch<T> | undefined {
    if (start === fullKey.length) {
      if (currNode.b || allNodes) {
        return {
          depth,
          key: fullKey,
          hasValue: currNode.b,
          value: currNode.v,
          edges: currNode.c
        };
      }
    } else {
      const entry = currNode.c.getChild(fullKey, start);
      if (entry !== undefined) {
        const [label, child] = entry;
        const n = sharedPrefixLength(label, fullKey, start);
        if (n === label.length) {
          return this._get(fullKey, child, start + n, depth + 1, allNodes);
        }
      }
    }
  }

  /**
   * Get the KeyMatch object for every [k,v] pair where k.startsWith(prefix).
   *
   * @generator
   *
   * @param prefix            only return KeyMatch for keys k where k.startsWith(prefix)
   * @param config            configuration for behavior of this function
   * @param config.pruner     prune nodes from traversal
   * @param config.searchType the type of tree traversal to do, must be in constants.SEARCH_TYPES
   * @param config.allNodes   include keyMatch objects for all nodes, not just those having values
   *
   * @yields the KeyMatch object for each key in the RadixTree that starts with prefix
   *
   * @desc Note: the depth property of the KeyMatch is relative to the searchRoot of the given prefix.
   */
  *getAll(
    prefix: string,
    config: {
      pruner?: Pruner<T>;
      searchType?: SearchType;
      allNodes?: boolean;
    } = {}
  ): IterableIterator<KeyMatch<T>> {
    const pruner = config.pruner || defaultPruner;
    const searchType = config.searchType || SearchType.DepthFirstPreorder;
    const allNodes = config.allNodes || false;

    const result = this.getSearchRoot(prefix);
    if (result) {
      const { extraPrefix, searchRoot } = result;
      const searchRootPrefix = prefix + extraPrefix;
      for (const keyMatch of searchRoot.subtreeTraverse(searchRootPrefix, {
        pruner,
        searchType
      })) {
        if (allNodes || keyMatch.hasValue) {
          yield keyMatch;
        }
      }
    }
  }

  /**
   * For a given prefix, find the shallowest node in the radix tree whose key either matches the prefix exactly
   * or is the shortest matching key that is longer than the prefix.
   *
   * For example, if "ab" and "abcd" are inserted into the radix tree, the search root of the prefix "abc" would
   * be the node matching "abcd". The "abcd" node would be the root of the subtree containing all nodes whose keys
   * start with "abc", since there were no other keys that start with "abc" other than "abcd" and its children.
   *
   * @param   prefix the prefix for which to find the searchRoot
   *
   * @returns the SearchRootMatch if one is found
   */
  getSearchRoot(prefix: string): SearchRootMatch<T> | undefined {
    return this._getSearchRoot(prefix, this.root, 0);
  }

  private _getSearchRoot(
    k: string,
    currNode: RadixNode<T>,
    start: number
  ): SearchRootMatch<T> | undefined {
    if (start === k.length) {
      return { extraPrefix: "", searchRoot: currNode };
    } else {
      const entry = currNode.c.getChild(k, start);
      if (entry !== undefined) {
        const [label, child] = entry;
        const n = sharedPrefixLength(label, k, start);
        const remaining = k.length - start;
        if (n < label.length) {
          if (n === remaining) {
            return { extraPrefix: label.slice(n), searchRoot: child };
          }
        } else {
          // n === label.length: the whole edge was consumed, descend
          return this._getSearchRoot(k, child, start + n);
        }
      }
    }
  }

  /**
   * Delete the k,v pair for the given key k from the radix tree.
   *
   * @param   k the key to delete from the radix tree
   *
   * @returns true if success, false if k not found
   */
  delete(k: string): boolean {
    if (k.length === 0) {
      return false;
    } else {
      return this._delete(k, this.root, 0, undefined, undefined);
    }
  }

  private _delete(
    k: string,
    currNode: RadixNode<T>,
    start: number,
    parent: RadixNode<T> | undefined,
    parentKey: string | undefined
  ): boolean {
    if (start === k.length) {
      if (currNode.b) {
        currNode.b = false;
        currNode.v = undefined;
        if (currNode.c.size === 1) {
          const [childKey, child] = currNode.c.entries().next().value;
          if (!currNode.c.delete(childKey)) {
            return false;
          }
          if (!parent.c.delete(parentKey)) {
            return false;
          }
          const newChildKey = parentKey + childKey;
          parent.c.set(newChildKey, child);
        } else if (currNode.c.size === 0) {
          parent.c.delete(parentKey);
        }
        return true;
      }
    } else {
      const entry = currNode.c.getChild(k, start);
      if (entry !== undefined) {
        const [label, child] = entry;
        const n = sharedPrefixLength(label, k, start);
        if (n === label.length) {
          return this._delete(k, child, start + n, currNode, label);
        }
      }
    }

    return false;
  }
}
