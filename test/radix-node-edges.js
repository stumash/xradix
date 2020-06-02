const assert = require("assert");
const { RadixNodeEdges } = require("../src/radix-node-edges");

describe("RadixNodeEdges", () => {
  describe(".set(k,v) .get(k)", () => {
    it("should find every inserted k,v pair", () => {
      const edgesList = new RadixNodeEdges();
      edgesList.set("hello", "val1");
      edgesList.set("world", "val2");
      assert(edgesList.get("hello") == "val1");
      assert(edgesList.get("world") == "val2");
    });

    it("should only allow one key per first char", () => {
      const edgesList = new RadixNodeEdges();
      edgesList.set("abcd", "val1");
      edgesList.set("abc", "val2");
      assert(edgesList.get("abcd") == undefined);
      assert(edgesList.get("abc") == "val2");
    });
  });

  describe(".findKeyHavingSharedPrefix(prefix)", () => {
    it("should find keys sharing prefixes", () => {
      const edgesList = new RadixNodeEdges();
      edgesList.set("hello", "val1");
      assert(edgesList.findKeyHavingSharedPrefix("h") === "hello");
      assert(edgesList.findKeyHavingSharedPrefix("he") === "hello");
      assert(edgesList.findKeyHavingSharedPrefix("hel") === "hello");
      assert(edgesList.findKeyHavingSharedPrefix("hell") === "hello");
      assert(edgesList.findKeyHavingSharedPrefix("hello") === "hello");
      assert(edgesList.findKeyHavingSharedPrefix("hello, world") === "hello");
    });
  });

  describe(".delete(k)", () => {
    it("should not find deleted entries", () => {
      const edgesList = new RadixNodeEdges();
      edgesList.set("hello", "val1");
      edgesList.set("there", "val2");
      assert(edgesList.get("hello") === "val1");
      assert(edgesList.get("there") === "val2");
      edgesList.delete("hello");
      assert(edgesList.get("hello") === undefined);
      assert(edgesList.get("there") === "val2");
      edgesList.delete("there");
      assert(edgesList.get("there") === undefined);
    });
  });
});
