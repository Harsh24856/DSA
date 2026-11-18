// Stage 10: vision language models. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { n0, patchTokens, tiledTokens, tiles } from "../../stages/s10.calc.ts";

const T224 = patchTokens(224, 224, 14);
// predict: halve both sides
const [PW, PH] = [1344, 896], FULL = patchTokens(PW, PH, 14), HALF = patchTokens(PW / 2, PH / 2, 14);
// numeric: one 336 image at patch 14
const S336 = patchTokens(336, 336, 14);
// numeric: tiling a screenshot
const [SW, SH] = [1792, 1008], TT = tiledTokens(SW, SH, 448, 14), TN = tiles(SW, SH, 448), PER_TILE = patchTokens(448, 448, 14);
// output
const O448 = patchTokens(448, 448, 14);

export const VISION_LANGUAGE: GModule = {
  id: "vision-language",
  stage: 10,
  title: "Vision language models",
  hook: "A vision language model reads images the way it reads words: cut the picture into patches, turn each patch into a vector, and slip them into the prompt. Everything after that is ordinary attention.",
  blocks: [
    { kind: "figure", id: "s10-patch-grid", caption: `The image is cut into a grid of patches, and each patch becomes one token next to the question's text tokens. A 224 pixel square at 14 pixel patches is ${T224} tokens.` },
    { kind: "text", md: "**Three parts.** A **vision encoder** (a ViT, often trained CLIP style to match images with captions) turns patches into vectors. A small **projector** maps them to the language model's embedding size. The **language model** then reads image tokens and text tokens in one sequence. Training then tunes them together on image and instruction data." },
    { kind: "flow", id: "g-vision" },
    {
      kind: "predict",
      q: `A ${PW} × ${PH} screenshot costs ${n0(FULL)} visual tokens. You halve both sides before sending it. About how many tokens now?`,
      answer: n0(HALF), wrong: [n0(FULL / 2), n0(FULL), n0(FULL / 8)],
      why: `Tokens follow the number of patches, which grows with area. Half the width times half the height is a quarter of the area: ${n0(FULL)} / 4 = ${n0(HALF)}. Check small text is still legible after resizing.`,
    },
    { kind: "play", id: "s10-patches" },
    {
      kind: "compare",
      head: ["Design", "How images get in", "Good at"],
      rows: [
        ["Contrastive (CLIP style)", "Separate image and text encoders, matched by cosine", "Search, zero-shot labels; it does not write text"],
        ["Encoder + projector", "Vision encoder output projected into the LLM's tokens", "Chat about images, documents, charts"],
        ["Native multimodal", "Images are tokens from the start of pretraining", "Mixing modalities freely in one model"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
# CLIP style: one vector per image and per caption; the right pair has the highest cosine.
rng = np.random.default_rng(3)
d = 16
captions = ["a dog on a beach", "a bar chart of sales", "a receipt from a cafe"]
text = rng.normal(size=(3, d))
images = text + 0.4 * rng.normal(size=(3, d))       # trained encoders put matching pairs close

def norm(m): return m / np.linalg.norm(m, axis=1, keepdims=True)
sim = norm(images) @ norm(text).T                    # 3 x 3 cosine similarities
for i, row in enumerate(sim):
    print(f"image {i}: best caption = {captions[row.argmax()]!r}, cos {row.max():.2f}")

# training pushes the diagonal up and everything else down (a softmax over each row)
assert (sim.argmax(axis=1) == np.arange(3)).all()
`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  I["image or PDF page"] --> R["resize or tile"]
  R --> V["vision encoder: patches to vectors"]:::hot
  V --> P["projector: to the LLM's size"]
  T["question text"] --> L["LLM reads one sequence"]
  P --> L
  L --> O["answer, JSON or code"]:::ok`,
      caption: "The image is just more tokens: it costs context and money like text.",
    },
    { kind: "text", md: "**In practice.** Crop to the region that matters and send the smallest size that still answers the question. Small print needs enough resolution, so tile big pages instead of shrinking them. Pair the model with a strict output schema for extraction, and evaluate on your own documents: accuracy varies a lot with layout." },
  ],
  keyPoints: [
    "A vision encoder (a ViT) cuts an image into patches and turns each into a vector; a projector maps those into the language model's embedding space.",
    "Image tokens sit in the same sequence as text tokens, so they cost context and money, and the count grows with the image's area.",
    "CLIP-style training matches images with their captions by cosine similarity; such encoders are often the vision half of a VLM.",
    "Large images are tiled or processed at their own resolution, so small text stays legible at the price of more tokens.",
    "Resize and crop before sending, use schemas for extraction, and test on your real documents.",
  ],
  questions: [
    { id: "patch", level: "easy", kind: "concept",
      q: "In a vision transformer, what becomes one token?",
      answer: "One small square patch of the image", wrong: ["One pixel", "One whole image", "One colour channel"],
      why: `Pixels would be far too many tokens. A patch of, say, 14 × 14 pixels is flattened and projected to one vector: a 224 pixel square gives ${T224} tokens.` },
    { id: "projector", level: "medium", kind: "concept",
      q: "What is the projector for in an encoder-plus-LLM vision model?",
      answer: "It maps the vision encoder's vectors to the language model's embedding size and space",
      wrong: ["It shows the image on screen", "It turns the image into a text caption first", "It compresses the image into JPEG"],
      why: "The encoder and the LLM were trained apart and speak different vector languages. A small trained layer or MLP bridges them, so image vectors can sit among text embeddings." },
    { id: "clip", level: "medium", kind: "concept",
      q: "What is CLIP trained to do?",
      answer: "Predict which caption goes with which image, across a large batch of pairs",
      wrong: ["Generate an image from a caption", "Write a caption word by word", "Classify images into 1,000 fixed labels"],
      why: "Matching pairs get a high cosine, mismatched ones low. The result is an image encoder whose vectors line up with text, good for search and zero-shot labels and as a VLM's eyes." },
    { id: "dynamic", level: "hard", kind: "concept",
      q: "A model processes images at their own resolution instead of resizing to one fixed size. What is the effect?",
      answer: "Different images give different numbers of visual tokens; detail is kept, and cost follows image size",
      wrong: ["Every image gives the same number of tokens", "Images no longer need a vision encoder", "It only works for square images"],
      why: "A fixed size squashes wide or detailed images. Variable token counts keep detail, as some recent models do, but a large image now costs many tokens." },
    { id: "small-text", level: "easy", kind: "concept",
      q: "A VLM misreads the small print on a scanned invoice. What should you try first?",
      answer: "Send it at higher resolution, or crop or tile the part with the small print",
      wrong: ["Raise the temperature", "Convert the image to black and white text first", "Ask the model to think step by step"],
      why: "If the patches are too coarse, the letters are a blur before the language model ever sees them. More pixels on the region that matters gives the encoder something to read." },
    { id: "pdf", level: "medium", kind: "concept",
      q: "When is sending page images better than extracting the PDF's text for a model?",
      answer: "When the meaning is in the layout: charts, tables, scans and forms",
      wrong: ["Always, because images are cheaper than text", "Never, because models cannot read images of text", "Only when the PDF is a single page"],
      why: "Text extraction loses position, chart marks and scanned content. It is cheaper for plain prose. Compare both on your own documents." },
    { id: "t336", level: "easy", kind: "numeric",
      q: "How many patch tokens does a 336 × 336 image make with 14 pixel patches?",
      answer: n0(S336), wrong: [n0(336 / 14), n0((336 * 336) / 14), n0(T224)],
      why: `${336 / 14} patches across and ${336 / 14} down: ${336 / 14}² = ${n0(S336)}. Patches count in two dimensions, so the count is a square.` },
    { id: "tiles", level: "medium", kind: "numeric",
      q: `A ${SW} × ${SH} screenshot is cut into 448 pixel tiles, plus one overview tile, each tile ${n0(PER_TILE)} tokens. How many tokens in all?`,
      answer: n0(TT), wrong: [n0(TN * PER_TILE), n0(patchTokens(SW, SH, 14)), n0((TN + 1) * 256)],
      why: `${Math.ceil(SW / 448)} × ${Math.ceil(SH / 448)} = ${TN} tiles, rounded up, plus 1 overview: ${TN + 1} × ${n0(PER_TILE)} = ${n0(TT)}. A partly filled tile still costs a whole tile.` },
    { id: "out", level: "easy", kind: "output",
      q: "What does this print?",
      code: "side, patch = 448, 14\nprint((side // patch) ** 2)",
      answer: String(O448), wrong: [String(448 / 14), String(448 * 448), String(O448 / 2)],
      why: `448 / 14 = ${448 / 14} patches per side, ${448 / 14}² = ${O448} tokens for one 448 tile.` },
    { id: "explain-see", level: "medium", kind: "explain",
      q: "Explain how a language model reads an image.",
      answer: `The image is resized or tiled and cut into patches, for example 14 × 14 pixels. A vision encoder, a transformer over the patches, turns each into a vector that knows its neighbours. A projector maps these vectors to the language model's embedding size.\n\nThe image tokens are placed in the prompt next to the text tokens, and the model attends over all of them as usual. A 224 pixel square at 14 pixel patches is ${T224} tokens, and bigger images cost more.` },
    { id: "explain-cost", level: "hard", kind: "explain",
      q: "Your document feature sends many large images and is too expensive. What do you change?",
      answer: "- Resize to the smallest size that still answers the question: tokens grow with area, so half the sides is a quarter of the tokens.\n- Crop to the region you need, or detect it first and send only that.\n- For text-heavy pages, compare extracting the text against sending the image.\n- Cache stable images or documents if your API supports prompt caching.\n- Route easy pages to a smaller model, and measure accuracy so savings do not break extraction." },
    { id: "explain-extract", level: "hard", kind: "explain",
      q: "Design receipt extraction with a VLM that you can trust in production.",
      answer: "Send the receipt image at a resolution where the smallest print is readable, then the instruction. Ask for output in a strict schema (merchant, date, items, total) using structured output.\n\nThen validate in code: totals add up, dates parse, currency is known. Route failures and low-confidence results to a person. Build an eval set of real receipts, including blurry and rotated ones, and track field-level accuracy whenever you change the model or the prompt." },
    { id: "trap-area", level: "easy", kind: "trap",
      claim: "For patch-based vision encoders, an image's token count grows with its area.",
      truth: true,
      why: `Patches tile both dimensions. Doubling width and height gives four times the patches: ${n0(HALF)} to ${n0(FULL)} in the example above.` },
    { id: "trap-pixels", level: "medium", kind: "trap",
      claim: "In an encoder-plus-LLM model, the language model reads the raw pixel values directly.",
      truth: false,
      why: "The LLM never sees pixels. The vision encoder turns patches into vectors and the projector maps them to its embedding size; the LLM reads those." },
  ],
  real: [
    { who: "Alexey Dosovitskiy and co-authors", when: "2020",
      what: "An Image is Worth 16x16 Words applied a pure Transformer to sequences of image patches. Pre-trained on large data, the Vision Transformer matched strong convolutional networks on ImageNet, CIFAR-100 and VTAB with substantially less training compute.",
      takeaway: "Treating patches as words made images fit the same machinery as text.",
      url: "https://arxiv.org/abs/2010.11929" },
    { who: "Alec Radford and co-authors", when: "2021",
      what: "CLIP learned from 400 million image and text pairs by predicting which caption goes with which image. Zero-shot, it matched the original ResNet-50's ImageNet accuracy without using its 1.28 million training examples.",
      takeaway: "Matching images to text gives an encoder that understands open-ended descriptions.",
      url: "https://arxiv.org/abs/2103.00020" },
    { who: "Haotian Liu and co-authors", when: "2023",
      what: "LLaVA connected a vision encoder to a language model and trained them end to end on instruction data that a text-only model generated. It reached an 85.1% relative score against GPT-4 on a synthetic benchmark, and 92.53% on ScienceQA combined with GPT-4.",
      takeaway: "A simple encoder, projector and LLM recipe became the template for open VLMs.",
      url: "https://arxiv.org/abs/2304.08485" },
    { who: "The Qwen team", when: "2024",
      what: "Qwen2-VL turns images of different sizes into different numbers of visual tokens (naive dynamic resolution) and uses M-RoPE to share position information across text, images and video. It came in 2B, 8B and 72B sizes.",
      takeaway: "Keeping native resolution trades more tokens for detail, which matters for documents.",
      url: "https://arxiv.org/abs/2409.12191" },
  ],
};
