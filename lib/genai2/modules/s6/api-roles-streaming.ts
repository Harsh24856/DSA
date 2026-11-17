// Stage 6: how one chat API call works, why the app owns the memory, and what streaming changes. Every number below is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r1 = (x: number) => x.toFixed(1);

// numeric: tokens sent at turn k, and over a whole chat
const [SYS, Q, A, K] = [400, 50, 250, 6];
const turnIn = (k: number) => SYS + (k - 1) * (Q + A) + Q;
const total = Array.from({ length: K }, (_, i) => turnIn(i + 1)).reduce((a, b) => a + b, 0);
// numeric: waiting without streaming
const [TTFT, SPEED, LEN] = [0.5, 40, 400], wait = TTFT + LEN / SPEED;
// output: capped exponential backoff
const CAP = 10, delays = Array.from({ length: 5 }, (_, i) => Math.min(2 ** i, CAP));
// compare: blocking against streaming at the play's defaults
const [CN, CS, CT] = [400, 50, 0.5];

export const API_ROLES_STREAMING: GModule = {
  id: "api-roles-streaming",
  stage: 6,
  title: "API calls, roles and streaming",
  hook: "A chat model is a function you call over HTTP. It remembers nothing, so your app sends the whole conversation every time and reads back the text, why it stopped and what it cost.",
  blocks: [
    { kind: "figure", id: "s6-api-call", caption: "One call. Every message carries a role. The reply says why it stopped and how many tokens went in and out." },
    { kind: "text", md: "**Three roles.** The **system** message sets who the model is, the rules and the output format. **User** messages are what the person types. **Assistant** messages are the model's earlier replies, which your app sends back so the model can see them.\n\nThe API is **stateless**: nothing is stored between calls. \"Memory\" is your app replaying the list." },
    { kind: "flow", id: "s6-roles" },
    {
      kind: "predict",
      q: "A reply reads fine but its stop reason is max_tokens. What happened?",
      answer: "The answer hit the output cap and was cut off",
      wrong: ["The model finished and used all its budget exactly", "The input was too long, so the model skipped part of it", "The model refused to answer"],
      why: "max_tokens means the model was still writing when the cap stopped it. The text can end mid-sentence or, for JSON, mid-object. A finished answer says end_turn (or the provider's word for a natural stop).",
    },
    { kind: "flow", id: "g-stateless" },
    { kind: "play", id: "s6-stream" },
    {
      kind: "compare",
      head: ["", "Blocking call", "Streaming call"],
      rows: [
        ["First text on screen", `After the whole answer: ${r1(CT + CN / CS)} s for ${n0(CN)} tokens at ${CS}/s`, `After the first token: ${r1(CT)} s`],
        ["Total time", `${r1(CT + CN / CS)} s`, `${r1(CT + CN / CS)} s, the same`],
        ["Best for", "Background jobs, JSON you parse at the end", "Chat screens, long answers"],
        ["Extra work", "None", "Join the pieces, handle a stream that drops"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  S["send: system + history + question"]:::hot --> R1
  subgraph R1["status 429 or 5xx?"]
    Q1["busy or server error"] --> A1["wait with backoff, send again"]:::warn
  end
  subgraph R2["status 400 or 401?"]
    Q2["your request is wrong"] --> A2["fix it, never retry as is"]:::bad
  end
  subgraph R3["stop reason max_tokens?"]
    Q3["cut off"] --> A3["raise the cap or continue"]:::warn
  end
  subgraph R4["stop reason end_turn?"]
    Q4["finished"] --> A4["log usage, show the answer"]:::ok
  end
  R1 --> R2 --> R3 --> R4`,
      caption: "Check every response in this order. Only temporary errors are worth retrying.",
    },
    { kind: "text", md: "**Streaming** sends the answer as small pieces over one open connection, usually server-sent events: lines that start with `data:`. Each piece adds a little text. The last one carries the stop reason and the token usage. The script below joins a stream like that." },
    {
      kind: "code",
      run: true,
      src: `import json

# A streamed reply as the raw lines a server sends (simplified; every provider names its events a little differently)
raw = """data: {"type": "start", "input_tokens": 52}

data: {"type": "delta", "text": "A KV cache "}

data: {"type": "delta", "text": "keeps past "}

data: {"type": "delta", "text": "keys and values."}

data: {"type": "stop", "stop_reason": "end_turn", "output_tokens": 9}
"""

text, usage, stop = [], {}, None
for line in raw.splitlines():
    if not line.startswith("data: "):
        continue                      # blank lines separate events
    event = json.loads(line[len("data: "):])
    if event["type"] == "delta":
        text.append(event["text"])    # show it now: this is what the user watches appear
        print(event["text"], end="", flush=True)
    elif event["type"] == "start":
        usage["input"] = event["input_tokens"]
    elif event["type"] == "stop":
        stop, usage["output"] = event["stop_reason"], event["output_tokens"]

print()
print("stop reason:", stop, "| usage:", usage)
assert "".join(text) == "A KV cache keeps past keys and values."
assert stop == "end_turn"             # max_tokens here would mean the answer was cut off
`,
    },
  ],
  keyPoints: [
    "A request is a list of messages with roles: system for rules and format, user for the person, assistant for the model's earlier replies.",
    "The API is stateless. Your app stores the conversation and resends all of it on every call, so input tokens grow every turn.",
    "Always read the stop reason: end_turn means finished, max_tokens means cut off.",
    "Log the token usage of every call; cost and limits are counted in tokens, not characters.",
    "Retry only temporary errors (429, 5xx) with exponential backoff and jitter; fix 4xx request errors instead.",
    "Streaming shows the first token sooner. It does not make the whole answer faster.",
  ],
  questions: [
    { id: "system-role", level: "easy", kind: "concept",
      q: "Where do the model's rules, persona and output format usually go?",
      answer: "The system message", wrong: ["The first assistant message", "The last user message, after the question", "The max_tokens setting"],
      why: "The system message frames the whole conversation and is sent first on every call. Assistant messages are the model's own earlier replies, and max_tokens only caps the answer length." },
    { id: "stateless", level: "easy", kind: "concept",
      q: "With a stateless chat API, how does the model know in turn 3 what was said in turn 1?",
      answer: "Your app sends turn 1 again as part of the message list",
      wrong: ["The API keeps the chat between calls on its own", "The model's weights update after every reply", "It does not; each turn sees only the new question"],
      why: "A plain chat call is stateless. The model sees only what is in this request, so the app replays the history. The last option describes what happens if the app forgets to." },
    { id: "stop-max", level: "medium", kind: "concept",
      q: "What is the right fix when replies often end with stop reason max_tokens?",
      answer: "Raise max_tokens or ask for a shorter answer, and check the stop reason before using the text",
      wrong: ["Retry the same request until it ends with end_turn", "Lower the temperature so the answer is shorter", "Send fewer input tokens"],
      why: "The cap cut the answer off. Retrying the same request hits the same cap. Temperature changes randomness, not length, and the input size does not set the output cap." },
    { id: "retry-which", level: "medium", kind: "concept",
      q: "Which response is worth retrying automatically, after a wait?",
      answer: "429 Too Many Requests", wrong: ["400 Bad Request", "401 Unauthorized", "A 200 with stop reason end_turn"],
      why: "429 means slow down: the same request can succeed later, ideally after the Retry-After time if the server gives one. 400 and 401 fail again until you fix the request or the key." },
    { id: "stream-ttft", level: "medium", kind: "concept",
      q: "What does streaming improve?",
      answer: "Time until the first words appear", wrong: ["Total generation time", "The price per output token", "The quality of the answer"],
      why: "The model produces tokens at the same speed either way. Streaming sends each one as it is made, so the user starts reading after the first token instead of after the last." },
    { id: "jitter", level: "hard", kind: "concept",
      q: "Why add random jitter to exponential backoff?",
      answer: "So many clients that failed together do not all retry at the same instant",
      wrong: ["So the server cannot tell the request is a retry", "So each retry gets a different answer from the model", "Because exact powers of 2 are not allowed by HTTP"],
      why: "If a thousand clients hit a limit at once and all wait exactly 1, 2, 4 seconds, they hit it again together. A random spread turns the spikes into a steady trickle." },
    { id: "turn-tokens", level: "medium", kind: "numeric",
      q: `The system prompt is ${SYS} tokens, each question ${Q} and each answer ${A}. How many input tokens does turn ${K} send?`,
      answer: n0(turnIn(K)), wrong: [n0(SYS + Q), n0(SYS + K * (Q + A)), n0(turnIn(K - 1))],
      why: `Turn ${K} sends the system prompt, ${K - 1} earlier question and answer pairs and the new question: ${SYS} + ${K - 1} × ${Q + A} + ${Q} = ${n0(turnIn(K))}. Only ${Q} of those tokens are new.` },
    { id: "chat-total", level: "hard", kind: "numeric",
      q: `Same chat: how many input tokens are billed over all ${K} turns together?`,
      answer: n0(total), wrong: [n0(K * (SYS + Q)), n0(turnIn(K)), n0(SYS + K * (Q + A))],
      why: `Add up every turn: ${Array.from({ length: K }, (_, i) => n0(turnIn(i + 1))).join(" + ")} = ${n0(total)}. Each turn adds ${Q + A} to the next, so the total grows with the square of the number of turns.` },
    { id: "blocking-wait", level: "easy", kind: "numeric",
      q: `First token after ${TTFT} s, then ${SPEED} tokens per second, for a ${LEN} token answer. Without streaming, how long until the user sees anything?`,
      answer: `${r1(wait)} s`, wrong: [`${r1(TTFT)} s`, `${r1(LEN / SPEED)} s`, `${r1(TTFT * LEN / SPEED)} s`],
      why: `A blocking call returns only when the answer is done: ${TTFT} + ${LEN} / ${SPEED} = ${r1(wait)} s. With streaming the first words would show at ${TTFT} s.` },
    { id: "backoff", level: "easy", kind: "output",
      q: "Exponential backoff with a cap. What does this print?",
      code: `print([min(2 ** i, ${CAP}) for i in range(5)])`,
      answer: `[${delays.join(", ")}]`, wrong: ["[1, 2, 4, 8, 16]", "[2, 4, 8, 16, 32]", "[0, 2, 4, 6, 8]"],
      why: `The wait doubles each time, 2^0 to 2^4, but never goes above ${CAP} seconds, so 16 becomes ${CAP}. In real code you add jitter on top and stop after a few tries.` },
    { id: "memory-design", level: "medium", kind: "explain",
      q: "The API is stateless. How do you build a chat with memory, and what does it cost?",
      answer: "Store each conversation in your own database, keyed by user and thread. On every turn, rebuild the message list: system prompt, history, new question, and send it all.\n\nThe cost is that input tokens grow every turn, so long chats get slower and pricier and finally hit the context limit. Control it with a sliding window of recent turns, a summary of older turns, trimmed tool output and prompt caching for the unchanging start." },
    { id: "wrapper", level: "hard", kind: "explain",
      q: "What goes into a production wrapper around one LLM call?",
      answer: "- A timeout, so a hung call does not block the user.\n- Retries only for 429 and 5xx, with exponential backoff, jitter, a try limit and Retry-After respected.\n- A check of the stop reason: max_tokens means cut off, a refusal needs its own path.\n- Logging of model, input and output tokens, latency and errors for every call.\n- Validation of the output before the rest of the app uses it." },
    { id: "when-not-stream", level: "medium", kind: "explain",
      q: "When would you not stream?",
      answer: "When nobody is watching the text appear. Batch jobs, background summaries and classification run fine as blocking calls.\n\nAlso when you need the whole answer before you can use it, such as JSON you parse and validate at the end. Streaming adds work: joining pieces, handling a dropped connection and reading usage from the last event, so use it where the faster first word matters." },
    { id: "untrusted-where", level: "hard", kind: "explain",
      q: "A user pastes a document into your app. Should it go in the system message or a user message, and why?",
      answer: "A user message, wrapped in clear tags such as <document>, with a note that it is data, not instructions.\n\nThe system message is where you, the developer, set the rules, and models are trained to follow it closely. Putting untrusted text there gives it that weight, so a line inside the document like \"ignore your rules\" is more likely to work. Keeping roles clean is one layer of defence against prompt injection, not a full fix." },
    { id: "trap-stream-fast", level: "easy", kind: "trap",
      claim: "Streaming makes the model generate the whole answer faster.",
      truth: false,
      why: `Generation speed is the same. At ${CS} tokens per second, ${n0(CN)} tokens take ${r1(CN / CS)} s either way; streaming only lets the user start reading after the first token.` },
    { id: "trap-replay", level: "medium", kind: "trap",
      claim: "With a stateless chat API, the model can use turn 1 in turn 3 only if your app sends turn 1 again.",
      truth: true,
      why: "Each call stands alone. Whatever is not in this request's messages does not exist for the model, which is why history, summaries and retrieved facts are all things the app puts back in." },
    { id: "trap-400", level: "medium", kind: "trap",
      claim: "A 400 Bad Request is worth retrying with exponential backoff.",
      truth: false,
      why: "400 means the request itself is wrong: a bad field, too many tokens, an invalid message order. Sending it again fails again. Fix the request; save retries for 429 and 5xx." },
  ],
  real: [
    { who: "Mark Nottingham and Roy Fielding (IETF, RFC 6585)", when: "2012",
      what: "RFC 6585 defined HTTP status 429 Too Many Requests: the user has sent too many requests in a given time. The response may include a Retry-After header saying how long to wait before trying again.",
      takeaway: "When an LLM API says 429, the polite and effective move is to wait, honouring Retry-After when it is there, then retry.",
      url: "https://www.rfc-editor.org/rfc/rfc6585" },
  ],
};
