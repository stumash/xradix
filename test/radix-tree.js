const assert = require("assert");

const { RadixTree } = require("~/src/radix-tree.js");

describe("RadixTree", () => {
  describe(".set(k, v) .get(k)", () => {
    let rt;

    beforeEach(() => {
      rt = new RadixTree();
    });

    describe("for 'orthogonal' kvpairs (keys that share no prefixes)", () => {
      const orthogonal_kvpairs = [
        [ 'aaaa', 'val1' ],
        [ 'bbbb', 'val2' ],
        [ 'cccc', 'val3' ],
      ];

      beforeEach(() => {
        orthogonal_kvpairs.forEach(([k, v]) => rt.set(k, v));
      });

      it("should retrieve every value for every inserted k,v pair", () => {
        orthogonal_kvpairs.forEach(([k, v]) => {
          assert(rt.get(k) === v)
        });
      });

      it("should have depth 1", () => {
        orthogonal_kvpairs.forEach(([k, v]) => {
          assert(rt.root.c.get(k).c.size === 0);
        });
      });

      it("should have no other keys in the root", () => {
        assert(rt.root.c.size === orthogonal_kvpairs.length);
      });

      it("should return undefined when key not found", () => {
        assert(rt.get("aaa") === undefined);
        assert(rt.get("aaaaa") === undefined);
      });
    });

    describe("for 'intersecting' kvpairs (keys that share prefixes)", () => {
      const kvpairs = [
        [ "aaa", "val1" ],
        [ "aaaa", "val2" ],
        [ "aaaaa", "val3" ],
        [ "aaaab", "val4" ],
        [ "bbb", "val5" ],
      ];

      it("should retrieve every value for every inserted k,v pair", () => {
        kvpairs.forEach(([k, v]) => {
          rt.set(k, v);
        });
        kvpairs.forEach(([k, v]) => {
          assert(rt.get(k) === v);
        });
      });

      it("should retrive every value for every insert k,v pair - no matter the insertion order", () => {
        kvpairs.slice().reverse().forEach(([k, v]) => {
          rt.set(k, v);
        });
        kvpairs.forEach(([k, v]) => {
          assert(rt.get(k) === v);
        });
      });

      it("should have correct structure after insertion of k,v pairs", () => {
        kvpairs.forEach(([k, v]) => {
          rt.set(k, v);
        });

        assert(rt.root.c.size === 2);
        assert(rt.root.c.has("aaa"));
        assert(rt.root.c.has("bbb"));

        assert(rt.root.c.get("aaa").c.size === 1);
        assert(rt.root.c.get("aaa").c.has("a"));

        assert(rt.root.c.get("aaa").c.get("a").c.size === 2);
        assert(rt.root.c.get("aaa").c.get("a").c.has("a"));
        assert(rt.root.c.get("aaa").c.get("a").c.has("b"));
      });

      it("should have correct structure after insertion of k,v pairs - no matter insertion order", () => {
        kvpairs.slice().reverse().forEach(([k, v]) => {
          rt.set(k, v);
        });

        assert(rt.root.c.size === 2);
        assert(rt.root.c.has("aaa"));
        assert(rt.root.c.has("bbb"));

        assert(rt.root.c.get("aaa").c.size === 1);
        assert(rt.root.c.get("aaa").c.has("a"));

        assert(rt.root.c.get("aaa").c.get("a").c.size === 2);
        assert(rt.root.c.get("aaa").c.get("a").c.has("a"));
        assert(rt.root.c.get("aaa").c.get("a").c.has("b"));
      });

      it("should return undefined when key not found", () => {
        assert(rt.get("aaab") === undefined);
        assert(rt.get("aaaaab") === undefined);
        assert(rt.get("aaaaba") === undefined);
      });
    });
  });
});
