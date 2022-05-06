[![Build Status](https://travis-ci.org/stumash/xradix.svg?branch=master)](https://travis-ci.com/stumash/xradix)

# xradix

A fast, clean, tested, and documented implementation of the [Radix Tree](https://en.wikipedia.org/wiki/Radix_tree) data structure.

Also, comes with special hooks for various tree-traversals starting at the first node matching a given prefix. These include depth-first (pre-order and post-order) and breadth-first.

This data structure is a performant and simple choice for implementing autocomplete.

## Examples

```typescript
const { RadixTree } = require('xradix');

const rt = new RadixTree<number>();
rt.set("xx",     1); // equivalently,
rt.set("xxA",    2); //
rt.set("xxB",    3); //
rt.set("xxC",    4); // new RadixTree([
rt.set("xxCxxA", 5); //   ["xx",     1], ["xxA",    2], ["xxB",  3], ["xxC",  4],
rt.set("xxCxxB", 6); //   ["xxCxxA", 5], ["xxCxxB", 6], ["xxCx", 7]
rt.set("xxCx",   7); // ])
```

which creates this tree, whose node depths are marked above it

<!-- some useful unicode characters:   ─ │ ┌ └ ┤ ├ -->

```
   0            1           2         3         4           5

                    ┌──A──( 2 )
                    ├──B──( 3 )
( root )──xx──( 1 )─┤                               ┌──A──( 5 )
                    └──C──( 4 )──x──( 7 )──x──( _ )─┤
                                                    └──B──( 6 )
```

this tree now has the following behaviour:

```typescript
rt.get("xxCx").value;// 7
rt.get("xxCx").depth;// 3

rt.get("not in the tree");// undefined

rt.getAll("");
/* generator* [
  { key: "xx",     value: 1, depth: 1, ... }, default traversal: DFS pre-order
  { key: "xxA",    value: 2, depth: 2, ... }, notice the node with no value is skipped
  { key: "xxB",    value: 3, depth: 2, ... },
  { key: "xxC",    value: 4, depth: 2, ... },
  { key: "xxCx",   value: 7, depth: 3, ... },
  { key: "xxCxxA", value: 5, depth: 4, ... },
  { key: "xxCxxB", value: 6, depth: 4, ... },
] */

rt.get("xxCxx");// undefined
rt.get("xxCxx", { allNodes: true });// {key: "xxCxx", value: undefined, depth: 4, ...}

rt.getAll("xxCxx", { allNodes: true });
/* generator* [
 { key: "xxCxx",  value: undefined, depth: 0, ... },
 { key: "xxcxxA", value: 6,         depth: 1, ... },
 { key: "xxCxxB", value: 5,         depth: 1, ... }, sibling nodes in random order
] */
```

## Support
<a href="https://www.buymeacoffee.com/afJNIsbfLk" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
