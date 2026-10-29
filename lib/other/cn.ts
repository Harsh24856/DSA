import type { Subject } from "./types";

export const CN: Subject = {
  id: "cn",
  name: "Computer Networks",
  short: "CN",
  blurb: "The layer models, addressing and subnetting, TCP and UDP, DNS, HTTP and TLS, routing and the classic \"what happens when you type a URL\". Interviewers want the flow, not memorised acronyms.",
  chapters: [
    {
      id: "layers",
      title: "OSI and TCP/IP models",
      summary: "Layering splits networking into jobs that can change independently: an app does not care whether bits travel over Wi-Fi or fibre. The OSI model has seven layers; the Internet actually runs the four-layer TCP/IP model.",
      table: { head: ["OSI layer", "Job", "Unit", "Examples", "TCP/IP layer"], rows: [
        ["7 Application", "what the program means", "message", "HTTP, DNS, SMTP", "Application"],
        ["6 Presentation", "encoding, encryption, compression", "message", "TLS, JPEG, UTF-8", "Application"],
        ["5 Session", "open, keep and close conversations", "message", "RPC sessions", "Application"],
        ["4 Transport", "process-to-process delivery", "segment / datagram", "TCP, UDP", "Transport"],
        ["3 Network", "host-to-host delivery across networks", "packet", "IP, ICMP", "Internet"],
        ["2 Data link", "delivery on one link", "frame", "Ethernet, Wi-Fi, ARP", "Link"],
        ["1 Physical", "bits as signals", "bit", "cables, radio", "Link"],
      ] },
      diagram: `flowchart LR
  A["HTTP data"] --> B["+ TCP header<br/>ports, seq"] --> C["+ IP header<br/>source and destination IP"] --> D["+ Ethernet header and trailer<br/>MAC addresses, CRC"] --> E["bits on the wire"]`,
      caption: "Encapsulation: each layer wraps the data from the layer above with its own header.",
      cards: [
        { id: "why-layers", q: "Why layer the network at all?", a: "Each layer offers a service to the one above and uses the one below, so each can be designed, replaced and debugged independently. HTTP works the same over Ethernet or 5G, and TCP did not change when Wi-Fi was invented. The cost is some header overhead and occasional duplicated work across layers." },
        { id: "devices", q: "Hub vs switch vs router?", a: "- **Hub** (layer 1): repeats every bit to every port. One collision domain.\n- **Switch** (layer 2): learns which MAC address is on which port and forwards frames only there. Each port is its own collision domain.\n- **Router** (layer 3): forwards packets between networks by IP address using a routing table, and separates broadcast domains." },
        { id: "mac-ip", q: "Why do we need both MAC and IP addresses?", a: "A MAC address identifies a network interface on the local link and is used for the next hop only. An IP address identifies a host's location in the global network and is used end to end. At every hop the IP addresses stay the same while the MAC addresses are rewritten for that link. ARP maps an IP to a MAC on the local network." },
      ],
    },
    {
      id: "addressing",
      title: "IP addressing and subnetting",
      summary: "An IPv4 address is 32 bits, written as four bytes. A prefix like /24 says how many leading bits name the network; the rest name hosts on it. CIDR lets the prefix be any length, replacing the old fixed classes.",
      points: [
        "Usable hosts in a /n subnet = 2^(32 − n) − 2 (the network and broadcast addresses are reserved).",
        "Private ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. They are not routed on the Internet; NAT translates them.",
        "IPv6 uses 128-bit addresses written in hex (2001:db8::1); it removes the need for NAT and has no broadcast.",
      ],
      lab: "subnet",
      cards: [
        { id: "subnet-q", q: "You need 5 subnets of at least 25 hosts from 192.168.1.0/24. What prefix do you use?", a: "25 hosts need 5 host bits (2⁵ − 2 = 30 ≥ 25), so the prefix is /27, giving 8 subnets of 30 hosts each: 192.168.1.0/27, .32/27, .64/27 and so on. Check the other way too: 8 subnets ≥ 5 needed." },
        { id: "nat", q: "How does NAT let many devices share one public IP?", a: "The router rewrites the source address (and usually the port) of outgoing packets to its public IP and a unique port, and records the mapping. Replies arriving at that port are rewritten back to the private address. This is why a home network of ten devices needs one public IPv4 address, and also why incoming connections need port forwarding." },
        { id: "dhcp", q: "How does a device get an IP address with DHCP?", a: "DORA: the client broadcasts **Discover**, a server replies with an **Offer**, the client broadcasts a **Request** for that offer, and the server confirms with an **Ack**. The lease includes the IP, subnet mask, default gateway and DNS servers, and must be renewed before it expires." },
        { id: "arp", q: "How does ARP work?", a: "To send to an IP on the same subnet, a host broadcasts \"who has 192.168.1.20?\". The owner replies with its MAC address, and the sender caches the mapping. For an IP outside the subnet, the host ARPs for its default gateway instead. ARP has no authentication, which is what ARP spoofing exploits." },
      ],
    },
    {
      id: "transport",
      title: "TCP and UDP",
      summary: "The transport layer delivers data between processes, identified by ports. **TCP** gives a reliable, ordered byte stream; **UDP** sends independent datagrams with no guarantees and almost no overhead.",
      table: { head: ["", "TCP", "UDP"], rows: [
        ["Connection", "handshake before data", "none"],
        ["Reliability", "acknowledgements and retransmission", "none"],
        ["Order", "guaranteed", "not guaranteed"],
        ["Flow and congestion control", "yes", "no"],
        ["Header", "20 to 60 bytes", "8 bytes"],
        ["Used by", "web, email, file transfer, SSH", "DNS, video calls, games, QUIC"],
      ] },
      lab: "tcp",
      cards: [
        { id: "three-way", q: "Why does TCP need a three-way handshake and not two?", a: "Both sides must agree on each other's initial sequence numbers. With SYN, SYN-ACK, ACK, each side sends its own number and has it acknowledged. With only two messages the server would never learn whether the client received its sequence number, and a delayed duplicate SYN from an old connection could open a connection nobody wants." },
        { id: "flow-congestion", q: "Flow control vs congestion control?", a: "**Flow control** protects the receiver: it advertises a receive window, and the sender never has more unacknowledged bytes in flight than that. **Congestion control** protects the network: the sender keeps a congestion window that grows with slow start (doubling each round trip) and additive increase, and shrinks sharply on packet loss (multiplicative decrease). The sender uses the smaller of the two windows." },
        { id: "time-wait", q: "Why does the side that closes first sit in TIME_WAIT?", a: "For twice the maximum segment lifetime, so that if its final ACK is lost and the other side resends FIN, it can acknowledge again; and so that stray segments from this connection die out before the same port pair is reused." },
        { id: "udp-why", q: "Why would anyone choose UDP?", a: "When late data is useless or the application handles reliability itself. In a video call, a retransmitted frame arrives too late to show, so dropping it is better. DNS answers fit in one packet, so a handshake would double the latency. QUIC (HTTP/3) is built on UDP so it can implement its own faster, per-stream reliability in user space." },
      ],
    },
    {
      id: "dns",
      title: "DNS",
      summary: "DNS turns names into IP addresses using a distributed, cached hierarchy. Your computer asks a recursive resolver, which walks the hierarchy for you and caches the answers for their TTL.",
      diagram: `sequenceDiagram
  participant B as Browser / OS
  participant R as Recursive resolver
  participant Root as Root server
  participant TLD as .com TLD server
  participant A as example.com authoritative
  B->>R: where is www.example.com?
  R->>Root: www.example.com?
  Root-->>R: ask the .com servers
  R->>TLD: www.example.com?
  TLD-->>R: ask example.com's name servers
  R->>A: www.example.com?
  A-->>R: A record 203.0.113.10, TTL 3600
  R-->>B: 203.0.113.10 (cached for an hour)`,
      caption: "An uncached lookup. Most lookups stop early at a cache in the browser, OS or resolver.",
      table: { head: ["Record", "Holds"], rows: [["A / AAAA", "IPv4 / IPv6 address"], ["CNAME", "alias to another name"], ["MX", "mail servers for the domain"], ["NS", "the domain's name servers"], ["TXT", "text, used for verification and email security (SPF, DKIM)"]] },
      cards: [
        { id: "recursive-iterative", q: "Recursive vs iterative DNS queries?", a: "In a recursive query the client asks the resolver for the final answer and the resolver does all the work. In an iterative query each server answers with a referral (\"ask these servers\") and the asker follows it. Your machine makes recursive queries to its resolver; the resolver makes iterative queries to root, TLD and authoritative servers." },
        { id: "dns-udp", q: "Does DNS use TCP or UDP?", a: "Normally UDP port 53, because queries are small and one round trip matters. It falls back to TCP when a response is too large (truncated flag set) and for zone transfers between servers. Encrypted variants run over TLS (DoT) or HTTPS (DoH)." },
        { id: "ttl", q: "Why can a DNS change take hours to be seen everywhere?", a: "Resolvers and clients cache records until their TTL expires. If the old record had a TTL of 86400 seconds, some users keep the old IP for up to a day. Lower the TTL well before a planned migration." },
      ],
    },
    {
      id: "http",
      title: "HTTP and HTTPS",
      summary: "HTTP is a request-response protocol: method, path and headers go in; a status code, headers and a body come back. It is stateless, so cookies or tokens carry identity between requests.",
      table: { head: ["Version", "Key change"], rows: [
        ["HTTP/1.1", "persistent connections, but one request at a time per connection (head-of-line blocking)"],
        ["HTTP/2", "binary framing, many parallel streams on one TCP connection, header compression"],
        ["HTTP/3", "runs on QUIC over UDP, so one lost packet only stalls its own stream; faster handshakes"],
      ] },
      cards: [
        { id: "methods", q: "GET vs POST, and what does idempotent mean?", a: "GET reads a resource; parameters go in the URL; it should have no side effects and can be cached. POST submits data in the body and usually creates or triggers something. **Idempotent** means repeating the request has the same effect as doing it once: GET, PUT and DELETE are idempotent, POST is not, which is why browsers warn before re-submitting a form." },
        { id: "status", q: "Which status codes should you know?", a: "- **2xx** success: 200 OK, 201 Created, 204 No Content.\n- **3xx** redirect: 301 permanent, 302 / 307 temporary, 304 Not Modified (use your cache).\n- **4xx** client error: 400 Bad Request, 401 Unauthenticated, 403 Forbidden, 404 Not Found, 429 Too Many Requests.\n- **5xx** server error: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.",
          trap: "401 means \"we do not know who you are\" (log in); 403 means \"we know, and you are not allowed\"." },
        { id: "tls", q: "How does HTTPS (TLS 1.3) set up a secure connection?", a: "The client sends supported cipher suites and a key share. The server replies with its key share and its certificate, signed by a certificate authority the client trusts. Both sides derive the same session key from the key exchange (Diffie-Hellman), so data is encrypted with fast symmetric crypto. The certificate proves the server owns the domain; the key exchange gives forward secrecy. TLS 1.3 does this in one round trip.",
          diagram: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello: ciphers, key share
  S->>C: ServerHello: key share, certificate, Finished
  Note over C: verify certificate chain, derive session key
  C->>S: Finished, then encrypted HTTP request
  S->>C: encrypted HTTP response` },
        { id: "cookies", q: "Cookies vs sessions vs tokens (JWT)?", a: "A cookie is just a header the browser stores and sends back. A session keeps state on the server and puts only a random session id in a cookie; easy to revoke. A JWT puts signed claims in the token itself, so servers need no lookup, but revoking before expiry needs extra machinery. Mark auth cookies HttpOnly, Secure and SameSite." },
      ],
    },
    {
      id: "url",
      title: "What happens when you type a URL",
      summary: "The classic question that tests whether you can connect every layer. Tell it as one story, top to bottom.",
      diagram: `flowchart TB
  A["1 · parse URL, check HSTS and browser cache"] --> B["2 · DNS: browser, OS, resolver caches, then the hierarchy"]
  B --> C["3 · TCP handshake to the server IP, port 443"]
  C --> D["4 · TLS handshake: certificate check, session key"]
  D --> E["5 · send HTTP GET with headers and cookies"]
  E --> F["6 · CDN / load balancer → app server → database"]
  F --> G["7 · response: status, headers, HTML"]
  G --> H["8 · browser parses HTML, fetches CSS, JS, images"]
  H --> I["9 · build DOM and CSSOM, layout, paint"]`,
      caption: "Mention caching at each step: it is why most page loads skip half of this.",
      cards: [
        { id: "url-depth", q: "Where can the request be served without reaching the origin server?", a: "From the browser cache (fresh by Cache-Control or validated with a 304), a service worker, a CDN edge close to the user, or a reverse proxy cache in front of the app. DNS answers are cached at several levels too." },
        { id: "lb", q: "What does a load balancer do, and layer 4 vs layer 7?", a: "It spreads requests across servers and stops sending to unhealthy ones. A **layer 4** balancer routes by IP and port without reading the request: fast and protocol-agnostic. A **layer 7** balancer reads HTTP, so it can route by path or header, terminate TLS and do sticky sessions." },
      ],
    },
    {
      id: "routing",
      title: "Routing and error reporting",
      summary: "Routers forward each packet using the longest matching prefix in their routing table. Routing protocols build those tables.",
      diagram: `flowchart LR
  subgraph AS1["ISP A (autonomous system)"]
    direction LR
    R1["router"] --- R2["router"]
  end
  subgraph AS2["ISP B"]
    direction LR
    R3["router"] --- R4["router"]
  end
  R2 <-->|"BGP between ISPs"| R3`,
      caption: "Inside an ISP: OSPF or IS-IS. Between ISPs: BGP.",
      table: { head: ["Protocol", "Type", "Idea"], rows: [
        ["RIP", "distance vector", "share your whole table with neighbours; metric = hop count (max 15)"],
        ["OSPF", "link state", "flood link costs to everyone; each router runs Dijkstra"],
        ["BGP", "path vector", "between autonomous systems (ISPs); chooses by policy, not just distance"],
      ] },
      cards: [
        { id: "lpm", q: "What is longest prefix match?", a: "When several routes match a destination, the router picks the most specific one. For 10.1.2.3 with routes 10.0.0.0/8 and 10.1.2.0/24, the /24 wins. The default route 0.0.0.0/0 matches everything and is used last." },
        { id: "dv-ls", q: "Distance vector vs link state?", a: "Distance vector routers only know what neighbours tell them, so they are simple but converge slowly and can suffer count-to-infinity. Link-state routers each learn the full topology and compute shortest paths themselves, so they converge faster but use more memory and CPU." },
        { id: "icmp", q: "How do ping and traceroute work?", a: "Ping sends ICMP Echo Request and measures time to the Echo Reply. Traceroute sends packets with TTL 1, 2, 3 and so on; each router that decrements TTL to zero returns ICMP Time Exceeded, revealing itself, until the destination answers." },
      ],
    },
    {
      id: "security",
      title: "Network security basics",
      summary: "Interviews usually ask about the common attacks and the standard defence for each.",
      diagram: `sequenceDiagram
  participant C as Client
  participant M as Attacker
  participant S as Server
  C->>M: thinks it is talking to the server
  M->>S: relays and reads everything
  Note over C,S: TLS stops this, the attacker cannot present a valid certificate for the server name`,
      caption: "Man in the middle, and why certificate checks defeat it.",
      table: { head: ["Attack", "What happens", "Defence"], rows: [
        ["Man in the middle", "attacker relays and reads traffic", "TLS with certificate validation, HSTS"],
        ["DDoS", "flood of traffic exhausts resources", "rate limiting, CDNs, scrubbing services"],
        ["SYN flood", "half-open connections fill the backlog", "SYN cookies"],
        ["DNS spoofing", "fake answers poison a cache", "DNSSEC, randomised query ids and ports"],
        ["ARP spoofing", "attacker claims the gateway's IP on a LAN", "dynamic ARP inspection, encryption"],
      ] },
      cards: [
        { id: "sym-asym", q: "Symmetric vs asymmetric encryption, and how does HTTPS use both?", a: "Symmetric (AES) uses one shared key: fast, but you must get the key to the other side safely. Asymmetric (RSA, elliptic curves) uses a public/private key pair: slow, but the public key can be shared openly. HTTPS uses asymmetric crypto during the handshake to authenticate the server and agree on a key, then switches to symmetric encryption for the data." },
        { id: "firewall", q: "Firewall vs proxy vs VPN?", a: "A firewall allows or blocks traffic by rules (addresses, ports, state). A proxy makes requests on a client's behalf (forward proxy) or receives them for servers (reverse proxy). A VPN wraps your traffic in an encrypted tunnel to another network, so you appear to be inside it." },
      ],
    },
  ],
};
