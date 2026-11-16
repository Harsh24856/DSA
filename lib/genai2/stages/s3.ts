import type { GModule } from "../types.ts";
import { WHY_ORDER_MATTERS } from "../modules/s3/why-order-matters.ts";
import { RNN_BPTT } from "../modules/s3/rnn-bptt.ts";
import { LSTM_GRU } from "../modules/s3/lstm-gru.ts";
import { SEQ2SEQ_BOTTLENECK } from "../modules/s3/seq2seq-bottleneck.ts";
import { ATTENTION_FIX } from "../modules/s3/attention-fix.ts";

export const MODULES_3: Record<string, GModule> = { "why-order-matters": WHY_ORDER_MATTERS, "rnn-bptt": RNN_BPTT, "lstm-gru": LSTM_GRU, "seq2seq-bottleneck": SEQ2SEQ_BOTTLENECK, "attention-fix": ATTENTION_FIX };
