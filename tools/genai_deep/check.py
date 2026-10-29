"""Runs every deep-dive script in this folder; each asserts its own result. Needs numpy, scikit-learn,
pydantic, langgraph and langchain:  python tools/genai_deep/check.py"""
import pathlib, subprocess, sys

here = pathlib.Path(__file__).parent
failed = []
for f in sorted(here.glob("*.py")):
    if f.name == "check.py": continue
    r = subprocess.run([sys.executable, "-I", str(f)], capture_output=True, text=True, timeout=300)
    print("ok  " if r.returncode == 0 else "FAIL", f.name)
    if r.returncode: failed.append(f.name); print(r.stderr[-800:])
sys.exit(1 if failed else 0)
