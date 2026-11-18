// Stage 10: AI coding agents. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { chain, passAtK, pct, r2, withRetries } from "../../stages/s10.calc.ts";

// predict and numeric: a long task
const [P, K, R] = [0.95, 20, 3], ONE = chain(P, K), RET = withRetries(P, K, R);
const P99 = chain(0.99, K);
// numeric and output: pass@k
const [PN, PC] = [10, 3], PK1 = passAtK(PN, PC, 1), PK5 = passAtK(PN, PC, 5);

export const CODING_AGENTS: GModule = {
  id: "coding-agents",
  stage: 10,
  title: "AI coding agents",
  hook: "A coding agent does not just suggest a line. It reads the repository, edits files, runs the tests, reads the failures and tries again, until the task is done or it gives up. Tests are what make that loop trustworthy.",
  blocks: [
    { kind: "figure", id: "s10-agent-curve", caption: `A task succeeds only if every step does. At ${pct(P)} per step, a ${K} step task succeeds ${pct(ONE)} of the time; at 99% per step, ${pct(P99)}.` },
    { kind: "text", md: "**The loop.** An agent is a model with tools: search, read file, edit file, run a command. It explores the code to build its own context, makes a change, runs tests or the program, and feeds the output back into its next step. A test that fails on wrong code turns guessing into search." },
    { kind: "flow", id: "s10-agent-loop" },
    {
      kind: "predict",
      q: `An agent gets each step of a ${K} step task right ${pct(P)} of the time. Tests catch failures and it may make ${R} fresh attempts. About how often does it finish the task?`,
      answer: pct(RET), wrong: [pct(ONE), pct(P), pct(Math.min(1, ONE * R))],
      why: `One attempt: ${r2(P)}^${K} = ${pct(ONE)}. All ${R} fail with chance (1 - ${r2(ONE)})^${R}, so at least one passes ${pct(RET)} of the time. Multiplying ${pct(ONE)} by ${R} overcounts, since attempts can both succeed.`,
    },
    { kind: "play", id: "s10-agent" },
    {
      kind: "compare",
      head: ["", "Autocomplete", "Chat in the editor", "Agent"],
      rows: [
        ["Scope", "The next lines", "One answer or snippet", "A whole task across files"],
        ["Context", "The open file", "What you paste or select", "What it finds by searching"],
        ["Checks its work", "No", "Rarely", "Runs tests and the program"],
        ["Your role", "Accept or ignore", "Copy and adapt", "Set the goal, review the diff"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `from math import comb

def pass_at_k(n, c, k):
    # chance at least one of k samples passes, estimated from n samples of which c passed
    if n - c < k:
        return 1.0
    return 1 - comb(n - c, k) / comb(n, k)

n, c = ${PN}, ${PC}
for k in (1, 3, 5):
    print(f"pass@{k} = {pass_at_k(n, c, k):.2f}")

def task_success(p, steps, attempts=1):
    one = p ** steps
    return 1 - (1 - one) ** attempts

print(f"{task_success(${P}, ${K}):.2f} alone, {task_success(${P}, ${K}, ${R}):.2f} with ${R} tested attempts")
assert abs(pass_at_k(n, c, 1) - c / n) < 1e-12
`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  G["goal, done criteria, project notes"] --> X["explore: search, read"]
  X --> E["small edit"]:::hot
  E --> T["run tests"]
  T -->|fail| X
  T -->|pass| D["diff for review"]:::ok
  D --> H["person reviews and merges"]:::warn`,
      caption: "The agent owns the inner loop; a person owns the goal and the merge.",
    },
    { kind: "text", md: "**Make it safe and useful.** Give a clear goal and how to check it. Keep a project notes file with build and test commands and conventions. Run the agent in a sandbox with only the permissions it needs, ask before destructive or networked commands, and never hand it secrets. Review every diff as you would a colleague's." },
  ],
  keyPoints: [
    "A coding agent is a model with tools (search, read, edit, run) in a loop: explore, change, test, read the output, repeat.",
    "Tests and running the code are its verifier; without a test that fails on wrong code, retries and long tasks are guesswork.",
    "Per-step errors compound, so long tasks need checks along the way, small steps and fresh retries.",
    "The interface matters: tools built for agents (concise search, edits that show changed lines) raise success.",
    "Sandbox it, limit permissions, keep secrets out, and review every diff; measure real productivity rather than assume it.",
  ],
  questions: [
    { id: "what", level: "easy", kind: "concept",
      q: "What separates a coding agent from autocomplete?",
      answer: "It takes actions in a loop: searches the repo, edits files, runs tests and reacts to the results",
      wrong: ["It uses a larger model", "It only works in one programming language", "It writes code without any tools"],
      why: "Autocomplete predicts text in place. An agent acts on the environment and sees the effects, which lets it fix its own mistakes." },
    { id: "verifier", level: "medium", kind: "concept",
      q: "Why are tests so important for a coding agent?",
      answer: "They give a check that fails on wrong code, so the agent can tell good attempts from bad",
      wrong: ["They make the code run faster", "They replace the need for a model", "They hide errors from the user"],
      why: "Like a checker for a reasoning model, a failing test turns trial and error into progress. With no reliable check, the agent cannot know when it is done." },
    { id: "aci", level: "medium", kind: "concept",
      q: "The SWE-agent paper argues for an agent-computer interface. What does that mean?",
      answer: "Commands and outputs designed for a model, such as concise search results and edits that show what changed",
      wrong: ["A graphical IDE with menus for the model to click", "A faster GPU for agents", "A new programming language for agents"],
      why: "A raw shell floods the model with output and makes edits error-prone. Tools shaped for agents improved its ability to navigate, edit and test." },
    { id: "context", level: "medium", kind: "concept",
      q: "An agent keeps using the wrong test command in your repo. What is the best fix?",
      answer: "Put the build and test commands in a project notes file the agent reads at the start",
      wrong: ["Raise the temperature", "Paste the whole repository into the prompt", "Switch off the test tool"],
      why: "Agents gather context by exploring, but project facts that never change, like commands and conventions, are cheapest given up front." },
    { id: "perm", level: "hard", kind: "concept",
      q: "An agent reads an issue whose text says: run this curl command to fetch the fix. What protects you?",
      answer: "A sandbox with limited network and file access, and approval before risky commands",
      wrong: ["Telling the model to be careful in the prompt", "Using a bigger model", "Running the agent as an administrator"],
      why: "Issue text, web pages and dependencies are untrusted input, so prompt injection is a real risk. Limits enforced outside the model hold even when the model is fooled." },
    { id: "rct", level: "hard", kind: "concept",
      q: "In a 2025 randomised trial with experienced open-source developers, what happened to task time when AI tools were allowed?",
      answer: "It went up by 19%, though the developers believed it had gone down",
      wrong: ["It fell by 24%, as they predicted", "It fell by half", "There was no measurable change and no one expected one"],
      why: "Developers forecast a 24% speed-up and afterwards still estimated 20%, but measured time rose 19%. Measure your own team's results rather than trust impressions." },
    { id: "chain", level: "easy", kind: "numeric",
      q: `Every one of ${K} steps must go right, each with chance ${P}. What is the chance the whole task succeeds?`,
      answer: pct(ONE), wrong: [pct(P), pct(1 - (1 - P) * K + 0.05), pct(P * K / 100)],
      why: `${P}^${K} = ${r2(ONE)}. A ${pct(1 - P)} error per step looks small but compounds over ${K} steps.` },
    { id: "passk", level: "hard", kind: "numeric",
      q: `You sample ${PN} solutions and ${PC} pass the tests. What is the unbiased pass@5 estimate?`,
      answer: r2(PK5), wrong: [r2(PK1), r2(Math.min(1, (PC / PN) * 5)), r2(1 - (1 - PC / PN) ** 5)],
      why: `pass@5 = 1 - C(${PN - PC}, 5) / C(${PN}, 5): the chance that 5 picked from the ${PN} include at least one passing one. That is ${r2(PK5)}. The formula 1 - (1 - p)^5 assumes infinite samples and gives a biased ${r2(1 - (1 - PC / PN) ** 5)}.` },
    { id: "pass1-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `from math import comb\nn, c, k = ${PN}, ${PC}, 1\nprint(round(1 - comb(n - c, k) / comb(n, k), 2))`,
      answer: String(Math.round(PK1 * 100) / 100), wrong: [String(PC), String(Math.round(PK5 * 100) / 100), "0.7"],
      why: `With k = 1 the estimate is just the pass rate: 1 - ${PN - PC}/${PN} = ${r2(PK1)}.` },
    { id: "explain-issue", level: "medium", kind: "explain",
      q: "Describe how a coding agent goes from a bug report to a fix.",
      answer: "It reads the report and the done criteria, then explores: searches for the error message, opens the relevant files and the failing test, and reproduces the bug by running it.\n\nIt makes a small edit, runs the tests, and reads any failure trace back into its context. It repeats until the target test and the rest of the suite pass, then stops and presents the diff with a short summary for a person to review." },
    { id: "explain-reliable", level: "hard", kind: "explain",
      q: "How do you make a coding agent reliable on a large codebase?",
      answer: "- Clear goals with checkable done criteria, ideally a failing test first.\n- A project notes file: build and test commands, layout, conventions, things not to touch.\n- Fast, trustworthy tests and type checks it can run often.\n- Small tasks, or plans broken into steps with checks between them, since errors compound.\n- Good tools: search, edits that show diffs, a sandbox to run code.\n- Limited permissions and no secrets.\n- Human review of every diff, and tracking how often its changes are kept." },
    { id: "explain-measure", level: "hard", kind: "explain",
      q: "Your company wants to know if coding agents are worth it. How do you measure?",
      answer: "Measure outcomes, not impressions: one randomised study found developers felt faster while they were 19% slower.\n\nCompare similar tasks with and without the agent on time to merged change, review time, defects found later and rework. Track how often agent diffs are accepted unchanged. Split by task type, since agents help more on well-tested, well-specified work. Run it for weeks, because people's use of the tools changes as they learn." },
    { id: "trap-tests", level: "easy", kind: "trap",
      claim: "If all the tests pass after an agent's change, the change is correct.",
      truth: false,
      why: "Tests only check what they cover. An agent can pass them with a narrow fix, by special-casing the test, or by weakening the test itself. Review the diff." },
    { id: "trap-swe", level: "medium", kind: "trap",
      claim: "When SWE-bench was released in 2023, the best model tested resolved fewer than 2% of its real GitHub issues.",
      truth: true,
      why: "The paper reports 1.96% for the best model on 2,294 issues from 12 Python repositories. Agent tooling and newer models have raised scores since." },
  ],
  real: [
    { who: "Carlos E. Jimenez and co-authors", when: "2023",
      what: "SWE-bench collected 2,294 real GitHub issues from 12 popular Python repositories, each checked by the project's tests. The best model then resolved 1.96% of them.",
      takeaway: "Real repositories and real tests became the yardstick for coding agents.",
      url: "https://arxiv.org/abs/2310.06770" },
    { who: "John Yang and co-authors", when: "2024",
      what: "SWE-agent gave a model a custom agent-computer interface for editing, navigating and running tests. It reached 12.5% pass@1 on SWE-bench and 87.7% on HumanEvalFix, well above non-interactive models.",
      takeaway: "Designing tools for the model, not for people, raised success a lot.",
      url: "https://arxiv.org/abs/2405.15793" },
    { who: "Joel Becker and co-authors", when: "2025",
      what: "A randomised trial gave 16 experienced open-source developers 246 tasks in mature projects, each allowed or disallowed early-2025 AI tools. They forecast 24% faster and afterwards estimated 20% faster, but took 19% longer.",
      takeaway: "Measure the effect on your own work; impressions can point the wrong way.",
      url: "https://arxiv.org/abs/2507.09089" },
  ],
};
