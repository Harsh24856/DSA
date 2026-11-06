import type { OaSubject } from "../types.ts";
import { numeric, r2 } from "./make.ts";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const nCr = (n: number, k: number) => { let x = 1; for (let i = 1; i <= k; i++) x = (x * (n - k + i)) / i; return Math.round(x); };
const fact = (n: number): number => (n < 2 ? 1 : n * fact(n - 1));
const frac = (a: number, b: number) => { const g = gcd(a, b); return `${a / g}/${b / g}`; };
const kmh = (x: number) => (x * 5) / 18;
const sum7 = [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].filter((b) => a + b === 7)).length;
const twoHeads = Array.from({ length: 8 }, (_, i) => i.toString(2).split("1").length - 1).filter((h) => h >= 2).length;
const age = Array.from({ length: 100 }, (_, b) => b).find((b) => b > 10 && 2 * b - 10 === 3 * (b - 10))! * 2;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const OA_APTITUDE: OaSubject = {
  id: "aptitude", name: "Aptitude",
  questions: [
    numeric("successive", "A price rises by 20% and then falls by 20%. What is the net change?", r2(20 - 20 - (20 * 20) / 100), [0, -2, 4], "Net = a + b + ab/100 with b = -20. The fall applies to the larger price.", "%"),
    numeric("consumption", "Petrol rises by 25%. By how much must use fall to keep spending the same?", (25 / 125) * 100, [25, 15, 30], "Reduction = rise / (100 + rise) × 100.", "%"),
    numeric("profit", "An item bought for ₹400 sells for ₹500. What is the profit percentage?", ((500 - 400) / 400) * 100, [20, 100, 10], "Profit is always a percentage of cost price, not selling price.", "%"),
    numeric("markup", "An item is marked up 50% and then discounted 20%. What is the profit percentage?", r2((1.5 * 0.8 - 1) * 100), [30, 25, 10], "Selling price = 1.5 × 0.8 = 1.2 times cost.", "%"),
    numeric("ratio", "₹64 is split in the ratio 3:5. What is the smaller share?", (3 / 8) * 64, [40, 12, 30], "The smaller share is 3 parts out of 8."),
    numeric("si", "Simple interest on ₹5000 at 10% per year for 3 years?", (5000 * 10 * 3) / 100, [1655, 1000, 500], "SI = P × R × T / 100."),
    numeric("ci", "Compound interest on ₹10000 at 10% per year for 2 years, compounded yearly?", r2(10000 * (1.1 ** 2 - 1)), [2000, 2200, 1100], "Amount = 10000 × 1.1². Subtract the principal."),
    numeric("ci-si", "On ₹20000 at 5% per year, how much does 2-year compound interest exceed simple interest?", r2(20000 * 0.05 ** 2), [100, 25, 500], "For 2 years, the difference = P(R/100)²."),
    numeric("work", "A finishes a job in 10 days and B in 15. How many days do they take together?", (10 * 15) / (10 + 15), [12.5, 5, 25], "Rates add: 1/10 + 1/15 = 1/6 per day."),
    numeric("pipes", "One pipe fills a tank in 12 hours and a drain empties it in 20. With both open, how many hours to fill it?", (12 * 20) / (20 - 12), [32, 7.5, 16], "Net rate = 1/12 - 1/20 = 1/30 per hour."),
    numeric("train-pole", "A 150 m train runs at 54 km/h. How many seconds to pass a pole?", 150 / kmh(54), [15, 2.78, 27], "54 km/h × 5/18 = 15 m/s. Only the train's own length counts.", " s"),
    numeric("train-platform", "A 240 m train at 72 km/h crosses a 360 m platform. How many seconds does it take?", (240 + 360) / kmh(72), [12, 18, 8.33], "Distance = train + platform = 600 m. Speed = 20 m/s.", " s"),
    numeric("train-opposite", "Trains of 120 m and 180 m run toward each other at 40 and 50 km/h. How many seconds to cross?", (120 + 180) / kmh(40 + 50), [108, 3.33, 30], "Opposite directions add speeds: 90 km/h = 25 m/s.", " s"),
    numeric("avg-speed", "A car goes out at 40 km/h and returns over the same distance at 60 km/h. What is its average speed?", (2 * 40 * 60) / (40 + 60), [50, 45, 52], "For equal distances use the harmonic mean, not the plain average.", " km/h"),
    numeric("boat", "A boat goes 15 km/h in still water, and the stream flows at 3 km/h. How many hours for 36 km upstream and back?", 36 / (15 - 3) + 36 / (15 + 3), [4.8, 6, 2.4], "Upstream speed is 12 km/h and downstream is 18 km/h. Add the two times.", " h"),
    numeric("hcf", "What is the HCF of 84 and 126?", gcd(84, 126), [21, 14, 252], "Euclid: 126 mod 84 = 42, then 84 mod 42 = 0."),
    numeric("lcm", "Three bells ring every 12, 18 and 24 minutes. After how many minutes do they next ring together?", lcm(lcm(12, 18), 24), [36, 48, 144], "Take the LCM of the three periods.", " min"),
    numeric("mod", "What is the remainder when 2^10 is divided by 7?", 2 ** 10 % 7, [1, 3, 4], "2³ leaves 1 mod 7, so 2^10 = (2³)³ × 2 leaves 2."),
    numeric("unit-digit", "What is the unit digit of 7^23?", Number(7n ** 23n % 10n), [7, 9, 1], "Unit digits of powers of 7 cycle 7, 9, 3, 1. 23 mod 4 = 3 picks the third."),
    numeric("level", "How many distinct arrangements do the letters of LEVEL have?", fact(5) / (fact(2) * fact(2)), [120, 60, 24], "Divide 5! by 2! for each repeated letter, L and E."),
    numeric("committee", "From 5 men and 4 women, how many 3-person committees have at least one woman?", nCr(9, 3) - nCr(5, 3), [84, 40, 30], "All committees minus those with only men: C(9,3) - C(5,3)."),
    numeric("circular", "In how many ways can 6 people sit around a round table?", fact(5), [720, 360, 60], "Fix one person, and arrange the rest: (n - 1)!."),
    numeric("dice", "Two dice are rolled. What is the probability that the sum is 7?", frac(sum7, 36), ["1/12", "7/36", "5/36"], "Six of the 36 outcomes sum to 7."),
    numeric("coins", "Three coins are tossed. What is the probability of at least two heads?", frac(twoHeads, 8), ["3/8", "1/4", "5/8"], "HHT, HTH, THH and HHH are 4 of 8 outcomes."),
    numeric("cards", "One card is drawn from 52. What is the probability it is a king or a heart?", frac(4 + 13 - 1, 52), ["17/52", "1/4", "1/13"], "The king of hearts is counted twice, so subtract it once."),
    numeric("balls", "A bag has 3 red and 5 blue balls. Two are drawn without replacement. What is the probability that both are red?", frac(nCr(3, 2), nCr(8, 2)), ["9/64", "3/8", "1/14"], "C(3,2) / C(8,2). The draws are not independent, so 3/8 × 3/8 is wrong."),
    numeric("mixture", "40 L of mix is milk and water at 3:1. How many litres of water must be added to make it 1:1?", 40 * (3 / 4) - 40 * (1 / 4), [10, 30, 40], "There are 30 L of milk and 10 L of water. Water must reach 30 L.", " L"),
    numeric("alligation", "Rice at ₹20 and ₹30 per kg is mixed to cost ₹24 per kg. What is the ratio of the cheaper to the dearer?", `${(30 - 24) / gcd(30 - 24, 24 - 20)}:${(24 - 20) / gcd(30 - 24, 24 - 20)}`, ["2:3", "4:6", "1:1"], "Alligation: (30 - 24) : (24 - 20) = 6:4."),
    numeric("clock", "What is the angle between the clock hands at 3:30?", Math.abs(30 * 3 - 5.5 * 30), [90, 60, 105], "Angle = |30H - 5.5M|. The hour hand moves too, so it is not 90 degrees.", " degrees"),
    numeric("ages", "A is twice as old as B. Ten years ago, A was three times as old as B. How old is A now?", age, [20, 30, 60], "2B - 10 = 3(B - 10), so B = 20."),
    numeric("series", "What comes next: 2, 6, 12, 20, 30, ?", 6 * 7, [40, 36, 44], "The terms are n(n + 1), and the differences grow by 2."),
    numeric("calendar", "1 January 2024 was a Monday. What day was 1 January 2025?", DAYS[new Date(Date.UTC(2025, 0, 1)).getUTCDay()], ["Tuesday", "Monday", "Thursday"], "2024 is a leap year, so the day moves forward by 2."),
    numeric("direction", "A person walks 3 km north and then 4 km east. How far are they from the start?", Math.hypot(3, 4), [7, 1, 12], "The path forms a right triangle.", " km"),
  ],
};
