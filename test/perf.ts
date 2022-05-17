import RadixTree from "../src/radix-tree";
import { plot } from "asciichart";
import { performance } from "perf_hooks"
import { strict as assert } from "assert";
import { linear as linear_regression } from "regression";

/**
 * Generate a random string of lowercase letters of a given size, else empty string
 *
 * @return string a random string of @size lowercase letters
 */
const randomString: ((_: number) => string) = size => {
  let result = ""
  for (let i = 0; i < size; i++) {
    result += random_lower_letter()
  }
  return result
}

const lower_letters = "abcdefghijklmnopqrstuvwxyz"
const random_lower_letter: () => string =
  () => lower_letters[Math.floor(Math.random() * lower_letters.length)]

describe("RadixTree Performance", function() {
  const OPS_PER_ITER = 1000

  const MAX_KEY_SIZE = 1000
  const KEY_SIZE_RANGE = Array.from(range(5, MAX_KEY_SIZE, 5))

  describe(".set(k, v)", () => {
    it("insertion speed should be linear in keySize", function(this: Mocha.Context) {
      this.timeout(0) // let this be slow test

      // maximum permitted regression slope
      const MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE = 35 / MAX_KEY_SIZE
      // minimum permitted r2
      const MIN_ALLOWED_R2 = 0.70

      const results = KEY_SIZE_RANGE.map(keySize => {
        const toInsert = makeArray(OPS_PER_ITER, () => randomString(keySize))
        const rt = new RadixTree<string>()

        const start = performance.now()
        toInsert.forEach(s => rt.set(s, undefined))
        return { keySize, durationMs: performance.now() - start }
      })

      console.log(plot(results.map(r => r.durationMs)))

      const regression_result = linear_regression(results.map((r) => [r.keySize, r.durationMs]))
      const r2 = regression_result.r2
      assert(
        regression_result.r2 >= MIN_ALLOWED_R2,
        `r2:${r2} < ${MIN_ALLOWED_R2} too small`,
      )
      const slope = regression_result.equation[0]
      assert(
        slope <= MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE,
        `slope:${slope} > ${MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE} too steep`,
      )
    })
  })

  describe(".get(k)", () => {
    it("lookup speed should be linear in keySize", function(this: Mocha.Context) {
      this.timeout(0) // let this be slow test

      // maximum permitted regression slope
      const MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE = 24 / MAX_KEY_SIZE
      // minimum permitted r2
      const MIN_ALLOWED_R2 = 0.70

      const results = KEY_SIZE_RANGE.map(size => {
        const toInsert = makeArray(OPS_PER_ITER, () => randomString(size))
        const rt = new RadixTree<string>()
        toInsert.forEach(s => rt.set(s, undefined))

        const start = performance.now()
        toInsert.forEach(s => rt.get(s))
        return { keySize: size , durationMs: performance.now() - start }
      })

      console.log(plot(results.map(r => r.durationMs)))

      const regression_result = linear_regression(results.map((r) => [r.keySize, r.durationMs]))
      const r2 = regression_result.r2
      assert(
        regression_result.r2 >= MIN_ALLOWED_R2,
        `r2:${r2} < ${MIN_ALLOWED_R2} too small`,
      )
      const slope = regression_result.equation[0]
      assert(
        slope <= MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE,
        `slope:${slope} > ${MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE} too steep`,
      )
    })
  })

  describe(".delete(k)", () => {
    it("deletion speed should be linear in keySize", function(this: Mocha.Context) {
      this.timeout(0) // let this be slow test

      // maximum permitted regression slope
      const MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE = 24 / MAX_KEY_SIZE
      // minimum permitted r2
      const MIN_ALLOWED_R2 = 0.70

      const results = KEY_SIZE_RANGE.map(keySize => {
        const toInsert = makeArray(OPS_PER_ITER, () => randomString(keySize))
        const rt = new RadixTree<string>()
        toInsert.forEach(s => rt.set(s, undefined))

        const start = performance.now()
        toInsert.forEach(s => rt.delete(s))
        return { keySize , durationMs: performance.now() - start }
      })

      console.log(plot(results.map(r => r.durationMs)))

      const regression_result = linear_regression(results.map((r) => [r.keySize, r.durationMs]))
      const r2 = regression_result.r2
      assert(
        regression_result.r2 >= MIN_ALLOWED_R2,
        `r2:${r2} < ${MIN_ALLOWED_R2} too small`,
      )
      const slope = regression_result.equation[0]
      assert(
        slope <= MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE,
        `slope:${slope} > ${MAX_ALLOWED_AVG_DURATION_MS_PER_KEYSIZE} too steep`,
      )
    })
  })
})

/**
 * Generate a sequence of numbers startting at start, until stop (not inclusive), increasing by sep
 *
 * @param {number} start the first number in the sequence
 * @param {number?} stop the stopping point of the sequence, not included
 * @param {number?} sep the amount to increment to the next value in the sequence
 * @return {Iterator<numbere>} a generator of the desired number sequence
 */
function *range(start: number, stop?: number, sep?: number): Generator<number> {
  if (stop === undefined) stop = Number.MAX_VALUE
  if (sep === undefined) sep = 1

  for (let i = start; i < stop; i += sep) {
    yield i
  }
}

/**
 * Generate an array of a given size using a given function to produce the values
 *
 * @param {number} size the size of the array to generate
 * @param {number => T} f a function to generate the array values
 * @return {T[]} the generated array
 */
 function makeArray<T>(size: number, f: ((_: number) => T)): T[] {
   const result = []
   for (let i = 0; i < size; i++) {
     result.push(f(i))
   }
   return result
 }
