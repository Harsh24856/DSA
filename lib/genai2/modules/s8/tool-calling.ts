// Stage 8: tool calling, the one mechanism every agent is built on. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { n0 } from "../../stages/s8.calc.ts";
import { FRIDAY } from "../../stages/s8.flows.ts";

// numeric: schema tokens over a task
const [NT, PT, NC] = [40, 150, 6], schemaTask = NT * PT * NC;
// numeric: three independent lookups, one after another or in one turn (model calls, counting the final answer)
const LOOK = 3, seqCalls = LOOK + 1, parCalls = 2;
// output: how many of these calls does the validator reject?
const CALLS = [["get_order", "A-1042"], ["get_order", 1042], ["cancel_order", "A-1042"], ["get_order", "B-7"]] as const;
const KNOWN = new Set(["get_order"]);
const rejected = CALLS.filter(([n, id]) => !KNOWN.has(n) || typeof id !== "string").length;

export const TOOL_CALLING: GModule = {
  id: "tool-calling",
  stage: 8,
  title: "Tool calling",
  hook: "A model can only write text. Tool calling is the trick that lets that text drive real systems: the model writes a structured request, and your code decides whether to run it.",
  blocks: [
    { kind: "figure", id: "s8-tool-call", caption: "Everything above the dashed line is text the model wrote. Everything below is your code: it checks, runs and trims. The model never touches the order system." },
    { kind: "text", md: "**A tool is a name, a description and an input schema.** You send these with the conversation. When the model decides a tool would help, it stops and replies with a call: the tool's name and arguments as JSON.\n\nYour code runs the function, sends the result back as a new message, and calls the model again. The description is the model's only guide to when the tool fits, so write it like documentation." },
    { kind: "flow", id: "g-toolloop" },
    {
      kind: "predict",
      q: "The model replies with a call to get_weather with city set to \"Oslo\". At this moment, how many times has the weather service been called?",
      answer: "Zero: the reply is only a request, and your code has not run it yet",
      wrong: ["Once: the model called it while writing the reply", "Once per token of the reply", "It depends on the temperature setting"],
      why: "Calling a tool means emitting text in an agreed format. Nothing happens until your code parses that request, decides to honour it, and makes the real call.",
    },
    { kind: "flow", id: "s8-tool-retry" },
    { kind: "text", md: `**Errors are messages, not crashes.** When arguments are wrong, return the problem as the tool result, with what to do next. In the walk-through, "date must be YYYY-MM-DD" let the model fix its call to ${FRIDAY} on its own. A stack trace or a silent failure gives it nothing to work with.` },
    {
      kind: "compare",
      head: ["Tool design", "Weak", "Strong"],
      rows: [
        ["Name", "do_stuff", "get_order, refund_order"],
        ["Description", "\"Order tool\"", "What it does, when to use it, one example"],
        ["Inputs", "Free text query", "Typed fields, enums for fixed choices"],
        ["Result", "The whole database row", "Only the fields the task needs"],
        ["Errors", "A stack trace", "What went wrong and what to try next"],
        ["Risky actions", "Runs at once", "Needs a person to confirm first"],
      ],
    },
    { kind: "play", id: "s8-tool-budget" },
    {
      kind: "code",
      run: true,
      src: `import json

ORDERS = {"A-1042": {"status": "shipped", "eta": "2026-11-19"}}

def get_order(order_id):
    return ORDERS[order_id]                      # raises KeyError for an unknown id

TOOLS = {"get_order": (get_order, {"order_id": str})}

def run_tool(call_json):
    call = json.loads(call_json)
    name, args = call.get("name"), call.get("input", {})
    if name not in TOOLS:
        return {"is_error": True, "content": f"Unknown tool {name}. Known tools: {sorted(TOOLS)}"}
    fn, schema = TOOLS[name]
    for key, typ in schema.items():              # check every field before running anything
        if not isinstance(args.get(key), typ):
            return {"is_error": True, "content": f"{key} must be a {typ.__name__}"}
    try:
        return {"is_error": False, "content": json.dumps(fn(**args))}
    except KeyError:
        return {"is_error": True, "content": f"No order {args['order_id']}. Ask the user to check the id."}

for c in ['{"name": "get_order", "input": {"order_id": "A-1042"}}',
          '{"name": "get_order", "input": {"order_id": 1042}}',
          '{"name": "cancel_order", "input": {"order_id": "A-1042"}}',
          '{"name": "get_order", "input": {"order_id": "B-7"}}']:
    print(run_tool(c))

assert not run_tool('{"name": "get_order", "input": {"order_id": "A-1042"}}')["is_error"]
assert run_tool('{"name": "get_order", "input": {"order_id": 1042}}')["is_error"]
`,
    },
    { kind: "text", md: "**Several calls in one turn.** When lookups do not depend on each other, a model can ask for several tools at once. Run them, in parallel if you like, and send every result back together before the next model call. That saves round trips. Calls that depend on an earlier result must still wait for it." },
  ],
  keyPoints: [
    "A tool is a name, a description and an input schema, sent with every request that offers it.",
    "The model never runs anything: it replies with a structured call, and your code decides whether to run it.",
    "Validate every argument and check permissions in your code, even when the model was given a schema.",
    "Return errors as tool results with a fix the model can try, and return only the fields the task needs.",
    "Independent lookups can go in one turn as parallel calls; dependent ones must wait for the earlier result.",
  ],
  questions: [
    { id: "who-runs", level: "easy", kind: "concept",
      q: "In tool calling, who executes the function you defined?",
      answer: "Your application code, after reading the model's request", wrong: ["The model, inside its forward pass", "The user's browser, automatically", "The tokenizer, when it sees the tool name"],
      why: "The model only produces text that names a tool and its arguments. Running it, and deciding whether to, is your code's job. That is where checks and permissions live." },
    { id: "what-model-sees", level: "easy", kind: "concept",
      q: "What does the model see of a tool you offer it?",
      answer: "Its name, description and input schema", wrong: ["The tool's source code", "A compiled version of the function", "Nothing until the tool has been called once"],
      why: "The model chooses tools by reading their definitions as part of the prompt. It never sees the implementation, so a vague description leads to wrong picks however good the code is." },
    { id: "bad-args", level: "medium", kind: "concept",
      q: "The model calls a tool with an invalid argument. What is the best thing for your code to do?",
      answer: "Skip running it and return an error result that says what was wrong and how to fix it",
      wrong: ["Raise an exception and end the conversation", "Silently fill in a default value and run the tool", "Retry the same call until it works"],
      why: "Models usually correct themselves when told precisely what was wrong. Ending the run wastes the work so far, a guessed default can do the wrong thing, and repeating an invalid call changes nothing." },
    { id: "parallel", level: "medium", kind: "concept",
      q: "In one turn the model asks for three independent lookups. What should your code send back before the next model call?",
      answer: "All three results, each matched to its call",
      wrong: ["Only the first result; the model will ask again for the rest", "Only the result that finished fastest", "Nothing until the user confirms each lookup"],
      why: "Parallel calls are one request with several parts. The model expects an answer for each call id, and sending them together means one round trip instead of three." },
    { id: "many-tools", level: "hard", kind: "concept",
      q: "An assistant is offered 80 tools and often picks the wrong one. Which change helps most?",
      answer: "Offer only the few tools that fit each request, with clear names and descriptions",
      wrong: ["Raise the temperature so it explores more tools", "Shorten every description to a single word", "Add more example tools so it sees more choices"],
      why: "Every definition competes for attention, and near-duplicates confuse selection. A router or a search over tool descriptions narrows the choice. Higher temperature adds randomness, not judgement." },
    { id: "force-tool", level: "medium", kind: "concept",
      q: "You only want structured data back, never prose. What setting fits?",
      answer: "Require the model to call a specific tool, and read its arguments as the data",
      wrong: ["Set the temperature to 0", "Set max tokens to 1", "Offer the tool but tell the model never to use it"],
      why: "Most APIs let you force a tool call. The arguments then arrive in the tool's schema, which you validate like any input. This is a common way to get structured extraction." },
    { id: "idempotent", level: "hard", kind: "concept",
      q: "A refund tool call times out, and your loop retries it. What keeps the customer from being refunded twice?",
      answer: "An idempotency key: the same key sent twice is applied only once",
      wrong: ["A lower temperature on the retry", "A longer timeout on the second try", "Asking the model whether the first call worked"],
      why: "A timeout does not tell you whether the action happened. With a unique key per intended action, the service can recognise the repeat and return the first result instead of acting again." },
    { id: "schema-tokens", level: "medium", kind: "numeric",
      q: `${NT} tools are offered, each definition about ${PT} tokens. A task takes ${NC} model calls. How many input tokens go to tool definitions alone?`,
      answer: n0(schemaTask), wrong: [n0(NT * PT), n0(PT * NC), n0(NT * NC)],
      why: `Definitions are sent on every call that offers the tools: ${NT} × ${PT} = ${n0(NT * PT)} per call, times ${NC} calls = ${n0(schemaTask)}. Prompt caching can make repeated prefixes cheaper, but they still fill the context.` },
    { id: "round-trips", level: "easy", kind: "numeric",
      q: `A model needs ${LOOK} independent lookups and then answers. Asking one tool per turn, it takes ${seqCalls} model calls. How many does it take if it asks for all ${LOOK} in one turn?`,
      answer: String(parCalls), wrong: [String(seqCalls), String(LOOK), "1"],
      why: `One call that requests all ${LOOK} tools, then one call that reads the results and answers: ${parCalls}. It cannot be 1, because the results must come back before the model can use them.` },
    { id: "count-rejects", level: "medium", kind: "output",
      q: "How many calls does this validator reject? What does this print?",
      code: `calls = [${CALLS.map(([n, id]) => `("${n}", ${typeof id === "string" ? `"${id}"` : id})`).join(", ")}]\nknown = {"get_order"}\nrejected = [c for c in calls if c[0] not in known or not isinstance(c[1], str)]\nprint(len(rejected))`,
      answer: String(rejected), wrong: [String(rejected - 1), String(rejected + 1), String(CALLS.length)],
      why: "One call has a number where a string is required, and one names a tool that does not exist. The call with id B-7 passes the checks: whether that order exists is a question the tool answers, with an error result if not." },
    { id: "round-trip", level: "easy", kind: "explain",
      q: "Walk through one tool call from the user's question to the final answer.",
      answer: "1. Your code sends the conversation plus the tool definitions.\n2. The model replies with a tool call: a name and JSON arguments.\n3. Your code validates the arguments, checks permissions and runs the function.\n4. It appends the result to the history as a tool result linked to that call.\n5. It calls the model again with the whole history.\n6. The model either asks for another tool or writes the answer." },
    { id: "good-tool", level: "medium", kind: "explain",
      q: "What makes a tool easy for a model to use well?",
      answer: "- A specific name and a description that says when to use it, ideally with one example.\n- Few typed parameters, with enums for fixed choices instead of free text.\n- Results trimmed to what the task needs, paged if they can be long.\n- Errors that say what went wrong and what to try.\n- No overlap with other tools, so the choice is obvious.\n\nTest it the way you test a function: try many inputs and read what the model actually sends." },
    { id: "why-validate", level: "hard", kind: "explain",
      q: "The API can constrain the model to your schema. Why validate arguments in your code anyway?",
      answer: "A schema checks shape, not meaning. A string id can still name another customer's order, a date can be in the past, an amount can be over a limit.\n\nThe arguments also come from a model that reads untrusted text, such as web pages or emails, which can steer what it asks for.\n\nSo treat tool arguments like any request from the outside: check types, ranges, ownership and permissions before acting." },
    { id: "destructive", level: "hard", kind: "explain",
      q: "How would you expose a tool that deletes data or moves money?",
      answer: "- Keep it separate from read tools, with a clear name.\n- Check the user's permission in code, never because the model says so.\n- Ask a person to confirm, showing exactly what will happen.\n- Use an idempotency key so retries cannot repeat it.\n- Set limits, such as a maximum amount, and log every call with its arguments.\n- Prefer reversible versions, such as soft delete." },
    { id: "trap-runs", level: "easy", kind: "trap",
      claim: "When you define your own function as a tool, the model runs that function.",
      truth: false,
      why: "The model only writes a request naming the function and its arguments. Your code runs it, or refuses to. Some providers also run built-in tools on their side, but your own functions run where your code runs." },
    { id: "trap-tokens", level: "medium", kind: "trap",
      claim: "Tool definitions are part of the input, so they use tokens on every call that includes them.",
      truth: true,
      why: `They are text the model must read to choose a tool. ${NT} definitions of ${PT} tokens add ${n0(NT * PT)} tokens to every such call.` },
    { id: "trap-required", level: "medium", kind: "trap",
      claim: "If the schema marks a field as required, your code can skip checking it.",
      truth: false,
      why: "A schema tells the model what to send; your code still decides what to accept. Unless the API strictly enforces the schema, a model can leave a field out or send the wrong type, and even a well-formed value can be unsafe." },
  ],
  real: [
    { who: "Timo Schick and co-authors", when: "2023",
      what: "The Toolformer paper trained a language model to decide by itself which external APIs to call, when, and with what arguments, and to use the results in its next predictions. Its tools included a calculator, a question answering system, search engines, a translator and a calendar.",
      takeaway: "The paper reports that this needed only a handful of demonstrations per API, and that the model kept its core language modelling ability.",
      url: "https://arxiv.org/abs/2302.04761" },
  ],
};
