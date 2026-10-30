// Used by check:other: lets an Express example call app.listen(3000) without blocking the check.
// Every server listens on a free port instead, answers one GET /, then closes.
import http from "node:http";

const listen = http.Server.prototype.listen;
http.Server.prototype.listen = function (...args) {
  const done = args.find((a) => typeof a === "function");
  return listen.call(this, 0, "127.0.0.1", async () => {
    done?.();
    const { port } = this.address();
    try { await fetch(`http://127.0.0.1:${port}/`); } catch {}
    this.close();
    this.closeAllConnections?.();
  });
};
