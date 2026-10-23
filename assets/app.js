"use strict";
// Problems come from problems.js as P: [track L/S/C, title, slug-or-url, level, phase, topic]
const PLACEMENT = new Date(2027, 4, 1);
const PHASES = {1:"Phase 1 · Unseen Mediums (to Dec 27)",2:"Phase 2 · Medium–Hard (to Feb 28)",3:"Phase 3 · OA simulation (to Apr 15)",4:"Phase 4 · Revision (to May 1)"};
const TRACK = {L:"LeetCode",S:"SQL",C:"Codeforces"};
const REV = [3,7,21];
const LS_KEY = "dsa-daily-v1";

let state = {done:{}, quota:{L:2,S:1,C:2}};
let showExtra = 0;

const revealed = new Set();

const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const diffDays = (a,b) => Math.round((parse(ymd(a)) - parse(ymd(b))) / 864e5);
const today = () => new Date();
const weekStart = d => addDays(parse(ymd(d)), -((d.getDay()+6)%7)); // Monday
const url = i => P[i][0]==="C" ? P[i][2] : "https://leetcode.com/problems/"+P[i][2]+"/";
const isWeekend = d => d.getDay()===0 || d.getDay()===6;
const el = (t, cls, txt) => { const e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

function displayTitle(i){
  const p = P[i];
  if (p[0]==="C") return "Top unsolved problem · rating " + p[3].replace("CF ","");
  return p[1];
}
function queue(track){ const q=[]; P.forEach((p,i)=>{ if(p[0]===track && !state.done[i]) q.push(i); }); return q; }
function doneOn(track, from, to){ // ids done in [from,to] (ymd strings)
  return Object.keys(state.done).map(Number).filter(i => P[i] && P[i][0]===track && state.done[i].d>=from && state.done[i].d<=to)
    .sort((a,b)=> (state.done[a].t||0)-(state.done[b].t||0) || a-b);
}

function todayPlan(){
  const t = ymd(today()), q = state.quota, out = [];
  for (const tr of ["L","S"]) {
    // today's slots = lowest-index problems among (done today + still undone), so extras never push a planned one out
    out.push(...[...doneOn(tr,t,t), ...queue(tr).slice(0, q[tr]||0)].sort((a,b)=>a-b).slice(0, q[tr]||0));
  }
  const ws = weekStart(today()), we = addDays(ws,6);
  const cfDone = doneOn("C", ymd(ws), ymd(we));
  const cfNeed = Math.max(0,(q.C||0)-cfDone.length);
  const cfToday = isWeekend(today()) ? [...cfDone.filter(i=>state.done[i].d===t), ...queue("C").slice(0,cfNeed)] : [];
  out.push(...cfToday);
  const extraToday = Object.keys(state.done).map(Number).filter(i => state.done[i].d===t && !out.includes(i));
  return {main: out, extraDone: extraToday, cfNeed, cfDone: cfDone.length};
}

function revisitsDue(){
  const t = today(), out = [];
  for (const [k,v] of Object.entries(state.done)) {
    if (!v.h || v.h==="s") continue;
    const r = v.r||0; if (r >= REV.length) continue;
    const due = addDays(parse(v.d), REV[r]);
    if (diffDays(t,due) >= 0) out.push({i:+k, r, due});
  }
  return out.sort((a,b)=>a.due-b.due);
}

/* ---------- rendering ---------- */
function problemRow(i, opts={}){
  const p = P[i], d = state.done[i], row = el("div","row"+(d?" is-done":""));
  const cb = el("input","tick"); cb.type="checkbox"; cb.checked=!!d; cb.id="p"+i;
  cb.setAttribute("aria-label", (d?"Untick ":"Tick ")+displayTitle(i));
  cb.addEventListener("change", ()=> toggle(i, cb.checked));
  const main = el("div","main");
  const a = el("a","title"); a.href=url(i); a.target="_blank"; a.rel="noopener"; a.textContent=displayTitle(i);
  a.appendChild(el("span","arrow","↗"));
  main.appendChild(a);
  const meta = el("div","meta");
  meta.appendChild(el("span","track",TRACK[p[0]]));
  const lv = p[0]==="C" ? "CF" : p[3];
  meta.appendChild(el("span","pill lv-"+lv, p[0]==="C" ? p[3] : p[3]));
  if (revealed.has(i)) meta.appendChild(el("span","",p[5]));
  else { const s = el("button","spoil","show topic"); s.type="button"; s.addEventListener("click",()=>{revealed.add(i);render();}); meta.appendChild(s); }
  main.appendChild(meta);
  if (d && !opts.compact) {
    const after = el("div","after");
    [["s","Solo"],["h","Hint"],["e","Editorial"]].forEach(([k,label])=>{
      const c = el("button","chip",label); c.type="button"; c.setAttribute("aria-pressed", String((d.h||"s")===k));
      c.addEventListener("click",()=>{ state.done[i] = {...state.done[i], h:k, r:0}; changed(); });
      after.appendChild(c);
    });
    const note = el("input","note"); note.id="n"+i; note.placeholder="Key insight in one line"; note.value=d.n||"";
    note.setAttribute("aria-label","Key insight for "+displayTitle(i));
    note.addEventListener("change",()=>{ state.done[i] = {...state.done[i], n:note.value.slice(0,200)}; changed(); });
    after.appendChild(note);
    main.appendChild(after);
  }
  row.append(cb, main, el("div","side", opts.side || ""));
  return row;
}

function render(){
  const v = currentView();
  if (v==="problems") renderProblems();
  if (v==="roadmap") renderRoadmap();
  const now = today(), t = ymd(now);
  document.getElementById("date").textContent = now.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  document.getElementById("daysLeft").textContent = Math.max(0, diffDays(PLACEMENT, now));

  // stats
  const stats = document.getElementById("stats"); stats.replaceChildren();
  const solvedToday = Object.values(state.done).filter(v=>v.d===t).length;
  for (const tr of ["L","S","C"]) {
    const tot = P.filter(p=>p[0]===tr).length, dn = Object.keys(state.done).filter(i=>P[i]&&P[i][0]===tr).length;
    const s = el("div","stat"); s.append(el("div","k",TRACK[tr]));
    const v = el("div","v num"); v.textContent = dn; v.appendChild(el("small",""," / "+tot)); s.append(v);
    const b = el("div","bar"), f = el("i"); f.style.width = (100*dn/tot).toFixed(1)+"%"; b.append(f); s.append(b);
    stats.append(s);
  }
  const s4 = el("div","stat"); s4.append(el("div","k","Solved today"), el("div","v num", String(solvedToday))); stats.append(s4);

  // today
  const plan = todayPlan();
  const list = document.getElementById("today"); list.replaceChildren();
  plan.main.forEach(i => list.append(problemRow(i)));
  const remaining = plan.main.filter(i=>!state.done[i]).length;
  const q = state.quota;
  document.getElementById("todaySub").textContent =
    `${q.L} LeetCode + ${q.S} SQL` + (isWeekend(now) ? ` + Codeforces (${plan.cfDone}/${q.C} this week)` : ` · Codeforces on the weekend`);
  const dm = document.getElementById("todayDone"); dm.replaceChildren();
  if (plan.main.length && remaining===0) dm.append(el("div","done-msg","Daily minimum done. Anything extra moves tomorrow’s problems up."));

  // extra
  const ex = document.getElementById("extra"); ex.replaceChildren();
  const nextUp = queue("L").filter(i=>!plan.main.includes(i)).slice(0, showExtra);
  const extraIds = [...plan.extraDone, ...nextUp.filter(i=>!plan.extraDone.includes(i))];
  extraIds.forEach(i => ex.append(problemRow(i,{side: state.done[i] ? "extra" : "from tomorrow"})));
  document.getElementById("moreBtn").textContent = extraIds.length ? "Show another" : "Got time? Do one more";

  // revisit
  const rv = revisitsDue(), rl = document.getElementById("revisit"); rl.replaceChildren();
  document.getElementById("revPanel").hidden = rv.length===0;
  rv.forEach(({i,r})=>{
    const row = problemRow(i,{compact:true, side:"revisit "+(r+1)+" of 3"});
    const cb = row.querySelector(".tick"); cb.checked=false; cb.setAttribute("aria-label","Mark revisit done: "+displayTitle(i));
    row.classList.remove("is-done");
    const fresh = cb.cloneNode(true); cb.replaceWith(fresh);
    fresh.addEventListener("change",()=>{ state.done[i] = {...state.done[i], r:(state.done[i].r||0)+1}; changed(); });
    if (state.done[i].n) row.querySelector(".main").append(el("div","meta","Your insight: "+state.done[i].n));
    rl.append(row);
  });

  // week strip
  const days = document.getElementById("days"); days.replaceChildren();
  const ws = weekStart(now);
  for (let k=0;k<7;k++){
    const d = addDays(ws,k), key = ymd(d), c = Object.values(state.done).filter(v=>v.d===key).length;
    const box = el("div","day"+(key===t?" today":"")+(c?"":" zero"));
    box.append(el("div","dn", d.toLocaleDateString(undefined,{weekday:"short"})), el("div","dc num", String(c)));
    days.append(box);
  }
  let streak = 0; for (let d = new Date(now); ; d = addDays(d,-1)) {
    const key = ymd(d), c = Object.values(state.done).some(v=>v.d===key);
    if (c) streak++; else if (key!==t) break; if (streak>400) break;
  }
  document.getElementById("streak").textContent = streak ? `${streak}-day streak` : "Start your streak today";

  // upcoming (simulate)
  const up = document.getElementById("upcoming"); up.replaceChildren();
  const qL = queue("L").filter(i=>!plan.main.includes(i)), qS = queue("S").filter(i=>!plan.main.includes(i));
  let qC = queue("C").filter(i=>!plan.main.includes(i));
  let cfLeftThisWeek = isWeekend(now) ? 0 : plan.cfNeed;
  for (let k=1;k<=7;k++){
    const d = addDays(now,k);
    const items = [...qL.splice(0,q.L), ...qS.splice(0,q.S)];
    if (d.getDay()===6) { const n = diffDays(weekStart(d), weekStart(now))===0 ? cfLeftThisWeek : q.C; items.push(...qC.splice(0,n)); }
    up.append(el("div","up-day", d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"})));
    items.forEach(i=>{ const r = el("div","up"); const a = el("a","",displayTitle(i)); a.href=url(i); a.target="_blank"; a.rel="noopener";
      r.append(el("span","pill lv-"+(P[i][0]==="C"?"CF":P[i][3]), P[i][0]==="C"?"CF":P[i][3]), a); up.append(r); });
  }

  // settings
  for (const k of ["L","S","C"]) { const inp = document.getElementById("q"+k); if (document.activeElement!==inp) inp.value = q[k]; }
  const cur = plan.main.length ? P[plan.main[0]][4] : 4;
  document.getElementById("phaseInfo").textContent = "You are in " + PHASES[cur] + ".";
}

/* ---------- state changes ---------- */
function toggle(i, on){
  if (on) state.done[i] = {d: ymd(today()), h:"s", r:0, t: Date.now()};
  else delete state.done[i];
  changed();
}
function changed(){ render(); persistLocal(); }
function persistLocal(){
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); setSave("Saved in this browser"); }
  catch(e){ setSave("Couldn’t save in this browser. Private mode or blocked storage can cause this."); }
}
function setSave(msg){ document.getElementById("saveState").textContent = msg; }
function toast(msg){
  document.querySelectorAll(".toast").forEach(x=>x.remove()); const t = el("div","toast",msg); t.setAttribute("role","status"); document.body.append(t); setTimeout(()=>t.remove(), 2600);
}

document.getElementById("moreBtn").addEventListener("click", ()=>{ showExtra++; render(); });
for (const k of ["L","S","C"]) document.getElementById("q"+k).addEventListener("change", e=>{
  const v = Math.max(0, Math.min(10, parseInt(e.target.value,10)||0)); state.quota = {...state.quota, [k]: v}; changed();
});

/* ---------- backup ---------- */
document.getElementById("exportBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify({app:"dsa-daily", v:1, saved:new Date().toISOString(), state}, null, 1)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dsa-daily-backup-"+ymd(today())+".json";
  document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
});
document.getElementById("importFile").addEventListener("change", async e=>{
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const data = JSON.parse(await f.text()), s = data.state || data;
    if (!s || typeof s.done !== "object") throw new Error("shape");
    state = {quota:{L:2,S:1,C:2}, ...s}; changed();
    toast("Backup restored: " + Object.keys(state.done).length + " solved problems");
  } catch(err){ toast("That file isn’t a DSA Daily backup. Pick the .json file you downloaded."); }
});

/* ---------- theme ---------- */
const PALETTES = {midnight:["Midnight","#1D4ED8","#5B9BFF"],galaxy:["Galaxy","#4A4E8F","#A3A7F2"],ocean:["Ocean","#0F766E","#4FD1C5"],forest:["Forest","#3F6B3A","#8CC77F"],sunset:["Sunset","#C2410C","#FB923C"],rose:["Rose","#BE185D","#F472B6"],mono:["Mono","#111111","#F2F2F2"]};
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

/* ---------- boot ---------- */
try { const s = JSON.parse(localStorage.getItem(LS_KEY)||"null"); if (s && s.done) state = {quota:{L:2,S:1,C:2}, ...s}; } catch(e){}
route();
setSave(Object.keys(state.done).length ? "Saved in this browser" : "Tick a problem to start. Progress saves in this browser.");
document.body.dataset.day = ymd(today());
setInterval(()=>{ if (ymd(today()) !== document.body.dataset.day) { document.body.dataset.day = ymd(today()); render(); } }, 60000);
