// Must-do "heap" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [1845, "Seat Reservation Manager", "seat-reservation-manager", "Medium", false],
  [1962, "Remove Stones to Minimize the Total", "remove-stones-to-minimize-the-total", "Medium", false],
  [1834, "Single-Threaded CPU", "single-threaded-cpu", "Medium", false],
  [502, "IPO", "ipo", "Hard", false],
  [373, "Find K Pairs with Smallest Sums", "find-k-pairs-with-smallest-sums", "Medium", false],
  [1642, "Furthest Building You Can Reach", "furthest-building-you-can-reach", "Medium", false],
  [2402, "Meeting Rooms III", "meeting-rooms-iii", "Hard", false],
  [871, "Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Hard", false],
  [407, "Trapping Rain Water II", "trapping-rain-water-ii", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "seat-reservation-manager": "heap:5",
  "remove-stones-to-minimize-the-total": "heap:5",
  "single-threaded-cpu": "heap:5",
  "ipo": "heap:5",
};
