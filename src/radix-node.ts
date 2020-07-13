import { SearchType, Pruner, KeyMatch } from "./constants";
import RadixNodeEdges from "./radix-node-edges";
import { defaultPruner } from "./utils";
import Deque from "double-ended-queue";

export default class RadixNode<T> {
  b: boolean; // does this node hold a value
  v: T | undefined; // the value this node holds
  c: RadixNodeEdges<T>; // edges to children

  /**
   * Create node in the Radix Tree.
   */
  constructor(b?: boolean, v?: T, c?: Array<[string, RadixNode<T>]>) {
    this.b = b || false;
    this.v = v;
    this.c = new RadixNodeEdges(c);
  }

  /**
   * Add intermediary node between this node and existing child. Use prefix as key to intermediary, and
   * update intermediary's key to current child as needed.
   *
   * @param prefix - the prefix of child to act as key to new intermediary node. length > 0
   * @param child  - the existing child key. length > 0 and child.startsWith(prefix)
   */
  addPrefixToChild(prefix: string, child: string) {
    const childNode = this.c.get(child);
    this.c.delete(child);

    const newChildNode = new RadixNode<T>();
    newChildNode.c.set(child.slice(prefix.length), childNode);

    this.c.set(prefix, newChildNode);
  }

  /**
   * Iterate over all nodes of subtree rooted at this node. Prune the subtree using the provided pruner function.
   * Control the search type with the searchType parameter.
   *
   * @generator
   *
   * @param prefix            - the prefix shared by all nodes returned
   * @param config            - the configuration of the behaviour of the function
   * @param config.pruner     - prune nodes tree using this function. false to prune, true to keep
   * @param config.searchType - the type of tree traversal to do. Must be in constants.SearchTypes
   */
  *subtreeTraverse(
      prefix?: string,
      config: {pruner?: Pruner<T>, searchType?: SearchType}={}
  ): IterableIterator<KeyMatch<T>> {
    prefix = prefix || "";
    const pruner = config.pruner || defaultPruner;
    const searchType = config.searchType || SearchType.DepthFirstPostorder;

    if (searchType === SearchType.BreadFirst) {
      yield* this._subtreeTraverseBfs(prefix, pruner);
    } else {
      const preNotPost = searchType === SearchType.DepthFirstPreorder;
      yield* this._subtreeTraverseDfs(0, prefix, pruner, preNotPost);
    }
  }

  *_subtreeTraverseBfs(prefix: string, pruner: Pruner<T>): IterableIterator<KeyMatch<T>> {
    const visited = new Set();
    const next = new Deque<[number, string, RadixNode<T>]>();
    next.enqueue([0, prefix, this])

    while (!next.isEmpty()) {
      const [depth, prefix, node] = next.dequeue()
      if (!visited.has(node)) {
        visited.add(node);

        if (pruner(depth, prefix, node.b, node.v, node.c)) {
          yield {depth, key:prefix, hasValue:node.b, value:node.v, edges:node.c};

          for (const [k,child] of node.c.entries()) {
            if (!visited.has(child)) {
              next.enqueue([depth+1, prefix+k, child]);
            }
          }
        }
      }
    }
  }

  *_subtreeTraverseDfs(depth: number, prefix: string, pruner: Pruner<T>, preNotPost: boolean): IterableIterator<KeyMatch<T>> {
    if (pruner(depth, prefix, this.b, this.v, this.c)) {
      if (preNotPost) {
        yield {depth, key:prefix, hasValue:this.b, value:this.v, edges:this.c};
      }

      for (const [k,node] of this.c.entries()) {
        yield* node._subtreeTraverseDfs(depth+1, prefix+k, pruner, preNotPost);
      }

      if (!preNotPost) {
        yield {depth, key:prefix, hasValue:this.b, value:this.v, edges:this.c};
      }
    }
  }
}
