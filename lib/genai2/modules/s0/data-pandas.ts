// Stage 0: pandas for the tables around model work: request logs, eval results, price lists. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { fmt, groupBy, LOG, mergeRows, nanMean, pyDict, sorted } from "../../stages/s0.calc.ts";

// predict: the mean of one model's latencies, one of them missing
const SMALL = LOG.filter((r) => r.model === "small").map((r) => r.ms), smallMean = nanMean(SMALL)!;
const r2 = (x: number) => x.toFixed(2), known = SMALL.filter((x): x is number => x !== null);
// code: the log as a CSV with "-" where the latency is missing
const CSV = ["id,model,tok,ms", ...LOG.map((r) => `${r.id},${r.model},${r.tok},${r.ms ?? "-"}`)].join("\n");
const GAPS = LOG.filter((r) => r.ms === null).length;
const COUNTS = sorted(groupBy(LOG, (r) => r.model)).map(([m, rs]): [string, number] => [m, rs.length]);
const BY_TOK = [...LOG].sort((a, b) => b.tok - a.tok).map((r) => r.id);
if (new Set(LOG.map((r) => r.tok)).size !== LOG.length) throw new Error("token counts must differ so the sort order is fixed");
// output questions
const XS = [3, 1, 4, 1, 5], XCUT = 1, S3 = [100, null, 300];
const GM = ["a", "b", "a", "b"], GT = [1, 2, 3, 4], GSUM = sorted(groupBy(GM.map((m, i) => ({ m, t: GT[i] })), (r) => r.m)).map(([m, rs]): [string, number] => [m, rs.reduce((s, r) => s + r.t, 0)]);
// numeric: a merge with repeated keys
const [LK, RK] = [["a", "b", "b", "c"], ["a", "b", "b", "d"]];
// concept: size against count
const smallRows = LOG.filter((r) => r.model === "small"), smallCount = smallRows.filter((r) => r.ms !== null).length;
const py = (xs: (string | number | null)[]) => `[${xs.map((x) => (x === null ? "None" : typeof x === "string" ? `"${x}"` : x)).join(", ")}]`;

export const DATA_PANDAS: GModule = {
  id: "data-pandas",
  stage: 0,
  title: "Data with pandas",
  hook: "Training data, eval scores and request logs all arrive as tables. pandas loads them, finds the gaps, and answers per-group questions in a line or two.",
  blocks: [
    { kind: "figure", id: "s0-split", caption: "The same groupby, two outputs. agg gives one row per group; transform puts each group's answer back on every row, so it lines up with the original table." },
    { kind: "text", md: "**A DataFrame is a table of named columns.** Each column is a Series: one typed array plus the index, the row labels that every column shares. Operations work a whole column at a time, and rows keep their index labels through filters and sorts, so results always line up again." },
    {
      kind: "predict",
      q: `The small model's latencies are ${known.slice(0, 1).join("")}, a missing value, ${known.slice(1).join(" and ")} ms. What does df[df["model"] == "small"]["ms"].mean() give?`,
      answer: r2(smallMean),
      wrong: [r2(known.reduce((a, b) => a + b, 0) / SMALL.length), "NaN", String(known.reduce((a, b) => a + b, 0))],
      why: `pandas skips missing values by default, so the mean is over the ${known.length} recorded latencies: ${known.reduce((a, b) => a + b, 0)} / ${known.length} = ${r2(smallMean)}. Counting the gap as 0 would give ${r2(known.reduce((a, b) => a + b, 0) / SMALL.length)}.`,
    },
    { kind: "flow", id: "s0-log" },
    { kind: "play", id: "s0-filter" },
    { kind: "flow", id: "s0-merge" },
    {
      kind: "code",
      run: true,
      src: `import io
import pandas as pd

csv = """${CSV}
"""
df = pd.read_csv(io.StringIO(csv))
print(df.dtypes.to_dict())       # ms is object: one "-" turned the column into text

df["ms"] = pd.to_numeric(df["ms"], errors="coerce")   # text that is not a number becomes NaN
print(df["ms"].dtype, "gaps:", int(df["ms"].isna().sum()))

print(df["model"].value_counts().to_dict())
print(df.sort_values("tok", ascending=False)["id"].tolist())

assert df["ms"].dtype == "float64" and df["ms"].isna().sum() == ${GAPS}
assert df["model"].value_counts().to_dict() == ${pyDict(COUNTS)}
assert df.sort_values("tok", ascending=False)["id"].tolist() == [${BY_TOK.join(", ")}]
`,
    },
    { kind: "text", md: "**Two habits.** Write with df.loc[mask, \"col\"] = value, in one step. The chained form df[mask][\"col\"] = value may write into a temporary copy and leave df unchanged.\n\nPrefer whole-column maths to df.apply(f, axis=1), which calls a Python function once per row. The next module shows why that is slow." },
  ],
  keyPoints: [
    "A DataFrame is named columns, each a typed Series, sharing one row index.",
    "Filter with a boolean mask: df[df[\"ok\"]], and combine masks with & and | inside parentheses.",
    "Missing values are NaN: arithmetic spreads them, comparisons are False, and mean or sum skip them.",
    "groupby then agg gives one row per group; groupby then transform gives one value per original row.",
    "After every merge, check the row count: a missing key leaves NaN, a repeated key multiplies rows.",
  ],
  questions: [
    { id: "series", level: "easy", kind: "concept",
      q: "What is a pandas Series?",
      answer: "One column: an array of values of one dtype plus an index of row labels",
      wrong: ["A whole table of rows and columns", "A Python list that pandas has sorted", "One row of a DataFrame, stored as a dict"],
      why: "A DataFrame is a set of Series that share one index. Picking df[\"tok\"] hands you one of them, labels included." },
    { id: "mask", level: "easy", kind: "concept",
      q: "What does df[df[\"ok\"]] return, where ok is a True/False column?",
      answer: "The rows where ok is True, with their original index labels",
      wrong: ["The ok column alone", "A copy of df with ok set to True everywhere", "The count of True values"],
      why: "A boolean Series inside [] acts as a mask over rows. Rows keep their labels, so a filtered table can still be lined up with the original." },
    { id: "transform", level: "medium", kind: "concept",
      q: "What does df.groupby(\"model\")[\"tok\"].transform(\"sum\") return?",
      answer: "A Series as long as df, each row holding its own model's total",
      wrong: ["One row per model with its total", "The grand total of all tokens", "The rows of df sorted by model"],
      why: "transform sends each group's answer back to the group's rows, so you can compute shares in one line: df[\"tok\"] / that Series. agg would give one row per model instead." },
    { id: "left-gap", level: "medium", kind: "concept",
      q: "You left-merge a log onto a price table, and one model in the log has no price. What happens to its rows?",
      answer: "They stay, with NaN in the price column",
      wrong: ["They are dropped", "They get a price of 0", "The merge raises a KeyError"],
      why: "how=\"left\" keeps every left row. With no match there is nothing to copy, so the new columns are NaN, and any cost computed from them is NaN too." },
    { id: "nan-filter", level: "hard", kind: "concept",
      q: "A latency column has one NaN. Which rows does df[df[\"ms\"] < 500] keep?",
      answer: "The rows under 500 ms; the NaN row is dropped because the comparison gives False",
      wrong: ["The rows under 500 ms plus the NaN row", "None: the NaN makes the whole mask NaN", "It raises a ValueError about missing values"],
      why: "NaN compared with anything using < or <= gives False, so the row fails the filter. That is fine here, but it also means df[~(df.ms >= 500)] keeps the NaN row: the two filters are not opposites." },
    { id: "apply-slow", level: "medium", kind: "concept",
      q: "Why is df.apply(f, axis=1) slow on a large table?",
      answer: "It calls the Python function f once for every row",
      wrong: ["It copies the table to the GPU first", "It sorts the rows before applying f", "It always runs f twice to check the result"],
      why: "Each call builds a row object and runs Python code, so a million rows means a million calls. Column arithmetic like df.a * df.b runs once over the whole array in compiled code." },
    { id: "size-count", level: "hard", kind: "concept",
      q: `The small model has ${smallRows.length} rows, and ${smallRows.length - smallCount} of them has no latency. What do groupby("model").size() and groupby("model")["ms"].count() give for small?`,
      answer: `${smallRows.length} and ${smallCount}`,
      wrong: [`${smallRows.length} and ${smallRows.length}`, `${smallCount} and ${smallCount}`, `${smallCount} and ${smallRows.length}`],
      why: "size counts rows. count counts values that are not missing in that column. The gap between them is how much data is missing per group." },
    { id: "len-filter", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import pandas as pd\ndf = pd.DataFrame({"x": [${XS.join(", ")}]})\nprint(len(df[df["x"] > ${XCUT}]))`,
      answer: String(XS.filter((x) => x > XCUT).length), wrong: [String(XS.length), String(XS.filter((x) => x <= XCUT).length), String(XS.filter((x) => x > XCUT).reduce((a, b) => a + b, 0))],
      why: `The mask is True for ${XS.filter((x) => x > XCUT).join(", ")}, so ${XS.filter((x) => x > XCUT).length} rows survive. len counts rows.` },
    { id: "series-mean", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import pandas as pd\nprint(pd.Series(${py(S3)}).mean())`,
      answer: `${nanMean(S3)}.0`, wrong: [`${fmt(S3.reduce<number>((a, b) => a + (b ?? 0), 0) / S3.length)}`, "nan", `${S3.reduce<number>((a, b) => a + (b ?? 0), 0)}.0`],
      why: `None becomes NaN in a float Series, and mean skips it: (${S3.filter((x) => x !== null).join(" + ")}) / ${S3.filter((x) => x !== null).length} = ${nanMean(S3)}. Pass skipna=False to get NaN instead.` },
    { id: "group-sum", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import pandas as pd\ndf = pd.DataFrame({"m": ${py(GM)}, "t": [${GT.join(", ")}]})\nprint(df.groupby("m")["t"].sum().to_dict())`,
      answer: pyDict(GSUM), wrong: [pyDict(GSUM.map(([m, v]): [string, number] => [m, v / 2]), true), pyDict([["a", GT[0] + GT[1]], ["b", GT[2] + GT[3]]]), `{'t': ${GT.reduce((a, b) => a + b, 0)}}`],
      why: `Rows split by m: a has ${GT.filter((_, i) => GM[i] === "a").join(" and ")}, b has ${GT.filter((_, i) => GM[i] === "b").join(" and ")}. Each group's t is summed, and to_dict turns the result into a dict keyed by group.` },
    { id: "dup-merge", level: "hard", kind: "numeric",
      q: `left has keys ${py(LK)} and right has keys ${py(RK)}. How many rows does left.merge(right, on="k") return? (The default is an inner merge.)`,
      answer: String(mergeRows(LK, RK, "inner")), wrong: [String(LK.length), String(mergeRows(LK, RK, "left")), String(new Set(LK.filter((k) => RK.includes(k))).size)],
      why: `Every left row meets every matching right row. a matches once (1 row). Each of the 2 b rows meets 2 b rows (4 rows). c has no match and is dropped. 1 + 4 = ${mergeRows(LK, RK, "inner")}, more than either input's matches suggest.` },
    { id: "split-apply-combine", level: "easy", kind: "explain",
      q: "What does split-apply-combine mean in pandas?",
      answer: "groupby splits the rows into groups by a key, such as model. A function is applied to each group, such as mean or sum. The results are combined into one table, one row per group for agg, or one value per original row for transform.\n\nIt replaces a loop over the groups with one line, and the work runs inside pandas rather than in Python." },
    { id: "missing-evals", level: "medium", kind: "explain",
      q: "An eval results table has missing scores. How do you handle them?",
      answer: "- First count them per column and per group: df.isna().sum() and groupby(...).count(). A gap may mean a crash, a timeout or a skipped case.\n- Decide what a gap means. A failed run usually counts as a fail (fillna(0)), not as a skip, or the score looks better than it is.\n- Never let mean silently skip them in a report: show the count next to the average.\n- Fix the cause if the gaps cluster in one model or one task." },
    { id: "loc-write", level: "medium", kind: "explain",
      q: "Why write df.loc[df[\"ok\"], \"score\"] = 1 instead of df[df[\"ok\"]][\"score\"] = 1?",
      answer: "The chained form runs two steps. df[df[\"ok\"]] builds a new table, and the assignment then goes into that temporary table, so df may not change at all. pandas warns about it, or ignores the write.\n\n.loc picks the rows and the column in one step on df itself, so the write lands where you meant." },
    { id: "p95-errors", level: "hard", kind: "explain",
      q: "From a request log with model, ms and ok columns, how do you get each model's 95th percentile latency and error rate?",
      answer: "One groupby with named aggregations:\n\ndf.groupby(\"model\").agg(p95=(\"ms\", lambda s: s.quantile(0.95)), error_rate=(\"ok\", lambda s: 1 - s.mean()), calls=(\"ok\", \"size\"))\n\nThe mean of a True/False column is the share of True, so 1 minus it is the error rate. quantile skips NaN latencies. Keep the call count next to each rate, because a rate from 5 calls means little." },
    { id: "trap-sorted", level: "easy", kind: "trap",
      claim: "By default, groupby returns its groups sorted by the key.",
      truth: true,
      why: "sort=True is the default, so the log's models come out as large, small, tiny. Pass sort=False to keep the order in which keys first appear." },
    { id: "trap-lazy", level: "medium", kind: "trap",
      claim: "df.groupby(\"model\") computes the groups' results right away and returns a DataFrame.",
      truth: false,
      why: "It returns a GroupBy object that only records how to split. Nothing is summed or averaged until you call agg, sum, mean or transform on it." },
    { id: "trap-coerce", level: "hard", kind: "trap",
      claim: "pd.read_csv turns any text it cannot read as a number into NaN.",
      truth: false,
      why: "Only a fixed list of markers, such as an empty field, NA or n/a, becomes NaN. Any other text, like \"-\", makes the whole column text (dtype object). pd.to_numeric(col, errors=\"coerce\") fixes it, as the code above shows." },
  ],
  real: [
    { who: "Wes McKinney", when: "2010",
      what: "The paper \"Data Structures for Statistical Computing in Python\", in the SciPy proceedings, introduced pandas as a new library for working with data sets common in finance and statistics, and compared its design with R.",
      takeaway: "pandas was built for labelled tables of real, messy data, which is exactly what logs and eval results are.",
      url: "https://proceedings.scipy.org/articles/Majora-92bf1922-00a" },
  ],
};
