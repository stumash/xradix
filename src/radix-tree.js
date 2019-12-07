const { RadixNode } = require("~/src/radix-node.js");
const { longestSharedPrefix, findKeyHavingSharedPrefix } = require("~/src/utils.js");
const { SEARCH_TYPES } = require("~/src/constants.js");

class RadixTree {
  constructor() {
    this.root = new RadixNode();
  }

  /**
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
   * @param   {string} k - the key to look for. must have length > 0
   * @returns {any}      - the value associated to the key. if not key found, return undefined
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
   * Generator function.
   * Get all k,v pairs where k.startsWith(prefix)
   * TODO: fix this doc comment
   *
   * @param   {string}                         prefix      - only return [k, v] pairs where k.startsWith(prefix)
   * @param   {[string,boolean,any]->boolean} [filter]     - prune nodes from traversal
   * @param   {string}                        [searchType] - the type of tree traversal to use for searching
   * @returns {[string, any][]}                            - all k,v pairs for matching keys
   */
  *getAll(prefix, filter=(k,b,v)=>true, searchType=SEARCH_TYPES.DEPTH_FIRST_POST_ORDER) {
    const result = this.getSearchRoot(prefix);
    if (result) {
      const { extraPrefix, searchRoot } = result;
      const searchRootPrefix = prefix + extraPrefix;
      for (let [k,v] of this._getAll(searchRoot, filter, searchType)) {
        yield [searchRootPrefix + k, v];
      }
    }
  }

  /**
   * For a given prefix, find the shallowest node in the radix tree whose key either matches the prefix exactly
   * or is the shortest matching key that is longer than the prefix.
   *
   * For example, if "ab" and "abcd" are inserted into the radix tree, the 'search root' of the prefix "abc" would
   * be the node matching "abcd". The "abcd" node would be the root of the subtree containing all nodes whose keys
   * start with "abc", since there were no other keys that start with "abc" other than "abcd" and its children.
   *
   * @param   {string}                                           prefix - the prefix for which to find the searchRoot
   * @returns { { extraPrefix: string, searchRoot: RadixNode } }        - undefined if not found
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
   * Do tree traversal rooted at current node, yielding every node along the way
   */
  *_getAll(searchType=SEARCH_TYPES.DEPTH_FIRST_POST_ORDER) {
    if (searchType === SEARCH_TYPES.BREADTH_FIRST) {
      yield* this._getAllBFS();
    } else {
      yield* this._getAllDFS(searchType);
    }
  }

  *_getAllDFS(searchType=SEARCH_TYPES.DEPTH_FIRST_POST_ORDER) {
  }

  *_getAllBFS() {
    // TODO
  }


  /**
   * @param {string} k - the key to delete from the radix tree
   */
  delete(k) {
    // TODO
  }
}

module.exports = { RadixTree };
