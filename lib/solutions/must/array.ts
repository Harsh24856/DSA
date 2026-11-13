// Solutions for the must-do "array" questions that were new to the app (lib/patterns/overview/array.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import type { Solution } from "../types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "merge-sorted-array": {
    approach: "Fill nums1 from the back: compare the largest unplaced items of both arrays and write the bigger one into the last free slot.",
    idea: ["nums1 has m real items and n empty slots at its end, exactly enough room for nums2.", "Merging from the front would overwrite items of nums1 before they are read. From the back, the slots being written are free or already used.", "Keep i at the last real item of nums1, j at the last item of nums2 and w at the last slot. Write the larger of nums1[i] and nums2[j] to w and step that pointer back.", "When nums2 runs out, the rest of nums1 is already in place. When nums1 runs out first, copy what is left of nums2."],
    code: `def merge(nums1, m, nums2, n):
    i, j, w = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[w] = nums1[i]
            i -= 1
        else:
            nums1[w] = nums2[j]
            j -= 1
        w -= 1`,
    lang: "python", time: "O(m + n)", space: "O(1)",
    viz: () => {
      const a: (number | string)[] = [1, 2, 3, 0, 0, 0], b = [2, 5, 6], m = 3, n = 3, frames: CellsFrame[] = [];
      let i = m - 1, j = n - 1, w = m + n - 1;
      frames.push({ note: `nums1 holds ${m} items and ${n} free slots; nums2 holds ${n}. Fill nums1 from the back so nothing unread is overwritten`, rows: [[...a], b], marks: [{ i, label: "i" }, { i: w, label: "w" }, { i: j, label: "j", row: 1 }] });
      while (j >= 0) {
        const fromA = i >= 0 && (a[i] as number) > b[j];
        const v = fromA ? a[i] : b[j];
        a[w] = v;
        frames.push({ note: `${i >= 0 ? `nums1[${i}] = ${fromA ? v : a[i]} vs nums2[${j}] = ${b[j]}` : "nums1 is used up"}: ${v} from ${fromA ? "nums1" : "nums2"} is the largest left, write it to slot ${w}`, rows: [[...a], b], tones: tonesOf([[`0:${w}`, "found"], [fromA ? `0:${i}` : `1:${j}`, "active"]]), marks: [{ i: Math.max(i, 0), label: "i" }, { i: w, label: "w" }, { i: j, label: "j", row: 1 }] });
        if (fromA) i--; else j--;
        w--;
      }
      frames.push({ note: `nums2 is used up. The ${i + 1} item${i + 1 === 1 ? "" : "s"} left in nums1 already sit in their final slots: [${a.join(", ")}]`, rows: [[...a], b], tones: tonesOf(a.map((_, k) => [`0:${k}`, "done"] as [string, Tone])) });
      return cells("merge from the back", [[1, 2, 3, 0, 0, 0], b], frames, ["nums1", "nums2"]);
    },
  },

  "remove-duplicates-from-sorted-array": {
    approach: "A write index k marks the end of the unique prefix; copy nums[i] to nums[k] only when it differs from the last kept value.",
    idea: ["In a sorted array, equal values sit next to each other, so a value is new exactly when it differs from the last one kept.", "Keep the invariant that nums[0..k-1] holds each distinct value once, in order.", "Scan i from 1. When nums[i] != nums[k - 1], write it to nums[k] and grow k.", "Return k. What sits after index k - 1 does not matter."],
    code: `def removeDuplicates(nums):
    k = 1
    for i in range(1, len(nums)):
        if nums[i] != nums[k - 1]:
            nums[k] = nums[i]
            k += 1
    return k`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [0, 0, 1, 1, 1, 2, 2, 3], frames: CellsFrame[] = [];
      let k = 1;
      frames.push({ note: "Index 0 is always kept. k = 1 is where the next new value will go", rows: [[...a]], tones: { "0:0": "done" }, marks: [{ i: 1, label: "k" }] });
      for (let i = 1; i < a.length; i++) {
        const isNew = a[i] !== a[k - 1];
        if (isNew) { a[k] = a[i]; k++; }
        frames.push({ note: `i = ${i}: ${a[i]} ${isNew ? `differs from the last kept value, so write it to index ${k - 1}` : `equals the last kept value ${a[k - 1]}, skip it`}. Kept: ${k}`, rows: [[...a]], tones: tonesOf([...Array(k)].map((_, t) => [`0:${t}`, "done"] as [string, Tone]).concat([[`0:${i}`, isNew ? "found" : "bad"]])), marks: [{ i, label: "i" }, { i: Math.min(k, a.length - 1), label: "k" }] });
      }
      frames.push({ note: `Return k = ${k}: the first ${k} slots hold [${a.slice(0, k).join(", ")}]`, rows: [[...a]], tones: tonesOf([...Array(k)].map((_, t) => [`0:${t}`, "found"] as [string, Tone])) });
      return cells(`removeDuplicates = ${k}`, [[0, 0, 1, 1, 1, 2, 2, 3]], frames);
    },
  },

  "design-hashmap": {
    approach: "An array of buckets, each a short list of [key, value] pairs; key % size picks the bucket, and put, get and remove scan only that bucket.",
    idea: ["Pick a fixed number of buckets, a prime such as 1009 spreads keys evenly.", "A key's bucket is key % 1009. Different keys can share a bucket (a collision), so each bucket is a list of pairs.", "put: if the key is in its bucket, overwrite the value; otherwise append a new pair.", "get and remove look only through that one bucket. With up to 10^4 calls the chains stay short, so each call is O(1) on average."],
    code: `class MyHashMap:
    def __init__(self):
        self.size = 1009
        self.buckets = [[] for _ in range(self.size)]

    def put(self, key, value):
        b = self.buckets[key % self.size]
        for pair in b:
            if pair[0] == key:
                pair[1] = value
                return
        b.append([key, value])

    def get(self, key):
        for k, v in self.buckets[key % self.size]:
            if k == key:
                return v
        return -1

    def remove(self, key):
        b = self.buckets[key % self.size]
        for i, (k, _) in enumerate(b):
            if k == key:
                b.pop(i)
                return`,
    lang: "python", time: "O(1) average per call (O(n / buckets) chain scan)", space: "O(buckets + keys)",
    viz: () => {
      const size = 5, buckets: [number, number][][] = Array.from({ length: size }, () => []), frames: CellsFrame[] = [];
      const rows = () => buckets.map((b) => (b.length ? b.map(([k, v]) => `${k}:${v}`) : [""]));
      const ops: [string, number, number?][] = [["put", 1, 1], ["put", 6, 2], ["put", 3, 9], ["get", 6], ["put", 6, 7], ["remove", 1], ["get", 1], ["get", 6]];
      frames.push({ note: `${size} buckets for the picture (the real code uses 1009). A key lives in bucket key % ${size}, as key:value`, rows: rows() });
      for (const [op, key, val] of ops) {
        const bi = key % size, b = buckets[bi], at = b.findIndex(([k]) => k === key);
        let note = "";
        if (op === "put") {
          if (at >= 0) { b[at][1] = val!; note = `put(${key}, ${val}): ${key} is already in bucket ${bi}, overwrite its value`; }
          else { b.push([key, val!]); note = `put(${key}, ${val}): bucket ${key} % ${size} = ${bi}${b.length > 1 ? " already has a key, a collision: append to its chain" : ", append"}`; }
        } else if (op === "get") note = `get(${key}): scan bucket ${bi} only: ${at >= 0 ? `found, return ${b[at][1]}` : "not there, return -1"}`;
        else { if (at >= 0) b.splice(at, 1); note = `remove(${key}): ${at >= 0 ? `unlink it from bucket ${bi}` : "not there, nothing to do"}`; }
        const now = buckets[bi].findIndex(([k]) => k === key);
        frames.push({ note, rows: rows(), tones: now >= 0 ? { [`${bi}:${now}`]: op === "get" ? "found" : "active" } : tonesOf(buckets[bi].map((_, t) => [`${bi}:${t}`, "window"] as [string, Tone])) });
      }
      return cells("MyHashMap with chaining", rows(), frames, buckets.map((_, i) => `b${i}`));
    },
  },

  "insert-delete-getrandom-o1": {
    approach: "A list holds the values for random picks; a dict maps each value to its index. Remove swaps the value with the last item and pops, so nothing shifts.",
    idea: ["getRandom in O(1) needs the values in an array, so a random index can be drawn.", "insert and remove in O(1) need to find a value without a scan, so keep value -> index in a hash map.", "insert: append to the list and record its index.", "remove: deleting from the middle of an array shifts everything after it. Instead copy the last item into the hole, fix that item's index in the map, then pop the end.", "Both structures always describe the same set, so getRandom just picks a random slot."],
    code: `import random
class RandomizedSet:
    def __init__(self):
        self.vals = []
        self.pos = {}

    def insert(self, val):
        if val in self.pos:
            return False
        self.pos[val] = len(self.vals)
        self.vals.append(val)
        return True

    def remove(self, val):
        if val not in self.pos:
            return False
        i, last = self.pos[val], self.vals[-1]
        self.vals[i] = last
        self.pos[last] = i
        self.vals.pop()
        del self.pos[val]
        return True

    def getRandom(self):
        return random.choice(self.vals)`,
    lang: "python", time: "O(1) average per call", space: "O(n)",
    viz: () => {
      const vals: number[] = [], pos = new Map<number, number>(), frames: CellsFrame[] = [];
      const show = () => [vals.length ? [...vals] : [""], vals.length ? vals.map((v) => `${v}@${pos.get(v)}`) : [""]];
      const ops: [string, number][] = [["insert", 4], ["insert", 7], ["insert", 2], ["insert", 9], ["insert", 7], ["remove", 7], ["remove", 5], ["remove", 9]];
      frames.push({ note: "vals is the array used for random picks; pos maps each value to its index in vals (shown as value@index)", rows: show() });
      for (const [op, x] of ops) {
        if (op === "insert") {
          if (pos.has(x)) { frames.push({ note: `insert(${x}): ${x} is already in pos, return false`, rows: show(), tones: { [`0:${pos.get(x)}`]: "bad" } }); continue; }
          pos.set(x, vals.length); vals.push(x);
          frames.push({ note: `insert(${x}): append at index ${vals.length - 1} and record pos[${x}] = ${vals.length - 1}`, rows: show(), tones: { [`0:${vals.length - 1}`]: "found", [`1:${vals.length - 1}`]: "found" } });
        } else {
          if (!pos.has(x)) { frames.push({ note: `remove(${x}): ${x} is not in pos, return false`, rows: show() }); continue; }
          const i = pos.get(x)!, last = vals[vals.length - 1];
          vals[i] = last; pos.set(last, i); vals.pop(); pos.delete(x);
          frames.push({ note: i === vals.length ? `remove(${x}): it is the last item, so just pop it` : `remove(${x}): move the last item ${last} into its index ${i}, set pos[${last}] = ${i}, then pop the end. No shifting`, rows: show(), tones: i < vals.length ? { [`0:${i}`]: "active", [`1:${i}`]: "active" } : {} });
        }
      }
      frames.push({ note: `getRandom picks one of the ${vals.length} slots of vals uniformly: [${vals.join(", ")}]`, rows: show(), tones: tonesOf(vals.map((_, k) => [`0:${k}`, "window"] as [string, Tone])) });
      return cells("RandomizedSet", show(), frames, ["vals", "pos"]);
    },
  },
};
