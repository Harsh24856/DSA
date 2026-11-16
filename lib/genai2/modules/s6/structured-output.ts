// Stage 6: getting data, not prose, out of a model: schemas, constrained decoding and validate-and-retry. Every number below is computed here.
import type { GModule } from "../../types.ts";

const r3 = (x: number) => x.toFixed(3);

// numeric: valid within three tries
const [P, Q, T] = [0.9, 0.8, 3];
const within = (k: number) => 1 - (1 - P) * (1 - Q) ** (k - 1);
// output: a number written as text
const TOTAL = "12.40";

export const STRUCTURED_OUTPUT: GModule = {
  id: "structured-output",
  stage: 6,
  title: "Structured output",
  hook: "Your code cannot read a friendly paragraph. Give the model a schema, make invalid output impossible or caught, and get back an object you can trust the shape of.",
  blocks: [
    { kind: "figure", id: "s6-json-mask", caption: "Constrained decoding at an enum field. Tokens the schema forbids get probability 0, so the model can only write an allowed value." },
    { kind: "text", md: "**Three levels of reliability.** Asking for JSON in the prompt usually works, but sometimes adds chatter or the wrong types. **Validate and retry** parses the reply with a schema and sends any error back. **Constrained decoding**, the strict structured output mode some APIs offer, masks illegal tokens at every step, so the reply always fits the schema unless it is cut off." },
    { kind: "flow", id: "g-grammar" },
    {
      kind: "predict",
      q: "Your schema lists the fields in the order {answer, reasoning}, and the model writes them in that order. What goes wrong?",
      answer: "The answer is fixed before any reasoning is written",
      wrong: ["The JSON will not parse", "The validator rejects reasoning that comes second", "Nothing: field order never matters to the model"],
      why: "The model writes one token at a time, left to right. With answer first, the reasoning can only explain a choice already made. Put reasoning first so the answer can build on it.",
    },
    {
      kind: "compare",
      head: ["Approach", "What it guarantees", "Extra calls"],
      rows: [
        ["Ask in the prompt, with an example", "Nothing; usually fine", "0"],
        ["JSON mode", "Parses as JSON, any shape", "0"],
        ["Validate and retry", "Your schema, or a loud failure", "0 to a few"],
        ["Strict schema (constrained decoding)", "Your schema's shape, unless cut off", "0"],
      ],
    },
    { kind: "flow", id: "s6-retry" },
    { kind: "play", id: "s6-retry-odds" },
    { kind: "text", md: "**The schema guarantees shape, not truth.** A total can be negative, a date can be in the future, an id can point to nothing. Keep business rules in your validator. Give the model an honest way out, such as a nullable field or a `not_found` flag, so a missing value is not invented. The script runs the full loop with pydantic." },
    {
      kind: "code",
      run: true,
      src: `from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Invoice(BaseModel):
    vendor: str
    total: float = Field(gt=0)                    # a business rule the schema can carry
    currency: str = Field(pattern="^[A-Z]{3}$")   # INR, USD, EUR
    category: Literal["software", "hardware", "travel", "other"]

# A scripted "model" so this runs offline: the first reply has chatter and two bad fields
replies = iter([
    'Sure! {"vendor": "Acme", "total": "12,40", "currency": "inr", "category": "software"}',
    '{"vendor": "Acme", "total": 12.40, "currency": "INR", "category": "software"}',
])

def extract(text, tries=3):
    messages = [{"role": "user", "content": f"Return this invoice as JSON: {text}"}]
    for attempt in range(1, tries + 1):
        raw = next(replies)                       # a real call to the model goes here
        try:
            body = raw[raw.index("{"): raw.rindex("}") + 1]   # drop chatter around the JSON
            return Invoice.model_validate_json(body), attempt
        except ValueError as err:                 # no braces, bad JSON, or a ValidationError
            n = len(err.errors()) if isinstance(err, ValidationError) else 1
            print(f"try {attempt}: {n} errors")
            messages += [{"role": "assistant", "content": raw},
                         {"role": "user", "content": f"Fix these errors and reply with JSON only:\\n{err}"}]
    raise RuntimeError("no valid JSON after retries: log it and fail loudly")

invoice, tries = extract("Acme, 12.40 rupees, software licence")
print(invoice, "| tries:", tries)
assert tries == 2 and invoice.currency == "INR" and invoice.total == 12.4
`,
    },
  ],
  keyPoints: [
    "Never regex-parse free text. Define a schema and validate every reply against it.",
    "Constrained decoding masks tokens that would break the schema, so output always fits unless it is cut off by the token limit.",
    "A schema guarantees shape, not truth: keep business rules and cross-field checks in your validator.",
    "On a validation failure, send back the exact error and retry a capped number of times, then fail loudly.",
    "Design schemas small: enums for categories, nullable fields or a not_found flag for missing data, reasoning before the answer.",
  ],
  questions: [
    { id: "enum", level: "easy", kind: "concept",
      q: "A category field may only be software, hardware, travel or other. How should the schema say so?",
      answer: "An enum of those four values", wrong: ["A free text field with a description", "A number from 1 to 4, with the meaning explained in the prompt", "A long regular expression over the whole JSON"],
      why: "An enum is checked by the validator and, under constrained decoding, enforced token by token. A free string lets the model write \"Software licence\", and numbered codes invite off-by-one mix-ups." },
    { id: "json-mode", level: "medium", kind: "concept",
      q: "JSON mode is on, but no schema is given. What is guaranteed?",
      answer: "The reply parses as JSON, if it is not cut off, but its fields and types can be anything",
      wrong: ["The reply matches the fields your code expects", "Every value in the reply is correct", "The reply is never cut off by max_tokens"],
      why: "JSON mode constrains syntax only. Without a schema the model picks the keys, so you may get \"amount\" where your code reads \"total\". A strict schema constrains the shape too." },
    { id: "why-validate", level: "medium", kind: "concept",
      q: "Constrained decoding with your schema is on. Why validate the reply anyway?",
      answer: "The schema fixes the shape, not whether the values are true or sensible",
      wrong: ["Constrained decoding often lets invalid JSON through", "Validation makes the model faster next time", "The API needs a validation result to bill the call"],
      why: "A total can be negative, a date can be in the future, and a vendor can be invented. Business rules and cross-field checks still need your code, and sometimes a retry." },
    { id: "truncated", level: "medium", kind: "concept",
      q: "Under constrained decoding, a reply still fails to parse. What is the most likely cause?",
      answer: "It hit max_tokens and stopped in the middle of the object",
      wrong: ["The token mask let an illegal token through", "The temperature was too high", "The schema used an enum"],
      why: "The mask guarantees every token is legal so far, but it cannot finish the object if the token budget runs out. Check the stop reason and raise the cap or shrink the output." },
    { id: "not-found", level: "medium", kind: "concept",
      q: "Some invoices have no due date. How should the due_date field be designed?",
      answer: "Allow null and say in the prompt to use null when the date is not in the document",
      wrong: ["Make it a required string so the model tries harder to find it", "Remove it from the schema and parse it from the text later", "Give it a default of today's date"],
      why: "A required field with no honest way out forces a guess, and a guessed date looks exactly like a real one. A null is easy to spot, count and send for review." },
    { id: "tools-vs-schema", level: "hard", kind: "concept",
      q: "How does tool calling differ from structured output?",
      answer: "With tools the model chooses whether to call one, and your code runs it; structured output forces the final answer itself into a schema",
      wrong: ["Tool calling returns free text, structured output returns JSON", "Structured output runs code on the provider's servers", "They are the same feature under two names"],
      why: "Both produce JSON that matches a schema. The difference is the role: tool arguments are a request for your code to act, while a structured answer is the end result for your code to use." },
    { id: "how-mask", level: "hard", kind: "concept",
      q: "How does constrained decoding prevent invalid output?",
      answer: "At each step, tokens that would break the grammar get probability 0 before sampling",
      wrong: ["It retries the call until the output parses", "It repairs the JSON after the model finishes", "It fine-tunes the model on the schema first"],
      why: "The schema is compiled into a grammar or state machine. At every step only tokens that keep the output valid are allowed, so there is nothing to repair afterwards and no retry needed for shape." },
    { id: "p-valid", level: "medium", kind: "numeric",
      q: `${P * 100}% of replies are valid on the first try. Each retry with the exact error fixes ${Q * 100}% of those still failing. What share is valid within ${T} tries?`,
      answer: r3(within(T)), wrong: [r3(P), r3(1 - (1 - P) ** T), r3(within(2))],
      why: `Still failing after ${T} tries: ${(1 - P).toFixed(1)} × ${(1 - Q).toFixed(1)}^${T - 1} = ${r3((1 - P) * (1 - Q) ** (T - 1))}, so ${r3(within(T))} succeed. ${r3(within(2))} is after only 2 tries, and ${r3(1 - (1 - P) ** T)} wrongly treats every retry as a fresh first try.` },
    { id: "string-total", level: "easy", kind: "output",
      q: "The model wrote the total as a string. What does this print?",
      code: `import json\ndata = json.loads('{"total": "${TOTAL}"}')\nprint(data["total"] * 2)`,
      answer: TOTAL + TOTAL, wrong: [String(+TOTAL * 2), (+TOTAL * 2).toFixed(2), "TypeError"],
      why: "The value is the string \"12.40\", and a string times 2 repeats it. The JSON parsed fine, yet the type is wrong: this is exactly what schema validation catches before the bad value reaches your maths." },
    { id: "design-schema", level: "medium", kind: "explain",
      q: "Design the output schema for an invoice extractor.",
      answer: "- Keep it small: only the fields the business needs.\n- Exact types: total a number, currency a 3 letter code, dates in one format.\n- Enums for categories, with an \"other\" value.\n- Nullable fields, or a not_found flag, so missing data is not invented.\n- A short description on each field.\n- Line items as a list of small objects, not one long string.\n- Validate business rules in code: total above 0, line items adding up to the total." },
    { id: "measure", level: "hard", kind: "explain",
      q: "How do you measure an extraction pipeline?",
      answer: "Build a labelled set: real documents with the expected JSON written by hand.\n\nReport field-level accuracy, not only whole-document pass rate, so you see which fields fail. Track the share of invalid replies before and after retries, retries per document, latency and cost per document. Run it in CI so a prompt or model change cannot quietly make things worse." },
    { id: "quality-vs-shape", level: "hard", kind: "explain",
      q: "Forcing a strict schema made answers worse on a reasoning task. Why, and what can you do?",
      answer: "The schema left no room to think: the model had to commit to the answer field straight away, and writing in a rigid format can itself distract it.\n\nFixes: add a reasoning field before the answer field; keep the schema small; or use two calls, one that reasons freely and a cheap second one that formats the result into the schema. Check the change with an eval, not by eye." },
    { id: "trap-correct", level: "easy", kind: "trap",
      claim: "With constrained decoding, every value in the output is correct.",
      truth: false,
      why: "Constraints control which tokens are legal, not which are true. The model can still pick a wrong but legal vendor, total or category. Evals and business rule checks catch those." },
    { id: "trap-parses", level: "medium", kind: "trap",
      claim: "Under constrained decoding the output always parses, as long as generation is not cut off by the token limit.",
      truth: true,
      why: "Every token is checked against the grammar before it can be picked, so the only way to end up invalid is to stop early. That is why the stop reason still matters." },
    { id: "trap-order", level: "hard", kind: "trap",
      claim: "A reasoning field placed after the answer field helps the model choose a better answer.",
      truth: false,
      why: "Tokens come out in order. Once the answer is written, the reasoning that follows cannot change it; it can only justify it. Reasoning must come first to help." },
  ],
  real: [
    { who: "Brandon T. Willard and Rémi Louf", when: "2023",
      what: "\"Efficient Guided Generation for Large Language Models\" recast generation as moving between the states of a finite-state machine. Indexing the vocabulary against that machine lets regular expressions and context-free grammars guide output with little extra cost. The method ships in the open-source library Outlines.",
      takeaway: "Guaranteed structure can be enforced while decoding, rather than hoped for and checked afterwards.",
      url: "https://arxiv.org/abs/2307.09702" },
  ],
};
