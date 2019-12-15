const { SEARCH_TYPES } = require("~/src/constants.js");
const { RadixNodeEdges } = require("~/src/radix-node-edges.js");
const { Deque } = require("double-ended-queue");

class RadixNode {
  /**
   * @param {boolean}        [b]       - whether or not this is a leaf node, i.e. a node containing a value
   * @param {any}            [v]       - the Value to associate to the key got you to this node
   * @param {[string,any][]} [knpairs] - pairs of key,node values for outgoing edges
   */
  constructor({ b, v, knpairs }={}) {
    this.b = b || false;
    this.v = v || undefined;
    this.c = new RadixNodeEdges(knpairs); // 'c' is for 'children'
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

    const newChildNode = new RadixNode();
    newChildNode.c.set(child.slice(prefix.length), childNode);

    this.c.set(prefix, newChildNode);
  }

  /**
   * Iterate over all nodes of subtree rooted at this node.
   *
   * @param {string}                                prefix - the prefix shared by all nodes returned
   * @param {number,string,boolean,any -> boolean} [prune] - prune all nodes from search tree using this function
   *
   * @yields {depth: number, prefix: string, b: boolean, v: any}
   */
  *subtreeTraverse(prefix, prune=(d,k,b,v)=>true, searchType=SEARCH_TYPES.DEPTH_FIRST_POST_ORDER) {
    const bfs = searchType === SEARCH_TYPES.BREADTH_FIRST;
    const dfsPre = searchType === SEARCH_TYPES.DEPTH_FIRST_PRE_ORDER;
    const dfsPost = searchType === SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;

    if (bfs) {
      yield* this._subtreeTraverseBfs(prefix, prune);
    } else if (dfsPre || dfsPost) {
      const preNotPost = dfsPre && !dfsPost;
      yield* this._subtreeTraverseDfs(0, prefix, prune, preNotPost);
    }
  }

  *_subtreeTraverseBfs(prefix, prune) {
    const visited = new Set();
    const next = new Deque();
    next.enqueue([0, prefix, this])

    while (!next.isEmpty()) {
      const [depth, prefix, node] = next.dequeue()
      if (!visited.has(node)) {
        visited.add(node);

        if (prune(depth, prefix, node.b, node.v)) {
          yield [depth, prefix, node.b, node.b];

          for (const [k,child] of node.entries()) {
            if (!visited.has(child)) {
              next.enqueue([depth+1, prefix+k, child]);
            }
          }
        }
      }
    }
  }

  *_subtreeTraverseDfs(depth, prefix, prune, preNotPost) {
    if (prune(depth, prefix, this.b, this.v)) {
      if (preNotPost) {
        yield [depth, prefix, this.b, this.v];
      }

      for (const [k,node] of this.c.entries()) {
        yield* node._subtreeTraverseDfsPre(depth+1, prefix+k, prune, preNotPost);
      }

      if (!preNotPost) {
        yield [depth, prefix, this.b, this.v];
      }
    }
  }
}

module.exports = { RadixNode };
