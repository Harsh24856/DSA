// Solutions for the must-do "bit-and-math" questions that were new to the app (lib/patterns/overview/bit-and-math.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, TableFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const bits = (x: number, w: number) => x.toString(2).padStart(w, "0").split("");

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "factorial-trailing-zeroes": {
    approach: "Each trailing zero is a factor 10 = 2 x 5, and 2s are plentiful, so count the 5s: n // 5 + n // 25 + n // 125 + ...",
    idea: ["A trailing zero of n! comes from one factor 2 paired with one factor 5.", "Every second number gives a 2 but only every fifth gives a 5, so the 5s run out first.", "n // 5 numbers up to n are multiples of 5, each giving one 5.", "Multiples of 25 give a second 5, multiples of 125 a third, and so on.", "Dividing n by 5 repeatedly and adding each quotient counts all of them in O(log n)."],
    code: `def trailingZeroes(n):
    count = 0
    while n:
        n //= 5            # multiples of 5, then of 25, then of 125, ...
        count += n
    return count`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const n0 = 10000, frames: TableFrame[] = [], rows: (string | number | null)[][] = [];
      let n = n0, count = 0, p = 5;
      frames.push({ note: `${n0}! has a factor 2 far more often than a factor 5, so count the factors of 5`, cells: [[p, "", ""]] });
      while (n) {
        n = Math.floor(n / 5); count += n;
        rows.push([p, n, count]);
        frames.push({ note: `${n} numbers up to ${n0} are multiples of ${p}, each giving one more 5. Total ${count}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 1] });
        p *= 5;
      }
      frames.push({ note: `The quotient reached 0. ${n0}! ends in ${count} zeros`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] });
      return { kind: "table", title: `trailingZeroes(${n0}) = ${count}`, rowHead: rows.map((_, i) => `step ${i + 1}`), colHead: ["power of 5", "multiples", "total"], frames };
    },
  },

  "gray-code": {
    approach: "The i-th Gray code is i ^ (i >> 1): neighbouring values of i differ in a run of low bits, and the XOR with the shifted copy leaves exactly one of them changed.",
    idea: ["A Gray code lists all 2^n values so that each neighbour, and the last and first, differ in exactly one bit.", "Going from i to i + 1 flips the lowest 0 bit of i and every 1 bit below it.", "g(i) = i ^ (i >> 1) XORs each bit with the bit above it. Inside that run of flipped bits the pairs flip together and cancel, so only one bit of g changes.", "The last value 2^(n-1) differs from 0 in one bit too, so the cycle closes.", "The reflect-and-prefix construction gives the same list: copy the list for n - 1, mirror it, and set the top bit on the mirrored half."],
    code: `def grayCode(n):
    return [i ^ (i >> 1) for i in range(1 << n)]`,
    lang: "python", time: "O(2^n)", space: "O(2^n) for the output",
    viz: () => {
      const n = 3, frames: CellsFrame[] = [], out: number[] = [];
      for (let i = 0; i < 1 << n; i++) {
        const g = i ^ (i >> 1), prev = out[out.length - 1]; out.push(g);
        const changed = prev === undefined ? -1 : n - 1 - Math.log2(prev ^ g);
        frames.push({ note: `i = ${i}: ${i} ^ (${i} >> 1) = ${i} ^ ${i >> 1} = ${g}${changed >= 0 ? `, one bit differs from ${prev}` : ", the start"}`, rows: [bits(i, n), bits(i >> 1, n), bits(g, n)], tones: changed >= 0 ? { [`2:${changed}`]: "found" } : {} });
      }
      frames.push({ note: `Sequence ${out.join(", ")}. The last value ${out[out.length - 1]} also differs from 0 in one bit`, rows: [bits(0, n), bits(0, n), bits(out[out.length - 1], n)], tones: { [`2:0`]: "found" } });
      return cells(`grayCode(${n})`, [bits(0, n), bits(0, n), bits(0, n)], frames, ["i", "i >> 1", "gray"]);
    },
  },

  "number-complement": {
    approach: "Build a mask of 1s exactly as wide as num, then num ^ mask flips every bit that matters and none of the leading zeros.",
    idea: ["The complement flips every bit of the binary form, without the leading zeros.", "~num alone would also flip the infinite run of leading zeros, giving a negative number.", "A mask with one 1 per significant bit of num is (1 << bit_length) - 1.", "XOR with 1 flips a bit and XOR with 0 keeps it, so num ^ mask is the answer.", "The width is at most 31 bits here, so the mask fits in a 32-bit integer when built as an unsigned or 64-bit value."],
    code: `def findComplement(num):
    mask = (1 << num.bit_length()) - 1     # 1s under every significant bit
    return num ^ mask`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const num = 37, w = num.toString(2).length, frames: CellsFrame[] = [];
      let mask = 0;
      frames.push({ note: `num = ${num} = ${num.toString(2)} in binary, ${w} significant bits`, rows: [bits(num, w), bits(0, w)] });
      for (let k = 0; k < w; k++) {
        mask = (mask << 1) | 1;
        frames.push({ note: `Grow the mask by one bit: ${mask.toString(2)} (${mask})`, rows: [bits(num, w), bits(mask, w)], tones: { [`1:${w - 1 - k}`]: "active" } });
      }
      const ans = num ^ mask;
      frames.push({ note: `num ^ mask flips each of the ${w} bits: ${ans.toString(2).padStart(w, "0")} = ${ans}`, rows: [bits(num, w), bits(mask, w), bits(ans, w)], tones: Object.fromEntries(bits(ans, w).map((_, i) => [`2:${i}`, "found" as Tone])) });
      return cells(`findComplement(${num}) = ${ans}`, [bits(num, w), bits(mask, w), bits(ans, w)], frames, ["num", "mask", "answer"]);
    },
  },

  "fraction-to-recurring-decimal": {
    approach: "Do long division and remember at which output position each remainder first appeared; when a remainder comes back, the digits since then repeat.",
    idea: ["Settle the sign first and work with absolute values, using big enough integers (the absolute value of -2^31 does not fit in 32 bits).", "The integer part is n // d; if the remainder is 0, stop there.", "Each next digit is (remainder x 10) // d, and the new remainder is (remainder x 10) % d.", "The digits depend only on the remainder, so a remainder seen before means the same digits come again forever.", "Store remainder -> index in the output; on a repeat, put '(' at that index and ')' at the end."],
    code: `def fractionToDecimal(numerator, denominator):
    if numerator == 0:
        return "0"
    sign = "-" if (numerator < 0) != (denominator < 0) else ""
    n, d = abs(numerator), abs(denominator)
    out = [sign + str(n // d)]
    r = n % d
    if r == 0:
        return out[0]
    out.append(".")
    seen = {}                       # remainder -> where its digit goes
    while r and r not in seen:
        seen[r] = len(out)
        r *= 10
        out.append(str(r // d))
        r %= d
    if r:
        out.insert(seen[r], "(")
        out.append(")")
    return "".join(out)`,
    lang: "python", time: "O(d)", space: "O(d)",
    viz: () => {
      const num = 22, den = 7, frames: TableFrame[] = [], rows: (string | number | null)[][] = [], seen = new Map<number, number>();
      let r = num % den, digits = "";
      frames.push({ note: `${num} / ${den}: integer part ${Math.floor(num / den)}, remainder ${r}`, cells: [[r, "", ""]] });
      while (r && !seen.has(r)) {
        seen.set(r, digits.length);
        const digit = Math.floor((r * 10) / den), nr = (r * 10) % den;
        rows.push([r, digit, nr]); digits += digit;
        frames.push({ note: `Remainder ${r}: ${r * 10} / ${den} gives digit ${digit}, new remainder ${nr}`, cells: rows.map((x) => [...x]), active: [rows.length - 1, 1] });
        r = nr;
      }
      const at = seen.get(r) ?? digits.length;
      const ans = `${Math.floor(num / den)}.${digits.slice(0, at)}${r ? `(${digits.slice(at)})` : ""}`;
      frames.push({ note: r ? `Remainder ${r} was seen at digit ${at + 1}: the digits from there repeat. Answer ${ans}` : `Remainder 0: the decimal ends. Answer ${ans}`, cells: rows.map((x) => [...x]), active: [at, 0] });
      return { kind: "table", title: `fractionToDecimal(${num}, ${den}) = "${ans}"`, rowHead: rows.map((_, i) => `digit ${i + 1}`), colHead: ["remainder", "digit", "next"], frames };
    },
  },
};
