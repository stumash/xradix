import RadixNodeEdges from "./radix-node-edges"
import RadixNode from "./radix-node"

/**
 * Types of tree traversals
 *
 * @enum {string}
 */
enum SearchType {
  BreadFirst = "BREADTH_FIRST",
  DepthFirstPreorder = "DEPTH_FIRST_PRE_ORDER",
  DepthFirstPostorder = "DEPTH_FIRST_POST_ORDER",
};

/**
 * @callback Pruner
 *
 * @template T
 * @param {number} depth            - the depth of the current node from the searchRoot
 * @param {string} key              - the key associated with the current node
 * @param {boolean} hasValue        - whether or not there is a value associated to the key of the current node
 * @param {T} value                 - the value associated to the key of the current node
 * @param {RadixNodeEdges<T>} edges - edges to the child nodes
 *
 * @returns false to prune the node, true to keep it and its descendants in the search
 */
type Pruner<T> = (depth: number, key: string, hasValue: boolean, value: T, edges: RadixNodeEdges<T>) => boolean;

/**
 * @typedef KeyMatch
 *
 * @property depth
 * @property key
 * @property hasValue
 * @property value
 * @property edges
 */
type KeyMatch<T> = { depth: number, key: string, hasValue: boolean, value: T|undefined, edges: RadixNodeEdges<T> };

/**
 * @typedef SearchRootMatch
 *
 * @property extraPrefix
 * @property searchRoot
 */
type SearchRootMatch<T> = { extraPrefix: string, searchRoot: RadixNode<T> };

export {
    SearchType,
    Pruner,
    KeyMatch,
    SearchRootMatch,
};
