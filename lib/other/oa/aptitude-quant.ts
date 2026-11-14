// Timed OA questions for the newer aptitude chapters, merged into the Aptitude bank by oa/aptitude.ts.
// Answers and wrong options are computed: each wrong option is a mistake people really make.
import type { OaQuestion } from "../types.ts";
import { numeric } from "./make.ts";
import { frac, nCr, num, only } from "../aptitude-quant.ts";

const si = (p: number, r: number, t: number) => (p * r * t) / 100;
const amt = (p: number, r: number, t: number) => p * (1 + r / 100) ** t;
const N = (xs: number[]) => xs.map(num);
const PI = 22 / 7;
const ar = only(1, 50, (x) => 4 * (5 * x + 6) === 3 * (7 * x + 6), "oa ages-ratio");
const al = only(1, 50, (b) => 4 * b + 5 === 3 * (b + 5), "oa ages-later");
const ap = only(1, 50, (x) => x * (x + 5) === 336, "oa ages-product");
const ad = only(6, 59, (d) => 60 - d - 5 === 4 * (d - 5), "oa ages-sum"), am = 60 - ad;
const ck = only(1, 10, (k) => 3 ** k === 27, "oa ci-times");

export const QUANT_OA: OaQuestion[] = [
  // simple interest
  numeric("si-basic", "What is the simple interest on ₹8,400 at 12.5% a year for 3 years?", num(si(8400, 12.5, 3)),
    N([8400 + si(8400, 12.5, 3), si(8400, 12.5, 1), si(8400, 12, 3)]), "SI = P × R × T / 100 = 8400 × 12.5 × 3 / 100."),
  numeric("si-months", "What is the simple interest on ₹9,600 at 5% a year for 9 months?", num(si(9600, 5, 9 / 12)),
    N([si(9600, 5, 9), si(9600, 5, 1), si(9600, 5, 6 / 12)]), "9 months is 9/12 of a year, so SI = 9600 × 5 × 0.75 / 100."),
  numeric("si-double", "At what rate of simple interest does a sum double in 16 years?", num(100 / 16),
    N([200 / 16, 16, 100 / 20]), "Doubling means SI = P, so R × 16 = 100.", "%"),
  numeric("si-times", "A sum doubles in 5 years at simple interest. In how many years will it become 5 times itself?", 5 * (5 - 1),
    [5 * 5, 5 * 3, 5 * 2], "5 times needs interest of 4P, and each 5 years adds P.", " years"),
  numeric("si-rate", "₹2,500 becomes ₹3,100 in 4 years at simple interest. What is the rate?", num((100 * 600) / (2500 * 4)),
    N([(100 * 3100) / (2500 * 4), (100 * 600) / 2500, (100 * 600) / (2500 * 5)]), "Interest = 600, so R = 100 × 600 / (2500 × 4).", "%"),
  // compound interest
  numeric("ci-basic", "What is the compound interest on ₹15,000 at 8% a year for 2 years, compounded yearly?", num(amt(15000, 8, 2) - 15000),
    N([si(15000, 8, 2), amt(15000, 8, 2), si(15000, 8, 1)]), "A = 15000 × 1.08² = 17496, so CI = 2496."),
  numeric("ci-half", "What is the compound interest on ₹20,000 for 1 year at 12% a year, compounded half-yearly?", num(amt(20000, 6, 2) - 20000),
    N([amt(20000, 12, 1) - 20000, amt(20000, 6, 1) - 20000, amt(20000, 6, 2)]), "Half-yearly: 6% for 2 periods, 20000 × 1.06² − 20000."),
  numeric("ci-diff", "Compound interest exceeds simple interest on a sum by ₹96 over 2 years at 8%. What is the sum?", num(96 / 0.08 ** 2),
    N([96 / 0.08, 96 / 0.08 ** 2 / 2, (96 / 0.08 ** 2) * 0.8]), "For 2 years, CI − SI = P(R/100)², so P = 96 / 0.0064."),
  numeric("ci-pop", "A town of 64,000 grows by 5% a year. What is its population after 2 years?", num(amt(64000, 5, 2)),
    N([64000 + si(64000, 5, 2), amt(64000, 5, 1), amt(64000, 5, 3)]), "64000 × 1.05² = 64000 × 1.1025."),
  numeric("ci-dep", "A car bought for ₹6,00,000 loses 15% of its value each year. What is it worth after 2 years?", num(600000 * 0.85 ** 2),
    N([600000 * 0.7, 600000 * 0.85, 600000 * (1 - 0.85 ** 2)]), "Each year multiplies the value by 0.85: 600000 × 0.7225."),
  numeric("ci-times", "A sum becomes 3 times itself in 5 years at compound interest. In how many years will it become 27 times?", ck * 5,
    [(27 / 3) * 5, 5 * 5, 27 / 3], "27 = 3³, so it triples 3 times: 3 × 5 years.", " years"),
  // ages
  numeric("ages-ratio", "Two ages are in the ratio 5 : 7. In 6 years the ratio will be 3 : 4. What is the younger person's age now?", 5 * ar,
    [7 * ar, 5 * ar + 6, ar], "4(5x + 6) = 3(7x + 6) gives x = 6, so 30 and 42."),
  numeric("ages-later", "A is 4 times as old as B. In 5 years A will be 3 times as old as B. How old is A now?", 4 * al,
    [al, 4 * al + 5, 3 * al], "4b + 5 = 3(b + 5) gives b = 10, so A = 40."),
  numeric("ages-baby", "When a couple married 6 years ago their average age was 25. Now, with a child, the family's average age is 22. How old is the child?", 3 * 22 - (2 * 25 + 2 * 6),
    [3 * 22 - 2 * 25, 3 * 22 - (2 * 25 + 6), 6], "The couple now total 50 + 12 = 62; the family totals 66."),
  numeric("ages-product", "Two brothers are 5 years apart, and the product of their ages is 336. How old is the elder?", ap + 5,
    [ap, ap + 8, ap + 12], `${ap} × ${ap + 5} = 336, and the elder is the larger.`),
  numeric("ages-sum", "A mother and daughter's ages add up to 60. Five years ago the mother was 4 times as old as the daughter. How old is the mother?", am,
    [ad, am - 5, 4 * ad], "m − 5 = 4(d − 5) and m + d = 60 give d = 15, m = 45."),
  // boats
  numeric("boats-speeds", "A boat goes 20 km/h downstream and 14 km/h upstream. What is the speed of the stream?", (20 - 14) / 2,
    [(20 + 14) / 2, 20 - 14, 7], "Stream = (D − U) / 2.", " km/h"),
  numeric("boats-round", "A boat goes 10 km/h in still water, and the stream flows at 2 km/h. How long is a 48 km trip there and back?", 48 / 12 + 48 / 8,
    [96 / 10, 48 / 12 + 48 / 10, 48 / 8 * 2], "Down at 12 km/h takes 4 h, up at 8 km/h takes 6 h.", " h"),
  numeric("boats-down", "A boat goes 13 km/h in still water, and the stream flows at 4 km/h. How long does 68 km downstream take?", 68 / 17,
    N([68 / 9, 68 / 13, 68 / 17 + 1]), "Downstream speed is 13 + 4 = 17 km/h.", " h"),
  numeric("boats-ratio", "Rowing upstream takes 3 times as long as downstream over the same distance. The boat's still-water speed is 12 km/h. What is the stream's speed?", (12 * 2) / 4,
    [12 / 3, 12 / 4, (12 * 2) / 3], "b : s = (3 + 1) : (3 − 1) = 2 : 1.", " km/h"),
  numeric("boats-avg", "A boat goes 20 km/h in still water, and the stream flows at 5 km/h. What is its average speed for a round trip?", (400 - 25) / 20,
    [20, 20 - 5, 20 + 5], "Average = (b² − s²) / b = 375 / 20.", " km/h"),
  // area and mensuration
  numeric("area-fence", "A rectangle is 25 m by 16 m. What does fencing it cost at ₹12 a metre?", num(2 * (25 + 16) * 12),
    N([25 * 16 * 12, (25 + 16) * 12, 2 * (25 + 16) * 24]), "Perimeter = 2(25 + 16) = 82 m."),
  numeric("area-circle", "A circle has circumference 88 cm. What is its area (π = 22/7)?", num(PI * 14 ** 2),
    N([PI * 28 ** 2 / 2, PI * 7 ** 2, PI * 14 ** 2 / 2]), "2πr = 88 gives r = 14, so area = 22/7 × 196.", " cm²"),
  numeric("area-cube", "A cube has total surface area 294 cm². What is its volume?", num(7 ** 3),
    N([7 ** 2, 7 ** 4, 2 * 7 ** 2]), "6a² = 294 gives a = 7.", " cm³"),
  numeric("area-cyl", "What is the volume of a cylinder of radius 7 cm and height 10 cm (π = 22/7)?", num(PI * 49 * 10),
    N([2 * PI * 7 * 10, 2 * PI * 7 * 17, PI * 49 * 20]), "πr²h = 22/7 × 49 × 10.", " cm³"),
  numeric("area-scale", "Every edge of a cube grows by 10%. By how much does its volume grow?", num((1.1 ** 3 - 1) * 100),
    N([3 * 10, (1.1 ** 2 - 1) * 100, 10]), "Volume × 1.1³ = × 1.331.", "%"),
  numeric("area-spheres", "How many spheres of radius 2 cm can be cast from a sphere of radius 6 cm?", (6 / 2) ** 3,
    [6 / 2, (6 / 2) ** 2, 2 * (6 / 2) ** 3], "Volume scales with r³: (6/2)³."),
  // geometry
  numeric("geometry-ext", "Each exterior angle of a regular polygon is 30°. How many sides does it have?", 360 / 30,
    [360 / 30 - 2, 180 / 30, 30 / 2], "Exterior angles add to 360°."),
  numeric("geometry-diag", "How many diagonals does a 10-sided polygon have?", (10 * 7) / 2,
    [nCr(10, 2), 10 * 7, 10 * 8 / 2], "n(n − 3)/2 = 10 × 7 / 2."),
  numeric("geometry-pyth", "A right triangle has legs 9 cm and 40 cm. How long is the hypotenuse?", Math.hypot(9, 40),
    [9 + 40, 40 - 9, Math.hypot(9, 40) + 2], "9-40-41 is a Pythagorean triple.", " cm"),
  numeric("geometry-similar", "Two similar triangles have areas 25 cm² and 64 cm². What is the ratio of their matching sides?", `${Math.sqrt(25)}:${Math.sqrt(64)}`,
    ["25:64", `${Math.sqrt(64)}:${Math.sqrt(25)}`, "5:64"], "Side ratio is the square root of the area ratio."),
  numeric("geometry-centre", "An arc subtends 64° at the centre of a circle. What does it subtend at a point on the rest of the circle?", 64 / 2,
    [64, 128, 180 - 64], "The angle at the centre is twice the angle at the circumference.", "°"),
  numeric("geometry-dist", "What is the distance between (1, 2) and (7, 10)?", Math.hypot(6, 8),
    [6 + 8, 8, 6], "√(6² + 8²) = √100."),
  // probability
  numeric("probability-dice", "Two dice are rolled. What is the probability that the sum is more than 9?", frac(3 + 2 + 1, 36),
    [frac(4 + 3 + 2 + 1, 36), frac(3 + 2, 36), frac(3, 36)], "Sums 10, 11, 12 happen in 3 + 2 + 1 = 6 of 36 ways."),
  numeric("probability-coins", "Four coins are tossed. What is the probability of exactly two heads?", frac(nCr(4, 2), 16),
    [frac(1, 2), frac(1, 4), frac(5, 16)], "C(4, 2) = 6 of the 16 outcomes."),
  numeric("probability-face", "One card is drawn from 52. What is the probability it is a face card?", frac(12, 52),
    [frac(16, 52), frac(1, 4), frac(3, 52)], "J, Q, K in 4 suits: 12 cards. Aces are not face cards."),
  numeric("probability-bag", "A bag has 5 red and 3 green balls. Two are drawn together. What is the probability of one of each colour?", frac(5 * 3, nCr(8, 2)),
    [frac(2 * 5 * 3, 64), frac(5 * 3, 56), frac(3, 8)], "5 × 3 ways out of C(8, 2) = 28."),
  numeric("probability-either", "A solves a problem with probability 1/2 and B with probability 1/3, independently. What is the probability it gets solved?", frac(6 - 1 * 2, 6),
    [frac(5, 6), frac(1, 6), frac(1, 3)], "1 − P(both fail) = 1 − 1/2 × 2/3."),
  numeric("probability-53", "What is the probability that a non-leap year has 53 Mondays?", frac(1, 7),
    [frac(2, 7), frac(1, 52), frac(53, 365)], "365 days = 52 weeks + 1 extra day, which is a Monday 1 time in 7."),
];
