import { slidingWindow, subnet } from "../sim.ts";
import type { OaSubject } from "../types.ts";
import { concept, numeric, r2 } from "./make.ts";

const hamming = (m: number) => { let r = 0; while (2 ** r < m + r + 1) r++; return r; };
const a = 2 / 1;   // propagation 2 ms over transmission 1 ms

export const OA_CN: OaSubject = {
  id: "cn", name: "Computer Networks",
  questions: [
    numeric("network", "What is the network address of 192.168.10.77/26?", subnet("192.168.10.77", 26).network, ["192.168.10.0", "192.168.10.76", "192.168.10.127"], "/26 means blocks of 64 in the last octet. The block holding 77 starts at 64."),
    numeric("broadcast", "What is the broadcast address of 172.16.5.130/25?", subnet("172.16.5.130", 25).broadcast, ["172.16.5.127", "172.16.5.128", "172.16.5.254"], "/25 splits the last octet into 0-127 and 128-255. The last address of the block is the broadcast."),
    numeric("hosts", "How many usable hosts does a /27 subnet have?", subnet("10.0.0.1", 27).hosts, [32, 62, 14], "2^5 - 2. The network and broadcast addresses are not usable."),
    numeric("mask", "What is the subnet mask of a /20 network?", subnet("10.0.0.1", 20).mask, ["255.255.0.0", "255.255.192.0", "255.255.248.0"], "/20 has 4 network bits in the third octet, which is 240."),
    numeric("split", "A /24 network is split into /26 subnets. How many subnets result?", 2 ** (26 - 24), [2, 6, 64], "2 borrowed bits give 2^2 subnets."),
    numeric("gbn", "Send 8 packets with window 4, and the first copy of packet 2 is lost. How many transmissions does Go-Back-N make in total?", slidingWindow(8, 4, [2], "gbn").sent, [slidingWindow(8, 4, [2], "sr").sent, 8, 12], "Packet 3 arrives out of order and is discarded, so 2 and 3 are both sent again."),
    numeric("sr", "Send 8 packets with window 4, and the first copy of packet 2 is lost. How many transmissions does Selective Repeat make in total?", slidingWindow(8, 4, [2], "sr").sent, [slidingWindow(8, 4, [2], "gbn").sent, 8, 12], "Only the lost packet is sent again."),
    numeric("sr-window", "With 3-bit sequence numbers, what is the largest window for Selective Repeat?", 2 ** (3 - 1), [7, 8, 3], "2^(n-1). A larger window lets old and new packets look the same."),
    numeric("gbn-window", "With 3-bit sequence numbers, what is the largest sender window for Go-Back-N?", 2 ** 3 - 1, [4, 8, 3], "2^n - 1. A full 2^n window could not tell a new batch from a repeat."),
    numeric("tx-delay", "What is the transmission delay of a 1000-byte packet on a 1 Mbps link?", (1000 * 8) / 1e6 * 1000, [1, 80, 0.8], "Packet bits divided by link rate: 8000 / 1,000,000 s.", " ms"),
    numeric("prop-delay", "What is the propagation delay over 2000 km at 2 × 10^8 m/s?", (2000e3 / 2e8) * 1000, [1, 100, 20], "Distance divided by signal speed. Packet size does not matter.", " ms"),
    numeric("efficiency", "Stop-and-wait: transmission time is 1 ms and one-way propagation time is 2 ms. What is the link efficiency?", r2((1 / (1 + 2 * a)) * 100), [50, 33.33, 100], "Efficiency = 1 / (1 + 2a), where a is propagation time divided by transmission time. Here a = 2.", "%"),
    numeric("throughput", "A TCP window of 64,000 bytes and an RTT of 20 ms. What is the maximum throughput?", (64000 * 8) / 0.02 / 1e6, [3.2, 12.8, 512], "One window per RTT: 512,000 bits / 0.02 s.", " Mbps"),
    numeric("hamming", "How many parity bits does a Hamming code need for 7 data bits?", hamming(7), [3, 5, 7], "The smallest r with 2^r ≥ m + r + 1. Here 2^4 = 16 ≥ 12."),
    numeric("crc", "A CRC generator has 4 bits (degree 3). How many check bits are appended to the data?", 4 - 1, [4, 2, 8], "The number of check bits equals the degree of the generator."),
    numeric("frag", "IP fragments carry 1480 bytes of data each. What is the fragment offset field of the second fragment?", 1480 / 8, [1480, 1500, 148], "The offset counts units of 8 bytes."),
    numeric("cwnd", "TCP slow start begins at cwnd = 1 MSS with no loss. What is cwnd after 3 RTTs?", 2 ** 3, [3, 4, 6], "cwnd doubles each RTT in slow start: 1, 2, 4, 8.", " MSS"),
    concept("private", "Which address is private?", "172.20.1.1", ["172.32.0.1", "8.8.8.8", "192.169.0.1"], "The private ranges are 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. 172.16 to 172.31 fall in the second."),
    concept("router-layer", "At which OSI layer does a router work?", "Network", ["Data link", "Physical", "Transport"], "Routers forward on IP addresses. Switches use MAC addresses at the data link layer. Hubs are physical."),
    concept("domains", "Which device separates broadcast domains?", "Router", ["Hub", "Repeater", "Layer 2 switch"], "A layer 2 switch separates collision domains, but it forwards broadcasts on the same VLAN."),
    concept("handshake", "What is the order of the TCP three-way handshake?", "SYN, SYN-ACK, ACK", ["SYN, ACK, FIN", "ACK, SYN, SYN-ACK", "SYN, ACK, SYN-ACK"], "Both sides agree on starting sequence numbers."),
    concept("time-wait", "Which side enters TIME_WAIT when a TCP connection closes?", "The side that closed first", ["The side that closed last", "Both sides", "The server, always"], "It waits so that a lost final ACK can be sent again and old packets die out."),
    concept("udp", "What does UDP NOT provide?", "Retransmission of lost data", ["Port numbers", "A checksum", "Message boundaries"], "UDP adds ports and a checksum to IP, and nothing else. Reliability, if needed, is up to the application."),
    concept("arp", "What does ARP resolve?", "An IP address to a MAC address", ["A domain name to an IP address", "A MAC address to a port", "A private IP to a public IP"], "DNS resolves names. NAT maps private addresses to public ones."),
    concept("dhcp", "What is the order of messages in DHCP?", "Discover, Offer, Request, Acknowledge", ["Request, Offer, Discover, Acknowledge", "Offer, Discover, Acknowledge, Request", "Discover, Request, Offer, Acknowledge"], "It is often remembered as DORA."),
    concept("flow", "What does TCP flow control protect?", "The receiver's buffer", ["The network's routers", "The sender's CPU", "The DNS server"], "The receiver advertises its window. Congestion control is what protects the network."),
    concept("csma", "Which access method detects collisions on classic wired Ethernet?", "CSMA/CD", ["CSMA/CA", "Token ring", "TDMA"], "Wi-Fi uses CSMA/CA because a radio cannot reliably detect a collision while it sends."),
    concept("dns-port", "Which port and protocol do most DNS queries use?", "UDP 53", ["TCP 80", "UDP 67", "TCP 25"], "DNS falls back to TCP 53 for large responses and zone transfers."),
    concept("https-port", "What is the default port for HTTPS?", "443", ["80", "22", "8443"], "HTTP uses 80 and SSH uses 22."),
    concept("idempotent", "Which HTTP method is NOT idempotent?", "POST", ["GET", "PUT", "DELETE"], "Repeating a PUT or DELETE leaves the same state. Repeating a POST can create a second resource."),
    concept("status", "Which status code means a permanent redirect?", "301", ["302", "304", "404"], "302 is temporary, and 304 means not modified."),
    concept("h3", "Which transport protocol does HTTP/3 run on?", "QUIC over UDP", ["TCP", "SCTP", "Raw IP"], "This avoids TCP head-of-line blocking between streams."),
    concept("tls", "Why does TLS use symmetric encryption for application data?", "It is much faster than asymmetric encryption", ["It needs no key", "It cannot be broken", "It works without a handshake"], "The handshake uses asymmetric methods to agree on a key, and the data then uses that key."),
    concept("routing", "Which routing protocol uses Dijkstra's algorithm?", "OSPF", ["RIP", "BGP", "ARP"], "RIP is distance vector (Bellman-Ford). BGP is path vector, between autonomous systems."),
    concept("ping", "Which protocol does `ping` use?", "ICMP", ["ARP", "UDP", "TCP"], "It sends an ICMP echo request and waits for the echo reply."),
  ],
};
