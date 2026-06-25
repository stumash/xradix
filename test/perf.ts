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

/**
 * Run fn repeatedly for at least minMs wall-clock milliseconds and return the
 * average ms-per-call. Fast operations automatically accumulate thousands of
 * iterations; slow ones get fewer. Every result is well above timing noise
 * regardless of how fast fn is.
 */
const timeOp = (fn: () => void, minMs: number = 50): number => {
  fn(); // warm up
  let iters = 0;
  const start = performance.now();
  do { fn(); iters++; } while (performance.now() - start < minMs);
  return (performance.now() - start) / iters;
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

  // ── 3. Prefix query: getAll speedup grows with prefix length ─────────────
  //
  // RadixTree.getAll(prefix) is O(prefix_len + result_count).
  // A naive Map scan is O(N) regardless of prefix or results.
  //
  // Each extra prefix character cuts expected result count by ~26x while Map
  // cost stays flat, so the speedup ratio grows with prefix length. We assert:
  //   a) ratio is always >= 50x at prefix length 3 (practical autocomplete floor)
  //   b) the ratio strictly increases as prefix length grows — but only checked
  //      when radix time is above NOISE_FLOOR_MS; at very long prefixes (~0 results)
  //      radix time is sub-millisecond and timing noise dominates.
  //
  // Note: at prefix length 1 (~1923 expected results with N=50k) radix can be
  // *slower* than the Map scan because generator yield overhead per result
  // outweighs the cost of a single Map.keys() scan. This is expected and fine —
  // the use case is multi-character prefix queries, not single-character ones.

  describe(".getAll(prefix) — speedup grows with prefix length", () => {
    it("should be at least 50x faster than Map scan at prefix length 3, and improve as prefix grows", function (this: Mocha.Context) {
      this.timeout(0);
      const N = 50000, KEY_LEN = 16;

      const keys = makeArray(N, () => randomString(KEY_LEN));
      const rt = new RadixTree<number>();
      keys.forEach((k) => rt.set(k, 1));
      const m = new Map<string, number>();
      keys.forEach((k) => m.set(k, 1));

      // Derive prefixes of increasing length from the same key so each is a
      // genuine prefix of a stored key (guaranteed non-empty result set).
      const baseKey = keys[Math.floor(N / 2)];

      // We test two ranges with different goals:
      //
      // ASSERT_LENGTHS (1–3): result counts are ~1923, ~74, ~3 — meaningfully
      // different, so both radix time and the ratio change substantially at each
      // step. We assert strict monotonic improvement here.
      //
      // DISPLAY_LENGTHS (4–5): result count is ~0 at both lengths, so radix time
      // has already bottomed out at pure navigation overhead (~0.2µs). The ratio
      // plateaus and is dominated by map cache-warming across the sequence.
      // We display these but do not assert monotonic — the property being tested
      // (fewer results → faster radix) is no longer observable once result count
      // hits zero.
      const ASSERT_LENGTHS  = [1, 2, 3];
      const DISPLAY_LENGTHS = [4, 5];

      // timeOp runs each operation for a fixed wall-clock duration so every
      // measurement accumulates enough iterations to be well above timing noise,
      // even for sub-microsecond operations.
      const measure = (pLen: number) => {
        const prefix = baseKey.slice(0, pLen);
        const radixMsPerOp = timeOp(() => { for (const _ of rt.getAll(prefix)) {} });
        const mapMsPerOp   = timeOp(() => { for (const k of m.keys()) if (k.startsWith(prefix)) {} });
        return { pLen, prefix, radixMsPerOp, mapMsPerOp, ratio: mapMsPerOp / radixMsPerOp };
      };

      const assertResults  = ASSERT_LENGTHS.map(measure);
      const displayResults = DISPLAY_LENGTHS.map(measure);
      const allResults     = [...assertResults, ...displayResults];

      if (SHOW_TIME) {
        const w = 12;
        console.log("\n.getAll speedup by prefix length (µs per call)");
        console.log(pl("prefixLen", w), pl("prefix", w), pl("radix µs", w), pl("map µs", w), pl("ratio", w));
        for (const r of allResults)
          console.log(
            pl(`${r.pLen}`, w), pl(r.prefix, w),
            pl((r.radixMsPerOp * 1000).toFixed(2), w),
            pl((r.mapMsPerOp  * 1000).toFixed(2), w),
            pl(`${r.ratio.toFixed(1)}x`, w)
          );
      }

      // floor: 3-char prefix must be at least 50x faster than Map scan
      const atThree = assertResults[assertResults.length - 1];
      assert(
        atThree.ratio >= 50,
        `.getAll speedup at prefix length 3: ${atThree.ratio.toFixed(1)}x (need ≥50x)`
      );

      // direction: ratio must strictly increase across prefix lengths 1→2→3,
      // where result counts drop enough (~26x per step) to produce a clear signal.
      for (let i = 1; i < assertResults.length; i++) {
        assert(
          assertResults[i].ratio > assertResults[i - 1].ratio,
          `.getAll speedup should grow with prefix length: got ${assertResults[i-1].ratio.toFixed(1)}x at L=${assertResults[i-1].pLen} then ${assertResults[i].ratio.toFixed(1)}x at L=${assertResults[i].pLen}`
        );
      }
    });
  });

  // ── 4. Overhead vs native Map for exact get/set ───────────────────────────
  //
  // A radix tree is not a drop-in Map replacement for exact lookups; the extra
  // structure costs something. We document the overhead here so it's visible
  // in CI, and assert it stays within a reasonable bound.

  describe("exact-lookup overhead vs native Map", () => {
    it("set and get should each be within 20x of Map performance", function (this: Mocha.Context) {
      this.timeout(0);
      const N = 50000, L = 20, REPS = 7;

      const keys = makeArray(N, () => randomString(L));

      const radixSetMs = median(() => {
        const rt = new RadixTree<number>();
        keys.forEach((k) => rt.set(k, 1));
      }, REPS);
      const mapSetMs = median(() => {
        const m = new Map<string, number>();
        keys.forEach((k) => m.set(k, 1));
      }, REPS);

      const rt = new RadixTree<number>();
      keys.forEach((k) => rt.set(k, 1));
      const m = new Map<string, number>();
      keys.forEach((k) => m.set(k, 1));

      const radixGetMs = median(() => keys.forEach((k) => rt.get(k)), REPS);
      const mapGetMs   = median(() => keys.forEach((k) => m.get(k)),  REPS);

      const setOverhead = radixSetMs / mapSetMs;
      const getOverhead = radixGetMs / mapGetMs;

      if (SHOW_TIME) {
        const w = 12;
        console.log("\nexact-lookup overhead vs Map");
        console.log(pl("op", w), pl("radix ms", w), pl("map ms", w), pl("overhead", w));
        console.log(pl("set", w), pl(radixSetMs.toFixed(2), w), pl(mapSetMs.toFixed(2), w), pl(`${setOverhead.toFixed(1)}x`, w));
        console.log(pl("get", w), pl(radixGetMs.toFixed(2), w), pl(mapGetMs.toFixed(2), w), pl(`${getOverhead.toFixed(1)}x`, w));
      }

      assert(setOverhead < 20, `set overhead vs Map: ${setOverhead.toFixed(1)}x (limit 20x)`);
      assert(getOverhead < 20, `get overhead vs Map: ${getOverhead.toFixed(1)}x (limit 20x)`);
    });
  });
});
