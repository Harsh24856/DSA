import type { GModule } from "../types.ts";
import { WHY_ORDER_MATTERS } from "../modules/s3/why-order-matters.ts";
import { RNN_BPTT } from "../modules/s3/rnn-bptt.ts";

export const MODULES_3: Record<string, GModule> = { "why-order-matters": WHY_ORDER_MATTERS, "rnn-bptt": RNN_BPTT };
