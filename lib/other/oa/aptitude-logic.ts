// Timed OA questions for the newer aptitude chapters, merged into the Aptitude bank by oa/aptitude.ts.
// Answers and wrong options come from the same helpers as the chapters, so they cannot drift.
import type { OaQuestion } from "../types.ts";
import { concept, numeric } from "./make.ts";
import {
  bearing, centuryOdd, clock12, clues, conText, DAYS, dayName, decode, Family, handAngle, isLeap, judge, L, mirrorSame, mirrorTime, MIRROR_SAME, mixed, named,
  opposite, pos, ring, sameCalendar, sayStmt, shift, towards, unique, walk, waterSame, WATER_SAME, type Con, type Stmt,
} from "../aptitude-logic.ts";

const others = <T>(all: T[], answer: T, n = 3) => all.filter((x) => x !== answer).slice(0, n);
const sum = (w: string) => [...w].reduce((a, c) => a + pos(c), 0);

// clocks
const gainShown = 6 * 60 + 30, gainTrue = (gainShown * 60) / 65;
// calendar
if (dayName(2030, 10, 2) !== DAYS[(1 + 2) % 7]) throw new Error("oa calendar-day: the explanation no longer matches");
const afterDay = (2 + 150) % 7, rep27 = sameCalendar(2027), centEnds = [100, 200, 300, 400].map((n) => dayName(2000 + n, 12, 31));
const neverEnd = DAYS.filter((d) => !centEnds.includes(d));
// direction
const dw = walk("north", [["none", 8], ["left", 6]]);
const threeRights = named(bearing("south") + 270), renamed = named(bearing("south-west") + bearing("north") - bearing("east"));
// blood
const neeta = new Family().female("Neeta").male("Father", "He").parent("Father", "Neeta").marry("He", "Neeta");
const rahul = new Family().male("Rahul", "Sunil").female("Mother").parent("Mother", "Rahul").sibling("Mother", "Sunil");
const mona = new Family().female("Mona", "Usha").male("Tarun").marry("Tarun", "Mona").parent("Usha", "Tarun");
const cousin = new Family().male("M", "N").female("O").parent("N", "M").sibling("N", "O").parent("O", "P");
// seating
const sr = ring(5), sc = clues(sr), s5 = unique("oa", "ABCDE", sr, [sc.right("B", "A", 2), sc.left("C", "A"), sc.notNext("D", "C")]);
const rightOfA = s5.who(s5.s.A - 1);
// syllogism
const VERDICTS = ["only I follows", "only II follows", "both follow", "neither follows", "either I or II follows"];
const syl = (id: string, prem: Stmt[], cons: Con[], why: string) => {
  const { verdict } = judge(prem, cons);
  return concept(`syllogism-${id}`, `Statements: ${prem.map((p) => `${sayStmt(p)}.`).join(" ")} Conclusions: I. ${conText(cons[0])}. II. ${conText(cons[1])}.`, verdict, others(VERDICTS, verdict), why);
};
// letter series
const lsNext = L(4 + 4 * 4), lsPairs = Array.from({ length: 4 }, (_, i) => L(2 + 2 * i) + L(25 - 2 * i));
const lsGaps = [1]; for (let i = 0; i < 5; i++) lsGaps.push(lsGaps[i] + 2 + i);
// number series
const nsNext = [5]; for (let i = 0; i < 4; i++) nsNext.push(nsNext[i] * 2 + 1);

export const LOGIC_OA: OaQuestion[] = [
  numeric("clocks-angle", "What is the angle between the hands of a clock at 8:20?", handAngle(8, 20), [Math.abs(30 * 8 - 6 * 20), handAngle(8, 20) + 10, 360 - handAngle(8, 20)], "|30 × 8 − 5.5 × 20| = |240 − 110|. The hour hand has moved 10° past 8.", "°"),
  concept("clocks-together", "At what time between 7 and 8 o'clock are the hands of a clock together?", `${mixed(420, 11)} min past 7`, ["35 min past 7", `${mixed(420 + 180, 11)} min past 7`, `${mixed(420 - 360, 11)} min past 7`], "The minute hand must gain 210°: 210 × 2/11 = 420/11 minutes."),
  numeric("clocks-right-day", "How many times in a day are the hands of a clock at right angles?", 44, [48, 24, 22], "The minute hand laps the hour hand 22 times a day and passes a right angle twice per lap."),
  concept("clocks-mirror", "A clock shows 9:25. What time does its mirror image show?", mirrorTime(9, 25), ["3:35", "2:25", "3:25"], "Subtract from 11:60: 11:60 − 9:25 = 2:35."),
  concept("clocks-gain", "A clock gains 5 minutes every hour. It is set right at 12:00 noon. What is the true time when it shows 6:30 PM?", clock12(720 + gainTrue), ["6:30 PM", "5:30 PM", "6:15 PM"], "The clock shows 65 minutes for every 60 true minutes: 390 × 60 / 65 = 360 true minutes."),

  concept("calendar-after", "Today is Tuesday. What day of the week will it be after 150 days?", DAYS[afterDay], [DAYS[(afterDay + 1) % 7], DAYS[(afterDay + 6) % 7], "Tuesday"], "150 mod 7 = 3, so move 3 days on from Tuesday."),
  numeric("calendar-odd", "How many odd days are there in 300 years?", centuryOdd(300), [3, 5, 0], "100 years give 5 odd days, so 300 give 15, which leaves 1 after removing whole weeks."),
  numeric("calendar-repeat", "Which is the next year with exactly the same calendar as 2027?", rep27, [rep27 - 1, rep27 + 1, 2027 + 28], "Add odd days year by year until the total is a multiple of 7, and the leap status must match."),
  concept("calendar-day", "What day of the week will 2 October 2030 be?", dayName(2030, 10, 2), [1, 2, 3].map((k) => DAYS[(DAYS.indexOf(dayName(2030, 10, 2)) + k) % 7]), "Add the odd days: 2000 years give 0, 29 more years with 7 leap years give 1, and 275 days of 2030 give 2."),
  concept("calendar-leap", "Which of these years is not a leap year?", "2100", ["2000", "2400", "2096"].filter((y) => isLeap(+y)), "A century year is a leap year only if it divides by 400; 2100 does not."),
  concept("calendar-century", "On which day can the last day of a century never fall?", neverEnd[0], centEnds.slice(0, 3), "Centuries end with 5, 3, 1 or 0 odd days: Friday, Wednesday, Monday or Sunday."),

  concept("direction-path", "Asha walks 8 km north, turns left and walks 6 km. How far is she from the start, and in which direction?", `${dw.dist} km, ${towards(dw.x, dw.y)}`, [`${8 + 6} km, ${towards(dw.x, dw.y)}`, `${dw.dist} km, ${towards(-dw.x, dw.y)}`, `${8 - 6} km, ${towards(dw.x, dw.y)}`], "Facing north, left is west: (−6, 8), and √(36 + 64) = 10."),
  concept("direction-turns", "A man faces south. He turns right three times. Which way does he face now?", threeRights, ["west", "north", "south"].filter((d) => d !== threeRights).concat(["south-west"]).slice(0, 3), "Three right turns are 270° clockwise, the same as one left turn."),
  concept("direction-shadow", "One morning, Ravi's shadow falls straight in front of him. Which way is he facing?", "west", ["east", "north", "south"], "Morning sun is in the east, so shadows point west. The shadow is in front, so he faces west."),
  concept("direction-rename", "If east is called north, and every direction is renamed the same way, what is south-west called?", renamed, ["north-west", "south-west", "north-east"].filter((d) => d !== renamed).slice(0, 3), "East became north: every direction turns 90° anticlockwise. South-west turns to south-east."),
  numeric("direction-apart", "From one point, A walks 12 km east and B walks 5 km south. How far apart are they?", Math.hypot(12, 5), [17, 7, 12], "The two paths are at right angles: √(144 + 25) = 13.", " km"),

  concept("blood-self", "Pointing to a man, Neeta says, \"His wife is the only daughter of my father.\" How is the man related to Neeta?", neeta.rel("He", "Neeta")!, ["brother-in-law", "brother", "father"], "Neeta is her father's only daughter, so the man's wife is Neeta herself."),
  concept("blood-code", "P # Q means P is the father of Q, and P $ Q means P is the brother of Q. How is X related to Z in X $ Y # Z?", decode("X $ Y # Z").rel("X", "Z")!, ["father", "brother", "grandfather"], "X is the brother of Y, and Y is Z's father, so X is Z's uncle."),
  concept("blood-uncle", "Rahul's mother is Sunil's only sister. How is Sunil related to Rahul?", rahul.rel("Sunil", "Rahul")!, ["cousin", "brother-in-law", "grandfather"], "Sunil is the brother of Rahul's mother: a maternal uncle."),
  concept("blood-in-law", "Mona is the wife of Tarun. Tarun's mother is Usha. How is Usha related to Mona?", mona.rel("Usha", "Mona")!, ["mother", "aunt", "sister-in-law"], "Usha is the mother of Mona's husband."),
  concept("blood-cousin", "M is the son of N. N is the brother of O. O is the mother of P. How is P related to M?", cousin.rel("P", "M")!, ["brother", "nephew", "nephew or niece"], "M's father and P's mother are siblings, so M and P are cousins."),

  concept("mirror-clock", "A clock shows 4:15. What time does its mirror image show?", mirrorTime(4, 15), ["8:45", "7:15", "4:45"], "Subtract from 11:60: 11:60 − 4:15 = 7:45."),
  concept("mirror-word", "Which word looks exactly the same in a mirror held beside it?", "WOW", ["NOON", "BOB", "SOS"].filter((w) => !mirrorSame(w)), "W and O are mirror-symmetric, and WOW reads the same backwards. N, B and S flip."),
  concept("mirror-water", "Which word looks exactly the same in water?", "HIKE", ["HOME", "HATE", "KNOB"].filter((w) => !waterSame(w)), "H, I, K and E are all symmetric top to bottom, and water keeps the order."),
  numeric("mirror-count", "How many of the 6 letters of HAMMER look the same in a mirror?", [..."HAMMER"].filter((c) => MIRROR_SAME.includes(c)).length, [2, 3, 6], "H, A, M and M are mirror-symmetric; E and R flip."),
  concept("mirror-both", "Which capital letter looks the same in both a mirror and water?", "X", ["A", "B", "N"].filter((c) => !(MIRROR_SAME.includes(c) && WATER_SAME.includes(c))), "Only H, I, O and X are symmetric both ways."),

  numeric("seating-rank", "In a row, Ravi is 9th from the left and 16th from the right. How many people are in the row?", 9 + 16 - 1, [25, 23, 7], "Ravi is counted from both ends, so subtract 1."),
  numeric("seating-between", "In a row of 35, A is 7th from the left and B is 12th from the right. How many people sit between them?", 35 - 12 + 1 - 7 - 1, [17, 15, 18], "B is 24th from the left, and 24 − 7 − 1 = 16 sit between."),
  concept("seating-left", "Six people sit around a round table facing the centre. Where is the person to A's immediate left?", "the next seat clockwise from A", ["the next seat anticlockwise from A", "the seat opposite A", "two seats clockwise from A"], "Facing the centre, your left hand points clockwise around the table."),
  concept("seating-ring", "Five people A, B, C, D and E sit around a round table facing the centre. B sits second to the right of A. C sits to the immediate left of A. D is not a neighbour of C. Who sits to the immediate right of A?", rightOfA, ["B", "C", "E"].filter((p) => p !== rightOfA), "Right is anticlockwise: B is two seats anticlockwise, C one clockwise, and D must avoid C's side."),
  concept("seating-outward", "Everyone at a round table faces outward. Where is the person to A's immediate left?", "the next seat anticlockwise from A", ["the next seat clockwise from A", "the seat opposite A", "two seats anticlockwise from A"], "Facing outward reverses the facing-the-centre rule."),

  numeric("venn-neither", "Of 80 people, 50 drink tea, 40 drink coffee and 20 drink both. How many drink neither?", 80 - (50 + 40 - 20), [30, 20, 70], "At least one = 50 + 40 − 20 = 70, so 10 drink neither."),
  numeric("venn-exactly-two", "In a three-set survey, the pair counts are 20, 15 and 12, and 6 belong to all three. How many belong to exactly two sets?", 20 + 15 + 12 - 3 * 6, [47, 41, 35], "Each pair count includes the 6 in the centre: subtract 3 × 6."),
  numeric("venn-least", "In a class, 75% speak English and 65% speak Hindi, and everyone speaks at least one. What percentage speak both?", 75 + 65 - 100, [65, 35, 25], "Overlap = 75 + 65 − 100.", "%"),
  concept("venn-picture", "Which picture shows pens, pencils and stationery?", "two separate circles inside a third", ["three circles, one inside another inside the third", "three overlapping circles", "two overlapping circles inside a third"], "Pens and pencils are both stationery, and no pen is a pencil."),
  numeric("venn-three", "Groups A, B and C have 30, 25 and 20 members. 10 are in A and B, 8 in B and C, 6 in C and A, and 3 in all three. How many are in at least one group?", 30 + 25 + 20 - 10 - 8 - 6 + 3, [75, 51, 57], "A + B + C − AB − BC − CA + ABC."),

  syl("chain", [["all", "books", "pages"], ["all", "pages", "words"]], [{ st: ["all", "books", "words"] }, { st: ["some", "words", "books"] }], "Books lie inside pages, which lie inside words, and All turns round to Some."),
  syl("some-no", [["some", "cars", "trucks"], ["no", "trucks", "buses"]], [{ st: ["somenot", "cars", "buses"] }, { st: ["some", "buses", "cars"] }], "The cars that are trucks are not buses. Nothing links buses to cars."),
  syl("either", [["all", "seeds", "plants"], ["some", "plants", "trees"]], [{ st: ["some", "seeds", "trees"] }, { st: ["no", "seeds", "trees"] }], "Neither is forced, but Some and No about the same pair cover every case."),
  syl("no-all", [["no", "cups", "mugs"], ["all", "mugs", "jars"]], [{ st: ["somenot", "jars", "cups"] }, { st: ["no", "jars", "cups"] }], "The jars that are mugs are not cups. Other jars may be cups."),
  syl("possible", [["all", "keys", "locks"], ["no", "locks", "doors"]], [{ st: ["some", "doors", "keys"], may: true }, { st: ["all", "locks", "keys"], may: true }], "A door that is a key would be a lock, which is forbidden. Keys can grow to fill locks."),

  concept("letter-series-next", "What comes next: D, H, L, P, ?", lsNext, [L(pos(lsNext) - 1), L(pos(lsNext) + 1), L(pos(lsNext) - 2)], "Each letter is 4 places after the one before."),
  concept("letter-series-pairs", `What comes next: ${lsPairs.slice(0, 3).join(", ")}, ?`, lsPairs[3], ["HT", "GS", "IS"], "First letters go +2 from B; second letters go −2 from Y."),
  concept("letter-series-position", "Which letter is 6th to the left of the 20th letter from the left?", L(20 - 6), [L(26), L(13), L(15)], "20 − 6 = 14, and the 14th letter is N."),
  concept("letter-series-reverse", "Which letter is 18th from the right end of the alphabet?", L(27 - 18), [L(18), L(8), L(10)], "From the right, position = 27 − 18 = 9."),
  concept("letter-series-gaps", `What comes next: ${lsGaps.slice(0, 5).map(L).join(", ")}, ?`, L(lsGaps[5]), [L(lsGaps[5] - 1), L(lsGaps[5] + 1), L(lsGaps[5] - 2)], "The gaps grow by one: +2, +3, +4, +5, so the next is +6."),

  numeric("number-series-next", `What comes next: ${nsNext.slice(0, 4).join(", ")}, ?`, nsNext[4], [nsNext[4] - 1, nsNext[4] + 1, nsNext[3] + 24], "Each term is twice the last, plus 1."),
  numeric("number-series-squares", "What comes next: 3, 8, 15, 24, 35, ?", 7 ** 2 - 1, [46, 49, 47], "The terms are n² − 1 for n = 2 to 6, so next is 7² − 1."),
  numeric("number-series-missing", "Find the missing term: 2, 6, 18, ?, 162", 18 * 3, [36, 72, 48], "Each term is 3 times the one before."),
  numeric("number-series-wrong", "Which term is wrong: 1, 8, 27, 65, 125?", 65, [8, 27, 125], "The terms are cubes: 1, 8, 27, 64, 125. 65 should be 64."),
  numeric("number-series-alternate", "What comes next: 1, 5, 2, 10, 3, 15, ?", 4, [20, 5, 18], "Odd places go 1, 2, 3, 4; even places go 5, 10, 15."),

  concept("coding-shift", `If RAIN is coded as ${shift("RAIN", 2)}, how is SNOW coded?`, shift("SNOW", 2), [shift("SNOW", 1), shift("SNOW", 3), [...shift("SNOW", 2)].reverse().join("")], "Every letter moves 2 places forward."),
  concept("coding-opposite", `If BEAD is coded as ${opposite("BEAD")}, how is BOOK coded?`, opposite("BOOK"), [shift("BOOK", 1), [...opposite("BOOK")].reverse().join(""), shift("BOOK", -1)], "Each letter becomes its opposite: positions add to 27."),
  numeric("coding-sum", `If BAT = ${sum("BAT")}, what is CAR?`, sum("CAR"), [sum("CAR") - 1, sum("CAR") + 1, sum("CAR") + 2], "The code is the sum of letter positions: 3 + 1 + 18."),
  concept("coding-decode", `In a code each letter moves 4 places forward. What does ${shift("TRAIN", 4)} mean?`, "TRAIN", [shift("TRAIN", 1), shift("TRAIN", 8), shift("TRAIN", -1)], "Decode by moving each letter 4 places back."),
  concept("coding-called", "If pen is called pencil, pencil is called eraser, eraser is called book, and book is called bag, what do you write with in ink?", "pencil", ["pen", "eraser", "book"], "You write in ink with a pen, and a pen is called pencil."),
];
