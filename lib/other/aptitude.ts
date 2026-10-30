import type { Subject } from "./types";

export const APTITUDE: Subject = {
  id: "aptitude",
  name: "Aptitude",
  short: "Aptitude",
  blurb: "Number system, percentages and interest, ratios and mixtures, time and work, speed and distance, counting and probability, reasoning and data interpretation. Short formulas, worked examples with fresh numbers, and an unlimited practice drill.",
  chapters: [
    {
      id: "drill",
      title: "Practice drill",
      summary: "Online tests reward speed. Use the drill below: every problem is generated with its answer computed, so you can do as many as you like. Aim for under 60 seconds each before moving to mixed tests.",
      lab: "aptitude",
      cards: [
        { id: "strategy", q: "How should you attack a timed aptitude section?", a: "- First pass: answer every question you can do in under a minute; mark the rest.\n- Second pass: the marked ones, cheapest first.\n- Use the options: plug them in, eliminate by last digit or parity, estimate.\n- Never sink three minutes into one question when each is worth the same.\n- Check for negative marking before guessing." },
      ],
    },
    {
      id: "numbers",
      title: "Number system",
      summary: "Divisibility, factors, HCF and LCM, remainders and unit digits. Most questions reduce to prime factorisation or a repeating cycle.",
      diagram: `flowchart TB
  N1["12 = 2 x 2 x 3"] --> H["HCF: shared primes, lowest power: 2 x 3 = 6"]:::ok
  N2["18 = 2 x 3 x 3"] --> H
  N1 --> L["LCM: every prime, highest power: 4 x 9 = 36"]:::hot
  N2 --> L
  H --> P["check: 6 x 36 = 216 = 12 x 18"]
  L --> P`,
      caption: "Factorise once and both answers fall out. Check: HCF times LCM equals the product of the two numbers.",
      table: { head: ["Divisible by", "Rule"], rows: [
        ["2, 5, 10", "last digit"], ["3, 9", "sum of digits divisible by 3 or 9"], ["4", "last two digits divisible by 4"],
        ["8", "last three digits divisible by 8"], ["6", "divisible by both 2 and 3"], ["11", "alternating digit sum (odd places − even places) divisible by 11"],
      ] },
      points: [
        "If n = p^a · q^b · r^c, the number of factors is (a + 1)(b + 1)(c + 1).",
        "HCF × LCM = product of the two numbers (for two numbers only).",
        "Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ...",
      ],
      cards: [
        { id: "factors", q: "How many factors does 360 have?", a: "360 = 2³ × 3² × 5¹, so the count is (3 + 1)(2 + 1)(1 + 1) = **24**." },
        { id: "unit-digit", q: "What is the last digit of 7⁹⁵?", a: "Powers of 7 end in 7, 9, 3, 1 and then repeat (cycle of 4). 95 = 4 × 23 + 3, so it matches the 3rd in the cycle: **3**.",
          trap: "When the remainder is 0, use the 4th term of the cycle, not the 0th." },
        { id: "remainder", q: "What is the remainder when 2⁵⁰ is divided by 7?", a: "2³ = 8 leaves remainder 1 when divided by 7. 2⁵⁰ = (2³)¹⁶ × 2², so the remainder is 1¹⁶ × 4 = **4**." },
        { id: "hcf-lcm", q: "Two numbers have HCF 12 and LCM 360. One is 72. What is the other?", a: "Product = HCF × LCM = 12 × 360 = 4320, so the other is 4320 / 72 = **60**. Check: HCF(72, 60) = 12 and LCM = 360." },
        { id: "zeros", q: "How many zeros does 100! end with?", a: "Each zero needs a factor 10 = 2 × 5, and 5s are scarcer. ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = **24**." },
      ],
    },
    {
      id: "percent",
      title: "Percentages, profit and interest",
      summary: "Think in multipliers: a 20% rise is × 1.2, a 15% fall is × 0.85, and successive changes multiply.",
      points: [
        "Successive changes a% and b%: net change = a + b + ab/100 (use negative numbers for falls).",
        "Profit % = (SP − CP) / CP × 100. Discount is on the marked price.",
        "Simple interest SI = P·R·T/100. Compound amount A = P(1 + R/100)^T. For 2 years, CI − SI = P(R/100)².",
      ],
      diagram: `flowchart LR
  CP["cost price ₹100"] -->|"mark up 40%"| MP["marked ₹140"]
  MP -->|"discount 25%"| SP["sold ₹105"]
  SP --> P["profit 5%"]`,
      caption: "Markup then discount: 1.4 × 0.75 = 1.05.",
      cards: [
        { id: "plus-minus", q: "A price rises 20% and then falls 20%. Net change?", a: "20 − 20 + (20 × −20)/100 = **−4%**: a 4% fall, because the fall applies to the larger amount." },
        { id: "consumption", q: "Petrol price rises 25%. By how much must you cut consumption to keep spending the same?", a: "Spending = price × quantity. Price × 1.25, so quantity × 1/1.25 = 0.8: cut by **20%**. Shortcut: r/(100 + r) × 100 = 25/125 × 100." },
        { id: "loss", q: "An item sold for ₹1080 made a 20% loss. What was the cost price?", a: "SP = 0.8 × CP, so CP = 1080 / 0.8 = **₹1350**.",
          trap: "Taking 20% of 1080 and adding it (₹1296) is wrong: the percentage is of the cost price." },
        { id: "ci-si", q: "₹10,000 at 10% for 2 years: CI minus SI?", a: "P(R/100)² = 10000 × 0.01 = **₹100**. Check: SI = 2000, CI = 10000 × 1.21 − 10000 = 2100." },
      ],
    },
    {
      id: "ratio",
      title: "Ratios, averages and mixtures",
      summary: "Averages are totals in disguise: convert to a total, change it, convert back. Mixtures use alligation: the distances to the mean give the ratio.",
      diagram: `flowchart TB
  C["cheaper: ₹0 / L (water)"] --> M["mean: ₹32 / L"]
  D["dearer: ₹40 / L (milk)"] --> M
  M --> R["water : milk = (40 − 32) : (32 − 0) = 8 : 32 = 1 : 4"]`,
      caption: "Alligation: each ingredient's share is the distance from the other ingredient to the mean.",
      cards: [
        { id: "avg-removed", q: "The average of 5 numbers is 20. After removing one, the average of the rest is 18. Which number was removed?", a: "Total before = 5 × 20 = 100; after = 4 × 18 = 72. Removed = **28**." },
        { id: "milk", q: "Milk costs ₹40 a litre. How much water per litre of milk makes the mix worth ₹32 a litre?", a: "Alligation: water : milk = (40 − 32) : (32 − 0) = 8 : 32 = 1 : 4, so **0.25 litre of water** per litre of milk." },
        { id: "partnership", q: "A invests ₹6000 for 12 months, B ₹9000 for 8 months. How do they share the profit?", a: "Profit shares follow capital × time: 6000 × 12 = 72000 and 9000 × 8 = 72000, so **1 : 1**." },
        { id: "ages", q: "A father is 3 times as old as his son. In 12 years he will be twice as old. How old is the son now?", a: "Let son = s, father = 3s. Then 3s + 12 = 2(s + 12), so s = **12** (father 36)." },
      ],
    },
    {
      id: "work",
      title: "Time and work, pipes and cisterns",
      summary: "The LCM trick avoids fractions: take the total work as the LCM of the individual times, find each person's work per day, then add or subtract.",
      diagram: `flowchart LR
  T["total work = LCM(12, 18) = 36 units"] --> A["A: 36 / 12 = 3 units a day"]
  T --> B["B: 36 / 18 = 2 units a day"]
  A --> S["together 5 units a day"]
  B --> S
  S --> D["36 / 5 = 7.2 days"]`,
      caption: "LCM method for A (12 days) and B (18 days) working together.",
      cards: [
        { id: "together", q: "A can do a job in 12 days, B in 18. Together?", a: "Using 36 units: A does 3, B does 2, together 5 a day, so 36 / 5 = **7.2 days**." },
        { id: "b-alone", q: "A and B together take 8 days; A alone takes 12. How long does B take alone?", a: "B's rate = 1/8 − 1/12 = 1/24, so **24 days**." },
        { id: "leak", q: "A pipe fills a tank in 10 hours; a leak empties it in 15. How long to fill with the leak open?", a: "Net rate = 1/10 − 1/15 = 1/30, so **30 hours**. Pipes that empty are just negative workers." },
      ],
    },
    {
      id: "speed",
      title: "Speed, distance, trains and boats",
      summary: "Distance = speed × time. Convert km/h to m/s by multiplying by 5/18. For trains, the distance to cover is the train's length plus whatever it passes; for two moving objects, use their relative speed.",
      diagram: `flowchart LR
  A["train A, 54 km/h"] --> R["opposite directions:<br/>closing speed 54 + 36 = 90 km/h"]
  B["train B, 36 km/h"] --> R
  R --> T["time = (150 + 100) m / 25 m/s = 10 s"]`,
      caption: "Relative speed: add for opposite directions, subtract for the same direction.",
      points: [
        "Same direction: relative speed = difference. Opposite directions: sum.",
        "Average speed over equal distances at a and b: 2ab / (a + b), not (a + b) / 2.",
        "Boats: downstream = boat + stream, upstream = boat − stream.",
      ],
      cards: [
        { id: "avg-speed", q: "You drive to a city at 60 km/h and back at 40 km/h. Average speed?", a: "Equal distances, so 2 × 60 × 40 / (60 + 40) = **48 km/h**.",
          trap: "50 km/h is wrong: you spend longer at the slower speed." },
        { id: "train-pole", q: "A 200 m train runs at 72 km/h. How long to pass a pole, and a 300 m platform?", a: "72 × 5/18 = 20 m/s. Pole: 200 / 20 = **10 s**. Platform: (200 + 300) / 20 = **25 s**." },
        { id: "two-trains", q: "Trains of 150 m and 100 m run towards each other at 54 and 36 km/h. How long to cross?", a: "Relative speed = 90 km/h = 25 m/s; distance = 150 + 100 = 250 m; time = **10 s**." },
        { id: "boat", q: "A boat goes 18 km/h downstream and 12 km/h upstream. Boat speed and stream speed?", a: "Boat = (18 + 12)/2 = **15 km/h**, stream = (18 − 12)/2 = **3 km/h**." },
      ],
    },
    {
      id: "counting",
      title: "Permutations, combinations and probability",
      summary: "Permutations count ordered arrangements, combinations count selections. Probability is favourable outcomes over total equally likely outcomes; for \"at least one\", use 1 minus the probability of none.",
      diagram: `flowchart LR
  S["two tosses"] --> H1["H (1/2)"]
  S --> T1["T (1/2)"]
  H1 --> HH["HH 1/4"]
  H1 --> HT["HT 1/4"]
  T1 --> TH["TH 1/4"]
  T1 --> TT["TT 1/4"]`,
      caption: "A probability tree: multiply along a branch, add across branches. P(at least one head) = 3/4.",
      table: { head: ["Formula", "Counts"], rows: [
        ["n!", "ways to arrange n distinct items"], ["n! / (p! q! ...)", "arrangements with repeated items"],
        ["nPr = n! / (n − r)!", "ordered choices of r from n"], ["nCr = n! / (r! (n − r)!)", "unordered choices of r from n"],
        ["(n − 1)!", "arrangements of n people around a round table"],
      ] },
      cards: [
        { id: "level", q: "How many arrangements of the letters of LEVEL?", a: "5 letters with L and E each repeated twice: 5! / (2! × 2!) = **30**." },
        { id: "committee", q: "From 5 men and 4 women, how many 3-person committees have exactly 2 women?", a: "Choose 2 women and 1 man: C(4, 2) × C(5, 1) = 6 × 5 = **30**." },
        { id: "heads", q: "Three coins are tossed. Probability of at least one head?", a: "Only TTT has no head: 1 − 1/8 = **7/8**." },
        { id: "aces", q: "Two cards are drawn without replacement. Probability both are aces?", a: "4/52 × 3/51 = 12/2652 = **1/221**.",
          trap: "With replacement it would be (4/52)² = 1/169; read whether cards go back." },
        { id: "expected", q: "What is the expected value of one roll of a fair die?", a: "(1 + 2 + 3 + 4 + 5 + 6) / 6 = **3.5**. Expected value is a long-run average; it need not be a possible outcome." },
      ],
    },
    {
      id: "reasoning",
      title: "Logical reasoning",
      summary: "Series, coding, blood relations, clocks, calendars and sets. Each type has a short method; practise until spotting the type is instant.",
      points: [
        "Clock angle between the hands at h:m = |30h − 5.5m| degrees (take 360 minus it if over 180).",
        "Odd days: a normal year shifts the weekday by 1, a leap year by 2.",
        "Two sets: |A ∪ B| = |A| + |B| − |A ∩ B|.",
      ],
      diagram: `flowchart TB
  D["D (grandfather)"] --> C["C (mother)"]
  C --> A["A (brother)"]
  C --> B["B"]`,
      caption: "Draw a family tree for blood-relation questions: generations top to bottom.",
      cards: [
        { id: "series", q: "Next term: 2, 6, 12, 20, 30, ?", a: "Differences are 4, 6, 8, 10, so the next difference is 12: **42**. Equivalently, the nth term is n(n + 1)." },
        { id: "clock", q: "Angle between the hands at 3:40?", a: "|30 × 3 − 5.5 × 40| = |90 − 220| = **130°**." },
        { id: "calendar", q: "1 January 2026 is a Thursday. What day is 1 January 2027?", a: "2026 is not a leap year, so it has 1 odd day: **Friday**." },
        { id: "blood", q: "A is B's brother. C is A's mother. D is C's father. How is B related to D?", a: "C is the mother of both A and B, and D is C's father, so B is D's **grandchild** (grandson or granddaughter: B's gender is not given)." },
        { id: "sets", q: "In a class of 50, 30 like tea, 25 like coffee and 10 like both. How many like neither?", a: "At least one = 30 + 25 − 10 = 45, so neither = **5**." },
        { id: "coding", q: "If CAT is coded 3120, how is DOG coded?", a: "Each letter becomes its alphabet position: C = 3, A = 1, T = 20. So D = 4, O = 15, G = 7: **4157**." },
      ],
    },
    {
      id: "di",
      title: "Data interpretation and estimation",
      summary: "DI sets give a table or chart and several questions. Read the units and the base year first, then estimate: the options are usually far enough apart.",
      diagram: `flowchart TB
  R["read title, units, base year"] --> Q["read the question: which rows, which years?"]
  Q --> A{"options far apart?"}
  A -->|"yes"| E["estimate: round to 2 significant figures"]:::ok
  A -->|"no"| X["compute exactly, only the cells you need"]:::warn
  E --> C["pick, then sanity-check size and sign"]
  X --> C`,
      caption: "Read the frame before the numbers, and estimate unless the options are close.",
      points: [
        "Percentage growth = (new − old) / old × 100.",
        "Compare fractions by cross-multiplying instead of dividing.",
        "Round to friendly numbers early, and check whether the question asks for a value, a share or a change.",
      ],
      cards: [
        { id: "growth", q: "Sales grew from 240 to 300 units. Percentage growth?", a: "(300 − 240) / 240 = 60 / 240 = **25%**.",
          trap: "Dividing by the new value (60 / 300 = 20%) gives the fall you would need to go back, not the growth." },
        { id: "fractions", q: "Which is larger: 17/23 or 19/26?", a: "Cross-multiply: 17 × 26 = 442 and 19 × 23 = 437. Since 442 > 437, **17/23** is larger." },
        { id: "share", q: "A pie chart gives Rent 30%, Food 25%, Travel 15%, Other 30% of ₹48,000. How much more is Rent than Travel?", a: "The gap is 15% of 48,000 = **₹7,200**. Work with the percentage difference first, then convert once." },
      ],
    },
  ],
};
