"use client";
import type { OtherLab as Kind } from "@/lib/other/types";
import { BankerLab, PagingLab, SchedulingLab } from "./labs-os";
import { SubnetLab, TcpLab } from "./labs-net";
import { BTreeLab, NormalizeLab, SqlOrderLab } from "./labs-db";
import { AptitudeLab, VtableLab } from "./labs-misc";
import { EventLoopLab } from "./labs-js";
import { HashRingLab, RateLimitLab } from "./labs-design";
import { AvailabilityLab, ClockLab, DiskLab, EstimateLab, NullLab, QuorumLab, RerenderLab } from "./labs-core";

const LAB: Record<Kind, () => React.JSX.Element> = {
  paging: PagingLab, scheduling: SchedulingLab, banker: BankerLab, tcp: TcpLab, subnet: SubnetLab,
  btree: BTreeLab, sqlorder: SqlOrderLab, normalize: NormalizeLab, vtable: VtableLab, aptitude: () => <AptitudeLab />, eventloop: EventLoopLab,
  hashring: HashRingLab, ratelimit: RateLimitLab,
  disk: DiskLab, nulls: NullLab, quorum: QuorumLab, estimate: EstimateLab, availability: AvailabilityLab, rerender: RerenderLab, clock: ClockLab,
  "apt-percent": () => <AptitudeLab topics={["percent", "profit", "interest"]} />, "apt-ratio": () => <AptitudeLab topics={["mixture"]} />,
  "apt-work": () => <AptitudeLab topics={["work"]} />, "apt-speed": () => <AptitudeLab topics={["trains", "boats"]} />, "apt-counting": () => <AptitudeLab topics={["pnc", "dice"]} />,
};

export function OtherLab({ kind }: { kind: Kind }) {
  const L = LAB[kind];
  return <L />;
}
