import type { Subject } from "./types";

export const OS: Subject = {
  id: "os",
  name: "Operating Systems",
  short: "OS",
  blurb: "Processes and threads, scheduling, synchronization, deadlock, memory, virtual memory and storage. The OS round checks whether you understand what the machine does between your code and the hardware.",
  chapters: [
    {
      id: "process",
      title: "Programs, processes and threads",
      summary: "A **program** is a file on disk. A **process** is that program running: it has its own memory, open files and at least one thread. A **thread** is one path of execution inside a process; threads of the same process share its memory.",
      points: [
        "Process memory, low to high address: text (code), data (globals), heap (grows up), stack (grows down).",
        "The OS tracks each process in a **PCB** (process control block): PID, state, program counter, registers, memory maps, open files, scheduling info.",
        "Threads share code, heap, globals and files, but each has its own stack, registers and program counter.",
      ],
      diagram: `flowchart LR
  subgraph P["One process"]
    direction TB
    T["text: code"] --- D["data: globals"] --- H["heap: new / malloc, grows up"] --- S1["stack of thread 1"] --- S2["stack of thread 2"]
  end
  PCB[("PCB: pid, state, PC,<br/>registers, page table,<br/>open files")] -.-> P`,
      caption: "Threads share everything in the process except their stacks and registers.",
      cards: [
        { id: "proc-vs-thread", q: "Process vs thread: what is the difference?", a: "A process is an independent program in execution with its own address space. A thread is a unit of execution inside a process.\n\n- Threads share the process's memory, so they communicate cheaply but need locks.\n- Processes are isolated: a crash in one does not corrupt another, but communication needs IPC.\n- Creating and switching threads is cheaper than processes because the address space stays the same.",
          table: { head: ["", "Process", "Thread"], rows: [["Memory", "own address space", "shared with its process"], ["Creation cost", "high (copy page tables)", "low"], ["Communication", "IPC: pipes, sockets, shared memory", "shared variables"], ["Crash impact", "isolated", "can bring down the whole process"]] },
          trap: "Saying threads have no memory of their own. Each thread has its own **stack** and registers." },
        { id: "pcb", q: "What does the OS store in a PCB, and when is it used?", a: "The PCB holds everything needed to stop a process and resume it later: process ID, state, program counter, CPU registers, scheduling priority, memory-management info (page table pointer) and the list of open files. On a context switch the kernel saves the running process's registers into its PCB and loads the next process's registers from its PCB." },
        { id: "fork", q: "What does fork() return, and what does the child inherit?", a: "`fork()` creates a copy of the calling process. It returns the child's PID in the parent, 0 in the child, and -1 on failure. The child gets a copy of the parent's memory (shared copy-on-write until either writes), open file descriptors and environment. `exec()` then replaces the child's program with a new one.",
          code: { text: "pid_t pid = fork();\nif (pid == 0)      { /* child  */ execlp(\"ls\", \"ls\", NULL); }\nelse if (pid > 0)  { /* parent */ wait(NULL); }\nelse               { perror(\"fork\"); }", file: "fork + exec (C)" },
          trap: "fork() followed by n more forks makes 2^n processes, not n + 1." },
        { id: "user-kernel", q: "User mode vs kernel mode, and what is a system call?", a: "The CPU runs applications in **user mode**, where privileged instructions (talking to devices, changing page tables) are forbidden. The kernel runs in **kernel mode** with full access. A **system call** (read, write, fork, mmap) is a controlled trap from user mode into the kernel: arguments go in registers, the CPU switches mode, the kernel does the work and returns. This boundary is what stops one program from corrupting the machine." },
      ],
    },
    {
      id: "states",
      title: "Process states and context switching",
      summary: "A process moves between a few states as it runs, waits for I/O and gets preempted. The scheduler picks which ready process runs next; the dispatcher performs the switch.",
      diagram: `stateDiagram-v2
  [*] --> New
  New --> Ready: admitted
  Ready --> Running: scheduler dispatch
  Running --> Ready: interrupt or time slice over
  Running --> Waiting: I/O or event wait
  Waiting --> Ready: I/O done
  Running --> Terminated: exit
  Terminated --> [*]`,
      caption: "The five-state model. Only one process per CPU core is Running at a time.",
      cards: [
        { id: "ctx-switch", q: "What happens in a context switch, and why is it costly?", a: "The kernel saves the current process's registers and program counter into its PCB, picks the next process, loads its saved state, and switches the memory map. The direct cost is small, but the indirect cost is large: caches and the TLB are full of the old process's data, so the new one starts with many misses. Switching between threads of the same process is cheaper because the address space does not change." },
        { id: "zombie", q: "Zombie vs orphan process?", a: "A **zombie** has finished but its parent has not yet called `wait()` to read its exit status, so its PCB entry remains. An **orphan** is still running but its parent has exited; it is adopted by init (PID 1), which reaps it when it ends.",
          trap: "Zombies use no CPU or memory, only a process-table slot, but many of them can exhaust PIDs." },
        { id: "schedulers", q: "Long-term, short-term and medium-term schedulers?", a: "- **Long-term** (job scheduler): decides which jobs enter memory, controlling the degree of multiprogramming.\n- **Short-term** (CPU scheduler): picks the next ready process, runs very often.\n- **Medium-term**: swaps processes out to disk and back to reduce memory pressure." },
      ],
    },
    {
      id: "scheduling",
      title: "CPU scheduling",
      summary: "When several processes are ready, the scheduler decides who runs. Good scheduling balances throughput, waiting time, response time and fairness.",
      points: [
        "Turnaround time = completion − arrival. Waiting time = turnaround − burst. Response time = first run − arrival.",
        "**Preemptive** algorithms (SRTF, round robin, preemptive priority) can take the CPU away; non-preemptive ones (FCFS, SJF) cannot.",
      ],
      table: { head: ["Algorithm", "Picks", "Strength", "Weakness"], rows: [
        ["FCFS", "earliest arrival", "simple, fair order", "convoy effect: short jobs wait behind long ones"],
        ["SJF", "shortest burst", "minimum average waiting (non-preemptive)", "needs burst lengths; long jobs can starve"],
        ["SRTF", "shortest remaining time", "optimal average waiting (preemptive)", "many switches; starvation"],
        ["Round robin", "next in a queue, for one quantum", "good response time, fair", "too small a quantum wastes time switching"],
        ["Priority", "highest priority", "important work first", "starvation, fixed by aging"],
        ["MLFQ", "several queues; demote CPU-heavy jobs", "adapts without knowing bursts", "many knobs to tune"],
      ] },
      lab: "scheduling",
      cards: [
        { id: "rr-quantum", q: "How do you choose the round-robin time quantum?", a: "Large enough that most interactive bursts finish within one quantum, small enough that response time stays low. If the quantum is huge, RR becomes FCFS. If it is tiny, the CPU spends most of its time context switching. A common rule of thumb: about 80% of CPU bursts should be shorter than the quantum." },
        { id: "starvation", q: "What is starvation and how does aging fix it?", a: "Starvation is when a ready process waits indefinitely because others always win (low priority under priority scheduling, long jobs under SJF). **Aging** gradually raises the priority of processes that have waited long, so every process eventually runs." },
        { id: "sjf-optimal", q: "Why is SJF optimal for average waiting time, and why is it rarely used directly?", a: "Running a short job before a long one reduces the short job's wait by a lot and increases the long job's wait by a little, so ordering by length minimises the sum (an exchange argument). The catch: the OS does not know future burst lengths. Real schedulers estimate them, for example with an exponential average of past bursts: τₙ₊₁ = α·tₙ + (1 − α)·τₙ." },
        { id: "mlfq", q: "How does a multilevel feedback queue work?", a: "Several queues with different priorities and quanta. New jobs start in the top queue. A job that uses its whole quantum is CPU-heavy and moves down; a job that gives up the CPU early (waiting for I/O) stays high. Lower queues get longer quanta. Periodically all jobs are boosted to the top so none starve. It approximates SJF without knowing burst lengths." },
      ],
    },
    {
      id: "sync",
      title: "Synchronization",
      summary: "When threads share data, the result can depend on timing: a **race condition**. The code that touches shared data is the **critical section**, and only one thread may be inside it at a time.",
      points: [
        "A correct solution needs **mutual exclusion**, **progress** (if nobody is inside, someone waiting gets in) and **bounded waiting** (no thread waits forever).",
        "`count++` is three steps (load, add, store), so two threads can both read 5 and both write 6.",
      ],
      diagram: `sequenceDiagram
  participant A as Thread A
  participant M as count (shared)
  participant B as Thread B
  A->>M: load 5
  B->>M: load 5
  A->>M: store 6
  B->>M: store 6
  Note over A,B: two increments, count went up by one`,
      caption: "A race condition: the lost update.",
      code: {
        file: "Counter.java / counter.cpp: a lock makes count++ safe",
        java: `public class Counter {
    private int count = 0;
    private synchronized void inc() { count++; }   // one thread at a time

    public static void main(String[] args) throws InterruptedException {
        Counter c = new Counter();
        Runnable work = () -> { for (int i = 0; i < 100_000; i++) c.inc(); };
        Thread a = new Thread(work), b = new Thread(work);
        a.start(); b.start(); a.join(); b.join();
        System.out.println(c.count);                  // always 200000
    }
}`,
        cpp: `#include <iostream>
#include <mutex>
#include <thread>

int count = 0;
std::mutex m;

void work() {
    for (int i = 0; i < 100000; i++) {
        std::lock_guard<std::mutex> lock(m);   // unlocked automatically at the end of the block
        count++;
    }
}

int main() {
    std::thread a(work), b(work);
    a.join(); b.join();
    std::cout << count << "\\n";               // always 200000
}`,
      },
      cards: [
        { id: "mutex-sem", q: "Mutex vs semaphore?", a: "A **mutex** is a lock with an owner: the thread that locks it must unlock it, and it protects one critical section. A **semaphore** is a counter with `wait()` (decrement, block at 0) and `signal()` (increment). A counting semaphore lets up to N threads in (for example N database connections) and can be signalled by a different thread, so it is also used for signalling between threads.",
          trap: "A binary semaphore is not the same as a mutex: it has no owner, so any thread can release it and priority inheritance does not apply." },
        { id: "prod-cons", q: "Solve producer-consumer with semaphores.", a: "Use a bounded buffer and three semaphores: `empty` (starts at N, free slots), `full` (starts at 0, filled slots) and `mutex` (starts at 1, protects the buffer).",
          code: { text: "producer:                 consumer:\n  wait(empty)               wait(full)\n  wait(mutex)               wait(mutex)\n  put item                  take item\n  signal(mutex)             signal(mutex)\n  signal(full)              signal(empty)", file: "pseudocode" },
          trap: "Swapping wait(empty) and wait(mutex) in the producer can deadlock: the producer holds the mutex while sleeping on a full buffer, so the consumer can never take an item." },
        { id: "spinlock", q: "When is a spinlock better than a blocking lock?", a: "A spinlock busy-waits in a loop instead of sleeping. It wins when the lock is held for a very short time on a multi-core machine, because sleeping and waking costs two context switches. On a single core, or for long critical sections, spinning just burns CPU." },
        { id: "monitor", q: "What is a monitor?", a: "A language-level construct that bundles shared data with the procedures that use it and guarantees only one thread runs inside at a time. Condition variables (`wait`, `notify`) let a thread sleep until some condition holds. Java's `synchronized` methods with `wait()`/`notify()` are a monitor." },
        { id: "dining", q: "Dining philosophers: what goes wrong and how do you fix it?", a: "Five philosophers each need the forks on both sides. If all pick up their left fork at once, each waits forever for the right one: deadlock. Fixes: make one philosopher pick up the right fork first (break circular wait), allow at most four at the table, or pick up both forks only when both are free." },
      ],
    },
    {
      id: "deadlock",
      title: "Deadlock",
      summary: "A set of processes is deadlocked when each holds a resource and waits for one held by another in the set, so none can proceed.",
      points: [
        "Four conditions must **all** hold (Coffman): mutual exclusion, hold and wait, no preemption, circular wait.",
        "Handle it by **prevention** (break a condition), **avoidance** (Banker's algorithm keeps the system in a safe state), **detection and recovery**, or ignoring it (most desktop OSes).",
      ],
      diagram: `flowchart LR
  P1(["P1"]) -->|"waits for"| R2["R2"]
  R2 -->|"held by"| P2(["P2"])
  P2 -->|"waits for"| R1["R1"]
  R1 -->|"held by"| P1`,
      caption: "A resource-allocation graph with a cycle. With one instance per resource, a cycle means deadlock.",
      lab: "banker",
      cards: [
        { id: "coffman", q: "Name the four deadlock conditions and one way to break each.", a: "- **Mutual exclusion**: make resources shareable (read-only files). Often impossible.\n- **Hold and wait**: request all resources at once.\n- **No preemption**: if a request fails, release what you hold and retry.\n- **Circular wait**: number the resources and always acquire them in increasing order. This is the most practical fix." },
        { id: "safe-state", q: "What is a safe state in the Banker's algorithm?", a: "A state is safe if there is some order in which every process can get its remaining maximum need from what is available plus what earlier processes release. A safe state cannot deadlock. An unsafe state may deadlock, so the Banker's algorithm grants a request only if the state after granting it is still safe.",
          trap: "Unsafe does not mean deadlocked. It means deadlock is possible if processes ask for their maximum." },
        { id: "starve-live", q: "Deadlock vs starvation vs livelock?", a: "- **Deadlock**: everyone waits; nothing changes.\n- **Starvation**: the system progresses, but one process never gets its turn.\n- **Livelock**: processes keep changing state in reaction to each other (two people stepping aside in a corridor) but no useful work happens." },
        { id: "cycle", q: "Does a cycle in a resource-allocation graph always mean deadlock?", a: "Only if every resource has a single instance. With multiple instances, a cycle is necessary but not sufficient: another process outside the cycle might release an instance and break it. Detection then uses a Banker-like algorithm instead of cycle search." },
      ],
    },
    {
      id: "memory",
      title: "Memory management: paging and segmentation",
      summary: "The OS gives every process the illusion of its own contiguous memory. **Paging** cuts virtual memory into fixed-size pages and physical memory into frames of the same size; a page table maps one to the other.",
      points: [
        "A virtual address splits into a page number and an offset. The page number indexes the page table; the frame number plus the same offset is the physical address.",
        "**Internal fragmentation**: unused space inside an allocated block (the last page). **External fragmentation**: free memory scattered in holes too small to use. Paging removes external fragmentation.",
        "The **TLB** is a small cache of recent page-table entries, so most translations skip the page-table memory access.",
      ],
      diagram: `flowchart LR
  VA["virtual address<br/>page 3 · offset 0x1A4"] --> TLB{"TLB hit?"}
  TLB -->|"yes"| PA["physical address<br/>frame 7 · offset 0x1A4"]
  TLB -->|"no"| PT["page table in memory<br/>entry 3 → frame 7"]
  PT --> PA
  PT -.->|"not present"| PF["page fault → OS loads page"]`,
      caption: "Address translation with a TLB. The offset never changes; only the page number is translated.",
      cards: [
        { id: "paging-seg", q: "Paging vs segmentation?", a: "Paging splits memory into equal fixed-size pages, invisible to the programmer: no external fragmentation, some internal fragmentation. Segmentation splits it into variable-size logical units (code, stack, heap) with a base and limit each: matches how programs are organised and helps protection, but suffers external fragmentation. Some systems combine them (segments made of pages)." },
        { id: "pt-size", q: "32-bit addresses, 4 KB pages, 4-byte entries: how big is a single-level page table?", a: "4 KB = 2¹² bytes, so the offset is 12 bits and the page number 20 bits: 2²⁰ ≈ 1 million entries × 4 bytes = **4 MB per process**. That is why real systems use multi-level page tables (only the parts in use are allocated) or inverted page tables." },
        { id: "eat", q: "How do you compute effective memory access time with a TLB?", a: "With hit ratio h, TLB lookup time t and memory access time m (single-level page table):\n\nEAT = h·(t + m) + (1 − h)·(t + 2m)\n\nExample: h = 0.9, t = 10 ns, m = 100 ns gives 0.9·110 + 0.1·210 = 120 ns." },
        { id: "frag", q: "Internal vs external fragmentation, with examples?", a: "Internal: a process needs 13 KB and gets four 4 KB pages, wasting 3 KB inside the last page. External: 50 MB is free in total, but in 5 MB holes, so a 20 MB request fails. Fix external fragmentation with compaction or paging; reduce internal fragmentation with smaller pages (at the cost of bigger page tables)." },
      ],
    },
    {
      id: "virtual",
      title: "Virtual memory and page replacement",
      summary: "With **demand paging**, a page is loaded only when first used. Touching a page that is not in memory causes a **page fault**; if no frame is free, the OS must evict a page, and the replacement policy decides which.",
      diagram: `flowchart TB
  A["CPU touches page 5"] --> B{"in memory?"}
  B -->|"yes"| C["read via TLB / page table"]
  B -->|"no: page fault"| D["OS: is the address valid?"]
  D -->|"no"| X["segmentation fault"]
  D -->|"yes"| E{"free frame?"}
  E -->|"no"| F["pick victim (FIFO / LRU / clock),<br/>write back if dirty"]
  E -->|"yes"| G["read page from disk"]
  F --> G
  G --> H["update page table, restart instruction"]`,
      caption: "What the OS does on a page fault.",
      points: [
        "Page fault steps: trap to the OS, check the access is valid, find a free frame (evicting if needed, writing it back if dirty), read the page from disk, update the page table, restart the instruction.",
        "**Thrashing**: the working sets of running processes do not fit in memory, so the system spends its time paging instead of working. Fix: run fewer processes or give them more frames.",
      ],
      lab: "paging",
      cards: [
        { id: "belady", q: "What is Belady's anomaly?", a: "With FIFO replacement, giving a process more frames can sometimes cause **more** page faults. For the string 1 2 3 4 1 2 5 1 2 3 4 5, FIFO makes 9 faults with 3 frames and 10 with 4. LRU and Optimal are stack algorithms (the pages kept with n frames are always a subset of those kept with n + 1), so they never show it." },
        { id: "lru-impl", q: "How would you implement LRU, exactly and approximately?", a: "Exactly: a hash map from page to a node in a doubly linked list; move a page to the front on every access and evict from the back, all O(1). Hardware cannot afford that on every memory access, so OSes approximate it with a **reference bit**: the clock (second-chance) algorithm sweeps frames in a circle, clearing set bits and evicting the first page whose bit is already 0." },
        { id: "working-set", q: "What is the working set model?", a: "The working set is the set of pages a process used in the last Δ references. If the sum of all working sets exceeds available frames, the OS suspends a process instead of letting everyone thrash. Page-fault frequency control is a simpler variant: give a process more frames when its fault rate is high, take some away when it is low." },
        { id: "dirty", q: "Why does a dirty bit matter on eviction?", a: "If the page was not modified since it was loaded, the copy on disk is still valid and the frame can be reused immediately. A dirty page must be written back first, which doubles the I/O. Replacement algorithms prefer clean victims when they can." },
      ],
    },
    {
      id: "storage",
      title: "File systems and disk scheduling",
      summary: "A file system maps names to data blocks on disk. On Unix, a file's metadata and block pointers live in an **inode**; a directory is just a table of (name → inode number).",
      diagram: `flowchart LR
  D["directory entry<br/>'notes.txt' → inode 42"] --> I["inode 42<br/>size, owner, permissions,<br/>timestamps, link count"]
  I --> B1["direct block pointers"]
  I --> B2["single indirect"]
  I --> B3["double indirect"]
  B1 --> DATA["data blocks"]
  B2 --> DATA
  B3 --> DATA`,
      caption: "Names live in directories; everything else about a file lives in its inode.",
      table: { head: ["Disk scheduling", "How it moves the head", "Note"], rows: [
        ["FCFS", "in request order", "fair, lots of seeking"],
        ["SSTF", "nearest request next", "less seeking, can starve far requests"],
        ["SCAN (elevator)", "sweep to one end, reverse", "bounded wait"],
        ["C-SCAN", "sweep one way, jump back to start", "more uniform wait times"],
        ["LOOK / C-LOOK", "like SCAN / C-SCAN but turn at the last request", "skips empty travel"],
      ] },
      cards: [
        { id: "links", q: "Hard link vs soft (symbolic) link?", a: "A **hard link** is another directory entry pointing to the same inode: same file, and the data survives until the last link is removed. It cannot cross file systems or point to directories. A **soft link** is a small file containing a path: it can point anywhere, but breaks if the target is moved or deleted." },
        { id: "alloc", q: "Contiguous, linked and indexed file allocation?", a: "- **Contiguous**: fast sequential and random access, but external fragmentation and files cannot grow easily.\n- **Linked**: each block points to the next; no fragmentation, but random access is slow and one bad pointer loses the rest (FAT keeps the links in a table).\n- **Indexed**: an index block (inode) lists all block addresses; good random access, small overhead per file." },
        { id: "ssd", q: "Do disk scheduling algorithms matter for SSDs?", a: "Much less. SSDs have no moving head, so seek order barely matters; their controllers handle internal parallelism and wear levelling. Linux typically uses a simple scheduler (none or mq-deadline) for SSDs and reserves elevator-style ordering for spinning disks." },
      ],
    },
    {
      id: "ipc",
      title: "Inter-process communication",
      summary: "Processes are isolated, so they need the kernel's help to talk. The two families are **shared memory** (fast, needs synchronization) and **message passing** (simpler, more copying).",
      diagram: `flowchart LR
  subgraph SM["Shared memory"]
    direction LR
    A1["process A"] -->|"write"| M[("shared pages")]
    M -->|"read"| B1["process B"]
  end
  subgraph MP["Message passing"]
    direction LR
    A2["process A"] -->|"send()"| K["kernel queue"]
    K -->|"receive()"| B2["process B"]
  end`,
      caption: "Shared memory skips the kernel after setup; message passing copies through it every time.",
      table: { head: ["Mechanism", "Shape", "Typical use"], rows: [
        ["Pipe", "one-way byte stream between related processes", "shell pipelines: ls | grep"],
        ["Named pipe (FIFO)", "pipe with a name in the file system", "unrelated processes on one machine"],
        ["Message queue", "kernel-managed queue of typed messages", "decoupled producers and consumers"],
        ["Shared memory", "the same physical pages mapped into both", "large data, lowest latency"],
        ["Socket", "bidirectional stream or datagram", "between machines, or local via Unix sockets"],
        ["Signal", "asynchronous notification number", "SIGINT, SIGTERM, SIGCHLD"],
      ] },
      cards: [
        { id: "shm-vs-msg", q: "Shared memory vs message passing: which is faster and why?", a: "Shared memory, because after setup the kernel is not involved: processes read and write the same pages directly. Message passing needs a system call and a copy per message. The price of shared memory is that you must add your own synchronization (semaphores or mutexes in the shared region)." },
        { id: "signals", q: "What happens when you press Ctrl+C in a terminal?", a: "The terminal driver sends SIGINT to the foreground process group. If the process installed a handler, it runs; otherwise the default action terminates the process. SIGKILL and SIGSTOP cannot be caught or ignored." },
      ],
    },
  ],
};
