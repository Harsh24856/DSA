import re
import json, random, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.workbook.properties import CalcProperties

random.seed(2027)
import sys
THEMES = {  # from the theme-factory skill: (dark, accent, light accent, pale, font)
    "ocean":    ("1A2332", "2D8B8B", "A8DADC", "F1FAEE", "Verdana"),
    "tech":     ("1E1E1E", "0066FF", "B3FFFF", "EEF5FF", "Verdana"),
    "midnight": ("0B1630", "1D4ED8", "BFD3FF", "EEF3FF", "Arial"),
    "galaxy":   ("2B1E3E", "4A4E8F", "C9BCE0", "F1F1FC", "Arial"),
    "forest":   ("2D4A2B", "7D8471", "D3D8BE", "FAF9F6", "Georgia"),
}
DARK, ACC, LIGHT, PALE, F = THEMES[sys.argv[1] if len(sys.argv) > 1 else "ocean"]
NAVY, INK, MUTED = DARK, "1F2937", "6B7280"
fill = lambda c: PatternFill("solid", fgColor=c)
thin = Side(style="thin", color="E5E7EB")
LINE = Border(bottom=thin)
CENTER = Alignment(horizontal="center", vertical="center")
LEFTV = Alignment(vertical="center", wrap_text=False)

# ---------- problem data ----------
raw = json.load(open("leetcode_questions.json"))
qs = [e["data"]["question"] for e in raw]
known = {x["link"].strip("/") for x in json.load(open(".problemSiteData.json"))}  # NeetCode 450: likely already solved
slug = lambda q: q["url"].rstrip("/").split("/")[-1]
tags = lambda q: [t["name"] for t in (q["topicTags"] or [])]
OA = {"Array","String","Hash Table","Sorting","Greedy","Binary Search","Depth-First Search","Breadth-First Search",
      "Prefix Sum","Two Pointers","Tree","Binary Tree","Heap (Priority Queue)","Graph Theory","Stack","Sliding Window",
      "Monotonic Stack","Union-Find","Linked List","Matrix","Backtracking","Trie","Topological Sort","Shortest Path",
      "Bit Manipulation","Counting","Math","Dynamic Programming","Memoization"}
def good(q):
    l, d = q["likes"] or 0, q["dislikes"] or 0
    return (q["categoryTitle"] == "Algorithms" and not q["isPaidOnly"] and slug(q) not in known
            and l >= 700 and l / max(1, l + d) >= 0.85 and set(tags(q)) & OA)
pool = [q for q in qs if good(q)]
med = [q for q in pool if q["difficulty"] == "Medium"]
hard = [q for q in pool if q["difficulty"] == "Hard"]
isdp = lambda q: "Dynamic Programming" in tags(q)
used = set()
def pick(cands, dp_ok):
    c = [q for q in cands if slug(q) not in used and (dp_ok or not isdp(q))]
    w = [min(q["likes"], 6000) for q in c]
    q = random.choices(c, weights=w)[0]; used.add(slug(q)); return q

START = dt.date(2026, 10, 23); DAYS = 190
def phase(d):
    if d <= dt.date(2026, 12, 27): return "1 · Unseen Mediums"
    if d <= dt.date(2027, 2, 28): return "2 · Medium-Hard"
    if d <= dt.date(2027, 4, 15): return "3 · OA Simulation"
    return "4 · Revision"
def lc_for(ph):
    r = random.random()
    if ph.startswith("1"): return pick(med, False)
    if ph.startswith("2"): return pick(hard if r < .3 else med, random.random() < .25)
    if ph.startswith("3"): return pick(hard if r < .5 else med, random.random() < .25)
    return pick(med, random.random() < .2)

db = [q for q in qs if q["categoryTitle"] == "Database" and not q["isPaidOnly"]]
order = {"Easy": 0, "Medium": 1, "Hard": 2}
easy_db = sorted([q for q in db if q["difficulty"] == "Easy"], key=lambda q: -q["likes"])
mh_db = sorted([q for q in db if q["difficulty"] != "Easy"], key=lambda q: (order[q["difficulty"]], -q["likes"]))
sql = easy_db[:20]
rest = easy_db[20:] + mh_db
random.shuffle(rest); rest.sort(key=lambda q: order[q["difficulty"]] if q["difficulty"] == "Hard" else 0)
sql += rest
sql_rows = [(q, "") for q in sql] + [(q, " (Round 2)") for q in mh_db] + [(q, " (Round 2)") for q in easy_db]

cf_tags = ["greedy", "constructive algorithms", "math", "implementation", "binary search", "two pointers",
           "sortings", "strings", "dp", "graphs", "number theory", "bitmasks", "brute force", "data structures"]
def cf_rating(i):
    return [1200, 1300][i % 2] if i < 18 else [1400, 1500][i % 2] if i < 36 else [1500, 1600, 1700][i % 3]

rows = []  # (track, title, url, level, phase, topic)
si = ci = 0
for k in range(DAYS):
    d = START + dt.timedelta(days=k); ph = phase(d)
    for _ in range(2):
        q = lc_for(ph)
        rows.append(("LeetCode", q["title"], q["url"], q["difficulty"], ph, ", ".join(tags(q)[:2])))
    if si < len(sql_rows):
        q, sfx = sql_rows[si]; si += 1
        rows.append(("SQL", q["title"] + sfx, q["url"], q["difficulty"], ph, "SQL"))
    if d.weekday() == 5:
        for _ in range(2):
            t, r = cf_tags[ci % len(cf_tags)], cf_rating(ci); ci += 1
            url = f"https://codeforces.com/problemset?order=BY_SOLVED_DESC&tags={t.replace(' ', '%20')},{r}-{r}"
            rows.append(("Codeforces", f"Most-solved unsolved: {t} · {r}", url, f"CF {r}", ph, t))
R = len(rows) + 1
print("rows", len(rows), "LC", sum(r[0]=="LeetCode" for r in rows), "SQL", sum(r[0]=="SQL" for r in rows), "CF", sum(r[0]=="Codeforces" for r in rows), "hard", sum(r[3]=="Hard" for r in rows))

wb = Workbook()
wb.calculation = CalcProperties(iterate=True, iterateCount=50, fullCalcOnLoad=True)

def hdr(ws, row, labels, start=1, color=NAVY):
    for i, t in enumerate(labels):
        c = ws.cell(row=row, column=start + i, value=t)
        c.font = Font(name=F, bold=True, color="FFFFFF", size=10); c.fill = fill(color); c.alignment = CENTER

# ---------- Settings ----------
st = wb.active; st.title = "Settings"
st["A1"] = "Settings"; st["A1"].font = Font(name=F, bold=True, size=18, color=NAVY)
st["A2"] = "Change the blue numbers. The whole schedule re-flows instantly."; st["A2"].font = Font(name=F, color=MUTED)
for r, (k, v, note) in enumerate([("LeetCode problems per day", 2, "Your daily minimum"),
                                   ("SQL problems per day", 1, ""),
                                   ("Codeforces problems per week (Saturday)", 2, "")], 4):
    st.cell(row=r, column=1, value=k).font = Font(name=F, size=11)
    c = st.cell(row=r, column=2, value=v); c.font = Font(name=F, size=12, bold=True, color=ACC); c.fill = fill(PALE); c.alignment = CENTER
    st.cell(row=r, column=3, value=note).font = Font(name=F, color=MUTED)
st["A8"] = "Placement date"; st["A8"].font = Font(name=F, size=11)
st["B8"] = dt.date(2027, 5, 1); st["B8"].number_format = "dd mmm yyyy"; st["B8"].font = Font(name=F, bold=True, color=ACC); st["B8"].fill = fill(PALE)
st["A10"] = "Problem sources: LeetCode problems are free (non-premium), well-liked, and exclude the NeetCode 150/250 lists you have likely already done. SQL = every free LeetCode database problem, then a second round of re-solving. Codeforces links open the problemset filtered by topic and rating; solve the first one you haven't solved."
st["A10"].alignment = Alignment(wrap_text=True, vertical="top"); st.merge_cells("A10:C12"); st["A10"].font = Font(name=F, size=9, color=MUTED)
st.column_dimensions["A"].width = 40; st.column_dimensions["B"].width = 14; st.column_dimensions["C"].width = 40

# ---------- Plan ----------
pl = wb.create_sheet("Plan", 0)
cols = ["Due", "Status", "Track", "Problem  (click to open)", "Level", "Phase", "Done", "Done on", "Needed help?", "Key insight (1 line)", "Topic (spoiler)", "url", "title", "slot", "quota"]
hdr(pl, 1, cols)
pl.row_dimensions[1].height = 28
firsts = {}
for i, (track, title, url, level, ph, topic) in enumerate(rows, 2):
    pl[f"C{i}"] = track; pl[f"E{i}"] = level; firsts.setdefault(ph, i); pl[f"K{i}"] = topic; pl[f"L{i}"] = url.replace("https://leetcode.com/problems/", "").rstrip("/") if "leetcode.com" in url else url; pl[f"M{i}"] = None if ("leetcode.com" in url and "(Round 2)" not in title and not re.search(r"-(ii|iii|iv|v|vi|i)/?$", url)) else title
    pl[f"H{i}"] = f'=IF(G{i}=TRUE,IF(H{i}="",TODAY(),H{i}),"")'; pl[f"H{i}"].number_format = "dd mmm"
f2, f3, f4 = [firsts[k] for k in sorted(firsts)][1:]
pl["F2"] = f'=ARRAYFORMULA(IF(C2:C{R}="","",IF(ROW(C2:C{R})<{f2},"1 · Unseen Mediums",IF(ROW(C2:C{R})<{f3},"2 · Medium-Hard",IF(ROW(C2:C{R})<{f4},"3 · OA Simulation","4 · Revision")))))'
WK = "(TODAY()-WEEKDAY(TODAY(),2)+1)"
rg = lambda c: f"{c}2:{c}{R}"
pl["O2"] = f'=ARRAYFORMULA(IF({rg("C")}="LeetCode",Settings!$B$4,IF({rg("C")}="SQL",Settings!$B$5,Settings!$B$6)))'
ONES = f'SIGN(ROW({rg("C")}))'
SAME = f'({rg("C")}=TRANSPOSE({rg("C")}))'
pl["N2"] = (f'=ARRAYFORMULA(IF({rg("G")}=TRUE,"",MMULT({SAME}*(ROW({rg("C")})>=TRANSPOSE(ROW({rg("C")})))*(TRANSPOSE({rg("G")})<>TRUE),{ONES})-1'
            f'+IF({rg("C")}="Codeforces",COUNTIFS({rg("C")},"Codeforces",{rg("H")},">="&{WK}),MMULT({SAME}*IFERROR(TRANSPOSE({rg("H")})=TODAY(),FALSE),{ONES}))))')
sat = f'({WK}+5+7*INT({rg("N")}/{rg("O")}))'
pl["A2"] = (f'=ARRAYFORMULA(IF({rg("C")}="","",IF({rg("G")}=TRUE,{rg("H")},IF({rg("C")}="Codeforces",IF({sat}<TODAY(),TODAY(),{sat}),'
            f'TODAY()+INT({rg("N")}/{rg("O")})))))')
pl["B2"] = (f'=ARRAYFORMULA(IF({rg("C")}="","",IF({rg("G")}=TRUE,"✓ Done",IF({rg("A")}=TODAY(),"▶ Today",IF({rg("A")}=TODAY()+1,"Tomorrow",TEXT({rg("A")},"ddd, dd mmm"))))))')
LINK = f'IF(LEFT({rg("L")},4)="http",{rg("L")},"https://leetcode.com/problems/"&{rg("L")}&"/")'
pl["D2"] = f'=ARRAYFORMULA(IF({rg("L")}="","",HYPERLINK({LINK},IF({rg("M")}="",PROPER(SUBSTITUTE({rg("L")},"-"," ")),{rg("M")}))))'
pl.column_dimensions["A"].number_format = "dd mmm"; pl["A2"].number_format = "dd mmm"
pl.column_dimensions["H"].number_format = "dd mmm"
for c, w in zip("ABCDEFGHIJKLMNO", [10, 13, 12, 52, 10, 19, 7, 10, 13, 40, 22, 4, 4, 4, 4]):
    pl.column_dimensions[c].width = w
for c in "LMNO": pl.column_dimensions[c].hidden = True
pl.freeze_panes = "E2"
dv = DataValidation(type="list", formula1='"Solo,Hint,Editorial"', allow_blank=True); pl.add_data_validation(dv); dv.add(f"I2:I{R}")
# spoiler: same colour as background (select the cell to read it)
pl.column_dimensions["K"].font = Font(name=F, color="FFFFFF", size=9)
body = f"A2:J{R}"
pl.conditional_formatting.add(body, FormulaRule(formula=["$G2=TRUE"], font=Font(color="9CA3AF", strike=True), fill=fill("F3F4F6"), stopIfTrue=True))
pl.conditional_formatting.add(body, FormulaRule(formula=['$B2="▶ Today"'], font=Font(color=DARK, bold=True), fill=fill(LIGHT), stopIfTrue=True))
pl.conditional_formatting.add(body, FormulaRule(formula=['$B2="Tomorrow"'], fill=fill(PALE), stopIfTrue=True))
pl.conditional_formatting.add(f"C2:C{R}", FormulaRule(formula=['$C2="SQL"'], font=Font(color="1D4ED8", bold=True)))
pl.conditional_formatting.add(f"C2:C{R}", FormulaRule(formula=['$C2="Codeforces"'], font=Font(color="0B1630", bold=True)))
pl.conditional_formatting.add(f"C2:C{R}", FormulaRule(formula=['$C2="LeetCode"'], font=Font(color="2563EB", bold=True)))
pl.conditional_formatting.add(f"E2:E{R}", FormulaRule(formula=['$E2="Hard"'], font=Font(color="DC2626", bold=True)))
pl.conditional_formatting.add(f"E2:E{R}", FormulaRule(formula=['$E2="Medium"'], font=Font(color="D97706")))
pl.conditional_formatting.add(f"E2:E{R}", FormulaRule(formula=['$E2="Easy"'], font=Font(color="059669")))
pl.auto_filter.ref = f"A1:K{R}"

# ---------- Today ----------
td = wb.create_sheet("Today", 0)
td.sheet_view.showGridLines = False
for c, w in zip("ABCDEFGHIJK", [3, 14, 58, 12, 14, 3, 3, 4, 4, 4, 4]):
    td.column_dimensions[c].width = w
for c in "HIJK": td.column_dimensions[c].hidden = True
td["B2"] = "Today's Practice"; td["B2"].font = Font(name=F, bold=True, size=22, color=NAVY)
td["B3"] = '=TEXT(TODAY(),"dddd, d mmmm yyyy")'; td["B3"].font = Font(name=F, size=11, color=MUTED)
td["E2"] = "=Settings!$B$8-TODAY()"; td["E2"].font = Font(name=F, bold=True, size=22, color=ACC); td["E2"].alignment = CENTER
td["E3"] = "days to placements"; td["E3"].font = Font(name=F, size=9, color=MUTED); td["E3"].alignment = CENTER
P = "Plan"
hdr(td, 5, ["Progress", "", "Done", "Total"], start=2)
for r, t in enumerate(["LeetCode", "SQL", "Codeforces"], 6):
    td[f"B{r}"] = t; td[f"B{r}"].font = Font(name=F, bold=True)
    td[f"D{r}"] = f'=COUNTIFS({P}!$C$2:$C${R},"{t}",{P}!$G$2:$G${R},TRUE)'
    td[f"E{r}"] = f'=COUNTIF({P}!$C$2:$C${R},"{t}")'
    td[f"C{r}"] = f'=SPARKLINE(D{r}/E{r},{{"charttype","bar";"max",1;"color1","#{ACC}";"empty","zero"}})'
    for c in "DE": td[f"{c}{r}"].alignment = CENTER
    for c in "BCDE": td[f"{c}{r}"].border = LINE
td["B9"] = "Solved today"; td["B9"].font = Font(name=F, bold=True)
td["D9"] = f"=COUNTIF({P}!$H$2:$H${R},TODAY())"; td["D9"].alignment = CENTER; td["D9"].font = Font(name=F, bold=True, size=12, color=ACC)
td["B11"] = "▶ Do these today"; td["B11"].font = Font(name=F, bold=True, size=14, color=ACC)
td["C11"] = "Tick them in the Plan tab. Finish early? Keep going in Plan: tomorrow's problems slide up."; td["C11"].font = Font(name=F, size=9, italic=True, color=MUTED)
hdr(td, 12, ["Track", "Problem (click to open)", "Level", "Phase"], start=2, color=ACC)
td["H13"] = (f'=IFERROR(ARRAY_CONSTRAIN(FILTER({{{P}!C2:C{R},{P}!D2:D{R},{P}!E2:E{R},{P}!L2:L{R}}},{P}!B2:B{R}="▶ Today"),12,4),"🎉 All done for today. Do extra in Plan if you have time.")')
td["B13"] = '=ARRAYFORMULA(IF(H13:H24="","",H13:H24))'
td["C13"] = '=ARRAYFORMULA(IF(K13:K24="","",HYPERLINK(IF(LEFT(K13:K24,4)="http",K13:K24,"https://leetcode.com/problems/"&K13:K24&"/"),I13:I24)))'
td["D13"] = '=ARRAYFORMULA(IF(J13:J24="","",J13:J24))'
for r in range(13, 25):
    for c in "BCDE": td[f"{c}{r}"].border = LINE; td[f"{c}{r}"].font = Font(name=F, size=11)
td["E13"] = f'=IFERROR(INDEX(Plan!F2:F{R},MATCH("▶ Today",Plan!B2:B{R},0)),"")'; td["E13"].font = Font(name=F, size=9, color=MUTED)
td["B26"] = "↻ Revisit today (redo from memory)"; td["B26"].font = Font(name=F, bold=True, size=14, color=DARK)
td["C26"] = "Problems you needed help on, coming back 3, 7 and 21 days after you solved them."; td["C26"].font = Font(name=F, size=9, italic=True, color=MUTED)
hdr(td, 27, ["Track", "Problem (click to open)", "Help used", "Solved on"], start=2, color=DARK)
gap = f"IFERROR(TODAY()-{P}!H2:H{R},0)"
td["H28"] = (f'=IFERROR(ARRAY_CONSTRAIN(FILTER({{{P}!C2:C{R},{P}!D2:D{R},{P}!I2:I{R},{P}!L2:L{R}}},'
             f'(({P}!I2:I{R}="Hint")+({P}!I2:I{R}="Editorial"))*(({gap}=3)+({gap}=7)+({gap}=21))),13,4),"Nothing to revisit today.")')
td["B28"] = '=ARRAYFORMULA(IF(H28:H40="","",H28:H40))'
td["C28"] = '=ARRAYFORMULA(IF(K28:K40="","",HYPERLINK(IF(LEFT(K28:K40,4)="http",K28:K40,"https://leetcode.com/problems/"&K28:K40&"/"),I28:I40)))'
td["D28"] = '=ARRAYFORMULA(IF(J28:J40="","",J28:J40))'
for r in range(28, 36):
    for c in "BCDE": td[f"{c}{r}"].border = LINE

# ---------- How to use ----------
hw = wb.create_sheet("How to Use", 2)
hw.sheet_view.showGridLines = False
hw["B2"] = "How to use this tracker"; hw["B2"].font = Font(name=F, bold=True, size=18, color=NAVY)
steps = [
    ("One-time setup (1 minute)", None),
    ("1", "Go to the Plan tab, click the column letter G (Done), then Insert → Checkbox."),
    ("2", "File → Settings → Calculation → Iterative calculation: ON. This lets 'Done on' remember the day you ticked a box."),
    ("Every day", None),
    ("1", "Open the Today tab. It lists today's minimum: 2 LeetCode + 1 SQL (+2 Codeforces on Saturdays)."),
    ("2", "Click a problem name to open it on LeetCode / Codeforces. Topic tags are hidden on purpose."),
    ("3", "When solved, tick it in the Plan tab (green rows = today) and pick Solo / Hint / Editorial."),
    ("4", "Got time? Keep ticking the next rows in Plan. Everything after slides one step earlier, so tomorrow still has a full minimum."),
    ("5", "Missed a day? Nothing piles up. Unfinished problems simply roll to today."),
    ("6", "Problems marked Hint or Editorial come back on the Today tab after 3, 7 and 21 days."),
    ("Tips", None),
    ("•", "Topic (spoiler) column: the text is hidden. Click the cell and read it in the formula bar after you solve."),
    ("•", "Change daily counts in the Settings tab. Roadmap tab has the phase plan."),
    ("•", "Already solved a problem? Tick it anyway and mark Solo, or replace the row with a new one."),
]
r = 4
for a, b in steps:
    if b is None:
        hw[f"B{r}"] = a; hw[f"B{r}"].font = Font(name=F, bold=True, size=12, color=NAVY); r += 1; continue
    hw[f"B{r}"] = a; hw[f"B{r}"].alignment = Alignment(horizontal="right", vertical="top"); hw[f"B{r}"].font = Font(name=F, bold=True, color=ACC)
    hw[f"C{r}"] = b; hw[f"C{r}"].alignment = Alignment(wrap_text=True, vertical="top"); hw[f"C{r}"].font = Font(name=F, size=11)
    r += 1
hw.column_dimensions["A"].width = 3; hw.column_dimensions["B"].width = 6; hw.column_dimensions["C"].width = 100

# ---------- Roadmap ----------
rm = wb.create_sheet("Roadmap", 3)
rm.sheet_view.showGridLines = False
rm["B2"] = "Roadmap · Oct 2026 → May 2027"; rm["B2"].font = Font(name=F, bold=True, size=18, color=NAVY)
hdr(rm, 4, ["Phase", "Dates", "LeetCode", "Codeforces (Sat)", "SQL", "Goal"], start=2)
phases = [
    ("1 · Unseen Mediums", "Oct 23 – Dec 27", "Random Mediums from the most-asked OA topics, tags hidden. No DP yet.", "1200–1300", "Easy → Medium", "Solve a random Medium solo in < 30 min"),
    ("2 · Medium-Hard", "Dec 28 – Feb 28", "70% Medium / 30% Hard. Common DP patterns start (about 1 in 4).", "1400–1500", "Medium", "Hards feel approachable"),
    ("3 · OA Simulation", "Mar 1 – Apr 15", "50% Medium / 50% Hard. Twice a week, do 3 in 90 min with no hints.", "1500–1700", "Medium/Hard, then round 2", "Pass a 90-min OA mock"),
    ("4 · Revision", "Apr 16 – May 1", "Mediums plus the revisit queue. No new topics.", "1600", "Round 2", "Calm and sharp"),
]
for i, p in enumerate(phases, 5):
    for j, v in enumerate(p, 2):
        c = rm.cell(row=i, column=j, value=v); c.alignment = Alignment(wrap_text=True, vertical="top"); c.border = LINE; c.font = Font(name=F, size=10, bold=(j == 2))
    rm.row_dimensions[i].height = 48
rm["B10"] = "Rules for every new problem"; rm["B10"].font = Font(name=F, bold=True, size=12, color=NAVY)
for k, t in enumerate(["Read it and write down the constraints before thinking of an approach.",
                       "Think for 25 min before any hint: brute force → why it is slow → what to optimise.",
                       "Write a one-line key insight. That line is what you revise.",
                       "Sunday: LeetCode Weekly Contest (8:00 AM IST). Upsolve what you missed."], 11):
    rm[f"B{k}"] = f"{k-10}."; rm[f"C{k}"] = t; rm.merge_cells(f"C{k}:G{k}")
for c, w in zip("ABCDEFG", [3, 20, 16, 50, 16, 22, 30]): rm.column_dimensions[c].width = w

for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if c.value is not None and c.font.name != F:
                c.font = Font(name=F, size=c.font.size, bold=c.font.bold, color=c.font.color, italic=c.font.italic)
td.sheet_properties.tabColor = ACC; pl.sheet_properties.tabColor = NAVY; st.sheet_properties.tabColor = "9CA3AF"
wb.active = 0
wb.save(sys.argv[2] if len(sys.argv) > 2 else "DSA_Prep_Tracker.xlsx")
