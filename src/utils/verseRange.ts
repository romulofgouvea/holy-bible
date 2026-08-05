import { SelectedVerse } from "../models";

type VerseRangeResult = {
  ranges: string;
  sameChapter: boolean;
};

export function formatVerseRanges(
  verses: SelectedVerse[] | number[],
): VerseRangeResult {
  if (verses.length === 0) return { ranges: "", sameChapter: true };

  const isNumbers = typeof verses[0] === "number";

  if (isNumbers) {
    const nums = verses as number[];
    return { ranges: buildGroups(nums), sameChapter: true };
  }

  const sorted = verses as SelectedVerse[];
  const sameChapter = sorted.every((v) => v.chapter === sorted[0].chapter);

  if (sameChapter) {
    return {
      ranges: buildGroups(sorted.map((v) => v.verse)),
      sameChapter: true,
    };
  }

  const ranges =
    sorted.length === 1
      ? `${sorted[0].verse}`
      : `${sorted[0].chapter}:${sorted[0].verse}–${sorted[sorted.length - 1].chapter}:${sorted[sorted.length - 1].verse}`;

  return { ranges, sameChapter: false };
}

function buildGroups(nums: number[]): string {
  const groups: string[] = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      groups.push(start === end ? `${start}` : `${start}-${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  groups.push(start === end ? `${start}` : `${start}-${end}`);

  return groups.join(", ");
}
