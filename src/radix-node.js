const { SEARCH_TYPES } = require("./constants");
const { defaultPruner } = require("./utils");
const { RadixNodeEdges } = require("./radix-node-edges");
const Deque = require("double-ended-queue");

class RadixNode {

  /**
   * Create node in the Radix Tree.
   *
   * @param {Object}         [config={}] - argument object
   * @param {boolean}        [config.b]  - whether or not this node contains a value, or just points to other nodes
   * @param {any}            [config.v]  - the value to associate to the key that leads to this node
   * @param {Array.<knpair>} [config.c]  - outgoing edges/children, pairs of [key,node]
   */
  constructor(config={}) {
    this.b = config.b || false;
    this.v = config.v || undefined;
    this.c = new RadixNodeEdges(config.c); // 'c' is for 'children'
  }

  /**
   * Add intermediary node between this node and existing child. Use prefix as key to intermediary, and
   * update intermediary's key to current child as needed.
   *
   * @param {string} prefix - the prefix of child to act as key to new intermediary node. length > 0
   * @param {string} child  - the existing child key. length > 0 and child.startsWith(prefix)
   */
  addPrefixToChild(prefix, child) {
    const childNode = this.c.get(child);
    this.c.delete(child);

    const newChildNode = new RadixNode();
    newChildNode.c.set(child.slice(prefix.length), childNode);

    this.c.set(prefix, newChildNode);
  }

  /**
   * Iterate over all nodes of subtree rooted at this node. Prune the subtree using the provided pruner function.
   * Control the search type with the searchType parameter.
   *
   * @generator
   *
   * @param {string}     [prefix=""]         - the prefix shared by all nodes returned
   * @param {Object}     [config={}]         - config object
   * @param {pruner}     [config.pruner]     - prune nodes tree using this function. false to prune, true to keep
   * @param {searchType} [config.searchType] - the type of tree traversal to do. Must be in constants.SEARCH_TYPES
   *
   * @yields {keyMatch}
   */
  *subtreeTraverse(prefix="", config={}) {
    const pruner = config.pruner || defaultPruner;
    const searchType = config.searchType || SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;

    const bfs = searchType === SEARCH_TYPES.BREADTH_FIRST;
    const dfsPre = searchType === SEARCH_TYPES.DEPTH_FIRST_PRE_ORDER;
    const dfsPost = searchType === SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;

    if (bfs) {
      yield* this._subtreeTraverseBfs(prefix, pruner);
    } else if (dfsPre || dfsPost) {
      const preNotPost = dfsPre && !dfsPost;
      yield* this._subtreeTraverseDfs(0, prefix, pruner, preNotPost);
    }
  }

  *_subtreeTraverseBfs(prefix, pruner) {
    const visited = new Set();
    const next = new Deque();
    next.enqueue([0, prefix, this])

    while (!next.isEmpty()) {
      const [depth, prefix, node] = next.dequeue()
      if (!visited.has(node)) {
        visited.add(node);

        if (pruner(depth, prefix, node.b, node.v, node.c)) {
          yield {depth, prefix, hasValue:node.b, value:node.v, edges:node.c};

          for (const [k,child] of node.c.entries()) {
            if (!visited.has(child)) {
              next.enqueue([depth+1, prefix+k, child]);
            }
          }
        }
      }
    }
  }

  *_subtreeTraverseDfs(depth, prefix, pruner, preNotPost) {
    if (pruner(depth, prefix, this.b, this.v, this.c)) {
      if (preNotPost) {
        yield {depth, prefix, hasValue:this.b, value:this.v, edges:this.c};
      }

      for (const [k,node] of this.c.entries()) {
        yield* node._subtreeTraverseDfs(depth+1, prefix+k, pruner, preNotPost);
      }

      if (!preNotPost) {
        yield {depth, prefix, hasValue:this.b, value:this.v, edges:this.c};
      }
    }
  }
}

module.exports = { RadixNode };
