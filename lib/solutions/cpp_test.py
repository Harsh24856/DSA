"""Compiles and runs every C++ solution in lib/solutions/cpp/ against LeetCode's examples.

Each lib/solutions/cpp/<name>.cpp holds the code shown on the site (LeetCode style: a `class Solution`, or a free `solve`
for Codeforces examples). The examples come from the Python cases (solutions_test.py and cases/*.py), turned into C++
by reading the method's signature. A file can instead end with a line `// @test` followed by the body of main(), using
the helpers in harness.hpp (H::mkList, H::mkTree, H::levelVec, H::check, ...); that is needed for design classes,
answers that are lists or trees, and in-place (void) answers.

  python3 lib/solutions/cpp_test.py                   every solution, plus the list of questions with no C++ yet
  python3 lib/solutions/cpp_test.py two-sum 3sum      only these
  python3 lib/solutions/cpp_test.py --emit            also write lib/solutions/cpp.ts (the code the site shows)
  python3 lib/solutions/cpp_test.py --patterns [ids]  the pattern templates in lib/patterns/cpp/<topic>__<n>.cpp instead;
                                                      each needs a // @test block; --emit writes lib/patterns/cpp.ts
"""
import json, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CPP_DIR = os.path.join(HERE, "cpp")
FLAGS = ["-std=c++20", "-O1", "-g0", "-fsanitize=address,undefined", "-fno-sanitize-recover=undefined", "-w"]


def file_of(slug):
    return slug.replace(":", "_").replace(" ", "-") + ".cpp"


def python_sources():
    code = "import('./lib/solutions/index.ts').then((m) => console.log(JSON.stringify(Object.fromEntries(Object.entries(m.SOLUTIONS).filter(([, s]) => s.lang === 'python').map(([k, s]) => [k, s.code])))))"
    out = subprocess.run(["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--disable-warning=ExperimentalWarning", "-e", code], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def load_cases():
    """CASES and TREE from the Python runner, without running it."""
    text = open(os.path.join(HERE, "solutions_test.py")).read()
    text = text.replace("src = json.load(sys.stdin)", "src = {}").split("ok = fail = 0")[0]
    ns = {"__file__": os.path.join(HERE, "solutions_test.py"), "__name__": "cases"}
    exec(compile(text, "solutions_test.py", "exec"), ns)
    return ns


# ---------- C++ types and literals ----------
def split_top(s, sep=","):
    out, depth, cur = [], 0, ""
    for ch in s:
        if ch in "<([{": depth += 1
        elif ch in ">)]}": depth -= 1
        if ch == sep and depth == 0: out.append(cur); cur = ""
        else: cur += ch
    if cur.strip(): out.append(cur)
    return [x.strip() for x in out]


def clean_type(t):
    t = re.sub(r"\bconst\b", "", t).replace("&", "").strip()
    return re.sub(r"\s+", " ", t).replace("< ", "<").replace(" >", ">")


def inner(t):
    """vector<int> -> ['int'];  pair<int, string> -> ['int', 'string'];  array<int, 2> -> ['int']."""
    m = re.match(r"^(?:std::)?(\w+)<(.*)>$", t)
    if not m: return None, []
    name, args = m.group(1), split_top(m.group(2))
    if name == "array": return name, [args[0]]
    return name, args


def lit(v, t, h):
    t = clean_type(t)
    if t == "TreeNode*":
        if isinstance(v, h["TreeNode"]): v = h["level"](v)
        return "H::mkTree({" + ", ".join("NUL" if x is None else str(x) for x in v) + "})"
    if t == "ListNode*":
        if isinstance(v, h["ListNode"]) or v is None: v = h["arr"](v)
        return "H::mkList({" + ", ".join(str(x) for x in v) + "})"
    if isinstance(v, bool): return "true" if v else "false"
    if t == "char":
        assert isinstance(v, str) and len(v) == 1, f"char from {v!r}"
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(v, str): return "string(" + json.dumps(v) + ")"
    if isinstance(v, int): return str(v) + ("LL" if abs(v) > 2**31 - 1 else "")
    if isinstance(v, float): return repr(v)
    if isinstance(v, (list, tuple)):
        name, args = inner(t)
        if name is None: raise ValueError(f"cannot write {v!r} as {t}")
        if name in ("pair", "tuple"): return "{" + ", ".join(lit(x, a, h) for x, a in zip(v, args)) + "}"
        return "{" + ", ".join(lit(x, args[0], h) for x in v) + "}"
    if v is None: raise ValueError(f"None for {t}")
    raise ValueError(f"cannot write {v!r} as {t}")


def signature(code, fn):
    """(return type, [param types], called on Solution?) of the last definition of fn."""
    best = None
    for m in re.finditer(r"([\w:<>,\s\*&]+?)\s*\b" + re.escape(fn) + r"\s*\(", code):
        start = m.end(); depth = 1; i = start
        while depth and i < len(code):
            depth += {"(": 1, ")": -1}.get(code[i], 0); i += 1
        after = code[i:i + 40].lstrip()
        if not after.startswith("{") and not after.startswith("const"): continue   # a call, not a definition
        ret = m.group(1).split("\n")[-1].strip()
        ret = re.sub(r"^(public:|private:|static|inline|virtual)\s*", "", ret).strip()
        params = [p for p in split_top(code[start:i - 1]) if p]
        types = []
        for p in params:
            p = p.split("=")[0].strip()
            mm = re.match(r"^(.*?)([A-Za-z_]\w*)$", p)
            types.append(mm.group(1).strip() if mm else p)
        best = (clean_type(ret), types, m.start())
    if not best: raise ValueError(f"no definition of {fn}")
    ret, types, at = best
    in_class = bool(re.search(r"class\s+Solution\b", code[:at]))
    return ret, types, in_class


SORTED = {"majority-element-ii", "find-all-duplicates-in-an-array", "word-subsets"}


def auto_main(slug, code, ns):
    cases = ns["CASES"].get(slug); tree = ns["TREE"].get(slug)
    lines, k = [], 0
    for kind, items in (("case", cases or []), ("tree", tree or [])):
        for item in items:
            if kind == "case": fn, args, exp = item; post = None
            else: fn, args, exp, post = item
            args = tuple(a() if callable(a) else a for a in args)
            ret, types, in_class = signature(code, fn)
            if ret == "void": raise ValueError("returns void: write a // @test block")
            if len(types) != len(args): raise ValueError(f"{fn} takes {len(types)} arguments, the example has {len(args)}")
            if kind == "tree": types = ["TreeNode*"] + types[1:]
            k += 1
            decl = [f"    {clean_type(t)} a{k}_{j} = {lit(a, t, ns)};" for j, (a, t) in enumerate(zip(args, types))]
            call = ("Solution()." if in_class else "") + f"{fn}(" + ", ".join(f"a{k}_{j}" for j in range(len(args))) + ")"
            name = json.dumps(f"{slug} example {k}")
            lines += decl
            if ret in ("double", "float"):
                lines.append(f"    H::checkNear({call}, {float(exp)!r}, {name});")
            else:
                lines.append(f"    {ret} e{k} = {lit(exp, ret, ns)};")
                srt = slug in SORTED or post is sorted
                if post not in (None, sorted): raise ValueError("tree case with a custom check: write a // @test block")
                lines.append(f"    H::check({'H::sorted(' + call + ')' if srt else call}, {'H::sorted(e' + str(k) + ')' if srt else 'e' + str(k)}, {name});")
    if not lines: return None
    return "\n".join(lines)


def build(slug, ns, path=None):
    path = path or os.path.join(CPP_DIR, file_of(slug))
    text = open(path).read()
    code, _, test = text.partition("// @test")
    code = code.rstrip() + "\n"
    body = test.strip("\n") if test.strip() else auto_main(slug, code, ns)
    if body is None: raise ValueError("no examples for this question: add a // @test block")
    return code, f"{code}\nint main() {{\n{body}\n    return H::report();\n}}\n"


def run_one(slug, ns, pch, tmp, path=None):
    try:
        _, src = build(slug, ns, path)
    except Exception as e:
        return slug, False, f"cannot build the test: {e}"
    base = os.path.join(tmp, file_of(slug)[:-4].replace("/", "_"))
    open(base + ".cpp", "w").write(src)
    c = subprocess.run(["c++", *FLAGS, "-include-pch", pch, base + ".cpp", "-o", base], capture_output=True, text=True)
    if c.returncode: return slug, False, "compile error:\n" + "\n".join(c.stderr.splitlines()[:25])
    try:
        r = subprocess.run([base], capture_output=True, text=True, timeout=20)
    except subprocess.TimeoutExpired:
        return slug, False, "timed out (20 s)"
    m = re.search(r"RESULT (\d+) (\d+)", r.stdout)
    if r.returncode or not m or m.group(2) != "0" or m.group(1) == "0":
        return slug, False, (r.stdout + r.stderr)[-2500:] or f"exit code {r.returncode}"
    return slug, True, m.group(1)


def stale(ts_path, built):
    """True when the generated .ts file does not match the .cpp files (someone forgot --emit)."""
    try:
        text = open(ts_path).read()
        return json.loads(text[text.index("= ") + 2:].rstrip().rstrip(";")) != built
    except (OSError, ValueError):
        return True


def make_pch(tmp):
    pch = os.path.join(tmp, "harness.hpp.pch")
    subprocess.run(["c++", *FLAGS, "-x", "c++-header", os.path.join(CPP_DIR, "harness.hpp"), "-o", pch], check=True)
    return pch


def patterns(args, emit):
    """Pattern templates: lib/patterns/cpp/<topic>__<n>.cpp, each with its own // @test block."""
    pdir = os.path.join(ROOT, "lib", "patterns", "cpp")
    names = sorted(f[:-4] for f in os.listdir(pdir) if f.endswith(".cpp")) if os.path.isdir(pdir) else []
    todo = args or names
    tmp = tempfile.mkdtemp(prefix="cpp-pat-"); pch = make_pch(tmp)
    ns = {"CASES": {}, "TREE": {}}
    fails = 0
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        for name, ok, msg in pool.map(lambda n: run_one(n, ns, pch, tmp, os.path.join(pdir, n + ".cpp")), todo):
            if not ok: fails += 1; print(f"FAIL {name}\n{msg}\n")
    print(f"C++ pattern templates: {len(todo) - fails} of {len(todo)} pass their tests")
    out = {n.replace("__", ":"): build(n, ns, os.path.join(pdir, n + ".cpp"))[0].strip("\n") for n in names}
    ts = os.path.join(ROOT, "lib", "patterns", "cpp.ts")
    if not args and not emit and stale(ts, out): fails += 1; print("lib/patterns/cpp.ts is out of date: run with --patterns --emit")
    if emit:
        with open(os.path.join(ROOT, "lib", "patterns", "cpp.ts"), "w") as f:
            f.write("// Generated by lib/solutions/cpp_test.py --patterns --emit from lib/patterns/cpp/*.cpp. Do not edit by hand.\n")
            f.write("export const PATTERN_CPP: Record<string, string> = " + json.dumps(out, indent=1, ensure_ascii=False) + ";\n")
    sys.exit(1 if fails else 0)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    emit = "--emit" in sys.argv
    if "--patterns" in sys.argv: return patterns(args, emit)
    py = python_sources()
    ns = load_cases()
    have = {s for s in py if os.path.exists(os.path.join(CPP_DIR, file_of(s)))}
    todo = args or sorted(have)
    for s in todo:
        if s not in py: sys.exit(f"unknown question: {s}")
        if s not in have: sys.exit(f"no file lib/solutions/cpp/{file_of(s)}")
    tmp = tempfile.mkdtemp(prefix="cpp-sol-")
    pch = make_pch(tmp)
    fails = 0
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        for slug, ok, msg in pool.map(lambda s: run_one(s, ns, pch, tmp), todo):
            if not ok:
                fails += 1
                print(f"FAIL {slug}\n{msg}\n")
    missing = sorted(set(py) - have)
    print(f"C++: {len(todo) - fails} of {len(todo)} solutions pass their examples" + (f"; {len(missing)} questions have no C++ yet" if not args and missing else ""))
    out = {s: build(s, ns)[0].strip("\n") for s in sorted(have)}
    if not args and not emit and stale(os.path.join(HERE, "cpp.ts"), out): fails += 1; print("lib/solutions/cpp.ts is out of date: run with --emit")
    if emit:
        with open(os.path.join(HERE, "cpp.ts"), "w") as f:
            f.write("// Generated by lib/solutions/cpp_test.py --emit from lib/solutions/cpp/*.cpp. Do not edit by hand.\n")
            f.write("export const CPP: Record<string, string> = " + json.dumps(out, indent=1, ensure_ascii=False) + ";\n")
    if not args and "--allow-missing" not in sys.argv and missing:
        print("no C++ yet:", " ".join(missing[:40]) + (" ..." if len(missing) > 40 else ""))
        fails += 1
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
