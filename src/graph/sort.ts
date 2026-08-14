export type SortStepType = "compare" | "swap" | "write";

export interface SortStep {
  type: SortStepType;
  indices: number[];
  array: number[];
}

export interface SortResult {
  steps: SortStep[];
  comparisons: number;
  writes: number;
  sorted: number[];
}

/** Classic bubble sort — O(n²) comparisons, adjacent swaps only. */
export function bubbleSort(input: number[]): SortResult {
  const arr = [...input];
  const steps: SortStep[] = [];
  let comparisons = 0;
  let writes = 0;

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      comparisons++;
      steps.push({ type: "compare", indices: [j, j + 1], array: [...arr] });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        writes++;
        steps.push({ type: "swap", indices: [j, j + 1], array: [...arr] });
      }
    }
  }

  return { steps, comparisons, writes, sorted: arr };
}

/** Classic merge sort — O(n log n) comparisons, writes into the shared
 * array as each merge resolves rather than swapping in place. */
export function mergeSort(input: number[]): SortResult {
  const arr = [...input];
  const steps: SortStep[] = [];
  let comparisons = 0;
  let writes = 0;

  function merge(lo: number, mid: number, hi: number): void {
    const left = arr.slice(lo, mid + 1);
    const right = arr.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    while (i < left.length && j < right.length) {
      comparisons++;
      steps.push({ type: "compare", indices: [lo + i, mid + 1 + j], array: [...arr] });
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      writes++;
      steps.push({ type: "write", indices: [k], array: [...arr] });
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      writes++;
      steps.push({ type: "write", indices: [k], array: [...arr] });
      i++;
      k++;
    }
    while (j < right.length) {
      arr[k] = right[j];
      writes++;
      steps.push({ type: "write", indices: [k], array: [...arr] });
      j++;
      k++;
    }
  }

  function sort(lo: number, hi: number): void {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }

  sort(0, arr.length - 1);
  return { steps, comparisons, writes, sorted: arr };
}

export type SortAlgorithm = "bubble" | "merge";

export function runSort(algorithm: SortAlgorithm, input: number[]): SortResult {
  return algorithm === "bubble" ? bubbleSort(input) : mergeSort(input);
}
