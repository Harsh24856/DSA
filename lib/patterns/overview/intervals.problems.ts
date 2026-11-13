// Must-do "intervals" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [3169, "Count Days Without Meetings", "count-days-without-meetings", "Medium", false],
  [2054, "Two Best Non-Overlapping Events", "two-best-non-overlapping-events", "Medium", false],
  [352, "Data Stream as Disjoint Intervals", "data-stream-as-disjoint-intervals", "Hard", false],
  [1235, "Maximum Profit in Job Scheduling", "maximum-profit-in-job-scheduling", "Hard", false],
  [436, "Find Right Interval", "find-right-interval", "Medium", false],
  [2402, "Meeting Rooms III", "meeting-rooms-iii", "Hard", false],
  [630, "Course Schedule III", "course-schedule-iii", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "count-days-without-meetings": "intervals:1",
  "two-best-non-overlapping-events": "intervals:3",
  "data-stream-as-disjoint-intervals": "intervals:5",
  "maximum-profit-in-job-scheduling": "dp:1",
};
