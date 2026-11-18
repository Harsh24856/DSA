"""PyTorch grader for the Gen AI code labs.

The site's API route (app/api/genai/grade/route.ts) builds the whole test program on its server (earlier steps, the
learner's code, the hidden tests) and POSTs it here with a shared secret. Each program runs in a fresh Modal Sandbox
with no network, 1 CPU, 1 GB of memory and a 20 s limit, so learner code never runs in this function's container.

Setup, once:  pip install modal fastapi && modal token new
              modal secret create genai-grader GRADER_SECRET=<a long random string>
Deploy:       modal deploy grader/genai_grader.py      (prints the URL to put in MODAL_GRADER_URL)
"""
import hmac
import os

import fastapi
import modal

app = modal.App("dsa-genai-grader")
sandbox_image = modal.Image.debian_slim(python_version="3.12").pip_install(
    "numpy==2.2.5", "torch==2.7.1", extra_index_url="https://download.pytorch.org/whl/cpu"
)
web_image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]")

MAX_PROGRAM = 200_000   # bytes: earlier steps + learner code (capped at 50 KB on the site) + hidden tests
RUN_SECONDS = 20
MAX_OUT = 100_000       # characters kept from stdout and from stderr


@app.function(image=web_image, secrets=[modal.Secret.from_name("genai-grader")], max_containers=4, timeout=90)
@modal.fastapi_endpoint(method="POST")
def grade(request: fastapi.Request, body: dict):
    auth = request.headers.get("authorization", "")
    if not hmac.compare_digest(auth, f"Bearer {os.environ['GRADER_SECRET']}"):
        raise fastapi.HTTPException(status_code=401, detail="unauthorized")
    program = body.get("program")
    if not isinstance(program, str) or not program or len(program.encode()) > MAX_PROGRAM:
        raise fastapi.HTTPException(status_code=400, detail="program missing or too large")

    sb = modal.Sandbox.create(app=app, image=sandbox_image, block_network=True, cpu=1.0, memory=1024, timeout=RUN_SECONDS + 30)
    try:
        p = sb.exec("python", "-", timeout=RUN_SECONDS)   # the program arrives on stdin: no file, no argument-length limit
        p.stdin.write(program.encode())
        p.stdin.write_eof()
        p.stdin.drain()
        code = p.wait()
        out, err = p.stdout.read()[:MAX_OUT], p.stderr.read()[:MAX_OUT]
    finally:
        sb.terminate()
    # a run killed by the time limit exits with a signal, not 0 or 1
    return {"stdout": out, "stderr": err, "timedOut": code not in (0, 1)}
