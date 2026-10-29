import json
from pydantic import BaseModel, Field, ValidationError

class Invoice(BaseModel):
    vendor: str
    total: float = Field(gt=0)
    currency: str = Field(pattern="^[A-Z]{3}$")

# A scripted "model" so this runs offline. Swap in a real call that returns text.
replies = iter([
    'Sure! Here is the JSON: {"vendor": "Acme", "total": "12,40", "currency": "inr"}',
    '{"vendor": "Acme", "total": 12.40, "currency": "INR"}',
])
def call_model(messages):
    return next(replies)

def extract(text, max_tries=3):
    messages = [{"role": "user", "content": f"Return JSON for this invoice: {text}"}]
    for attempt in range(1, max_tries + 1):
        raw = call_model(messages)
        try:
            start, end = raw.index("{"), raw.rindex("}") + 1      # tolerate chatter around the JSON
            return Invoice.model_validate(json.loads(raw[start:end])), attempt
        except (ValueError, ValidationError) as err:
            # feed the exact error back: the model fixes what the validator complains about
            messages += [{"role": "assistant", "content": raw},
                         {"role": "user", "content": f"Invalid: {err}. Reply with corrected JSON only."}]
    raise RuntimeError("no valid JSON after retries")

invoice, tries = extract("Acme, total 12.40 rupees")
print(invoice, "after", tries, "attempts")      # vendor='Acme' total=12.4 currency='INR' after 2 attempts
assert tries == 2 and invoice.currency == "INR"
