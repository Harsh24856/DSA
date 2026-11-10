// Syntax tracks that belong to some languages only: Python for Gen AI work, and React and Node.js in JavaScript and
// TypeScript. Programs live in code-tracks.ts; check:other runs every one (React ones are rendered with react-dom/server
// and the Node ones also run on the playground's Node emulation) and requires the expected output.
import type { SynGroup } from "./topics.ts";

export const TRACK_GROUPS: SynGroup[] = [
  { title: "Python for Gen AI", langs: ["python"], topics: [
    { id: "gx-dataclass", title: "Type hints and dataclasses", idea: "Chat messages, documents and tool calls are small records. A dataclass gives you the constructor, a readable print and equality for free, and type hints say what each field holds.", notes: {
      python: "`field(default_factory=list)` gives each object its own list; a bare `[]` default is an error in a dataclass. `asdict` turns it into a plain dict, ready for JSON.",
    } },
    { id: "gx-generators", title: "Generators, streaming and comprehensions", idea: "Models stream tokens one at a time, and documents are split into chunks before embedding. `yield` hands out one piece at a time; comprehensions build lists and dicts in one line.", notes: {
      python: "A function with `yield` returns a generator: nothing runs until you loop over it. `sum(x for x in ...)` adds without building a list.",
    } },
    { id: "gx-prompts", title: "Prompt templates", idea: "Prompts are strings built from parts: a system message, a few examples and the question. Keep the template in one place and fill it in.", notes: {
      python: "`dedent` removes the indent of a triple-quoted string. Inside an f-string or `.format`, write `{{` and `}}` for a literal brace, which JSON examples need.",
    } },
    { id: "gx-json", title: "JSON from model output", idea: "Models often wrap the JSON you asked for in extra text. Pull out the object, parse it, and handle the case where it is not valid JSON.", notes: {
      python: "`json.loads` turns text into dicts and lists; `json.dumps` goes back. JSON needs double quotes, and Python's `True` and `None` become `true` and `null`.",
    } },
    { id: "gx-pydantic", title: "Pydantic for structured output", idea: "Describe the answer you expect as a class, then validate what the model returned: wrong labels, out-of-range numbers and missing fields are caught with a clear error.", notes: {
      python: "`model_validate_json` parses and checks in one step. `Literal[...]` limits a string to fixed values and `Field(ge=0, le=1)` sets a range. Compatible values such as `\"0.5\"` are converted.",
    } },
    { id: "gx-async", title: "async and await for API calls", idea: "Calls to a model API spend most of their time waiting on the network. Run them concurrently with `asyncio.gather`, cap how many run at once, and give up after a timeout.", notes: {
      python: "`await` only works inside `async def`. `gather` returns results in the order you passed them, not the order they finished. A `Semaphore` limits calls in flight to respect rate limits.",
    } },
    { id: "gx-numpy", title: "NumPy arrays, shapes and broadcasting", idea: "Embeddings, logits and weights are arrays. Most bugs are shape bugs: know `shape`, `reshape`, matrix product `@`, sums along an axis and broadcasting.", notes: {
      python: "Operators work element by element with no loop. `axis=0` goes down the columns, `axis=1` along the rows. Broadcasting stretches a smaller array, such as a bias, across the bigger one.",
    } },
    { id: "gx-similarity", title: "Embeddings and cosine similarity", idea: "Retrieval in RAG scores every document embedding against the query embedding and keeps the best few. Normalise once, then one matrix product scores them all.", notes: {
      python: "Cosine similarity is the dot product of unit vectors. `np.argsort(-scores)[:k]` gives the top k indexes, best first. Convert NumPy numbers with `float()` before printing or saving.",
    } },
    { id: "gx-softmax", title: "Softmax, temperature and top-k", idea: "A model outputs logits; softmax turns them into probabilities. Temperature sharpens or flattens them, and top-k keeps only the best tokens before sampling.", notes: {
      python: "Subtract the max before `np.exp`, or large logits overflow to infinity. Dividing by a temperature below 1 sharpens the distribution. Setting a logit to `-np.inf` gives that token probability 0.",
    } },
    { id: "gx-decorators", title: "Decorators: retry and cache", idea: "API calls fail with rate limits, and the same text gets embedded twice. A decorator wraps a function to add retries or caching without changing it.", notes: {
      python: "A decorator with arguments is a function that returns a decorator. `functools.wraps` keeps the wrapped function's name. `lru_cache` needs hashable arguments, so pass tuples, not lists.",
    } },
    { id: "gx-context", title: "Context managers", idea: "Tracing a step of a pipeline, holding a connection or tracking a token budget: set up, run the body, and always clean up, even when the body fails.", notes: {
      python: "With `@contextmanager`, code before `yield` is the set-up and the `finally` block is the clean-up. A class version uses `__enter__` and `__exit__`; returning True from `__exit__` hides the error.",
    } },
    { id: "gx-tools", title: "Tool registries, *args and **kwargs", idea: "An agent receives a tool name and arguments from the model. Keep tools in a dict of functions, look the name up, and call the function with the arguments unpacked.", notes: {
      python: "Functions are values, so a dict can map names to them. `fn(**args)` passes a dict as keyword arguments. `*args` collects extra positional arguments and `**kwargs` extra named ones. `TypedDict` describes a dict's keys.",
    } },
  ] },
  { title: "React", langs: ["js", "ts"], play: "react", topics: [
    { id: "rx-jsx", title: "Components and JSX", idea: "A component is a function that returns JSX, which looks like HTML. Build pages by putting components inside components.", notes: {
      js: "Component names start with a capital letter. Write `className`, not `class`. Braces hold any expression, and a component returns one root element.",
      ts: "Write the props type after the parameter. A `.tsx` file allows JSX in TypeScript.",
    } },
    { id: "rx-props", title: "Props, defaults and children", idea: "Props pass data from a parent to a child. `children` is whatever you put between the opening and closing tags.", notes: {
      js: "Destructure props in the parameter list and give defaults there. Props are read-only: never change them in the child.",
      ts: "Describe props with a type; `?` makes one optional and a union like `\"easy\" | \"medium\"` limits the values. `ReactNode` is the type for children.",
    } },
    { id: "rx-state", title: "State with useState", idea: "State is data that changes, and changing it re-renders the component. The preview is live: click the buttons.", notes: {
      js: "Use the updater form `setCount((c) => c + 1)` when the new value depends on the old one. Never change an array in place: make a new one with `[...items, x]`.",
      ts: "The type is inferred from the first value; give it with `useState<string[]>(...)` when it starts empty or null.",
    } },
    { id: "rx-lists", title: "Lists and keys", idea: "Render a list with `map`, filter first if needed, and give every item a stable `key` so React can track it between renders.", notes: {
      js: "Use an id from the data as the key. The index is a bad key when items can be added, removed or reordered.",
      ts: "Type the data once (`Problem[]`) and every `p.` in the `map` is checked.",
    } },
    { id: "rx-conditional", title: "Conditional rendering", idea: "Show or hide parts with `&&`, choose between two with the ternary, or return `null` to render nothing.", notes: {
      js: "`{count && <X />}` renders a 0 when count is 0, as the last line shows. Write `{count > 0 && <X />}` instead.",
      ts: "The same trap exists: TypeScript allows a number before `&&`.",
    } },
    { id: "rx-forms", title: "Events and controlled inputs", idea: "A controlled input takes its value from state and updates state on every change, so React always knows what is typed. Type a task in the preview and press Add.", notes: {
      js: "Call `e.preventDefault()` in `onSubmit`, or the browser reloads the page. An input with `value` and no `onChange` cannot be typed in.",
      ts: "Event types come from React: `FormEvent<HTMLFormElement>` and `ChangeEvent<HTMLInputElement>`; `e.target.value` is then a string.",
    } },
    { id: "rx-effects", title: "useEffect and cleanup", idea: "Effects run after the component appears on screen: timers, subscriptions and fetching data. Return a cleanup function to undo them.", notes: {
      js: "The dependency array decides when the effect runs again; `[]` means once. A missing cleanup leaves timers running after the component is gone. The HTML below is the first render, before any effect runs.",
      ts: "Give state that starts as null its full type: `useState<string[] | null>(null)`.",
    } },
    { id: "rx-memo", title: "useMemo and useRef", idea: "`useMemo` keeps a costly result until its inputs change. `useRef` holds a value that survives re-renders without causing one, such as a DOM element to focus.", notes: {
      js: "Typing in the note re-renders but does not recompute the primes. Measure before reaching for `useMemo`; most components do not need it.",
      ts: "`useRef<HTMLInputElement>(null)` is null until React attaches the element, so use `input.current?.focus()`.",
    } },
    { id: "rx-context", title: "Context", idea: "Context passes a value, such as the theme or the signed-in user, to every component below without threading props through each level.", notes: {
      js: "A component reads the nearest provider above it, or the default from `createContext` when there is none. In React 19 the context itself is the provider; older code writes `<ThemeContext.Provider>`.",
      ts: "Type the context once with `createContext<Theme>(...)`; every `useContext` then returns that type.",
    } },
    { id: "rx-custom-hooks", title: "Custom hooks", idea: "Move stateful logic into a function whose name starts with `use`, and reuse it in any component.", notes: {
      js: "Hooks are called at the top level of a component or another hook, never inside a condition or loop, so they run in the same order every render.",
      ts: "Return a pair `as const`, or TypeScript widens it to an array of either type.",
    } },
    { id: "rx-reducer", title: "useReducer", idea: "When state has several parts that change together, put every change in one reducer function and send actions to it.", notes: {
      js: "A reducer returns a new state object and never changes the old one. Throw on an unknown action so typos show up.",
      ts: "Actions as a union of types: inside each `case`, TypeScript knows which fields exist, and the `never` line fails to compile if a case is missing.",
    } },
  ] },
  { title: "Node.js", langs: ["js", "ts"], play: "node", topics: [
    { id: "nd-modules", title: "Built-in modules: path, URL and util", idea: "Node ships modules for paths, URLs and formatting. Import them with the `node:` prefix and export your own values with `export`.", notes: {
      js: "Build paths with `join`, never by adding strings with \"/\". `URLSearchParams` handles repeated keys and encoding.",
      ts: "Node's types come from `@types/node`; the same imports are fully typed.",
    } },
    { id: "nd-fs", title: "Files with fs/promises", idea: "Read and write files with promises: JSON settings, logs and uploads. Handle the file that is not there.", notes: {
      js: "Pass `\"utf8\"` to get a string instead of a Buffer. A missing file throws an error with `code === \"ENOENT\"`.",
      ts: "`JSON.parse` returns `any`, so say what you expect with `as Progress`. A caught error is `unknown` in strict mode: cast it before reading `.code`.",
    } },
    { id: "nd-events", title: "EventEmitter", idea: "Much of Node is built on events: streams, servers and processes. Emit named events with values, and listen with `on` or `once`.", notes: {
      js: "`once` removes the listener after one call. `events.once` turns the next event into a promise you can await.",
      ts: "`EventEmitter<Events>` checks event names and the arguments of every `emit` and listener.",
    } },
    { id: "nd-event-loop", title: "The event loop order", idea: "Inside a callback, Node runs synchronous code, then `process.nextTick`, then promise callbacks, then the check phase (`setImmediate`), then the next timers.", notes: {
      js: "At the top level of an ES module, promises run before nextTick, and the order of `setTimeout(0)` and `setImmediate` is not fixed. That is why this example starts inside a timer.",
      ts: "Types change nothing here: the order is the same.",
    } },
    { id: "nd-promises", title: "Promise.all, allSettled, race and timeouts", idea: "Run independent work at once and combine it: all must succeed, collect every result, or take the first to finish.", notes: {
      js: "`Promise.all` rejects as soon as one fails; `allSettled` never rejects. A timeout is a race against a promise that rejects.",
      ts: "`Promise.all` keeps each result's type: `[string, number]` here. Generic arrow functions in a `.ts` file are written `<T,>(...)`.",
    } },
    { id: "nd-process", title: "process: arguments, environment and exit", idea: "A Node program reads command-line arguments and environment variables, and reports success or failure with its exit code.", notes: {
      js: "Environment values are strings or undefined: convert with `Number` and give a default. Set `process.exitCode` instead of calling `process.exit()`, which cuts off pending work.",
      ts: "`process.env.X` is `string | undefined`, so the compiler makes you handle the missing case.",
    } },
    { id: "nd-express", title: "Express: routes, params and JSON", idea: "A small REST API: list, read one by id, and create, with the right status codes. The program calls its own server with `fetch`.", notes: {
      js: "`express.json()` fills `req.body`. Route params are strings, so convert them. Use `return res...` to stop after sending an error.",
      ts: "`Request<Params, ResBody, ReqBody>` types the params and body. Handlers return nothing, so send the response and then `return;`.",
    } },
    { id: "nd-middleware", title: "Express middleware and error handling", idea: "Middleware runs in order for each request: logging, authentication, then the route. A handler with four arguments catches errors.", notes: {
      js: "Call `next()` to continue, or send a response to stop. Express 5 passes errors thrown in async handlers to the error handler; Express 4 needed `next(err)`.",
      ts: "`Request`, `Response` and `NextFunction` come from `express`; the error handler's first parameter is the error.",
    } },
  ] },
];
