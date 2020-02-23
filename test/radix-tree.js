const assert = require("assert");

const { RadixTree } = require("~/src/radix-tree.js");
const { defaultPruner } = require("~/src/utils.js");
const { SEARCH_TYPES } = require("~/src/constants.js");

describe("RadixTree", () => {
  describe(".set(k, v) and .get(k)", () => {
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
          assert(rt.get(k).value === v)
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
        [ "bbbbb", "val6" ],
        [ "bbbbc", "val7" ],
      ];

      it("should retrieve every value for every inserted k,v pair", () => {
        kvpairs.forEach(([k, v]) => {
          rt.set(k, v);
        });
        kvpairs.forEach(([k, v]) => {
          assert(rt.get(k).value === v);
        });
      });

      it("should retrive every value for every insert k,v pair - no matter the insertion order", () => {
        kvpairs.slice().reverse().forEach(([k, v]) => {
          rt.set(k, v);
        });
        kvpairs.forEach(([k, v]) => {
          assert(rt.get(k).value === v);
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
        assert(rt.get("bbbb") === undefined);
      });
    });
  });

  describe(".getSearchRoot(prefix)", () => {
    const kvpairs = [
      ["ab", "val1"],
      ["abc1", "val2"],
      ["abc2", "val3"],
      ["xx", "val4"],
      ["xxxx", "val5"],
    ]

    let rt;
    beforeEach(() => {
      rt = new RadixTree();
      kvpairs.forEach(([k,v]) => rt.set(k, v));
    });

    it("should return an exact match where possible", () => {
      const searchRootResult = rt.getSearchRoot("ab")
      assert(searchRootResult !== undefined);
      const { extraPrefix, searchRoot } = searchRootResult;
      assert(extraPrefix === "");
      assert(searchRoot.b && searchRoot.v === "val1");
    });

    it("should return an intermediate, no-value node, if that node is the best match", () => {
      const searchRootResult = rt.getSearchRoot("abc");
      assert(searchRootResult !== undefined);
      const { extraPrefix, searchRoot } = searchRootResult;
      assert(extraPrefix === "");
      assert(searchRoot.b === false && searchRoot.v === undefined);
    });

    it("should return the nearest child node when no node is an exact match", () => {
      const searchRootResult = rt.getSearchRoot("xxx");
      assert(searchRootResult !== undefined);
      const { extraPrefix, searchRoot } = searchRootResult;
      assert(extraPrefix === "x");
      assert(searchRoot.b && searchRoot.v === "val5");
    });

    it("should return the root node when prefix is empty string", () => {
      const searchRootResult = rt.getSearchRoot("");
      assert(searchRootResult !== undefined);
      const { extraPrefix, searchRoot } = searchRootResult;
      assert(extraPrefix === "");
      assert(searchRoot === rt.root);
    });

    it("should return undefined if prefix has no matching nodes", () => {
      assert(undefined === rt.getSearchRoot("abc3"));
      assert(undefined === rt.getSearchRoot("abd"));
      assert(undefined === rt.getSearchRoot("xxxxx"));
      assert(undefined === rt.getSearchRoot("xy"));
    });
  });

  describe(".getAll(prefix, { pruner:defaultPruner, searchType:SEARCH_TYPES.DEPTH_FIRST_POST_ORDER })", () => {
    const rt = new RadixTree();
    const kvs = [
      "foobar", "foobark", "foobaz", "foo",
      "plop",   "pluck",   "plucky", "plunck"
    ];
    kvs.forEach(kv => rt.set(kv, kv));

    const pruner = defaultPruner;
    const searchType = SEARCH_TYPES.DEPTH_FIRST_POST_ORDER;
    const config = { pruner, searchType };

    it("should yield no elements when the prefix is not in the tree", () => {
      let enteredLoop = false;

      for (const _ of rt.getAll("junk", config)) {
        enteredLoop = true;
      }

      assert(!enteredLoop);
    });

    it("should yield a prefixMatch for every value in the tree when prefix is ''", () => {
      const vals = new Set();
      for (const { value } of rt.getAll("", { pruner, searchType })) {
        vals.add(value);
      }

      kvs.forEach(kv => assert(vals.has(kv)));
    });

    it("should yield all prefixMatch objects for which their key k starts with prefix", () => {
      for (const k of kvs) {
        for (const { value } of rt.getAll(k)) {
          assert(value.startsWith(k));
        }
      }
    });
  });

  describe(".delete(k)", () => {
    let rt;
    const keys = [
      "foobar", "foobark", "foobaz", "foo",
      "plop",   "pluck",   "plucky", "plunck"
    ];

    beforeEach(() => {
      rt = new RadixTree(keys.map(k => [k, true]));
    });

    it("should find all keys before deletion", () => {
      keys.forEach(k => assert(rt.get(k)));
    });

    it("should find all remaining keys after each deletion", () => {
      let remainingKvs = keys.map(kv => kv);
      keys.forEach(kv => {
        rt.delete(kv);
        remainingKvs.splice(remainingKvs.indexOf(kv), 1); // remove kv from remainingKvs

        remainingKvs.forEach(remainingKv => {
          assert(rt.get(remainingKv))
        });
      });
    });

    it("should not find any deleted keys after each deletion", () => {
      let deletedKvs = [];
      keys.forEach(kv => {
        deletedKvs.push(kv);
        rt.delete(kv);

        deletedKvs.forEach(kv => {
            assert(rt.get(kv) === undefined) // not found
        })
      });
    });
  });

  describe("integration tests", () => {
    // TODO FIXME
  });
});
