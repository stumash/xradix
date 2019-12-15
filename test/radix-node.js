const assert = require("assert");

const { RadixNode } = require("~/src/radix-node.js");
const { SEARCH_TYPES } = require("~/src/constants.js");

describe("RadixNode", () => {
  describe(".addPrefixToChild(prefix, child)", () => {
    it("should create intermediary nodes correctly", () => {
      const originalKey = "tester";
      const value = "xxx";
      const prefix = "test";

      const childNode = new RadixNode({ b:true, v:value })
      const node = new RadixNode();
      node.c.set(originalKey, childNode);

      node.addPrefixToChild(prefix, originalKey);

      assert(childNode === node.c.get(prefix).c.get(originalKey.slice(prefix.length)));
    });
  });

  describe(".subtreeTraverse(prefix, filter, searchType)", () => {
    let root;
    let parent;
    let children;
    let grandchildren;

    before(() => {
      // build the "tree" (just the nodes) for the following entries:
      // X:val1,
      //  Xa:val2,
      //   Xa1:val4, Xa2:val5
      //  Xb:val3,
      //   Xb1:val6, Xb2:val7

      grandchildren = [
        new RadixNode({ b: true, v: 4 }),
        new RadixNode({ b: true, v: 5 }),
        new RadixNode({ b: true, v: 6 }),
        new RadixNode({ b: true, v: 7 }),
      ];

      children = [
        new RadixNode({ b: true, v: 2, c: [
          ["1", grandchildren[0]],
          ["2", grandchildren[1]],
        ] }),
        new RadixNode({ b: true, v: 3, c: [
          ["1", grandchildren[2]],
          ["2", grandchildren[3]],
        ] })
      ];

      parent = new RadixNode({ b: true, v: 1, c: [
        ["a", children[0]],
        ["b", children[1]],
      ] });

      root = new RadixNode({ c: [ ["X", parent] ] });
    });

    describe("depth first search - post order", () => {
      it("should yield nodes in post order", () => {
        // check that for every node visited, all its ancestors are already visited
        visited = new Set();

        const prune = (d,k,b,v) => true;
        const searchType = SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;
        for (let [depth, key, hasValue, value] of root.subtreeTraverse("", prune, searchType)) {
          // TODO: do check that children are already visited

        }
      });
    });

    describe("depth first search - pre order", () => {
      it("should yield nodes in pre order", () => {
        // TODO
      });
    });

    describe("breadth first search", () => {
      it("should yield nodes in breadth order", () => {
        // TODO
      });
    });
  });
});
