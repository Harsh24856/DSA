import type { Subject } from "./types";

export const REACT: Subject = {
  id: "react",
  name: "React",
  short: "React",
  blurb: "From JSX and props to effects, context, performance, custom hooks, the React 19 hooks (use, actions, optimistic UI) and Server Components, and how rendering works underneath. Every component here is strict TypeScript and is type-checked against React 19.",
  parts: [["Basics", "jsx"], ["Data and state", "effects"], ["Advanced", "perf"]],
  chapters: [
    {
      id: "jsx",
      anim: "react-jsx",
      title: "Components and JSX",
      summary: "A React component is a function that takes **props** and returns **JSX**, a description of the UI. React calls your function, compares the result with the last one, and updates only the parts of the page that changed.",
      points: [
        "Component names start with a capital letter; lowercase tags are HTML elements.",
        "JSX is JavaScript: `{}` embeds any expression, `className` replaces `class`, and every element is closed (`<img />`).",
        "A component must return one root; use a fragment `<>...</>` to group without an extra element.",
      ],
      diagram: `flowchart LR
  P["props"] --> C["Component function"]
  S["state"] --> C
  C --> J["JSX (a description of UI)"]
  J --> R["React compares with the last render"]
  R --> D["updates only what changed in the DOM"]`,
      caption: "UI = f(props, state). You describe the result; React works out the DOM changes.",
      code: {
        file: "Greeting.tsx",
        tsx: `type GreetingProps = { name: string; unread?: number };

export function Greeting({ name, unread = 0 }: GreetingProps) {
  return (
    <section className="card">
      <h2>Hello, {name}</h2>
      {unread > 0 ? <p>You have {unread} new messages</p> : <p>All caught up</p>}
    </section>
  );
}

export function App() {
  return (
    <>
      <Greeting name="Asha" unread={3} />
      <Greeting name="Ben" />
    </>
  );
}`,
      },
      cards: [
        { id: "jsx-compile", q: "What does JSX compile to?", a: "Function calls that create plain objects describing elements. `<h2 className=\"t\">Hi</h2>` becomes roughly `jsx(\"h2\", { className: \"t\", children: \"Hi\" })`. React reads these objects; nothing touches the DOM until React commits a render." },
        { id: "props-readonly", q: "Can a component change its props?", a: "No. Props are read-only inputs owned by the parent. To change something, the parent passes down a value and a callback; the child calls the callback and the parent updates its own state, which re-renders the child with new props (data flows down, events flow up)." },
      ],
    },
    {
      id: "state",
      anim: "react-batch",
      title: "State and events",
      summary: "**State** is data a component remembers between renders. Calling the setter schedules a re-render with the new value. State updates are asynchronous and batched, so use the updater form when the new value depends on the old one.",
      diagram: `flowchart TB
  E["click"] --> H["handler: setCount(c => c + 1)"]
  H --> Q["React queues the update and batches it"]:::warn
  Q --> R["re-render: Counter runs again, count is 1"]:::hot
  R --> D["React compares the output and patches the DOM"]
  D --> S["screen shows 1"]:::ok
  S -.->|"next click"| E`,
      caption: "Setting state does not change the variable now: it schedules a render that runs the component again with the new value.",
      code: {
        file: "Counter.tsx",
        tsx: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  function addThrice() {
    // updater form: each call sees the latest value, so this adds 3 * step
    setCount((c) => c + step);
    setCount((c) => c + step);
    setCount((c) => c + step);
  }

  return (
    <div>
      <p>Count: {count}</p>
      <label>
        Step <input type="number" value={step} onChange={(e) => setStep(Number(e.target.value))} />
      </label>
      <button onClick={() => setCount(count + step)}>Add</button>
      <button onClick={addThrice}>Add three times</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
      },
      cards: [
        { id: "stale", q: "Why does `setCount(count + 1)` three times only add 1?", a: "`count` is a constant for this render (a snapshot). All three calls compute 0 + 1 and schedule \"set to 1\". The updater form `setCount(c => c + 1)` queues functions that each receive the latest pending value, so it adds 3." },
        { id: "state-objects", q: "How do you update an object or array in state?", a: "Never mutate it; create a new one so React sees a new reference: `setUser({ ...user, name })`, `setItems([...items, item])`, `setItems(items.filter(i => i.id !== id))`, `setItems(items.map(i => i.id === id ? { ...i, done: true } : i))`.",
          trap: "`items.push(x); setItems(items)` passes the same array, so React may skip the re-render." },
        { id: "lifting", q: "What is lifting state up?", a: "When two siblings need the same data, move the state to their closest common parent and pass it down as props, with callbacks to change it. There should be one owner for each piece of state." },
      ],
    },
    {
      id: "lists",
      anim: "react-keys",
      title: "Lists, keys and conditional rendering",
      summary: "Render lists with `map`. Each item needs a stable, unique **key** so React can tell which item moved, was added or was removed between renders.",
      diagram: `flowchart TB
  O["before: Asha, Ben"] --> I["insert Chen at the top"]
  I --> K{"what is the key?"}
  K -->|"key = item.id"| G["React keeps Asha and Ben, creates only Chen"]:::ok
  K -->|"key = index"| B["key 0 was Asha, now Chen: every row updates, and typed input sticks to the wrong row"]:::bad`,
      caption: "Keys tell React which item is which. With index keys, inserting at the top shifts every key.",
      code: {
        file: "TodoList.tsx",
        tsx: `import { useState } from "react";

type Todo = { id: number; text: string; done: boolean };

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Revise joins", done: false },
    { id: 2, text: "Two LeetCode mediums", done: true },
  ]);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const shown = filter === "open" ? todos.filter((t) => !t.done) : todos;   // derived, not stored

  const toggle = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div>
      <button onClick={() => setFilter(filter === "all" ? "open" : "all")}>Show {filter === "all" ? "open" : "all"}</button>
      {shown.length === 0 && <p>Nothing to do</p>}
      <ul>
        {shown.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} /> {t.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      },
      cards: [
        { id: "index-key", q: "Why is using the array index as a key a bug?", a: "If items are inserted, removed or reordered, the index of an item changes, so React matches the wrong old element to the new data: input values, checkbox state and focus jump to the wrong row. Use a stable id from the data. Index keys are fine only for static lists that never change order." },
        { id: "derived", q: "Should the filtered list be in state?", a: "No. Anything you can compute from existing state or props should be computed during render. Storing it duplicates data that can drift out of sync. Memoise the calculation only if it is measurably slow." },
      ],
    },
    {
      id: "effects",
      anim: "react-effect",
      title: "Effects and data fetching",
      summary: "`useEffect` runs code **after** React has updated the screen, to synchronise with something outside React: a network request, a subscription, a timer, the document title. Its dependency array says when to re-run, and its cleanup function undoes the previous run.",
      real: [
        {
                "who": "Cloudflare",
                "when": "Sep 2025",
                "what": "A dashboard bug put an object in a `useEffect` dependency array. It was recreated on each render, so React treated it as always new and re-ran the effect, calling an API over and over. Together with a service update, that overwhelmed the service, which was part of API authorization, so other APIs failed too.",
                "lesson": "This is a real outage from a beginner mistake. Depend on primitive values, or memoize the object.",
                "url": "https://blog.cloudflare.com/deep-dive-into-cloudflares-sept-12-dashboard-and-api-outage/"
        }
],
      work: ["Open the Network tab while building. A repeating request is obvious there and invisible in a code review.", "In real apps, a data library such as TanStack Query handles caching, dedupe and retries that most hand-written effects get wrong."],
      diagram: `flowchart LR
  R["render: call the component"] --> C["commit: update the DOM"]
  C --> E["run effects whose dependencies changed"]
  E -.->|"before the next run, or on unmount"| CL["cleanup of the previous effect"]
  E -->|"setState inside the effect"| R`,
      caption: "Effects run after paint. Cleanup runs before the effect re-runs and when the component unmounts.",
      code: {
        demo: `// A stand-in server, so this works with no backend. Change the name, or return a 404 to see the error path.
const fetch = async (url: string, _init?: RequestInit) => new Response(JSON.stringify({ id: Number(url.split("/").pop()), name: "User " + url.split("/").pop() }));

export function App() {
  const [id, setId] = useState(1);
  return (
    <div>
      <button onClick={() => setId(id + 1)}>Next user</button>
      <UserCard userId={id} />
    </div>
  );
}`,
        file: "UserCard.tsx",
        tsx: `import { useEffect, useState } from "react";

type User = { id: number; name: string };

export function UserCard({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();         // cancel the request if userId changes or we unmount
    setError(null);
    fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(\`HTTP \${r.status}\`))))
      .then((data: User) => setUser(data))
      .catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();                  // cleanup
  }, [userId]);                                       // re-run only when userId changes

  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p>Loading...</p>;
  return <h3>{user.name}</h3>;
}`,
      },
      cards: [
        { id: "deps", q: "What do [], [x] and no array mean for useEffect?", a: "No array: run after every render. `[]`: run once after the first render (and clean up on unmount). `[x, y]`: run after the first render and whenever x or y changed (compared with Object.is). List every value from the component that the effect reads; the linter rule exhaustive-deps enforces it." },
        { id: "race", q: "What race condition does the cleanup prevent here?", a: "If userId changes from 1 to 2 quickly, the response for user 1 might arrive after user 2's and overwrite it. Aborting (or ignoring) the previous request in the cleanup guarantees only the latest request can set state." },
        { id: "no-effect", q: "When should you not use an effect?", a: "For anything computable during render (derived data), and for responding to user events (do it in the event handler). Fetching in effects works, but in real apps a data library (TanStack Query, SWR) or a framework's server-side data loading handles caching, deduplication and races for you." },
        { id: "strict-twice", q: "Why does my effect run twice in development?", a: "StrictMode mounts, unmounts and remounts components in development to surface effects that do not clean up properly. Production runs them once. If the double run causes a bug (two subscriptions, two POSTs), the effect is missing its cleanup or should be an event handler." },
      ],
    },
    {
      id: "forms",
      anim: "react-controlled",
      title: "Forms: controlled inputs and React 19 actions",
      summary: "A **controlled** input takes its value from state and reports every change, so React is the single source of truth. React 19 adds **actions**: pass an async function to a form and use `useActionState` for its pending state and result.",
      work: ["Validate on the server even if you validate in the browser: client checks are for users, server checks are for security.", "Real forms need disabled states, error messages tied to fields, and protection against double submit."],
      diagram: `flowchart TB
  T["user types"] --> C["onChange: setName(value)"]
  C --> S[("state: name")]:::hot
  S --> I["input shows value = name"]
  I -.->|"next key"| T
  I --> F["submit"]
  F --> A["form action runs, via useActionState"]
  A --> P["isPending: button disabled"]:::warn
  P --> R["result or error shown"]:::ok`,
      caption: "Controlled input: state is the source of truth and the input only displays it. A form action handles the submit, with its pending state.",
      code: {
        file: "SignupForm.tsx",
        tsx: `import { useActionState, useState } from "react";

type Result = { ok: boolean; message: string };

async function signup(_prev: Result, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "");
  await new Promise((r) => setTimeout(r, 300));        // stand-in for a server call
  return email.includes("@") ? { ok: true, message: \`Welcome, \${email}\` } : { ok: false, message: "Enter a valid email" };
}

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, { ok: false, message: "" });
  const [name, setName] = useState("");                // a controlled input alongside the action

  return (
    <form action={formAction}>
      <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <button disabled={isPending}>{isPending ? "Signing up..." : "Sign up"}</button>
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}`,
      },
      cards: [
        { id: "controlled", q: "Controlled vs uncontrolled inputs?", a: "Controlled: `value` comes from state and `onChange` updates it; easy to validate and transform on every keystroke. Uncontrolled: the DOM keeps the value and you read it on submit (via a ref or FormData); less code and fewer re-renders. Form libraries such as React Hook Form use uncontrolled inputs for speed." },
        { id: "actions", q: "What do React 19 form actions give you?", a: "The form calls your (possibly async) function with its FormData; React tracks pending state, resets the form after success, and works with Server Functions so the same form can post to the server without client-side fetch code. `useFormStatus` reads the pending state from inside child components like a submit button." },
      ],
    },
    {
      id: "react19",
      anim: "react-optimistic",
      title: "React 19 hooks: use, actions and optimistic UI",
      summary: "React 19 adds `use` to read a promise or a context during render, and a family of hooks built around **actions** (async functions that run inside a transition): `useActionState`, `useFormStatus`, `useOptimistic` and an async `useTransition`. Smaller additions: `useDeferredValue` takes an initial value, `ref` is a plain prop, and context works as its own provider.",
      points: [
        "`use(promise)` suspends the component until the promise settles: the nearest `<Suspense>` shows its fallback, and a rejection goes to the nearest error boundary.",
        "`use` is the one hook you may call inside an `if` or a loop. It still cannot go inside `try`/`catch`, and it must be called during render, not in a handler.",
        "The promise must survive re-renders: create it in a parent, a cache or a Server Component. A new promise on every render suspends forever.",
        "An action is any function passed to a form's `action`, to `useActionState` or to `startTransition`. React tracks its pending state for you.",
      ],
      table: {
        head: ["API", "What it gives you"],
        rows: [
          ["use(promise)", "The resolved value, with Suspense while pending. Use it for: data started outside the component"],
          ["use(context)", "The context value, even inside an if. Use it for: a context needed on one branch only"],
          ["useActionState", "[state, formAction, isPending]. Use it for: a form whose result you show"],
          ["useFormStatus", "{ pending, data, method } of the parent form. Use it for: a submit button in its own component"],
          ["useOptimistic", "A value that shows the change before the server confirms. Use it for: likes, chat messages, toggles"],
          ["useTransition", "An async startTransition, plus isPending. Use it for: buttons that save without a form"],
          ["useDeferredValue", "A lagging copy of a value; a second argument sets the first render. Use it for: slow lists behind a fast input"],
          ["useId", "A stable id, the same on server and client. Use it for: linking a label to its input"],
          ["useSyncExternalStore", "A store value without tearing. Use it for: subscribing to a store or a browser API"],
        ],
      },
      diagram: `flowchart TB
  P["parent creates or caches a promise"]:::hot --> C["child calls use(promise)"]
  C -->|"pending"| S["nearest Suspense shows its fallback"]:::warn
  S -->|"promise resolves"| C
  C -->|"resolved"| R["child renders with the value"]:::ok
  C -->|"rejected"| E["nearest error boundary renders"]:::bad`,
      caption: "use(promise) lets a component wait for data during render. Suspense handles the waiting, an error boundary the failure.",
      code: {
        file: "QuoteCard.tsx",
        tsx: `import { Suspense, createContext, use, useState } from "react";

type Quote = { id: number; text: string };

// The cache keeps one promise per id, so re-renders reuse it instead of starting a new request.
const cache = new Map<number, Promise<Quote>>();
function fetchQuote(id: number): Promise<Quote> {
  let p = cache.get(id);
  if (!p) {
    p = new Promise((resolve) => setTimeout(() => resolve({ id, text: \`Quote number \${id}\` }), 600));
    cache.set(id, p);
  }
  return p;
}

const Theme = createContext("light");

function QuoteText({ quotePromise, showTheme }: { quotePromise: Promise<Quote>; showTheme: boolean }) {
  const quote = use(quotePromise);               // suspends until the promise resolves
  let label = "";
  if (showTheme) label = \` (theme: \${use(Theme)})\`; // use may sit inside an if; useContext may not
  return <p>{quote.text}{label}</p>;
}

export function App() {
  const [id, setId] = useState(1);
  const [showTheme, setShowTheme] = useState(false);
  return (
    <Theme value="dark">{/* React 19: the context itself is the provider */}
      <button onClick={() => setId(id + 1)}>Next quote</button>
      <label>
        <input type="checkbox" checked={showTheme} onChange={(e) => setShowTheme(e.target.checked)} /> Show theme
      </label>
      <Suspense fallback={<p>Loading quote...</p>}>
        <QuoteText quotePromise={fetchQuote(id)} showTheme={showTheme} />
      </Suspense>
    </Theme>
  );
}`,
      },
      work: [
        "In Next.js, a Server Component can start a query without awaiting it and pass the promise to a Client Component, which reads it with `use`. The page streams while the data loads.",
        "Most teams still fetch through TanStack Query or the framework. `use` is the primitive those libraries build on, so knowing it explains how their Suspense mode works.",
      ],
      cards: [
        { id: "use-vs-usecontext", q: "How is `use` different from every other hook?", a: "It can be called conditionally and in loops, because it does not keep a slot in the hook list: it reads a value (a promise or a context) each time it is called. It accepts a promise, which suspends the component until it settles, or a context, which behaves like `useContext` but may sit after an early return or inside an `if`.",
          trap: "Creating the promise inside the same component (`use(fetch(url))`) makes a new promise on every render, so the component suspends forever. The promise has to come from outside: a parent, a cache or a Server Component." },
        { id: "use-errors", q: "How do you handle a rejected promise read with `use`?", a: "Wrap the component in an error boundary: a rejection is thrown during render like any other error, and the nearest boundary shows its fallback. `use` cannot sit inside `try`/`catch`. To show a value instead of an error, catch on the promise itself: `fetchQuote(id).catch(() => fallbackQuote)`." },
        { id: "optimistic", q: "Show an optimistic update with `useOptimistic`.", a: "`useOptimistic(state, update)` returns a copy of `state` that you can change at once while an action runs. When the action ends, React throws the copy away and shows the real `state` again. On success the real state already holds the saved item; on failure it never changed, so the optimistic item simply vanishes with no rollback code.",
          code: {
            file: "Chat.tsx",
            tsx: `import { useOptimistic, useState } from "react";

type Msg = { id: number; text: string; sending?: boolean };

let nextId = 1;
async function sendToServer(text: string): Promise<Msg> {
  await new Promise((r) => setTimeout(r, 800));            // stand-in for a network call
  if (text.toLowerCase().includes("fail")) throw new Error("The server rejected it");
  return { id: nextId++, text };
}

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [shown, addOptimistic] = useOptimistic(messages, (list: Msg[], text: string) => [
    ...list,
    { id: -(list.length + 1), text, sending: true },       // negative ids never clash with saved ones
  ]);
  const [error, setError] = useState("");

  async function send(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    setError("");
    addOptimistic(text);                                   // appears now, before the server answers
    try {
      const saved = await sendToServer(text);
      setMessages((list) => [...list, saved]);
    } catch (e) {
      setError((e as Error).message);                      // the optimistic copy disappears by itself
    }
  }

  return (
    <div>
      <ul>
        {shown.map((m) => (
          <li key={m.id} style={{ opacity: m.sending ? 0.5 : 1 }}>{m.text}{m.sending ? " (sending)" : ""}</li>
        ))}
      </ul>
      <form action={send}>
        <input name="text" placeholder="Type, or include the word fail" />
        <button>Send</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}`,
          },
          trap: "Calling the optimistic setter outside an action or transition does nothing useful: React warns, and the value snaps back on the next render." },
        { id: "form-status", q: "How does a submit button know its form is submitting, without props?", a: "`useFormStatus()` from `react-dom` reads the status of the nearest parent `<form>`: `pending`, the submitted `data` (FormData), `method` and `action`. It only works in a component rendered inside the form, so the button is usually its own component. This keeps a design-system button reusable across every form.",
          code: {
            file: "SaveForm.tsx",
            tsx: `import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending, data } = useFormStatus();               // status of the form this button sits in
  return <button disabled={pending}>{pending ? \`Saving \${String(data?.get("title"))}...\` : "Save"}</button>;
}

async function save(formData: FormData) {
  await new Promise((r) => setTimeout(r, 800));
  console.log("saved", formData.get("title"));
}

export function App() {
  return (
    <form action={save}>
      <input name="title" defaultValue="Revision notes" />
      <SubmitButton />
    </form>
  );
}`,
          },
          trap: "Calling `useFormStatus` in the same component that renders the `<form>` always reports `pending: false`; it looks upward for a parent form." },
        { id: "async-transition", q: "What changed in `useTransition` in React 19?", a: "`startTransition` accepts an async function. `isPending` stays true from the moment it starts until the whole async function finishes, so one flag covers the request and the re-render. State set after an `await` is no longer inside the transition, so wrap it in `startTransition` again to keep it non-urgent.",
          code: {
            file: "Quantity.tsx",
            tsx: `import { useState, useTransition } from "react";

async function saveQuantity(qty: number): Promise<number> {
  await new Promise((r) => setTimeout(r, 700));            // stand-in for a PATCH request
  return qty;
}

export function App() {
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();

  function change(next: number) {
    startTransition(async () => {
      const saved = await saveQuantity(next);
      startTransition(() => setQty(saved));                // after an await, mark the update again
    });
  }

  return (
    <div>
      <p>Quantity: {qty}{isPending ? " (saving)" : ""}</p>
      <button onClick={() => change(qty + 1)} disabled={isPending}>Add one</button>
      <button onClick={() => change(Math.max(1, qty - 1))} disabled={isPending}>Remove one</button>
    </div>
  );
}`,
          } },
        { id: "action-state-vs-transition", q: "useActionState or useTransition?", a: "`useActionState(fn, initial)` is for a result you show: it keeps the last return value as state, passes it to the next call as `prev`, and gives a `formAction` for a form. Calls are queued, so two quick submits run in order. `useTransition` is for fire-and-forget saves where the state lives elsewhere and you only need `isPending`. The Forms chapter has a full `useActionState` example." },
        { id: "deferred-initial", q: "What does the second argument of `useDeferredValue` do?", a: "`useDeferredValue(value, initialValue)` returns `initialValue` on the first render, then re-renders in the background with `value`. The first paint stays cheap (an empty list, a placeholder) instead of blocking on the slow version. Later, when `value` changes, it lags behind exactly like before: the input updates at once and the slow child catches up.",
          code: {
            file: "Search.tsx",
            tsx: `import { memo, useDeferredValue, useState } from "react";

const ITEMS = Array.from({ length: 3000 }, (_, i) => \`topic \${i}\`);

const Results = memo(function Results({ query }: { query: string }) {
  const hits = ITEMS.filter((t) => t.includes(query));    // 3000 checks and up to 3000 rows: slow on purpose
  return <ul>{hits.map((t) => <li key={t}>{t}</li>)}</ul>;
});

export function App() {
  const [query, setQuery] = useState("12");
  const deferred = useDeferredValue(query, "none yet");    // first render shows the cheap placeholder query
  const stale = query !== deferred;
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Showing results for: {deferred}{stale ? " (updating)" : ""}</p>
      <div style={{ opacity: stale ? 0.5 : 1 }}><Results query={deferred} /></div>
    </div>
  );
}`,
          } },
        { id: "use-id", q: "Why use `useId` instead of `Math.random()` for an element id?", a: "`useId` returns an id that is unique per component instance and identical on the server and the client, because it comes from the component's position in the tree. A random id differs between the server HTML and the first client render, which causes a hydration mismatch, and a module counter breaks when components render in a different order.",
          code: {
            file: "Field.tsx",
            tsx: `import { useId } from "react";

function Field({ label, hint, type = "text" }: { label: string; hint: string; type?: string }) {
  const id = useId();                                      // one per Field, stable across server and client
  return (
    <p>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} aria-describedby={\`\${id}-hint\`} />
      <small id={\`\${id}-hint\`}>{hint}</small>
    </p>
  );
}

export function App() {
  return (
    <form>
      <Field label="Email" hint="Used for sign in only" type="email" />
      <Field label="Phone" hint="Optional" type="tel" />
    </form>
  );
}`,
          },
          trap: "`useId` is not for list keys. Keys come from your data." },
        { id: "sync-store", q: "What is `useSyncExternalStore` for?", a: "Reading a value that lives outside React (a store, `navigator.onLine`, `window.innerWidth`) safely. You pass `subscribe`, `getSnapshot` and optionally `getServerSnapshot`. React re-renders when the snapshot changes and, during a concurrent render, makes sure every component sees the same snapshot (no tearing). Zustand and Redux use it under the hood.",
          code: {
            file: "store.tsx",
            tsx: `import { useSyncExternalStore } from "react";

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: T) => { state = next; listeners.forEach((l) => l()); },
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

const cart = createStore(0);
const useCartCount = () => useSyncExternalStore(cart.subscribe, cart.get, cart.get);

function Badge({ where }: { where: string }) {
  return <p>{where}: {useCartCount()} items</p>;
}

export function App() {
  return (
    <div>
      <Badge where="Header" />
      <button onClick={() => cart.set(cart.get() + 1)}>Add to cart</button>
      <Badge where="Footer" />
    </div>
  );
}`,
          },
          trap: "`getSnapshot` must return the same value when nothing changed. Returning a new object each call (`() => ({ count })`) loops forever." },
        { id: "ref-prop", q: "How do refs change in React 19?", a: "A function component receives `ref` as an ordinary prop, so `forwardRef` is no longer needed (it still works, and will be deprecated). A ref callback may return a cleanup function, which React calls when the element is removed, like an effect cleanup.",
          code: {
            file: "TextInput.tsx",
            tsx: `import { useRef, useState, type Ref } from "react";

function TextInput({ ref, label }: { ref?: Ref<HTMLInputElement>; label: string }) {
  return <label>{label} <input ref={ref} /></label>;      // ref is just a prop now
}

export function App() {
  const input = useRef<HTMLInputElement>(null);
  const [showBox, setShowBox] = useState(true);
  return (
    <div>
      <TextInput ref={input} label="Search" />
      <button onClick={() => input.current?.focus()}>Focus search</button>
      <button onClick={() => setShowBox(!showBox)}>{showBox ? "Remove" : "Add"} box</button>
      {showBox && (
        <div ref={(node) => {
          console.log("attached", node?.tagName);
          return () => console.log("detached");           // React 19: ref callbacks can clean up
        }}>A box</div>
      )}
    </div>
  );
}`,
          } },
      ],
    },
    {
      id: "context",
      anim: "react-context",
      title: "Context and reducers",
      summary: "**Context** passes a value to any depth without threading props through every level (theme, current user, locale). **useReducer** moves complex state transitions into one pure function: (state, action) => new state.",
      diagram: `flowchart TB
  P["ThemeContext provider: value dark"]:::hot --> L["Layout"]
  L --> S["Sidebar"]
  S --> B["Button: useContext(ThemeContext) gives dark"]:::ok
  P -.->|"no props in between"| B`,
      caption: "The provider's value reaches any component below it that asks; the components in between pass nothing.",
      code: {
        demo: `function AddBook() {
  const { dispatch } = useCart();
  return <button onClick={() => dispatch({ type: "add", item: { id: "book", price: 250 } })}>Add book (250)</button>;
}

export function App() {
  return (
    <CartProvider>
      <AddBook />
      <CartTotal />
    </CartProvider>
  );
}`,
        file: "Cart.tsx",
        tsx: `import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

type Item = { id: string; price: number; qty: number };
type Action = { type: "add"; item: Omit<Item, "qty"> } | { type: "remove"; id: string } | { type: "clear" };

function cartReducer(state: Item[], action: Action): Item[] {
  switch (action.type) {
    case "add": {
      const found = state.find((i) => i.id === action.item.id);
      return found ? state.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i)) : [...state, { ...action.item, qty: 1 }];
    }
    case "remove":
      return state.filter((i) => i.id !== action.id);
    case "clear":
      return [];
  }
}

const CartContext = createContext<{ items: Item[]; dispatch: Dispatch<Action> } | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  return <CartContext.Provider value={{ items, dispatch }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function CartTotal() {
  const { items } = useCart();
  return <p>Total: {items.reduce((s, i) => s + i.price * i.qty, 0)}</p>;
}`,
      },
      cards: [
        { id: "context-rerender", q: "What is the performance catch with context?", a: "Every component that reads a context re-renders whenever its value changes. A provider value created inline (`value={{ items, dispatch }}`) is a new object on each provider render. Split rarely-changing and often-changing values into separate contexts, memoise the value, or use a store with selectors (Zustand, Redux) for high-frequency state." },
        { id: "redux", q: "When would you reach for Redux or Zustand instead?", a: "When much of the app shares state that changes often, when you need selectors so components re-render only for their slice, devtools with time travel, or middleware. For server data, a fetching library (TanStack Query) usually removes most of the need for a global store." },
      ],
    },
    {
      id: "perf",
      lab: "rerender",
      title: "Refs and performance",
      summary: "A component re-renders when its state changes, when its parent re-renders, or when a context it reads changes. Most re-renders are cheap. When one is not, `memo`, `useMemo` and `useCallback` let React skip work. `useRef` holds a value or DOM node that survives renders without causing them.",
      work: ["Profile before optimizing: the React DevTools Profiler shows which components actually re-rendered and why.", "Most slowness in production is bundle size and network, not re-renders. Check those first."],
      diagram: `flowchart TB
  A["App: state changes"]:::hot --> B["Header and Cart re-render"]:::warn
  A --> C["ProductList: memo, same props, skipped"]:::ok
  C --> E["500 ProductRows: skipped too"]:::ok`,
      caption: "memo lets ProductList skip re-rendering (and its 500 rows) when its props are unchanged.",
      code: {
        demo: `export function App() {
  return <SearchList items={["Arrays", "Graphs", "Greedy", "Heaps", "Stacks", "Tries"]} />;
}`,
        file: "SearchList.tsx",
        tsx: `import { memo, useCallback, useMemo, useRef, useState } from "react";

const Row = memo(function Row({ label, onPick }: { label: string; onPick: (l: string) => void }) {
  return <li onClick={() => onPick(label)}>{label}</li>;
});

export function SearchList({ items }: { items: string[] }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);           // a DOM node, no re-render when set
  const renders = useRef(0);
  renders.current += 1;                                       // a value that survives renders

  const shown = useMemo(() => items.filter((i) => i.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const onPick = useCallback((l: string) => setPicked(l), []); // stable function, so memo(Row) can skip

  return (
    <div>
      <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={() => inputRef.current?.focus()}>Focus search</button>
      <p>Picked: {picked ?? "none"} (render {renders.current})</p>
      <ul>{shown.map((l) => <Row key={l} label={l} onPick={onPick} />)}</ul>
    </div>
  );
}`,
      },
      cards: [
        { id: "memo-when", q: "When are memo, useMemo and useCallback worth it?", a: "Only when you have measured a slow render (React DevTools Profiler) and the props really stay equal between renders. Wrapping everything adds comparison cost and code noise. The React Compiler can add this memoisation automatically at build time, which makes most manual use unnecessary." },
        { id: "ref-vs-state", q: "useRef vs useState?", a: "Changing state re-renders the component and the new value is visible in the next render. Changing `ref.current` does not re-render and is visible immediately. Use refs for DOM nodes, timers, previous values and anything that should not drive the UI." },
        { id: "virtualize", q: "A list of 10,000 rows is slow. Fix?", a: "Render only the rows on screen (virtualisation, e.g. TanStack Virtual), give rows stable keys and memoised props, debounce the filter input or use `useDeferredValue` so typing stays responsive, and paginate or search on the server." },
      ],
    },
    {
      id: "hooks",
      anim: "react-hooks",
      title: "Custom hooks",
      summary: "A custom hook is a function whose name starts with `use` and that calls other hooks. It lets components share stateful logic (not state itself): each component that calls it gets its own copy.",
      diagram: `flowchart TB
  H["useOnline(): useState + useEffect, written once"]:::hot
  H -->|"called in"| A["Navbar"]
  H -->|"called in"| B["Editor"]
  A --> SA["its own online flag and listener"]:::ok
  B --> SB["its own online flag and listener"]:::ok`,
      caption: "Hooks share logic, not state: every component that calls one gets its own copy.",
      points: [
        "Rules of hooks: call them only at the top level of a component or another hook, never inside conditions, loops or after an early return. React relies on the call order to match state to hooks.",
      ],
      code: {
        demo: `export function App() {
  const [text, setText] = useLocalStorage("draft", "");
  const debounced = useDebounce(text, 500);
  const online = useOnline();
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something" />
      <p>Debounced after 500 ms: {debounced}</p>
      <p>{online ? "Online" : "Offline"}</p>
    </div>
  );
}`,
        file: "hooks.ts",
        tsx: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);                 // a new keystroke cancels the pending update
  }, [value, ms]);
  return debounced;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {   // lazy initial state: read storage once
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  }, [key, value]);
  return [value, setValue] as const;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return online;
}`,
      },
      cards: [
        { id: "hooks-order", q: "Why can't hooks go inside an if?", a: "React stores each component's hook state in a list and matches calls by position. If a hook is skipped on one render, every later hook reads the wrong slot. Put the condition inside the hook (or the effect) instead." },
        { id: "hook-vs-util", q: "Custom hook or plain function?", a: "If it calls hooks (state, effects, context), it must be a hook. If it is a pure calculation, keep it a plain function; naming it useSomething only adds restrictions." },
      ],
    },
    {
      id: "server",
      anim: "react-rsc",
      title: "Server Components, routing and frameworks",
      summary: "Modern React apps run on a framework (Next.js, React Router, TanStack Start) that adds routing, data loading and server rendering. **Server Components** render on the server, can read databases directly, and send no JavaScript for themselves; **Client Components** (marked `\"use client\"`) handle state and events in the browser.",
      diagram: `flowchart LR
  subgraph SV["server"]
    direction TB
    P["page.tsx (Server Component)<br/>await db.query(...)"] --> L["ProductList (Server)"]
  end
  subgraph CL["browser"]
    direction TB
    B["AddToCart ('use client')<br/>useState, onClick"]
  end
  L -->|"props (serialisable data)"| B`,
      caption: "Server parts send HTML and data; only client parts ship JavaScript and become interactive.",
      code: {
        file: "server-and-client (Next.js App Router)",
        text: `// app/products/page.tsx: a Server Component (the default in the App Router)
import { AddToCart } from "./AddToCart";
export default async function Page() {
  const products = await db.product.findMany();          // runs on the server only
  return products.map((p) => (
    <article key={p.id}>
      <h2>{p.name}</h2>
      <AddToCart id={p.id} />                            {/* client island */}
    </article>
  ));
}

// app/products/AddToCart.tsx: a Client Component
"use client";
import { useState } from "react";
export function AddToCart({ id }: { id: string }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? "Added" : "Add to cart"}</button>;
}`,
      },
      cards: [
        { id: "csr-ssr", q: "CSR vs SSR vs SSG vs Server Components?", a: "- **CSR**: the browser downloads JS and renders everything; slow first paint, simple hosting.\n- **SSR**: the server renders HTML per request, then the client hydrates it; fast first paint, needs a server.\n- **SSG**: HTML built at deploy time; fastest, but data is fixed until the next build (or revalidation).\n- **Server Components**: parts of the tree render only on the server and ship zero JS, mixed with client components where interactivity is needed." },
        { id: "hydration", q: "What is hydration, and what causes a hydration mismatch?", a: "Hydration attaches React's event handlers and state to server-rendered HTML. If the first client render produces different markup (Date.now(), Math.random(), reading localStorage or window during render), React warns and re-renders. Read browser-only values in an effect, after hydration." },
        { id: "use-client", q: "Does \"use client\" mean the component only renders in the browser?", a: "No. Client Components still render on the server for the initial HTML; the directive marks the boundary where JavaScript is sent to the browser so the component can use state, effects and event handlers." },
      ],
    },
    {
      id: "internals",
      anim: "react-render",
      title: "How React renders: reconciliation, batching and Fiber",
      summary: "On each update React calls your components to get a new element tree, **reconciles** it with the previous tree to find the minimal changes, then **commits** them to the DOM. The Fiber architecture splits this work into small units so urgent updates (typing) can interrupt less urgent ones (a big list).",
      diagram: `flowchart LR
  T["setState / new props"] --> RP["render phase: call components,<br/>build the new tree (interruptible)"]
  RP --> DF["diff against the old tree<br/>(same type + key = update in place)"]
  DF --> CM["commit phase: apply DOM changes<br/>(synchronous)"]
  CM --> EF["run layout effects, paint, then effects"]`,
      caption: "Reconciliation rule of thumb: a different element type or key means unmount and mount fresh.",
      cards: [
        { id: "vdom", q: "Is the virtual DOM what makes React fast?", a: "Not by itself: computing a diff is extra work compared with a perfectly hand-written DOM update. Its value is that you write UI declaratively and React applies a near-minimal set of changes, batching them. Speed in practice comes from rendering less (good component boundaries, memoisation, virtualisation)." },
        { id: "batching", q: "What is automatic batching?", a: "Since React 18, multiple state updates in the same event, timeout, promise or native handler are combined into one re-render. Before, only updates inside React event handlers were batched." },
        { id: "transitions", q: "What are useTransition and useDeferredValue for?", a: "They mark updates as non-urgent so React can keep the input responsive: typing updates immediately while the expensive filtered list renders in the background and is interrupted if the user keeps typing. `isPending` lets you show a subtle loading state." },
        { id: "testing-react", q: "How do you test a React component?", a: "With React Testing Library and a runner (Vitest or Jest): render the component, find elements the way a user would (by role, label or text), fire events with user-event, and assert on what appears. Test behaviour, not implementation details like state variables. Mock the network at the fetch level (MSW)." },
      ],
    },
  ],
};
