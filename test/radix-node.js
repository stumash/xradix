const assert = require("assert");

const { RadixNode } = require("~/src/radix-node.js");

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
});
