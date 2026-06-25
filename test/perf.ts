import RadixTree from "../src/radix-tree";
import { plot } from "asciichart";
import { performance } from "perf_hooks";
import { strict as assert } from "assert";

// ─── helpers ──────────────────────────────────────────────────────────────────

const lower_letters = "abcdefghijklmnopqrstuvwxyz";

const randomString = (size: number): string => {
  let result = "";
  for (let i = 0; i < size; i++)
    result += lower_letters[Math.floor(Math.random() * 26)];
  return result;
};

const makeArray = <T>(size: number, f: (i: number) => T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < size; i++) result.push(f(i));
  return result;
};

/** Run fn `reps` times and return the median duration in ms. */
const median = (fn: () => void, reps: number): number => {
  const xs: number[] = [];
  for (let i = 0; i < reps; i++) {
    const t = performance.now();
    fn();
    xs.push(performance.now() - t);
  }
  xs.sort((a, b) => a - b);
  return xs[xs.length >> 1];
};

const parseBool = (s: any) =>
  s === "true" ? true : s === "false" ? false : undefined;
const [SHOW_PLOT, SHOW_TIME] = [
  parseBool(process.env["SHOW_PLOT"]),
  parseBool(process.env["SHOW_TIME"]),
];
const pl = (s: string, w: number) => s.padStart(w);

const printResults = (
  label: string,
  points: { x: number; xLabel: string; durationMs: number }[],
  opsPerPoint: number
) => {
  if (SHOW_PLOT) console.log(label, "\n" + plot(points.map((p) => p.durationMs)));
  if (SHOW_TIME) {
    const w = 16;
    console.log("\n" + label);
    console.log(pl(points[0].xLabel, w), pl("total ms", w), pl("per-op µs", w));
    for (const p of points)
      console.log(
        pl(`${p.x}`, w),
        pl(p.durationMs.toFixed(2), w),
        pl(((p.durationMs / opsPerPoint) * 1000).toFixed(3), w)
      );
  }
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe("RadixTree Performance", function () {
  // ── 1. Scaling with key length L (fixed N=2000) ───────────────────────────
  //
  // Measure at L = 50, 100, 200, 400. When L doubles, time should at most
  // double (linear). If the ratio exceeds 4.0 for any doubling step that
  // indicates quadratic or worse growth in L.
  //
  // Why 4.0: a truly quadratic algorithm produces ratio ≈ 4; we allow up to
  // 4.0 to account for measurement noise while still catching quadratic.

  const L_SCALE_N = 2000;
  const L_POINTS = [50, 100, 200, 400];
  const L_REPS = 5; // median of 5 runs per point

  describe(".set(k,v) — key-length scaling", () => {
    it("time should grow at most linearly with key length L", function (this: Mocha.Context) {
      this.timeout(0);
      const results = L_POINTS.map((L) => {
        const keys = makeArray(L_SCALE_N, () => randomString(L));
        return {
          x: L,
          xLabel: "keyLen",
          durationMs: median(() => {
            const rt = new RadixTree<number>();
            keys.forEach((k) => rt.set(k, 1));
          }, L_REPS),
        };
      });
      printResults(".set key-length scaling", results, L_SCALE_N);
      for (let i = 1; i < results.length; i++) {
        const ratio = results[i].durationMs / results[i - 1].durationMs;
        assert(
          ratio < 4.0,
          `.set time ratio at L=${results[i].x} vs L=${results[i-1].x}: ${ratio.toFixed(2)} ≥ 4.0 (suggests super-linear growth)`
        );
      }
    });
  });

  describe(".get(k) — key-length scaling", () => {
    it("time should grow at most linearly with key length L", function (this: Mocha.Context) {
      this.timeout(0);
      const results = L_POINTS.map((L) => {
        const keys = makeArray(L_SCALE_N, () => randomString(L));
        const rt = new RadixTree<number>();
        keys.forEach((k) => rt.set(k, 1));
        return {
          x: L,
          xLabel: "keyLen",
          durationMs: median(() => keys.forEach((k) => rt.get(k)), L_REPS),
        };
      });
      printResults(".get key-length scaling", results, L_SCALE_N);
      for (let i = 1; i < results.length; i++) {
        const ratio = results[i].durationMs / results[i - 1].durationMs;
        assert(
          ratio < 4.0,
          `.get time ratio at L=${results[i].x} vs L=${results[i-1].x}: ${ratio.toFixed(2)} ≥ 4.0 (suggests super-linear growth)`
        );
      }
    });
  });

  describe(".delete(k) — key-length scaling", () => {
    it("time should grow at most linearly with key length L", function (this: Mocha.Context) {
      this.timeout(0);
      const results = L_POINTS.map((L) => {
        const keys = makeArray(L_SCALE_N, () => randomString(L));
        const rt = new RadixTree<number>();
        keys.forEach((k) => rt.set(k, 1));
        return {
          x: L,
          xLabel: "keyLen",
          durationMs: median(() => keys.forEach((k) => rt.delete(k)), L_REPS),
        };
      });
      printResults(".delete key-length scaling", results, L_SCALE_N);
      for (let i = 1; i < results.length; i++) {
        const ratio = results[i].durationMs / results[i - 1].durationMs;
        assert(
          ratio < 4.0,
          `.delete time ratio at L=${results[i].x} vs L=${results[i-1].x}: ${ratio.toFixed(2)} ≥ 4.0 (suggests super-linear growth)`
        );
      }
    });
  });

  // ── 2. Scaling with N (number of stored keys, fixed L=20) ─────────────────
  //
  // Radix tree operations are O(L) per op, independent of N, so per-op time
  // should be roughly flat as N grows. We test N = 2k → 8k → 32k (4x steps).
  //
  // The bound is generous (6x) to account for CPU cache pressure on larger
  // trees, while still catching a genuinely O(N) implementation.

  describe("scaling with N (number of stored keys)", () => {
    it("per-op time for set/get/delete should not grow super-linearly with N", function (this: Mocha.Context) {
      this.timeout(0);
      const L = 20;
      const N_POINTS = [2000, 8000, 32000];
      const N_REPS = 5;

      type Row = { N: number; setPerOp: number; getPerOp: number; delPerOp: number };
      const rows: Row[] = N_POINTS.map((N) => {
        const keys = makeArray(N, () => randomString(L));
        const setMs = median(() => {
          const rt = new RadixTree<number>();
          keys.forEach((k) => rt.set(k, 1));
        }, N_REPS);
        const rt = new RadixTree<number>();
        keys.forEach((k) => rt.set(k, 1));
        const getMs = median(() => keys.forEach((k) => rt.get(k)), N_REPS);
        const rt2 = new RadixTree<number>();
        keys.forEach((k) => rt2.set(k, 1));
        const delMs = median(() => keys.forEach((k) => rt2.delete(k)), N_REPS);
        return { N, setPerOp: setMs / N, getPerOp: getMs / N, delPerOp: delMs / N };
      });

      if (SHOW_TIME) {
        const w = 10;
        console.log("\nscaling with N (per-op ms)");
        console.log(pl("N", w), pl("set", w), pl("get", w), pl("delete", w));
        for (const r of rows)
          console.log(
            pl(`${r.N}`, w),
            pl(r.setPerOp.toFixed(4), w),
            pl(r.getPerOp.toFixed(4), w),
            pl(r.delPerOp.toFixed(4), w)
          );
      }

      const small = rows[0], large = rows[rows.length - 1];
      const setRatio  = large.setPerOp  / small.setPerOp;
      const getRatio  = large.getPerOp  / small.getPerOp;
      const delRatio  = large.delPerOp  / small.delPerOp;
      const MAX_RATIO = 6.0;
      assert(setRatio < MAX_RATIO,
        `set per-op at N=${large.N} vs N=${small.N}: ${setRatio.toFixed(2)}x (limit ${MAX_RATIO}x)`);
      assert(getRatio < MAX_RATIO,
        `get per-op at N=${large.N} vs N=${small.N}: ${getRatio.toFixed(2)}x (limit ${MAX_RATIO}x)`);
      assert(delRatio < MAX_RATIO,
        `delete per-op at N=${large.N} vs N=${small.N}: ${delRatio.toFixed(2)}x (limit ${MAX_RATIO}x)`);
    });
  });

  // ── 3. Prefix query: getAll vs naive Map scan ──────────────────────────────
  //
  // The whole point of a radix tree over a plain Map is prefix lookup:
  //   RadixTree.getAll(prefix) → O(prefix_len + result_count)
  //   Map scan                 → O(N * prefix_len)   always
  //
  // With N=50k and a 2-char prefix (~74 expected matches), the radix tree
  // should be comfortably faster. We assert a minimum 10x advantage to give
  // the CI headroom while still proving the fundamental property.

  describe(".getAll(prefix) — prefix query advantage", () => {
    it("should be faster than naive Map scan", function (this: Mocha.Context) {
      this.timeout(0);
      const N = 50000, L = 16, ITERS = 500;

      // Build tree and map from the same keys
      const keys = makeArray(N, () => randomString(L));
      const rt = new RadixTree<number>();
      keys.forEach((k) => rt.set(k, 1));
      const m = new Map<string, number>();
      keys.forEach((k) => m.set(k, 1));

      // Use a 2-char prefix derived from an actual key so it's guaranteed to
      // match at least one entry; on average ~74 matches with 50k/26^2 keys.
      const prefix = keys[Math.floor(N / 2)].slice(0, 2);

      const radixMs = median(() => {
        for (let i = 0; i < ITERS; i++) for (const _ of rt.getAll(prefix)) {}
      }, 5);

      const mapMs = median(() => {
        for (let i = 0; i < ITERS; i++)
          for (const k of m.keys()) if (k.startsWith(prefix)) {}
      }, 5);

      if (SHOW_TIME) {
        console.log(
          `\n.getAll('${prefix}') x${ITERS}: radix ${radixMs.toFixed(1)}ms  map-scan ${mapMs.toFixed(1)}ms  ratio ${(mapMs / radixMs).toFixed(1)}x`
        );
      }

      const speedup = mapMs / radixMs;
      assert(
        speedup >= 10,
        `radix getAll not fast enough vs Map scan: ${radixMs.toFixed(1)}ms vs ${mapMs.toFixed(1)}ms (${speedup.toFixed(1)}x, need ≥10x)`
      );
    });
  });
});
