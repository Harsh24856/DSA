"use client";
// Networking labs: the TCP handshake and teardown, sliding-window retransmission, and an IPv4 subnet calculator.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { slidingWindow, splitSubnet, subnet, validIp } from "@/lib/other/sim";
import { Seg } from "../ui";
import { Lab, Slider, spring, tint } from "../labs/kit";

/* ---------- TCP handshake, teardown and sliding window ---------- */
type Msg = { from: "C" | "S"; label: string; detail: string; c: string; s: string; note: string };
const TCP: Msg[] = [
  { from: "C", label: "SYN", detail: "seq = 100", c: "SYN_SENT", s: "LISTEN", note: "The client picks a random initial sequence number (here 100) and asks to open a connection." },
  { from: "S", label: "SYN + ACK", detail: "seq = 300, ack = 101", c: "SYN_SENT", s: "SYN_RCVD", note: "The server picks its own sequence number (300) and acknowledges the client's: ack = 100 + 1, because SYN uses up one sequence number." },
  { from: "C", label: "ACK", detail: "ack = 301", c: "ESTABLISHED", s: "ESTABLISHED", note: "The client acknowledges the server's SYN. Both sides now know the other can send and receive: the connection is open." },
  { from: "C", label: "data", detail: "seq = 101, 500 bytes", c: "ESTABLISHED", s: "ESTABLISHED", note: "Data flows. Each byte has a sequence number, so the receiver can reorder segments and spot gaps." },
  { from: "S", label: "ACK", detail: "ack = 601", c: "ESTABLISHED", s: "ESTABLISHED", note: "The server acknowledges every byte up to 600 by asking for byte 601 next (cumulative ACK)." },
  { from: "C", label: "FIN", detail: "seq = 601", c: "FIN_WAIT_1", s: "CLOSE_WAIT", note: "Teardown is four messages because each direction closes separately. The client says it has nothing more to send." },
  { from: "S", label: "ACK", detail: "ack = 602", c: "FIN_WAIT_2", s: "CLOSE_WAIT", note: "The server acknowledges, but may still have data of its own to send." },
  { from: "S", label: "FIN", detail: "seq = 301", c: "TIME_WAIT", s: "LAST_ACK", note: "Now the server is done too and sends its own FIN." },
  { from: "C", label: "ACK", detail: "ack = 302", c: "TIME_WAIT", s: "CLOSED", note: "The client acknowledges and waits 2 × MSL in TIME_WAIT, so a lost final ACK can be re-sent and old segments die out." },
];

function Handshake() {
  const [n, setN] = useState(1);
  const cur = TCP[n - 1];
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-start gap-2 text-center text-[12px]">
        <div><div className="font-semibold">Client</div><motion.div key={cur.c} className="pill pill-muted mt-1" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={spring}>{cur.c}</motion.div></div>
        <div />
        <div><div className="font-semibold">Server</div><motion.div key={cur.s} className="pill pill-muted mt-1" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={spring}>{cur.s}</motion.div></div>
      </div>
      <ol className="relative grid gap-1.5 border-x-2 border-line-strong px-2 py-2">
        <AnimatePresence initial={false}>
          {TCP.slice(0, n).map((m, i) => (
            <motion.li key={i} className={`flex ${m.from === "C" ? "justify-start" : "justify-end"}`} initial={{ opacity: 0, x: m.from === "C" ? -40 : 40 }} animate={{ opacity: i === n - 1 ? 1 : 0.55, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <span className={`inline-flex w-[78%] items-center gap-2 rounded-control border px-2 py-1 text-[12px] ${m.from === "C" ? "border-accent bg-accent-soft" : "flex-row-reverse border-line-strong bg-surface-2"}`}>
                <b className="whitespace-nowrap">{m.label}</b><span className="num min-w-0 flex-1 truncate text-muted">{m.detail}</span><span aria-hidden>{m.from === "C" ? "→" : "←"}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <p className="callout text-[13px]" role="status">{cur.note}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setN((v) => Math.max(1, v - 1))} disabled={n === 1}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setN((v) => Math.min(TCP.length, v + 1))} disabled={n === TCP.length}>Next message</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setN(1)}>Restart</button>
      </div>
    </>
  );
}

function Window() {
  const [mode, setMode] = useState<"gbn" | "sr">("gbn");
  const [w, setW] = useState(4);
  const [lost, setLost] = useState<number[]>([2]);
  const res = slidingWindow(8, w, lost, mode);
  const toggle = (s: number) => setLost((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Seg<"gbn" | "sr"> label="Protocol" value={mode} onChange={setMode} options={[["gbn", "Go-Back-N"], ["sr", "Selective Repeat"]]} />
        <div className="min-w-[160px] flex-1"><Slider label="window size" value={w} min={1} max={6} onChange={setW} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lose the first copy of these packets">
        <span className="text-[13px] text-muted">Lose packet:</span>
        {Array.from({ length: 8 }, (_, s) => <button key={s} type="button" className="chip" aria-pressed={lost.includes(s)} onClick={() => toggle(s)}>{s}</button>)}
      </div>
      <ol className="grid gap-1.5">
        {res.rounds.map((round, r) => (
          <motion.li key={`${mode}-${w}-${lost.join()}-${r}`} className="flex flex-wrap items-center gap-1.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: r * 0.12, duration: 0.3 }}>
            <span className="num w-16 text-[12px] text-muted">round {r + 1}</span>
            {round.map((tx) => (
              <span key={tx.seq} className="num grid size-8 place-items-center rounded-[8px] text-[13px] font-semibold"
                style={{ background: tx.ok ? tint(30, "var(--easy)") : tint(30, "var(--hard)"), textDecoration: tx.ok ? undefined : "line-through" }} title={tx.ok ? "delivered" : "lost"}>{tx.seq}</span>
            ))}
          </motion.li>
        ))}
      </ol>
      <p className="text-[13px]" role="status"><b className="num">{res.sent}</b> transmissions for 8 packets. {mode === "gbn" ? "Go-Back-N's receiver keeps no buffer, so after a loss it discards everything that follows and the sender resends the whole window." : "Selective Repeat buffers out-of-order packets, so only the lost one is resent. The cost is a buffer and an ACK per packet."}</p>
    </>
  );
}

export function TcpLab() {
  const [view, setView] = useState<"hs" | "win">("hs");
  return (
    <Lab title="TCP: open, send, close, recover" hint="Step through a connection's life message by message, then see how a lost packet is recovered with a sliding window.">
      <Seg<"hs" | "win"> label="View" value={view} onChange={setView} options={[["hs", "Handshake and teardown"], ["win", "Sliding window"]]} />
      {view === "hs" ? <Handshake /> : <Window />}
    </Lab>
  );
}

/* ---------- subnet calculator ---------- */
export function SubnetLab() {
  const [ip, setIp] = useState("192.168.10.77");
  const [prefix, setPrefix] = useState(26);
  const [split, setSplit] = useState(28);
  const ok = validIp(ip);
  const s = ok ? subnet(ip, prefix) : null;
  const subs = ok && split > prefix ? splitSubnet(ip, prefix, split) : [];
  return (
    <Lab title="Subnet calculator" hint="The prefix says how many leading bits are the network. The rest are host bits: 2^(host bits) addresses, minus the network and broadcast addresses.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[13px]"><span className="text-muted">IPv4 address</span>
          <input className="field num" value={ip} onChange={(e) => setIp(e.target.value.trim())} aria-invalid={!ok} /></label>
        <Slider label="prefix length" value={prefix} min={8} max={30} onChange={(v) => { setPrefix(v); setSplit((x) => Math.max(x, v)); }} show={`/${prefix}`} />
      </div>
      {!s ? <p className="text-[13px] text-hard" role="alert">Enter four numbers from 0 to 255, like 10.0.4.17.</p> : (
        <>
          <div className="overflow-x-auto" aria-label={`Address in binary, first ${prefix} bits are the network`}>
            <div className="num flex w-max gap-[3px] text-[12px]">
              {s.bits.split("").map((b, i) => (
                <span key={i} className={`grid h-7 w-[18px] place-items-center rounded-[4px] ${i % 8 === 7 && i < 31 ? "mr-1.5" : ""}`} style={{ background: i < prefix ? tint(35) : "var(--surface-2)" }}>{b}</span>
              ))}
            </div>
          </div>
          <p className="text-[12px] text-muted">Shaded: {prefix} network bits. Plain: {32 - prefix} host bits.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["network", s.network], ["broadcast", s.broadcast], ["first host", s.first], ["last host", s.last], ["usable hosts", s.hosts.toLocaleString()], ["subnet mask", s.mask], ["class", s.cls], ["private?", s.isPrivate ? "yes (RFC 1918)" : "no"]].map(([l, v]) => (
              <div key={l} className="tile min-w-0"><div className="text-[12px] text-muted">{l}</div><div className="num truncate text-[14px] font-semibold">{v}</div></div>
            ))}
          </div>
          <Slider label="split into smaller subnets of size" value={split} min={prefix} max={30} onChange={setSplit} show={`/${split} → ${2 ** (split - prefix)} subnets`} />
          {subs.length > 0 && (
            <ul className="grid max-h-[220px] gap-1 overflow-y-auto text-[12px]">
              {subs.map((x) => <li key={x.network} className="num grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 rounded-control bg-surface-2 px-2 py-1"><b>{x.network}</b><span className="text-muted">{x.range}</span></li>)}
            </ul>
          )}
        </>
      )}
    </Lab>
  );
}
