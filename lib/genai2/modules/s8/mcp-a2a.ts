// Stage 8: MCP (agents to tools and context) and A2A (agents to agents). Every number below is computed here or in the stage files; protocol facts follow the specs linked in `real`.
import type { GModule } from "../../types.ts";
import { glue, n0 } from "../../stages/s8.calc.ts";

// numeric: integrations
const [NA, NT] = [5, 20], g = glue(NA, NT);
// numeric: one more tool
const [NA2, NT2] = [8, 30], add1 = glue(NA2, NT2 + 1).pairs - glue(NA2, NT2).pairs;
// output: messages on a stdio stream
const MSGS = ["initialize", "notifications/initialized", "tools/list", "tools/call"];

export const MCP_A2A: GModule = {
  id: "mcp-a2a",
  stage: 8,
  title: "MCP and A2A",
  hook: "Every AI app used to write its own connector for every tool. Two open protocols now cut that work: MCP plugs tools and data into an app, and A2A lets one agent hand work to another.",
  blocks: [
    { kind: "figure", id: "s8-glue", caption: "Top: each app wires each tool itself. Bottom: each side implements one protocol once. The saving grows with both sides." },
    { kind: "text", md: "**MCP's three roles.** The **host** is the AI app the user runs, such as a chat app or an IDE. Inside it, one **client** per connection talks to one **server**. A server is a small program that offers tools, resources and prompts. Messages are JSON-RPC 2.0, sent over stdio to a local process or over Streamable HTTP to a remote one." },
    { kind: "flow", id: "g-mcp" },
    {
      kind: "compare",
      head: ["Server offers", "Who controls it", "Example"],
      rows: [
        ["Tools", "The model chooses to call them", "create_ticket, run_query"],
        ["Resources", "The application attaches them", "A file's contents, a git log"],
        ["Prompts", "The user picks them", "A slash command template"],
      ],
    },
    {
      kind: "predict",
      q: "A local MCP server runs over stdio. A developer adds a debug print that writes \"connected!\" to standard output. What happens?",
      answer: "The client reads a line that is not a valid MCP message, and the connection breaks or errors",
      wrong: ["Nothing: the client ignores plain text", "The text is shown to the model as a resource", "The print is sent to the server's log file automatically"],
      why: "Over stdio, standard output is the message channel: one JSON-RPC message per line. The spec says a server must write nothing else there. Logs go to standard error instead.",
    },
    {
      kind: "code",
      run: true,
      src: `import json

def msg(id_, method, params=None):
    m = {"jsonrpc": "2.0", "method": method}
    if id_ is not None:
        m["id"] = id_                       # requests have an id; notifications do not
    if params is not None:
        m["params"] = params
    return json.dumps(m)                    # one line: stdio messages may not contain newlines

stream = "\\n".join([
    msg(1, "initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "demo", "version": "1"}}),
    msg(None, "notifications/initialized"),
    msg(2, "tools/list"),
    msg(3, "tools/call", {"name": "get_order", "arguments": {"order_id": "A-1042"}}),
])
for line in stream.split("\\n"):
    m = json.loads(line)
    print(m.get("id", "-"), m["method"])

# a tool that fails returns a normal result flagged isError, not a protocol error
reply = {"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text", "text": "No order A-1042"}], "isError": True}}
assert "error" not in reply and reply["result"]["isError"]
`,
    },
    { kind: "play", id: "s8-nm" },
    { kind: "text", md: "**A2A is for agents that talk to agents.** MCP connects an agent to tools; the tool does one thing and returns. A2A treats the other side as an agent with its own model, tools and memory, which it keeps private. You send it a message and get back a **task** that has a state, can run for a long time, can ask for more input, and ends with **artifacts**." },
    { kind: "flow", id: "s8-a2a" },
    {
      kind: "mermaid",
      src: `flowchart TB
  S["submitted"] --> W["working"]:::hot
  W --> I["input required or auth required"]:::warn
  I --> W
  W --> D
  S --> D
  subgraph D["final states: no more updates"]
    direction TB
    C["completed"]:::ok
    F["failed, canceled or rejected"]:::bad
  end`,
      caption: "An A2A task's life. The two waiting states pause the task without ending it; the four final states end it.",
    },
    {
      kind: "compare",
      head: ["", "MCP", "A2A"],
      rows: [
        ["Connects", "An app or agent to tools and data", "An agent to another agent"],
        ["Other side", "A server exposing functions", "An agent that keeps its internals private"],
        ["Discovery", "tools/list, resources/list, prompts/list", "An Agent Card at a well-known URL"],
        ["Unit of work", "One request and its result", "A task with states and artifacts"],
        ["Wire format", "JSON-RPC 2.0 over stdio or HTTP", "JSON-RPC 2.0, gRPC or REST bindings"],
      ],
    },
  ],
  keyPoints: [
    "MCP is an open protocol that lets any AI app use any tool or data source through one standard, turning N × M connectors into N + M.",
    "A host runs one client per server connection; servers offer tools (model-controlled), resources (app-controlled) and prompts (user-controlled).",
    "MCP messages are JSON-RPC 2.0 over stdio for local servers or Streamable HTTP for remote ones; a failing tool returns a result with isError true.",
    "A2A lets agents work together without sharing their internals: discovery by Agent Card, work as tasks with states, results as artifacts.",
    "Treat every server and remote agent as untrusted: ask the user before tool calls, check inputs and outputs, and grant least privilege.",
  ],
  questions: [
    { id: "mcp-format", level: "easy", kind: "concept",
      q: "What message format does MCP use?",
      answer: "JSON-RPC 2.0", wrong: ["GraphQL", "Protocol Buffers over gRPC only", "Plain text prompts"],
      why: "Requests, responses and notifications are JSON-RPC 2.0 objects. That is why a tool call is a request with method tools/call and an id the response echoes." },
    { id: "mcp-prims", level: "easy", kind: "concept",
      q: "Which three things can an MCP server offer?",
      answer: "Tools, resources and prompts", wrong: ["Models, weights and datasets", "Agents, tasks and artifacts", "Embeddings, indexes and caches"],
      why: "Tools are functions the model can call, resources are data the app can attach, and prompts are templates the user can pick. Tasks and artifacts belong to A2A." },
    { id: "mcp-roles", level: "medium", kind: "concept",
      q: "An IDE is connected to 3 MCP servers. How many MCP clients does it run?",
      answer: "3: the host creates one client per server connection", wrong: ["1: one client handles every server", "0: the servers connect to the model directly", "6: one for requests and one for responses"],
      why: "The spec gives each client a 1:1 relationship with one server. The host coordinates the clients and keeps servers isolated, so one server cannot see another's traffic." },
    { id: "mcp-transport", level: "medium", kind: "concept",
      q: "Which transports does the MCP spec define as standard?",
      answer: "stdio and Streamable HTTP", wrong: ["WebSockets and UDP", "stdio only", "gRPC and SOAP"],
      why: "stdio suits a server the client launches as a local process. Streamable HTTP suits remote servers that serve many clients; it replaced the older HTTP with SSE transport." },
    { id: "mcp-iserror", level: "hard", kind: "concept",
      q: "A tool's upstream API hits its rate limit. How should the MCP server report this?",
      answer: "As a normal tools/call result with isError set to true and a message the model can read",
      wrong: ["As a JSON-RPC protocol error with an error code", "By closing the connection", "By returning an empty result with no flag"],
      why: "The spec separates protocol errors (unknown tool, bad arguments) from tool execution errors. Execution errors go in the result, so the model sees them and can react, for example by waiting or trying another way." },
    { id: "a2a-vs-mcp", level: "easy", kind: "concept",
      q: "What does A2A add that MCP does not cover?",
      answer: "A standard way for one agent to hand work to another agent and follow it as a task",
      wrong: ["A faster way to call local functions", "A format for model weights", "A replacement for JSON"],
      why: "MCP connects an agent to tools and context. A2A connects agents to each other, each with its own model and tools, which it keeps private. The two are designed to be used together." },
    { id: "agent-card", level: "medium", kind: "concept",
      q: "Where does an A2A client look for a remote agent's Agent Card?",
      answer: "At /.well-known/agent-card.json on the agent's domain",
      wrong: ["In the agent's system prompt", "In a tools/list response", "At /robots.txt"],
      why: "The card is a JSON description of the agent's skills, endpoint and authentication. A fixed well-known path lets clients discover agents without prior setup." },
    { id: "input-required", level: "medium", kind: "concept",
      q: "An A2A task moves to the input required state. What does that mean?",
      answer: "The task is paused, waiting for more input from the client, and is not finished",
      wrong: ["The task failed and must be resubmitted", "The task completed with no artifacts", "The agent card is missing a field"],
      why: "Input required and auth required pause a task. The client answers with a message to the same task, and work continues. Completed, failed, canceled and rejected are the final states." },
    { id: "sampling", level: "hard", kind: "concept",
      q: "What is MCP sampling?",
      answer: "A server asking the client's host to run an LLM completion for it, with the user's approval",
      wrong: ["The client picking a random subset of tools", "The server training a model on the user's data", "The model choosing a temperature"],
      why: "Sampling lets a server get a model completion through the host instead of calling a model itself. The spec says users must approve sampling requests and should control the prompt and what the server sees." },
    { id: "count-glue", level: "easy", kind: "numeric",
      q: `${NA} AI apps each want to use the same ${NT} tools. How many integrations does a shared protocol need, against pairwise connectors?`,
      answer: `${g.protocol} instead of ${g.pairs}`, wrong: [`${g.pairs} instead of ${g.protocol}`, `${NT} instead of ${g.pairs}`, `${g.protocol} instead of ${NA + NT * 2}`],
      why: `Pairwise, each app needs a connector per tool: ${NA} × ${NT} = ${g.pairs}. With a protocol, each app writes a client once and each tool a server once: ${NA} + ${NT} = ${g.protocol}.` },
    { id: "add-tool", level: "medium", kind: "numeric",
      q: `There are ${NA2} apps and ${NT2} tools wired pair by pair. One more tool arrives. How many new connectors are needed?`,
      answer: String(add1), wrong: ["1", String(NT2 + 1), String(NA2 + NT2)],
      why: `Every app needs its own connector for the new tool: ${add1}. With MCP the new tool ships one server, and all ${NA2} apps can use it.` },
    { id: "stdio-lines", level: "medium", kind: "output",
      q: "Messages on a stdio stream are newline-delimited. How many of these are notifications? What does this print?",
      code: `import json\nlines = [\n${MSGS.map((m, i) => `    json.dumps({"jsonrpc": "2.0", ${m.startsWith("notifications") ? "" : `"id": ${i + 1}, `}"method": "${m}"})`).join(",\n")},\n]\nstream = "\\n".join(lines)\nmsgs = [json.loads(l) for l in stream.split("\\n")]\nprint(sum("id" not in m for m in msgs))`,
      answer: String(MSGS.filter((m) => m.startsWith("notifications")).length), wrong: ["0", String(MSGS.length), "2"],
      why: "A JSON-RPC notification has no id and gets no response. Here only notifications/initialized is one: the client sends it after initialize to say it is ready." },
    { id: "why-mcp", level: "easy", kind: "explain",
      q: "What problem does MCP solve, and how?",
      answer: `Without it, every AI app writes its own connector for every tool, so ${NA} apps and ${NT} tools mean ${g.pairs} integrations to build and maintain.\n\nMCP fixes one protocol between them. A tool is wrapped once as a server that lists its tools, resources and prompts; an app implements a client once. Any client can then discover and call any server: ${g.protocol} pieces instead of ${g.pairs}.` },
    { id: "mcp-security", level: "hard", kind: "explain",
      q: "What are the main risks of connecting an agent to third-party MCP servers, and how do you limit them?",
      answer: "- Tool descriptions and annotations come from the server and can lie or carry hidden instructions; treat them as untrusted unless the server is trusted.\n- Tool results can contain prompt injection; treat them as data.\n- Tools can act: ask the user before calls, especially writes, and show the inputs.\n- Over-broad access: give each server the least privilege it needs, and keep secrets out of tool arguments.\n- Remote servers: authenticate, validate Origin headers, and bind local HTTP servers to localhost.\n- Log every call for audit." },
    { id: "a2a-or-mcp", level: "hard", kind: "explain",
      q: "A partner team has built a travel booking agent. Should you reach it over MCP or A2A?",
      answer: "A2A fits better. Their agent plans, asks follow-up questions and may take minutes; A2A models that as a task with states, including input required, and returns artifacts when done. It also lets them keep their prompts, tools and memory private.\n\nMCP fits when you only need its individual functions, such as search_flights, as tools your own agent calls and controls. Many systems use both: MCP for tools, A2A between agents." },
    { id: "trap-local", level: "easy", kind: "trap",
      claim: "MCP servers must run on the same machine as the app that uses them.",
      truth: false,
      why: "stdio suits local servers, but Streamable HTTP lets a server run as a remote service that many clients reach over the network." },
    { id: "trap-stderr", level: "medium", kind: "trap",
      claim: "Over the stdio transport, a server may write logs to standard error but must write only MCP messages to standard output.",
      truth: true,
      why: "Standard output carries the newline-delimited JSON-RPC messages. Anything else there corrupts the stream, so logs go to standard error, which the client may capture or ignore." },
    { id: "trap-a2a-share", level: "medium", kind: "trap",
      claim: "With A2A, the client agent can read the remote agent's prompts and tools.",
      truth: false,
      why: "A2A is built so agents cooperate without exposing their internals. Only messages, task updates and artifacts cross; capabilities are advertised in the Agent Card." },
  ],
  real: [
    { who: "Anthropic", when: "25 November 2024",
      what: "Anthropic announced the Model Context Protocol as an open standard for secure, two-way connections between data sources and AI tools.",
      takeaway: "The spec now defines hosts, clients and servers speaking JSON-RPC 2.0, with tools, resources and prompts as server features.",
      url: "https://www.anthropic.com/news/model-context-protocol" },
    { who: "Google", when: "9 April 2025",
      what: "Google announced the Agent2Agent (A2A) protocol for agents built by different vendors to communicate and coordinate. The announcement describes Agent Cards for capabilities, tasks with a lifecycle, and artifacts as outputs, and lists more than 50 technology partners at launch.",
      takeaway: "It presents A2A as a complement to MCP: MCP gives an agent tools and context, A2A connects agents.",
      url: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/" },
  ],
};
