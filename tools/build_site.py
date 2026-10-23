import os, json, re, shutil
t = open('page/template.html').read().split('\n')
css = '\n'.join(t[5:111])          # lines 6-111
body = '\n'.join(t[113:169])       # lines 114-169
js = '\n'.join(t[171:397])         # lines 172-397

# ---- body: theme toggle in header, backup controls in settings
body = body.replace('<div class="count"><b class="num" id="daysLeft">–</b><span>days to placements</span></div>',
 '<div class="count"><b class="num" id="daysLeft">–</b><span>days to placements</span></div>\n    <button class="theme-btn" id="themeBtn" type="button" aria-label="Switch colour theme"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg></button>')
body = body.replace('      <div class="sub" id="phaseInfo"',
'''      <div class="backup">
        <div class="k">Backup</div>
        <p>Your progress is saved in this browser. Download a backup now and then, and restore it on a new laptop or phone.</p>
        <div class="more" style="margin-top:0">
          <button class="btn" id="exportBtn" type="button">Download backup</button>
          <label class="btn" for="importFile">Restore backup</label>
          <input id="importFile" type="file" accept="application/json,.json" hidden>
        </div>
      </div>
      <div class="sub" id="phaseInfo"''')
assert 'themeBtn' in body and 'exportBtn' in body

css += '''
.theme-btn{border:1px solid var(--line);background:var(--surface);border-radius:10px;width:40px;height:40px;font-size:18px;display:grid;place-content:center;align-self:center}
.backup .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.backup p{margin:4px 0 10px;color:var(--muted);font-size:14px}
label.btn{cursor:pointer;display:inline-block}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:10px;font-weight:600;font-size:14px;max-width:calc(100% - 32px)}
'''

# ---- js: drop the Claude sync, keep local save, add backup + theme
js = js.replace('const P = __DATA__; // [track L/S/C, title, slug-or-url, level, phase, topic]\n', '')
js = js.replace('let db = null, docRef = null, dirty = false, saveTimer = null;', '')
old_save = js[js.index('function changed(){'):js.index('document.getElementById("moreBtn").addEventListener')]
assert len(old_save) > 200
js = js.replace(old_save, '''function changed(){ render(); persistLocal(); }
function persistLocal(){
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); setSave("Saved in this browser"); }
  catch(e){ setSave("Couldn’t save in this browser. Private mode or blocked storage can cause this."); }
}
function setSave(msg){ document.getElementById("saveState").textContent = msg; }
function toast(msg){
  document.querySelectorAll(".toast").forEach(x=>x.remove()); const t = el("div","toast",msg); t.setAttribute("role","status"); document.body.append(t); setTimeout(()=>t.remove(), 2600);
}

''')
boot_start = js.index('/* ---------- boot ---------- */')
js = js[:boot_start] + '''/* ---------- backup ---------- */
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
const THEMES = ["auto","dark","light"];
function applyTheme(m){
  if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.dataset.theme = m;
  document.getElementById("themeBtn").title = "Theme: " + m;
}
let themeMode = "auto";
try { themeMode = localStorage.getItem("dsa-daily-theme") || "auto"; } catch(e){}
applyTheme(themeMode);
document.getElementById("themeBtn").addEventListener("click", ()=>{
  themeMode = THEMES[(THEMES.indexOf(themeMode)+1) % 3]; applyTheme(themeMode);
  try { localStorage.setItem("dsa-daily-theme", themeMode); } catch(e){}
  toast("Theme: " + themeMode);
});

/* ---------- boot ---------- */
try { const s = JSON.parse(localStorage.getItem(LS_KEY)||"null"); if (s && s.done) state = {quota:{L:2,S:1,C:2}, ...s}; } catch(e){}
render();
setSave(Object.keys(state.done).length ? "Saved in this browser" : "Tick a problem to start. Progress saves in this browser.");
document.body.dataset.day = ymd(today());
setInterval(()=>{ if (ymd(today()) !== document.body.dataset.day) { document.body.dataset.day = ymd(today()); render(); } }, 60000);
'''
assert 'claude' not in js and 'docRef' not in js and 'dirty' not in js, [m.start() for m in re.finditer('claude|docRef|dirty',js)]

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DSA Daily · Placement practice tracker</title>
<meta name="description" content="Daily LeetCode, SQL and Codeforces practice for placements, with an auto-shifting schedule and spaced revisits.">
<meta name="theme-color" content="#04060B" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F4F6FB" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
<script defer src="/assets/problems.js"></script>
<script defer src="/assets/app.js"></script>
</head>
<body>
{body}
<noscript><p style="text-align:center">This tracker needs JavaScript turned on.</p></noscript>
</body>
</html>
'''
out = 'site/dsa-daily'
shutil.rmtree(out, ignore_errors=True); os.makedirs(out+'/assets')
open(out+'/index.html','w').write(html)
open(out+'/assets/style.css','w').write(css.strip()+'\n')
open(out+'/assets/app.js','w').write('"use strict";\n// Problems come from problems.js as P: [track L/S/C, title, slug-or-url, level, phase, topic]\n'+js.strip()+'\n')
open(out+'/assets/problems.js','w').write('// 624 problems: 380 LeetCode, 190 SQL, 54 Codeforces. Row: [track, title, slug-or-url, level, phase, topic]\nconst P = '+open('problems.json').read()+';\n')
open(out+'/favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0B1630"/><path d="M18 33l9 9 19-20" fill="none" stroke="#5B9BFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>\n')
open(out+'/manifest.webmanifest','w').write(json.dumps({"name":"DSA Daily","short_name":"DSA Daily","start_url":"/","display":"standalone","background_color":"#04060B","theme_color":"#0B1630","icons":[{"src":"/favicon.svg","sizes":"any","type":"image/svg+xml"}]}, indent=2)+'\n')
open(out+'/vercel.json','w').write(json.dumps({"cleanUrls":True,"headers":[{"source":"/assets/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=0, must-revalidate"}]}]}, indent=2)+'\n')
open(out+'/README.md','w').write('''# DSA Daily

Daily placement practice tracker: 2 LeetCode + 1 SQL a day, Codeforces on weekends, 624 problems scheduled up to May 2027.
Plain HTML, CSS and JavaScript. No build step, no backend.

## Deploy on Vercel

**Option A: drag and drop (no Git)**
1. Unzip this folder.
2. Go to https://vercel.com/new and choose to deploy without Git, or install the CLI: `npm i -g vercel`.
3. With the CLI, run `vercel` inside this folder, accept the defaults, then `vercel --prod`.

**Option B: from GitHub**
1. Push this folder to a new GitHub repository.
2. On https://vercel.com/new, import the repository.
3. Framework preset: **Other**. Leave the build command empty and the output directory as the root. Click Deploy.

## Run locally
Open `index.html` through any static server, for example `npx serve .`, then visit the URL it prints.

## Where progress is saved
Ticks, notes and settings are saved in your browser's local storage, so they stay on that device and browser.
Use **Settings & rules → Download backup** now and then, and **Restore backup** on a new device.

## Files
- `index.html`: page layout
- `assets/style.css`: theme (black, navy, white, blue; follows system light/dark, the round button top-right switches it)
- `assets/app.js`: scheduling, ticking, revisits, backup
- `assets/problems.js`: the problem list. Edit it to add or reorder problems (ticks are stored by row position, so add new ones at the end of a track).
''')
print('ok', sorted(os.listdir(out)), os.path.getsize(out+'/assets/app.js'))
