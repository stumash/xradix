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
      const matchingChild = findKeyHavingSharedPrefix(currNode.c, k);
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
      return currNode.v;
    } else {
      const matchingChild = findKeyHavingSharedPrefix(currNode.c, k);
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
      const { searchPrefix, searchRoot } = result;
      for (let [k,v] of this._getAll(searchPrefix, searchRoot, filter, searchType)) {
        yield [k, v];
      }
    }
  }

  /**
   * @param {string} prefix - TODO
   */
  getSearchRoot(prefix) {
    if (prefix === "") {
      return { searchPrefix: prefix, searchRoot: this.root };
    } else {
      return this._getSearchRoot(prefix, prefix, this.root);
    }
  }

  _getSearchRoot(prefix, k, currNode) {
    if (k.length === 0) {
      return { searchPrefix: prefix, searchRoot: currNode };
    } else {
      const matchingChild = findKeyHavingSharedPrefix(currNode.c, k);
      if (matchingChild) {
        
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

module.exports = { RadixTree, SEARCH_TYPES };
