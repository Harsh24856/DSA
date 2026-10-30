"use client";
import type { OtherLab as Kind } from "@/lib/other/types";
import { BankerLab, PagingLab, SchedulingLab } from "./labs-os";
import { SubnetLab, TcpLab } from "./labs-net";
import { BTreeLab, NormalizeLab, SqlOrderLab } from "./labs-db";
import { AptitudeLab, VtableLab } from "./labs-misc";
import { EventLoopLab } from "./labs-js";

const LAB: Record<Kind, () => React.JSX.Element> = {
  paging: PagingLab, scheduling: SchedulingLab, banker: BankerLab, tcp: TcpLab, subnet: SubnetLab,
  btree: BTreeLab, sqlorder: SqlOrderLab, normalize: NormalizeLab, vtable: VtableLab, aptitude: AptitudeLab, eventloop: EventLoopLab,
};

export function OtherLab({ kind }: { kind: Kind }) {
  const L = LAB[kind];
  return <L />;
}
