import { strict as assert } from "assert";
import { defaultPruner } from "../src/utils";
import RadixNode from "../src/radix-node";
import { SearchType } from "../src/constants";

describe("RadixNode", () => {
  describe(".addPrefixToChild(prefix, child)", () => {
    it("should create intermediary nodes correctly", () => {
      const originalKey = "tester";
      const value = "xxx";
      const prefix = "test";

      const childNode = new RadixNode(true, value)
      const node = new RadixNode();
      node.c.set(originalKey, childNode);

      node.addPrefixToChild(prefix, originalKey);

      assert(childNode === node.c.get(prefix).c.get(originalKey.slice(prefix.length)));
    });
  });

  describe(".subtreeTraverse(prefix, filter, searchType)", () => {
    let root: RadixNode<{ val: string, children?: Array<string>}>;
    let parent: RadixNode<{ val: string, children?: Array<string>}>;
    let children: Array<RadixNode<{ val: string, children?: Array<string>}>>;
    let grandchildren: Array<RadixNode<{ val: string, children?: Array<string>}>>;

    before(() => {
      // build the "tree" (just the nodes) for the following entries:
      // X:val1,
      //  Xa:val2,
      //   Xa1:val4, Xa2:val5
      //  Xb:val3,
      //   Xb1:val6, Xb2:val7

      grandchildren = [
        new RadixNode(true, { val: "val4" }),
        new RadixNode(true, { val: "val5" } ),
        new RadixNode(true, { val: "val6" } ),
        new RadixNode(true, { val: "val7" } ),
      ];

      children = [
        new RadixNode( true, { val: "val2", children: ["val4", "val5"] }, [
          ["1", grandchildren[0]],
          ["2", grandchildren[1]],
        ] ),
        new RadixNode( true, { val: "val3", children: ["val6", "val7"] }, [
          ["1", grandchildren[2]],
          ["2", grandchildren[3]],
        ] )
      ];

      parent = new RadixNode( true, { val: "val1", children: ["val2", "val3"] }, [
        ["a", children[0]],
        ["b", children[1]],
      ] );

      root = new RadixNode( true, { val: "val0", children: ["val1"] }, [
        ["X", parent],
      ] );
    });

    describe("depth first search - post order", () => {
      it("should yield nodes in post order (descendant first)", () => {
        // check that for every node visited, all its descendants are already visited
        const visited = new Set();

        const pruner = defaultPruner;
        const searchType = SearchType.DepthFirstPostorder;
        const config = { pruner, searchType };

        for (let {hasValue, value} of root.subtreeTraverse("", config)) {
          if (hasValue) {
            visited.add(value.val);
            if (value.children) {
              for (let childVal of value.children) {
                assert(visited.has(childVal));
              }
            }
          }
        }
      });
    });

    describe("depth first search - pre order", () => {
      it("should yield nodes in pre order (descendant last)", () => {
        // check that for every node visited, all its descendants are not yet visited
        const visited = new Set();

        const pruner = defaultPruner;
        const searchType = SearchType.DepthFirstPreorder;
        const config = { pruner, searchType };

        for (let {hasValue, value} of root.subtreeTraverse("", config)) {
          if (hasValue) {
            visited.add(value.val);
            if (value.children) {
              for (let childVal of value.children) {
                assert(!visited.has(childVal));
              }
            }
          }
        }
      });
    });

    describe("breadth first search", () => {
      it("should yield nodes in breadth order (shallowest first)", () => {
        // check that for every node visited, no nodes of greater depth have yet been visited
        const visitedDepths = new Set();

        const pruner = defaultPruner;
        const searchType = SearchType.BreadthFirst;
        const config = { pruner, searchType };

        for (let {depth, hasValue, value} of root.subtreeTraverse("", config)) {
          if (hasValue) {
            visitedDepths.add(depth);
            if (value.children) {
              assert(!visitedDepths.has(depth+1))
            }
          }
        }
      });
    });
  });
});
