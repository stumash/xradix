const { RadixNode } = require("~/src/radix-node.js");
const { defaultPruner, longestSharedPrefix } = require("~/src/utils.js");
const { SEARCH_TYPES } = require("~/src/constants.js");

/**
 * The RadixTree class
 */
class RadixTree {

  /**
   * Create a new RadixTree.
   */
  constructor() {
    this.root = new RadixNode();
  }

  /**
   * Add a [key, value] pair to the RadixTree.
   *
   * @param {string}  k  - the key to insert into the radix tree. must have length > 0
   * @param {any}    [v] - the value to associate to the key in the radix tree
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
      const matchingChild = currNode.c.findKeyHavingSharedPrefix(k);
      if (!matchingChild) {
        currNode.c.set(k, new RadixNode({ b:true, v }));
      } else {
        const sharedPrefix = longestSharedPrefix(matchingChild, k);
        if (sharedPrefix.length < matchingChild.length) {
          currNode.addPrefixToChild(sharedPrefix, matchingChild);
        }
        this._set(k.slice(sharedPrefix.length), v, currNode.c.get(sharedPrefix));
      }
    }
  }

  /**
   * Return the value associated to a key in the RadixTree.
   *
   * @param   {string} k - the key to look for. must have length > 0
   * @returns {any}      - the value associated to the key. if key not found, return undefined
   */
  get(k) {
    if (k.length > 0) {
      return this._get(k, this.root);
    }
  }

  _get(k, currNode) {
    if (k.length === 0) {
      if (currNode.b) {
        return currNode.v;
      }
    } else {
      const matchingChild = currNode.c.findKeyHavingSharedPrefix(k);
      if (matchingChild) {
        const sharedPrefix = longestSharedPrefix(matchingChild, k);
        if (sharedPrefix === matchingChild) {
          return this._get(k.slice(sharedPrefix.length), currNode.c.get(sharedPrefix));
        }
      }
    }
  }

  /**
   * Get all k,v pairs where k.startsWith(prefix)
   *
   * @generator
   *
   * @param {string}     prefix              - only return [k, v] pairs where k.startsWith(prefix)
   * @param {Object}     [config={}]         - the config object
   * @param {pruner}     [config.pruner]     - prune nodes from traversal
   * @param {searchType} [config.searchType] - the type of tree traversal to do, must be in constants.SEARCH_TYPES
   *
   * @yields {prefixMatch}
   */
  *getAll(prefix, config) {
    const pruner = config.pruner || utils.defaultPruner;
    const searchType = config.searchType || SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;
    const newConfig = { pruner, searchType };

    const result = this.getSearchRoot(prefix);
    if (result) {
      const { extraPrefix, searchRoot } = result;
      const searchRootPrefix = prefix + extraPrefix;
      for (const prefixMatch of searchRoot.subtreeTraverse(searchRootPrefix, newConfig)) {
        const { hasValue } = prefixMatch;
        if (hasValue) {
          yield prefixMatch;
        }
      }
    }
  }


  /**
   * Get all nodes for which the key k to reach that node satisfies k.startsWith(prefix)
   *
   * @generator
   *
   * @param {string}     prefix              - only return [k, v] pairs where k.startsWith(prefix)
   * @param {Object}     [config={}]         - the config object
   * @param {pruner}     [config.pruner]     - prune nodes from traversal
   * @param {searchType} [config.searchType] - the type of tree traversal to do, must be in constants.SEARCH_TYPES
   *
   * @yields {prefixMatch}
   */
  *getAllNodes(prefix, config) {
    const pruner = config.pruner || utils.defaultPruner;
    const searchType = config.searchType || SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;
    const newConfig = { pruner, searchType };

    const result = this.getSearchRoot(prefix);
    if (result) {
      const { extraPrefix, searchRoot } = result;
      const searchRootPrefix = prefix + extraPrefix;
      for (const prefixMatch of searchRoot.subtreeTraverse(searchRootPrefix, newConfig)) {
        yield prefixMatch;
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
   * @param   {string}                                       prefix - the prefix for which to find the searchRoot
   * @returns {{extraPrefix: string, searchRoot: RadixNode}}        - undefined if not found
   */
  getSearchRoot(prefix) {
    return this._getSearchRoot(prefix, this.root);
  }

  _getSearchRoot(k, currNode) {
    if (k.length === 0) {
      return { extraPrefix: k, searchRoot: currNode };
    } else {
      const matchingChild = currNode.c.findKeyHavingSharedPrefix(k);
      if (matchingChild) {
        const sharedPrefix = longestSharedPrefix(matchingChild, k);
        if (sharedPrefix.length < matchingChild.length) {
          if (sharedPrefix.length === k.length) {
            return {
              extraPrefix: matchingChild.slice(sharedPrefix.length),
              searchRoot: currNode.c.get(matchingChild)
            };
          }
        } else if (sharedPrefix.length === matchingChild.length){
          return this._getSearchRoot(k.slice(sharedPrefix.length), currNode.c.get(matchingChild));
        }
      }
    }
  }

  /**
   * @param {string} k - the key to delete from the radix tree
   */
  delete(k) {
    // TODO FIXME UNIMPLEMENTED
  }
}

module.exports = { RadixTree };
