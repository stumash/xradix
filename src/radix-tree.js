const { RadixNode } = require("./radix-node");
const { defaultPruner, longestSharedPrefix } = require("./utils");
const { SEARCH_TYPES } = require("./constants");

/**
 * The RadixTree class
 */
class RadixTree {

  /**
   * Create a new RadixTree.
   *
   * @param {Array<kvpair>} [kvpairs=[]] the [key, value] pairs with which to seed the radix tree
   */
  constructor(kvpairs=[]) {
    this.root = new RadixNode();

    for (const [k,v] of kvpairs) {
      this.set(k, v);
    }
  }

  /**
   * Add a [key, value] pair to the RadixTree.
   *
   * @param {string}  k  the key to insert into the radix tree. must have length > 0
   * @param {any}    [v] the value to associate to the key in the radix tree
   */
  set(k, v) {
    if (k.length > 0) {
      this._set(k, v, this.root);
    }
  }

  _set(k, v, currNode) {
    if (k.length === 0) {
      currNode.b = true;
      currNode.v = v;
    } else {
      const matchingChildKey = currNode.c.findKeyHavingSharedPrefix(k);
      if (!matchingChildKey) {
        currNode.c.set(k, new RadixNode({ b:true, v }));
      } else {
        const sharedPrefix = longestSharedPrefix(matchingChildKey, k);
        if (sharedPrefix.length < matchingChildKey.length) {
          currNode.addPrefixToChild(sharedPrefix, matchingChildKey);
        }
        this._set(k.slice(sharedPrefix.length), v, currNode.c.get(sharedPrefix));
      }
    }
  }

  /**
   * Return the value associated to a key in the RadixTree.
   *
   * @param   {string}  k                       the key to look for. must have length > 0
   * @param   {object}  [config={}]             the config object
   * @param   {boolean} [config.allNodes=false]
   *
   * @returns {keyMatch|undefined} the keyMatch for the given key k. if k not found, return undefined
   */
  get(k, config={}) {
    const allNodes = config.allNodes || false;
    const newConfig = { allNodes };

    if (k.length > 0) {
      return this._get(k, k, this.root, 0, newConfig);
    }
  }

  _get(fullKey, k, currNode, depth, config) {
    if (k.length === 0) {
      if (currNode.b || config.allNodes) {
        return { depth, key: fullKey, hasValue: currNode.b, value: currNode.v, edges: currNode.c };
      }
    } else {
      const matchingChildKey = currNode.c.findKeyHavingSharedPrefix(k);
      if (matchingChildKey) {
        const sharedPrefix = longestSharedPrefix(matchingChildKey, k);
        if (sharedPrefix === matchingChildKey) {
          return this._get(
              fullKey,
              k.slice(sharedPrefix.length),
              currNode.c.get(sharedPrefix),
              depth+1,
              config
          );
        }
      }
    }
  }

  /**
   * Get the keyMatch object for every [k,v] pair where k.startsWith(prefix).
   *
   * @generator
   *
   * @param {string}     prefix              only return [k, v] pairs where k.startsWith(prefix)
   * @param {Object}     [config={}]         the config object
   * @param {pruner}     [config.pruner]     prune nodes from traversal
   * @param {searchType} [config.searchType] the type of tree traversal to do, must be in constants.SEARCH_TYPES
   * @param {boolean}    [config.allNodes]   include keyMatch objects for all nodes, not just those having values
   *
   * @yields {keyMatch} the keyMatch object for each key in the RadixTree that starts with prefix
   *
   * @desc Note: the depth property of the keyMatch is relative to the searchRoot of the given prefix.
   */
  *getAll(prefix, config={}) {
    const pruner = config.pruner || defaultPruner;
    const searchType = config.searchType || SEARCH_TYPES.DEPTH_FIRST_PRE_ORDER;
    const allNodes = config.allNodes || false;
    const newConfig = { pruner, searchType, allNodes };

    const result = this.getSearchRoot(prefix);
    if (result) {
      const { extraPrefix, searchRoot } = result;
      const searchRootPrefix = prefix + extraPrefix;
      for (const keyMatch of searchRoot.subtreeTraverse(searchRootPrefix, newConfig)) {
        if (newConfig.allNodes || keyMatch.hasValue) {
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
   * @param   {string} prefix the prefix for which to find the searchRoot
   *
   * @returns {searchRootMatch|undefined}
   */
  getSearchRoot(prefix) {
    return this._getSearchRoot(prefix, this.root);
  }

  _getSearchRoot(k, currNode) {
    if (k.length === 0) {
      return { extraPrefix: k, searchRoot: currNode };
    } else {
      const matchingChildKey = currNode.c.findKeyHavingSharedPrefix(k);
      if (matchingChildKey) {
        const sharedPrefix = longestSharedPrefix(matchingChildKey, k);
        if (sharedPrefix.length < matchingChildKey.length) {
          if (sharedPrefix.length === k.length) {
            return {
              extraPrefix: matchingChildKey.slice(sharedPrefix.length),
              searchRoot: currNode.c.get(matchingChildKey)
            };
          }
        } else if (sharedPrefix.length === matchingChildKey.length){
          return this._getSearchRoot(k.slice(sharedPrefix.length), currNode.c.get(matchingChildKey));
        }
      }
    }
  }

  /**
   * Delete the k,v pair for the given key k from the radix tree.
   *
   * @param {string} k the key to delete from the radix tree
   *
   * @returns {boolean} true if success, false if key k to delete not found
   */
  delete(k) {
    if (k.length === 0) {
      return false;
    } else {
      return this._delete(
        k,
        this.root,
        [undefined, undefined]
      );
    }
  }

  _delete(k, currNode, [parent, parentKey]) {
    if (k.length === 0) {
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
      const matchingChildKey = currNode.c.findKeyHavingSharedPrefix(k);
      if (matchingChildKey) {
        const sharedPrefix = longestSharedPrefix(matchingChildKey, k);
        if (sharedPrefix === matchingChildKey) {
          return this._delete(
            k.slice(matchingChildKey.length),
            currNode.c.get(matchingChildKey),
            [currNode, matchingChildKey]
          );
        }
      }
    }

    return false;
  }
}

module.exports = { RadixTree };
