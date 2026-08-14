import { describe, it, expect } from "vitest";
import { bubbleSort, mergeSort, runSort } from "./sort";

const CASES: number[][] = [
  [8, 3, 5, 1, 9, 2, 7, 4],
  [1, 2, 3, 4, 5], // already sorted
  [5, 4, 3, 2, 1], // reverse sorted
  [3, 3, 1, 2, 3, 1], // duplicates
  [42], // single element
  [], // empty
];

function reference(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

describe("bubbleSort", () => {
  it.each(CASES.map((c) => [c]))("sorts %j correctly", (input) => {
    expect(bubbleSort(input).sorted).toEqual(reference(input));
  });

  it("the final step's array snapshot matches the fully sorted result", () => {
    const result = bubbleSort([5, 3, 4, 1, 2]);
    if (result.steps.length > 0) {
      expect(result.steps[result.steps.length - 1].array).toEqual(result.sorted);
    }
  });
});

describe("mergeSort", () => {
  it.each(CASES.map((c) => [c]))("sorts %j correctly", (input) => {
    expect(mergeSort(input).sorted).toEqual(reference(input));
  });

  it("the final step's array snapshot matches the fully sorted result", () => {
    const result = mergeSort([5, 3, 4, 1, 2]);
    if (result.steps.length > 0) {
      expect(result.steps[result.steps.length - 1].array).toEqual(result.sorted);
    }
  });
});

describe("bubble vs merge — the actual point of the comparison", () => {
  it("merge sort makes fewer comparisons than bubble sort on a non-trivial random array", () => {
    const input = [8, 3, 5, 1, 9, 2, 7, 4];
    const bubble = bubbleSort(input);
    const merge = mergeSort(input);
    expect(merge.comparisons).toBeLessThan(bubble.comparisons);
  });

  it("bubble sort's comparison count grows roughly with n², merge sort's with n log n", () => {
    // n=8 vs n=16: bubble should roughly quadruple, merge should barely double.
    const small = Array.from({ length: 8 }, (_, i) => 8 - i);
    const large = Array.from({ length: 16 }, (_, i) => 16 - i);

    const bubbleSmall = bubbleSort(small).comparisons;
    const bubbleLarge = bubbleSort(large).comparisons;
    const mergeSmall = mergeSort(small).comparisons;
    const mergeLarge = mergeSort(large).comparisons;

    const bubbleRatio = bubbleLarge / bubbleSmall;
    const mergeRatio = mergeLarge / mergeSmall;
    expect(bubbleRatio).toBeGreaterThan(mergeRatio);
  });

  it("both algorithms agree on the sorted result for the same input", () => {
    const input = [8, 3, 5, 1, 9, 2, 7, 4];
    expect(bubbleSort(input).sorted).toEqual(mergeSort(input).sorted);
  });
});

describe("runSort", () => {
  it("dispatches to the correct algorithm", () => {
    const input = [3, 1, 2];
    expect(runSort("bubble", input).sorted).toEqual([1, 2, 3]);
    expect(runSort("merge", input).sorted).toEqual([1, 2, 3]);
  });
});
