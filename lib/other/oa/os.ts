import { bankerSafety, pageReplace, schedule } from "../sim.ts";
import type { OaSubject } from "../types.ts";
import { concept, numeric } from "./make.ts";

const REFS = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], REF_TEXT = REFS.join(", ");
const faults = (algo: "fifo" | "lru" | "opt", refs = REFS, frames = 3) => pageReplace(refs, frames, algo).faults;
const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
const PROCS = [{ id: "P1", arrival: 0, burst: 7, priority: 1 }, { id: "P2", arrival: 2, burst: 4, priority: 1 }, { id: "P3", arrival: 4, burst: 1, priority: 1 }, { id: "P4", arrival: 5, burst: 4, priority: 1 }];
const PROC_TEXT = "P1 (arrives 0, burst 7), P2 (2, 4), P3 (4, 1), P4 (5, 4)";
const wait = (algo: "fcfs" | "sjf" | "srtf") => schedule(PROCS, algo).avgWait;
const CONVOY = [24, 3, 3].map((burst, i) => ({ id: `P${i + 1}`, arrival: 0, burst, priority: 1 }));
const RR = [5, 3, 1].map((burst, i) => ({ id: `P${i + 1}`, arrival: 0, burst, priority: 1 }));
const need = bankerSafety([2, 1, 1], [[5, 3, 2], [3, 2, 2]], [[1, 1, 0], [2, 0, 1]]).need[0].join(", ");
const QUEUE = [98, 183, 37, 122, 14, 124, 65, 67], QUEUE_TEXT = QUEUE.join(", ");
const fcfsSeek = () => QUEUE.reduce((s, c, i) => s + Math.abs(c - (i ? QUEUE[i - 1] : 53)), 0);
const sstfSeek = () => { let at = 53, sum = 0; const left = [...QUEUE]; while (left.length) { const c = left.reduce((a, b) => (Math.abs(b - at) < Math.abs(a - at) ? b : a)); sum += Math.abs(c - at); at = c; left.splice(left.indexOf(c), 1); } return sum; };

export const OA_OS: OaSubject = {
  id: "os", name: "Operating Systems",
  questions: [
    numeric("fifo", `Reference string: ${REF_TEXT}. With 3 frames and FIFO, how many page faults occur?`, faults("fifo"), [faults("lru"), faults("opt"), 20], "FIFO evicts the page loaded first, even if it is in heavy use, so it faults more than LRU on this string."),
    numeric("lru", `Reference string: ${REF_TEXT}. With 3 frames and LRU, how many page faults occur?`, faults("lru"), [faults("fifo"), faults("opt"), 10], "LRU evicts the page unused for the longest time. Trace the frames and count every miss, including the first three."),
    numeric("opt", `Reference string: ${REF_TEXT}. With 3 frames and the optimal algorithm, how many page faults occur?`, faults("opt"), [faults("fifo"), faults("lru"), 7], "Optimal evicts the page used farthest in the future. It sets the lower bound for any algorithm, but needs knowledge of future references."),
    numeric("belady", `Reference string: ${BELADY.join(", ")}. FIFO gives ${faults("fifo", BELADY, 3)} faults with 3 frames. How many with 4 frames?`, faults("fifo", BELADY, 4), [8, faults("fifo", BELADY, 3), 7], "More frames gave more faults here. This is Belady's anomaly."),
    numeric("sjf", `${PROC_TEXT}. What is the average waiting time under non-preemptive SJF?`, wait("sjf"), [wait("fcfs"), wait("srtf"), 5.5], "Run order is P1, P3, P2, P4. Waits are 0, 3, 6 and 7, and the average is their sum divided by 4."),
    numeric("srtf", `${PROC_TEXT}. What is the average waiting time under preemptive SJF (SRTF)?`, wait("srtf"), [wait("sjf"), wait("fcfs"), 2], "Each arrival can preempt the running process when its burst is shorter than the remaining time. SRTF gives the lowest average wait."),
    numeric("convoy", "P1, P2 and P3 arrive at time 0 in that order, with bursts 24, 3 and 3. What is the average waiting time under FCFS?", schedule(CONVOY, "fcfs").avgWait, [schedule(CONVOY, "sjf").avgWait, 27, 9], "Waits are 0, 24 and 27. One long job holds up the short ones. This is the convoy effect."),
    numeric("rr", "P1, P2 and P3 arrive at time 0 in that order, with bursts 5, 3 and 1. Round robin with quantum 2. When does P2 complete?", schedule(RR, "rr").stats[1].completion, [7, 9, 5], "The order is P1 0-2, P2 2-4, P3 4-5, P1 5-7, P2 7-8, P1 8-9."),
    numeric("need", "In the Banker's algorithm, P0 has Max (5, 3, 2) and Allocation (1, 1, 0). What is its Need?", need, ["6, 4, 2", "5, 3, 2", "1, 1, 0"], "Need = Max - Allocation, for each resource."),
    numeric("fork-lines", "A process calls `fork(); fork(); fork();` and then `printf(\"x\");` with a flush. How many times does x print?", 2 ** 3, [3, 4, 7], "Each fork doubles the number of processes, so n forks give 2^n processes and all of them print."),
    numeric("fork-children", "A process calls `fork()` three times in a row. How many new processes are created?", 2 ** 3 - 1, [3, 8, 6], "There are 2^n processes in total, and one of them is the original, so 2^n - 1 are new."),
    numeric("page-entries", "A 32-bit logical address space uses 4 KB pages. How many entries does a flat page table have?", `2^${32 - 12}`, ["2^12", "2^32", "2^22"], "4 KB takes 12 offset bits. The remaining 20 bits select the page."),
    numeric("translate", "Page size is 4096 bytes. For logical address 8196, what are the page number and offset?", `page ${Math.floor(8196 / 4096)}, offset ${8196 % 4096}`, ["page 1, offset 4100", "page 2, offset 0", "page 4, offset 2"], "Page = address div page size, and offset = address mod page size."),
    numeric("eat", "TLB lookup takes 20 ns, memory access takes 100 ns, and the TLB hit rate is 80%. What is the effective access time with a one-level page table?", 0.8 * 120 + 0.2 * 220, [120, 220, 116], "A hit costs 20 + 100 = 120 ns. A miss costs 20 + 100 + 100 = 220 ns. Weight them by hit rate.", " ns"),
    numeric("seek-fcfs", `Disk head at 53. Queue: ${QUEUE_TEXT}. Total head movement under FCFS?`, fcfsSeek(), [sstfSeek(), 299, 382], "Add the distance between each request and the one before it, in queue order."),
    numeric("seek-sstf", `Disk head at 53. Queue: ${QUEUE_TEXT}. Total head movement under SSTF?`, sstfSeek(), [fcfsSeek(), 208, 299], "Always go to the nearest request: 65, 67, 37, 14, 98, 122, 124, 183."),
    numeric("semaphore", "A counting semaphore starts at 10. Then 6 P (wait) and 4 V (signal) operations run. What is its final value?", 10 - 6 + 4, [12, 4, 6], "Each P subtracts 1 and each V adds 1. The order does not change the final value when no process blocks."),
    numeric("min-resources", "3 processes each need at most 2 units of one resource. What is the minimum number of units that guarantees no deadlock?", 3 * (2 - 1) + 1, [3, 5, 6], "Worst case, each holds max - 1. One more unit lets a process finish: sum of (max - 1) + 1."),
    numeric("internal-frag", "A process of 10 KB runs with 4 KB pages. How much internal fragmentation is there?", Math.ceil(10 / 4) * 4 - 10, [0, 4, 6], "It needs 3 pages, which is 12 KB, so 2 KB of the last page is unused.", " KB"),
    concept("thread-shared", "Which of these does a thread NOT share with other threads of its process?", "Its stack", ["The heap", "Global variables", "Open files"], "Each thread has its own stack, registers and program counter. The rest of the process is shared."),
    concept("coffman", "Which is NOT one of the four necessary conditions for deadlock?", "Preemption", ["Mutual exclusion", "Hold and wait", "Circular wait"], "The fourth condition is NO preemption. Allowing preemption breaks deadlock."),
    concept("mutex", "What is the main difference between a mutex and a binary semaphore?", "A mutex has an owner, and only that thread should unlock it", ["A semaphore can only be used by one process", "A mutex can count above 1", "A semaphore never blocks"], "A semaphore is a signal that any thread can post. A mutex is a lock with ownership."),
    concept("aging", "Which technique fixes starvation in priority scheduling?", "Aging", ["Paging", "Spooling", "Compaction"], "Aging raises the priority of a process the longer it waits, so it runs eventually."),
    concept("fcfs-np", "Which scheduling algorithm is always non-preemptive?", "FCFS", ["Round robin", "SRTF", "Multilevel feedback queue"], "Once an FCFS process has the CPU, it keeps it until it blocks or exits."),
    concept("belady-who", "Which page replacement algorithm can show Belady's anomaly?", "FIFO", ["LRU", "Optimal", "No replacement algorithm can"], "LRU and Optimal are stack algorithms, so more frames never hurt them. FIFO is not."),
    concept("thrashing", "What is thrashing?", "Processes spend more time paging than executing", ["The CPU runs too many instructions per second", "A disk head moves back and forth during SCAN", "Threads wait forever for a lock"], "Too little memory per process causes constant faults, and CPU use falls. Reduce the degree of multiprogramming."),
    concept("zombie", "What is a zombie process?", "A finished process whose parent has not called wait yet", ["A running process whose parent has exited", "A process stuck in an endless loop", "A process swapped out to disk"], "Its exit status stays in the process table until the parent reads it. A running process whose parent exited is an orphan."),
    concept("pcb-switch", "On a context switch, where are the running process's registers saved?", "In its PCB", ["In the TLB", "In the page table", "In the ready queue"], "The PCB holds what is needed to resume the process."),
    concept("critical", "Which is NOT a requirement of a critical section solution?", "Busy waiting", ["Mutual exclusion", "Progress", "Bounded waiting"], "The three requirements are mutual exclusion, progress and bounded waiting. Busy waiting is a cost to avoid, not a requirement."),
    concept("paging-frag", "What does paging eliminate?", "External fragmentation", ["Internal fragmentation", "Page faults", "The need for a TLB"], "Any free frame fits any page, so free memory is never too scattered to use. The last page can still waste space."),
    concept("tlb", "What does a TLB cache?", "Page table entries", ["Disk blocks", "Whole processes", "Instructions only"], "It holds recent page number to frame number translations, so most accesses skip the page table walk."),
    concept("dirty", "Why does a page table keep a dirty bit?", "To write a page back to disk only if it was modified", ["To mark a page as invalid", "To count how often a page is used", "To stop other processes reading the page"], "A clean page can be dropped on eviction because the disk copy is still correct."),
    concept("exec", "What does `exec()` do?", "Replaces the current process image with a new program", ["Creates a child process", "Waits for a child to finish", "Sends a signal to a process"], "The PID stays the same. `fork` creates the process and `exec` loads the program."),
    concept("raid", "Which RAID level stripes data with no redundancy?", "RAID 0", ["RAID 1", "RAID 5", "RAID 6"], "RAID 0 improves speed, but one failed disk loses the array. RAID 1 mirrors, RAID 5 and 6 add parity."),
    concept("inode", "Which of these is NOT stored in a Unix inode?", "The file name", ["File size", "Permissions", "Pointers to data blocks"], "Names live in directory entries, which map a name to an inode number. So one inode can have several hard links."),
  ],
};
