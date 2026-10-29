# Back-of-envelope sizing for a RAG chatbot: the numbers an interviewer expects you to work out aloud.
users_per_day = 50_000
questions_per_user = 4
peak_factor = 3                      # peak traffic vs the daily average
in_tokens, out_tokens = 3_000, 300   # prompt (system + retrieved chunks + question) and answer

qps_avg = users_per_day * questions_per_user / 86_400
qps_peak = qps_avg * peak_factor
tok_out_per_s = qps_peak * out_tokens                     # generation throughput needed at peak
monthly_in = users_per_day * questions_per_user * in_tokens * 30
monthly_out = users_per_day * questions_per_user * out_tokens * 30

price_in, price_out = 3 / 1e6, 15 / 1e6                   # example API prices per token; check current ones
cost = monthly_in * price_in + monthly_out * price_out
cached = monthly_in * 0.7 * price_in * 0.1 + monthly_in * 0.3 * price_in + monthly_out * price_out   # 70% of prompt cached

print(f"average {qps_avg:.1f} req/s, peak {qps_peak:.1f} req/s, {tok_out_per_s:,.0f} output tokens/s at peak")
print(f"monthly tokens: {monthly_in / 1e9:.1f}B in, {monthly_out / 1e9:.2f}B out")
print(f"API cost ~${cost:,.0f}/month, ~${cached:,.0f} with 70% of the prompt cached")
assert 2 < qps_avg < 3 and cached < cost
