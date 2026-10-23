import re, os
D='site/dsa-daily'
css=open(D+'/assets/style.css').read(); html=open(D+'/index.html').read(); js=open(D+'/assets/app.js').read()

# ---------- palettes: name -> (light, dark) of bg surface ink muted line accent accent-ink soft
PAL = {
 "midnight":("Midnight",("F4F6FB","FFFFFF","0B1630","56637F","DCE2EE","1D4ED8","FFFFFF","E6ECFB"),("04060B","0B1530","F5F7FF","8F9CBC","1B2950","5B9BFF","04060B","13224A")),
 "galaxy":("Galaxy",("F4F3FA","FFFFFF","1E1830","6B6683","E3E0EF","4A4E8F","FFFFFF","ECEBF8"),("14111D","1D1929","ECE9F6","9C96B5","2D2840","A3A7F2","14111D","262140")),
 "ocean":("Ocean",("F1F7F7","FFFFFF","10272B","557075","D7E6E7","0F766E","FFFFFF","E0F0EE"),("071415","0E2224","E6F4F3","8FB0B2","1C3739","4FD1C5","071415","133133")),
 "forest":("Forest",("F6F5EF","FFFFFF","1F2A1D","5F6B5A","E2E2D6","3F6B3A","FFFFFF","E7EEDF"),("0F140E","182016","EDF1E8","9AA893","2A3527","8CC77F","0F140E","1F2C1C")),
 "sunset":("Sunset",("FBF5F1","FFFFFF","2B1A14","7A6158","EFE2DA","C2410C","FFFFFF","FBE8DD"),("140C09","22150F","F8EDE7","B39B90","3A2820","FB923C","140C09","2E1B13")),
 "rose":("Rose",("FBF4F6","FFFFFF","2A1520","7A5E6A","EEDDE4","BE185D","FFFFFF","FBE4EE"),("130A0F","21121A","F7EAF0","B496A4","3A2330","F472B6","130A0F","2E1824")),
 "mono":("Mono",("F5F5F5","FFFFFF","111111","666666","E2E2E2","111111","FFFFFF","EBEBEB"),("000000","111111","F2F2F2","9A9A9A","262626","F2F2F2","000000","1C1C1C")),
}
KEYS=["bg","surface","ink","muted","line","accent","accent-ink","soft"]
def decl(v, dark):
    d={k:"#"+x for k,x in zip(KEYS,v)}; d["good"]=d["accent"]; d["good-soft"]=d["soft"]
    d.update({"medium":"#E3AE5A","hard":"#EE8496","easy":"#5CC79E"} if dark else {"medium":"#A86A12","hard":"#B4475A","easy":"#1F7A5C"})
    return " ".join(f"--{k}:{x};" for k,x in d.items()) + (" color-scheme:dark;" if dark else "")
start=css.index(':root{'); end=css.index('*{box-sizing')
fonts='''  --display:"Sora",ui-sans-serif,system-ui,sans-serif;
  --body:"Manrope",ui-sans-serif,system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,Menlo,monospace;'''
out=[f":root{{\n  {decl(PAL['midnight'][1],False)}\n{fonts}\n}}"]
out.append(f'@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{ {decl(PAL["midnight"][2],True)} }}}}')
out.append(f':root[data-theme="dark"]{{ {decl(PAL["midnight"][2],True)} }}')
for k,(name,l,d) in PAL.items():
    if k=="midnight": continue
    out.append(f':root[data-palette="{k}"]{{ {decl(l,False)} }}')
    out.append(f'@media (prefers-color-scheme: dark){{:root[data-palette="{k}"]:not([data-theme="light"]){{ {decl(d,True)} }}}}')
    out.append(f':root[data-palette="{k}"][data-theme="dark"]{{ {decl(d,True)} }}')
css=css[:start]+"/* Themes: Midnight is the default; each palette has a light and a dark set. */\n"+"\n".join(out)+"\n"+css[end:]
css+='''
/* header stays on one row on phones */
.top{flex-wrap:nowrap;align-items:center}
.top>div:first-child{flex:1 1 auto;min-width:0}
@media (max-width:420px){.count b{font-size:24px}.count span{font-size:11px}}
/* nav + views */
.tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:4px;overflow-x:auto}
.tabs a{flex:1 0 auto;text-align:center;text-decoration:none;padding:8px 12px;border-radius:9px;font-weight:600;color:var(--muted);white-space:nowrap}
.tabs a[aria-current="page"]{background:var(--accent);color:var(--accent-ink)}
.view{display:flex;flex-direction:column;gap:22px}
.view[hidden]{display:none}
/* theme picker */
.top{position:relative}
.picker{position:absolute;right:0;top:calc(100% + 8px);z-index:10;width:min(320px,100%);background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 12px 32px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:12px}
.picker[hidden]{display:none}
.picker .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.swatches{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.sw{border:2px solid var(--line);border-radius:10px;padding:6px 4px;background:transparent;font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.sw i{display:block;width:28px;height:28px;border-radius:50%}
.sw[aria-pressed="true"]{border-color:var(--accent)}
.modes{display:flex;gap:6px}
.modes .chip{flex:1}
/* all problems */
.filters{display:flex;gap:8px;flex-wrap:wrap}
.filters input,.filters select{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:8px 10px;font:inherit;font-size:14px;min-width:0}
.filters input{flex:1 1 200px}
/* roadmap */
.phase{border-top:1px solid var(--line);padding:14px 0}
.phase:first-of-type{border-top:0}
.phase h3{margin:0;font-family:var(--display);font-size:16px;font-weight:600}
.phase .when{color:var(--muted);font-size:13px}
.phase ul{margin:8px 0 0;padding-left:20px;color:var(--muted);font-size:14px}
.phase.now h3::after{content:"You are here";margin-left:8px;font-family:var(--body);font-size:11px;font-weight:700;color:var(--accent-ink);background:var(--accent);border-radius:99px;padding:2px 8px;vertical-align:middle}
'''

# ---------- html
sw_svg='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>'
old_btn=html[html.index('    <button class="theme-btn"'):html.index('</header>')]
html=html.replace(old_btn, f'''    <button class="theme-btn" id="themeBtn" type="button" aria-label="Choose theme" aria-expanded="false" aria-controls="picker">{sw_svg}</button>
    <div class="picker" id="picker" hidden>
      <div class="k">Theme</div>
      <div class="swatches" id="swatches"></div>
      <div class="k">Mode</div>
      <div class="modes" id="modes"></div>
    </div>
  ''')
html=html.replace('<h1>Today’s practice</h1>','<h1>DSA Daily</h1>')
html=html.replace('  <section class="stats"','''  <nav class="tabs" aria-label="Sections">
    <a href="#today" data-view="today">Today</a>
    <a href="#problems" data-view="problems">All problems</a>
    <a href="#roadmap" data-view="roadmap">Roadmap</a>
  </nav>

  <div class="view" id="view-today">
  <section class="stats"''',1)
html=html.replace('  <div class="save" id="saveState">','''  </div>

  <div class="view" id="view-problems" hidden>
    <section class="panel" aria-labelledby="allH">
      <div class="ph"><h2 id="allH">All problems</h2><span class="sub" id="allCount"></span></div>
      <div class="filters">
        <input id="fq" type="search" placeholder="Search by name" aria-label="Search problems by name">
        <select id="ft" aria-label="Track"><option value="">All tracks</option><option value="L">LeetCode</option><option value="S">SQL</option><option value="C">Codeforces</option></select>
        <select id="fs" aria-label="Status"><option value="">Any status</option><option value="todo">Not solved</option><option value="done">Solved</option><option value="help">Needed help</option></select>
        <select id="fl" aria-label="Difficulty"><option value="">Any level</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      </div>
      <div class="list" id="allList" style="margin-top:8px"></div>
      <div class="more"><button class="btn" id="allMore" type="button">Show more</button></div>
    </section>
  </div>

  <div class="view" id="view-roadmap" hidden>
    <section class="panel" aria-labelledby="rmH">
      <div class="ph"><h2 id="rmH">Roadmap to May 2027</h2><span class="sub">Four phases, about 2 hours a day</span></div>
      <div id="phases"></div>
    </section>
  </div>

  <div class="save" id="saveState">''',1)
html=html.replace('<meta name="theme-color" content="#04060B" media="(prefers-color-scheme: dark)">\n<meta name="theme-color" content="#F4F6FB" media="(prefers-color-scheme: light)">',
 '<script>try{var p=localStorage.getItem("dsa-daily-palette"),m=localStorage.getItem("dsa-daily-theme");if(p&&p!=="midnight")document.documentElement.dataset.palette=p;if(m==="light"||m==="dark")document.documentElement.dataset.theme=m;}catch(e){}</script>')
assert 'view-roadmap' in html and 'dataset.palette' in html

# ---------- js: replace theme block
a=js.index('/* ---------- theme ---------- */'); b=js.index('/* ---------- boot ---------- */')
pal_js="{"+",".join(f'{k}:["{n}","#{l[5]}","#{d[5]}"]' for k,(n,l,d) in PAL.items())+"}"
js=js[:a]+'''/* ---------- theme ---------- */
const PALETTES = '''+pal_js+''';
const MODES = [["auto","Auto"],["light","Light"],["dark","Dark"]];
let theme = {palette:"midnight", mode:"auto"};
try { theme.palette = localStorage.getItem("dsa-daily-palette") || "midnight"; theme.mode = localStorage.getItem("dsa-daily-theme") || "auto"; } catch(e){}
if (!PALETTES[theme.palette]) theme.palette = "midnight";
function applyTheme(){
  const r = document.documentElement;
  if (theme.palette === "midnight") r.removeAttribute("data-palette"); else r.dataset.palette = theme.palette;
  if (theme.mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = theme.mode;
  try { localStorage.setItem("dsa-daily-palette", theme.palette); localStorage.setItem("dsa-daily-theme", theme.mode); } catch(e){}
  const dark = theme.mode === "dark" || (theme.mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  const sw = document.getElementById("swatches"); sw.replaceChildren();
  for (const [k,[name,lc,dc]] of Object.entries(PALETTES)) {
    const b = el("button","sw"); b.type="button"; b.setAttribute("aria-pressed", String(k===theme.palette));
    const dot = el("i"); dot.style.background = dark ? dc : lc; b.append(dot, el("span","",name));
    b.addEventListener("click", ()=>{ theme.palette = k; applyTheme(); });
    sw.append(b);
  }
  const md = document.getElementById("modes"); md.replaceChildren();
  for (const [k,label] of MODES) {
    const b = el("button","chip",label); b.type="button"; b.setAttribute("aria-pressed", String(k===theme.mode));
    b.addEventListener("click", ()=>{ theme.mode = k; applyTheme(); });
    md.append(b);
  }
}
const picker = document.getElementById("picker"), themeBtn = document.getElementById("themeBtn");
function setPicker(open){ picker.hidden = !open; themeBtn.setAttribute("aria-expanded", String(open)); }
themeBtn.addEventListener("click", e=>{ e.stopPropagation(); setPicker(picker.hidden); });
picker.addEventListener("click", e=> e.stopPropagation()); // swatches re-render on click, so keep clicks inside from closing it
document.addEventListener("click", e=>{ if (!picker.hidden) setPicker(false); });
document.addEventListener("keydown", e=>{ if (e.key==="Escape" && !picker.hidden) { setPicker(false); themeBtn.focus(); } });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ()=>{ if (theme.mode==="auto") applyTheme(); });
applyTheme();

/* ---------- views ---------- */
const VIEWS = ["today","problems","roadmap"];
let allShown = 60;
function currentView(){ const h = location.hash.slice(1); return VIEWS.includes(h) ? h : "today"; }
function route(){
  const v = currentView();
  for (const x of VIEWS) document.getElementById("view-"+x).hidden = x !== v;
  document.querySelectorAll(".tabs a").forEach(a=> a.dataset.view===v ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"));
  render();
}
window.addEventListener("hashchange", route);
function renderProblems(){
  const q = document.getElementById("fq").value.trim().toLowerCase(), t = document.getElementById("ft").value,
        s = document.getElementById("fs").value, l = document.getElementById("fl").value;
  const ids = [];
  P.forEach((p,i)=>{
    const d = state.done[i];
    if (t && p[0]!==t) return;
    if (l && p[3]!==l) return;
    if (s==="todo" && d) return;
    if (s==="done" && !d) return;
    if (s==="help" && !(d && d.h && d.h!=="s")) return;
    if (q && !displayTitle(i).toLowerCase().includes(q)) return;
    ids.push(i);
  });
  const list = document.getElementById("allList"); list.replaceChildren();
  ids.slice(0, allShown).forEach(i => list.append(problemRow(i, {side: state.done[i] ? "solved "+parse(state.done[i].d).toLocaleDateString(undefined,{day:"numeric",month:"short"}) : PHASES[P[i][4]].split(" · ")[0]})));
  if (!ids.length) list.append(el("p","sub","No problems match. Clear the search or pick another filter."));
  document.getElementById("allCount").textContent = ids.length + " of " + P.length;
  document.getElementById("allMore").hidden = ids.length <= allShown;
}
["fq","ft","fs","fl"].forEach(id => document.getElementById(id).addEventListener("input", ()=>{ allShown = 60; renderProblems(); }));
document.getElementById("allMore").addEventListener("click", ()=>{ allShown += 60; renderProblems(); });
const ROADMAP = [
  [1,"Unseen Mediums","26 Oct – 27 Dec 2026",["2 new Mediums a day on the most-asked OA topics: arrays, strings, hashing, two pointers, sliding window, binary search, graphs, trees, heaps.","Hide topic tags and work out the pattern yourself.","1 SQL problem a day from the SQL 50 list."]],
  [2,"Medium–Hard","28 Dec 2026 – 28 Feb 2027",["Timed Mediums plus one Hard every few days.","Company-tagged sets and light DP (1D, knapsack, grids).","Codeforces on weekends at 1200–1500 rating."]],
  [3,"OA simulation","1 Mar – 15 Apr 2027",["2–3 problems in 90 minutes, twice a week, like a real OA.","LeetCode weekly contests and upsolving.","Harder SQL: window functions and joins."]],
  [4,"Revision","16 Apr – 1 May 2027",["Re-solve every problem you marked Hint or Editorial.","Read your one-line insights daily.","Light new practice only, to stay sharp."]],
];
function renderRoadmap(){
  const box = document.getElementById("phases"); box.replaceChildren();
  const cur = (todayPlan().main[0] != null) ? P[todayPlan().main[0]][4] : 4;
  for (const [n,name,when,points] of ROADMAP) {
    const tot = P.filter(p=>p[4]===n).length, dn = Object.keys(state.done).filter(i=>P[i] && P[i][4]===n).length;
    const ph = el("div","phase"+(n===cur?" now":""));
    ph.append(el("h3","","Phase "+n+" · "+name), el("div","when",when+" · "+dn+" of "+tot+" solved"));
    const bar = el("div","bar"), f = el("i"); f.style.width = (tot ? 100*dn/tot : 0).toFixed(1)+"%"; bar.append(f); ph.append(bar);
    const ul = el("ul"); points.forEach(p=> ul.append(el("li","",p))); ph.append(ul);
    box.append(ph);
  }
}

'''+js[b:]
# render(): also draw the active secondary view
js=js.replace('function render(){','function render(){\n  const v = currentView();\n  if (v==="problems") renderProblems();\n  if (v==="roadmap") renderRoadmap();',1)
js=js.replace('render();\nsetSave(','route();\nsetSave(',1)
js=js.replace('toast("Theme: " + themeMode);','')
open(D+'/assets/style.css','w').write(css); open(D+'/index.html','w').write(html); open(D+'/assets/app.js','w').write(js)
print("ok")
