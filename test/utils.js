const assert = require("assert");
const {
  increasingPrefixesOf,
  decreasingPrefixesOf,
  longestSharedPrefix,
  findKeyHavingSharedPrefix,
} = require("~/src/utils");

describe("utils", () => {
  describe("#increasingPrefixesOf(s)", () => {
    it("should return *['a', 'ab', 'abc'] for 'abc'", () => {
      const incPrefixes = increasingPrefixesOf("abc");

      const firstPrefix  = incPrefixes.next();
      const secondPrefix = incPrefixes.next();
      const thirdPrefix  = incPrefixes.next();
      const fourthPrefix = incPrefixes.next();

      assert(!firstPrefix.done  && firstPrefix.value === "a");
      assert(!secondPrefix.done && secondPrefix.value === "ab");
      assert(!thirdPrefix.done  && thirdPrefix.value === "abc");
      assert(fourthPrefix.done);
    });

    it("should return *[] for ''", () => {
      const incPrefixes = increasingPrefixesOf("");
      assert(incPrefixes.next().done)
    });
  });

  describe("#decreasingPrefixesOf(s)", () => {
    it("should return *['abc', 'ab', 'a'] for 'abc'", () => {
      const decPrefixes = decreasingPrefixesOf("abc");

      const firstPrefix  = decPrefixes.next();
      const secondPrefix = decPrefixes.next();
      const thirdPrefix  = decPrefixes.next();
      const fourthPrefix = decPrefixes.next();

      assert(!firstPrefix.done  && firstPrefix.value === "abc");
      assert(!secondPrefix.done && secondPrefix.value === "ab");
      assert(!thirdPrefix.done  && thirdPrefix.value === "a");
      assert(fourthPrefix.done);
    });

    it("should return *[] for ''", () => {
      const decPrefixes = decreasingPrefixesOf("");
      assert(decPrefixes.next().done);
    });
  });

  describe("#longestSharedPrefix(s1, s2)", () => {
    it("should return the longest shared prefix when one exists", () => {
      assert(longestSharedPrefix("abc", "abcd") === "abc");
      assert(longestSharedPrefix("abc", "axxx") === "a");
    });

    it("should return undefined if no shared prefix exists", () => {
      assert(longestSharedPrefix("abc", "def") === undefined);
    });

    it("should return undefined if either s1 or s2 is empty", () => {
      assert(longestSharedPrefix("", "abc") === undefined);
      assert(longestSharedPrefix("abc", "") === undefined);
      assert(longestSharedPrefix("", "") === undefined);
    });
  });

  describe("#findKeyHavingSharedPrefix(m, s)", () => {
    it("should return the key having a shared prefix if one exists", () => {
      const key = "foobar";
      const s = "foo";
      const m = new Map([ [key, 17] ]);
      assert(findKeyHavingSharedPrefix(m, s) === key);
    });

    it("should return undefined if there is no key in m sharing a prefix with s", () => {
      const s = "XXxxXX";
      const m = new Map([ ["foobar", 17], ["dazy", 6] ]);
      assert(findKeyHavingSharedPrefix(m, s) === undefined);
    });

    it("should return undefined for an empty map", () => {
      const s = "foo";
      const m = new Map()
      assert(findKeyHavingSharedPrefix(m, s) === undefined);
    });

    it("should return undefined for empty string s", () => {
      const s = "";
      const m = new Map([ ["foobar", 17], ["dazy", 6] ]);
      assert(findKeyHavingSharedPrefix(m, s) === undefined);
    });
  });
});
