import type { Subject } from "./types";

export const REACT: Subject = {
  id: "react",
  name: "React",
  short: "React",
  blurb: "From JSX and props to effects, context, performance, custom hooks, React 19 actions and Server Components, and how rendering works underneath. Every component here is strict TypeScript and is type-checked against React 19.",
  chapters: [
    {
      id: "jsx",
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
      title: "State and events",
      summary: "**State** is data a component remembers between renders. Calling the setter schedules a re-render with the new value. State updates are asynchronous and batched, so use the updater form when the new value depends on the old one.",
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
      title: "Lists, keys and conditional rendering",
      summary: "Render lists with `map`. Each item needs a stable, unique **key** so React can tell which item moved, was added or was removed between renders.",
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
      title: "Effects and data fetching",
      summary: "`useEffect` runs code **after** React has updated the screen, to synchronise with something outside React: a network request, a subscription, a timer, the document title. Its dependency array says when to re-run, and its cleanup function undoes the previous run.",
      diagram: `flowchart LR
  R["render: call the component"] --> C["commit: update the DOM"]
  C --> E["run effects whose dependencies changed"]
  E -.->|"before the next run, or on unmount"| CL["cleanup of the previous effect"]
  E -->|"setState inside the effect"| R`,
      caption: "Effects run after paint. Cleanup runs before the effect re-runs and when the component unmounts.",
      code: {
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
      title: "Forms: controlled inputs and React 19 actions",
      summary: "A **controlled** input takes its value from state and reports every change, so React is the single source of truth. React 19 adds **actions**: pass an async function to a form and use `useActionState` for its pending state and result.",
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
      id: "context",
      title: "Context and reducers",
      summary: "**Context** passes a value to any depth without threading props through every level (theme, current user, locale). **useReducer** moves complex state transitions into one pure function: (state, action) => new state.",
      code: {
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
      title: "Refs and performance",
      summary: "A component re-renders when its state changes, when its parent re-renders, or when a context it reads changes. Most re-renders are cheap. When one is not, `memo`, `useMemo` and `useCallback` let React skip work. `useRef` holds a value or DOM node that survives renders without causing them.",
      diagram: `flowchart TB
  A["App (state changes)"] --> B["Header"]
  A --> C["ProductList (memo, same props)"]
  A --> D["Cart"]
  C --> E["ProductRow x 500"]
  style C stroke-dasharray: 5 5`,
      caption: "memo lets ProductList skip re-rendering (and its 500 rows) when its props are unchanged.",
      code: {
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
      title: "Custom hooks",
      summary: "A custom hook is a function whose name starts with `use` and that calls other hooks. It lets components share stateful logic (not state itself): each component that calls it gets its own copy.",
      points: [
        "Rules of hooks: call them only at the top level of a component or another hook, never inside conditions, loops or after an early return. React relies on the call order to match state to hooks.",
      ],
      code: {
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
