/**
 * # 🧠 Part 11: RNNs, NLP & Transformers
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 11_RNN_NLP_Transformers\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: SEQUENCE MODELING — RNNs
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Reading Comprehension Analogy
 *
 * When you read a sentence, you remember what came before. The word "bank" means something completely different in "I walked to the river bank" vs "I deposited money at the bank." You know the meaning because of the **context** from previous words.
 *
 * Regular MLPs can't do this — they process each input independently. **RNNs** solve this by maintaining a **hidden state** — a memory that gets updated at each step of the sequence.
 *
 * ---
 *
 * ### 📐 The RNN Formula
 *
 * > **hₜ = tanh(Wₕₕ · hₜ₋₁ + Wₓₕ · xₜ + b)**
 *
 * - `hₜ` = current hidden state (the memory at time step t)
 * - `hₜ₋₁` = previous hidden state (what we remembered before)
 * - `xₜ` = current input (the current word/token)
 *
 * ---
 *
 * ### 💥 The Vanishing Gradient Problem
 *
 * Basic RNNs fail on long sequences because gradients shrink exponentially as they propagate backwards through 100+ time steps. The model effectively "forgets" what happened early in the sequence.
 *
 * **Solutions:**
 *
 * | Model | How it fixes vanishing gradient | Complexity |
 * |---|---|---|
 * | **LSTM** | Cell state acts as a "conveyor belt" — info flows with minimal modification via gating | High (4 gates) |
 * | **GRU** | Simpler 2-gate version of LSTM — reset + update gates | Medium (2 gates) |
 * | **Transformer** | No recurrence at all — uses Attention to connect any two positions directly | High (but parallelizable) |
 */

const rnnCode = `
import torch
import torch.nn as nn

# ── Basic RNN (for reference — use LSTM/GRU in practice) ──
rnn = nn.RNN(
    input_size=10,      # Features per time step
    hidden_size=64,     # Hidden state dimension
    num_layers=2,       # Stacked layers
    batch_first=True,   # Input shape: [batch, seq_len, features]
    dropout=0.3,        # Between stacked layers (not applied to last layer)
    bidirectional=False
)
x  = torch.randn(32, 100, 10)  # 32 sequences, length 100, 10 features each
h0 = torch.zeros(2, 32, 64)   # [num_layers, batch, hidden_size]

output, hn = rnn(x, h0)
print(f"All hidden states: {output.shape}")  # [32, 100, 64]
print(f"Last hidden state: {hn.shape}")      # [2, 32, 64]

# ── LSTM (most common RNN variant) ────────────────────────
lstm = nn.LSTM(
    input_size=10,
    hidden_size=64,
    num_layers=2,
    batch_first=True,
    dropout=0.3,
    bidirectional=True   # Reads sequence forwards AND backwards!
)
h0 = torch.zeros(4, 32, 64)   # 2 layers × 2 directions
c0 = torch.zeros(4, 32, 64)   # Cell state — unique to LSTM

output, (hn, cn) = lstm(x, (h0, c0))
print(f"BiLSTM output: {output.shape}")  # [32, 100, 128] — 64 × 2 directions

# For classification: use the last hidden state
last_fwd  = hn[-2, :, :]   # Forward direction, last layer
last_bwd  = hn[-1, :, :]   # Backward direction, last layer
combined  = torch.cat([last_fwd, last_bwd], dim=-1)  # [32, 128]

# ── GRU (simpler than LSTM, often similar performance) ────
gru = nn.GRU(input_size=10, hidden_size=64, batch_first=True, bidirectional=True)
out, hn = gru(x)
print(f"BiGRU output: {out.shape}")  # [32, 100, 128]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: LSTM GATES — HOW MEMORY WORKS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔑 LSTM's Four Gates
 *
 * LSTM has two things that flow through it: the **hidden state** `h` (short-term memory) and the **cell state** `C` (long-term memory — the conveyor belt).
 *
 * | Gate | Formula | Purpose |
 * |---|---|---|
 * | **Forget Gate** | `fₜ = σ(Wf · [hₜ₋₁, xₜ] + bf)` | What to erase from long-term memory (0=forget, 1=keep) |
 * | **Input Gate** | `iₜ = σ(Wi · [hₜ₋₁, xₜ] + bi)` | What new information to write to memory |
 * | **Candidate** | `C̃ₜ = tanh(Wc · [hₜ₋₁, xₜ] + bc)` | The candidate values to potentially write |
 * | **Output Gate** | `oₜ = σ(Wo · [hₜ₋₁, xₜ] + bo)` | What portion of memory to expose as output |
 *
 * **Cell State Update:** `Cₜ = fₜ ⊙ Cₜ₋₁ + iₜ ⊙ C̃ₜ`
 * (Forget some old info + Write some new info)
 *
 * **Hidden State:** `hₜ = oₜ ⊙ tanh(Cₜ)`
 *
 * > **GRU simplification:** GRU combines the forget and input gates into a single "update gate" and eliminates the separate cell state — same capability, fewer parameters.
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: NLP FUNDAMENTALS & TEXT PREPROCESSING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📝 The NLP Pipeline
 *
 * ```
 * Raw Text → Tokenization → Numericalization → Embedding → Model → Output
 * ```
 *
 * ---
 *
 * ### 🔤 Text Vectorization Methods
 *
 * | Method | Idea | Best For |
 * |---|---|---|
 * | **Bag of Words** | Count word occurrences, ignore order | Simple baselines |
 * | **TF-IDF** | Weight words by how unique they are to a document | Classic text classification |
 * | **Word Embeddings** | Dense 300D vector per word — captures meaning | RNN-based models |
 * | **Subword Tokenization** | Split words into pieces (BPE, WordPiece) | **Transformers (BERT, GPT)** |
 *
 * ---
 *
 * ### 📊 TF-IDF Explained
 *
 * **TF (Term Frequency):** How often does the word appear in this document?
 * **IDF (Inverse Document Frequency):** How rare is the word across all documents?
 *
 * Words that are frequent in ONE document but rare overall (like "photosynthesis" in a biology article) get high TF-IDF — they're informative. Common words like "the" appear everywhere → low IDF → low TF-IDF.
 */

const classicNLPCode = `
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# ── Text Cleaning ─────────────────────────────────────────
def clean_text(text: str) -> str:
    text   = text.lower()
    text   = re.sub(r'<.*?>', '', text)          # Remove HTML tags
    text   = re.sub(r'[^a-z\\s]', '', text)      # Keep only letters + spaces
    text   = re.sub(r'\\s+', ' ', text).strip()  # Normalize whitespace
    return text

texts  = ["Machine learning is amazing!", "I hate spam emails.", "Buy now!!!"]
labels = [0, 1, 1]   # 0=not spam, 1=spam

cleaned = [clean_text(t) for t in texts]

# ── TF-IDF Vectorization ──────────────────────────────────
tfidf = TfidfVectorizer(
    max_features=10000,   # Vocabulary size limit
    ngram_range=(1, 2),   # Use single words AND two-word phrases
    min_df=2,             # Ignore words appearing in fewer than 2 documents
    max_df=0.95,          # Ignore words appearing in >95% of documents
    sublinear_tf=True     # Apply log(1 + tf) — dampens very frequent words
)
X = tfidf.fit_transform(cleaned)
print(f"TF-IDF shape: {X.shape}")   # (3, n_vocabulary_terms)

# ── End-to-End Classification Pipeline ───────────────────
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000,
                               sublinear_tf=True)),
    ('clf',   LogisticRegression(C=1.0, max_iter=1000))
])
# Fit, predict — no manual preprocessing needed!
pipeline.fit(train_texts, train_labels)
preds = pipeline.predict(test_texts)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: WORD EMBEDDINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🗺️ Words as Points in Space
 *
 * Word embeddings map every word to a point in a 100–300 dimensional space. Words with similar meanings cluster together. This enables remarkable **semantic arithmetic**:
 *
 * > **king − man + woman ≈ queen**
 *
 * The vector from "man" to "king" (royalty) is the same direction as the vector from "woman" to "queen". The model learned the concept of royalty without being told!
 *
 * ---
 *
 * ### 📊 Embedding Comparison
 *
 * | Embedding | Year | Key Feature |
 * |---|---|---|
 * | **Word2Vec** | 2013 | Skip-gram and CBOW. Fast to train. Static (one vector per word). |
 * | **GloVe** | 2014 | Uses global co-occurrence statistics. Often slightly better than Word2Vec. |
 * | **FastText** | 2016 | Subword embeddings — handles rare/misspelled words. |
 * | **BERT Embeddings** | 2018 | **Contextual** — "bank" gets different vectors in different contexts. |
 *
 * > **Static vs Contextual:** Word2Vec/GloVe give "bank" one fixed vector always. BERT gives "bank" a different vector depending on the surrounding sentence.
 */

const wordEmbeddingsCode = `
import torch
import torch.nn as nn

# ── PyTorch Embedding Layer ───────────────────────────────
vocab_size = 10000
embed_dim  = 128

embedding = nn.Embedding(
    num_embeddings=vocab_size,
    embedding_dim=embed_dim,
    padding_idx=0             # Token 0 = padding, always maps to zero vector
)

# Input: integer token IDs (from tokenizer)
token_ids = torch.tensor([[1, 5, 3, 0, 0],   # Padded sequence
                           [2, 7, 8, 4, 6]])
embedded  = embedding(token_ids)
print(embedded.shape)   # [2, 5, 128] — 2 sequences, 5 tokens, 128-dim vectors

# ── Load Pretrained GloVe / Word2Vec ──────────────────────
import numpy as np

# Suppose we loaded glove_vectors from gensim
vocab = {'pad': 0, 'king': 1, 'queen': 2, 'man': 3, 'woman': 4}
glove_dim = 100

embed_matrix = np.zeros((len(vocab), glove_dim))
for word, idx in vocab.items():
    if word in glove_vectors:                  # glove_vectors from gensim
        embed_matrix[idx] = glove_vectors[word]

# Load into a PyTorch Embedding layer
pretrained_embed = nn.Embedding.from_pretrained(
    torch.FloatTensor(embed_matrix),
    freeze=False,    # False = fine-tune during training; True = keep frozen
    padding_idx=0
)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: ATTENTION & TRANSFORMERS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔦 The Spotlight Analogy
 *
 * When translating "The cat sat on the mat" to French, not every word is equally important for translating each output word. **Attention** is like a spotlight — when generating "chat" (cat), the model focuses strongly on "cat" in the input.
 *
 * ---
 *
 * ### 📐 Scaled Dot-Product Attention
 *
 * > **Attention(Q, K, V) = softmax(Q · Kᵀ / √d_k) · V**
 *
 * - **Q (Query):** "What am I looking for?" — the current token's question
 * - **K (Key):** "What do I contain?" — each token's label
 * - **V (Value):** "What do I give you?" — each token's actual information
 * - **√d_k:** Scaling to prevent dot products from getting too large for softmax
 *
 * ---
 *
 * ### 🆚 RNN vs Transformer — Why Transformers Won
 *
 * | Aspect | RNN / LSTM | Transformer |
 * |---|---|---|
 * | **Processing** | Sequential — must wait for step t before t+1 | Fully **parallel** — all tokens at once |
 * | **Long-range dependencies** | Gradient vanishes over distance | O(1) — any two tokens attend directly |
 * | **Training speed** | Slow (sequential) | Fast (GPU-parallelizable) |
 * | **Memory** | O(sequence length) hidden state | O(n²) attention matrix |
 * | **Scale** | Doesn't scale well | Scales amazingly with data + compute |
 */

const attentionCode = `
import torch
import torch.nn as nn
import math

class ScaledDotProductAttention(nn.Module):
    def __init__(self, d_k: int):
        super().__init__()
        self.scale = math.sqrt(d_k)

    def forward(self, Q, K, V, mask=None):
        # Q, K, V: [batch, heads, seq_len, d_k]
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale
        # scores: [batch, heads, seq_len, seq_len] — each token's attention to all others

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))  # Causal mask for GPT

        attn_weights = torch.softmax(scores, dim=-1)  # Rows sum to 1
        output       = torch.matmul(attn_weights, V)  # Weighted sum of values
        return output, attn_weights

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0, "d_model must be divisible by n_heads"

        self.n_heads = n_heads
        self.d_k     = d_model // n_heads   # Each head works on a smaller subspace

        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)

        self.attn    = ScaledDotProductAttention(self.d_k)
        self.dropout = nn.Dropout(dropout)

    def forward(self, Q, K, V, mask=None):
        B = Q.size(0)  # Batch size

        # Project → split into heads: [B, seq, d_model] → [B, heads, seq, d_k]
        Q = self.W_Q(Q).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_K(K).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_V(V).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)

        out, _ = self.attn(Q, K, V, mask)

        # Merge heads: [B, heads, seq, d_k] → [B, seq, d_model]
        out = out.transpose(1, 2).contiguous().view(B, -1, self.n_heads * self.d_k)
        return self.W_O(out)

# Test
mha = MultiHeadAttention(d_model=512, n_heads=8)
x   = torch.randn(4, 64, 512)   # [batch=4, seq_len=64, d_model=512]
out = mha(x, x, x)              # Self-attention: Q = K = V = x
print(f"MHA output: {out.shape}")   # [4, 64, 512]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: PRETRAINED TRANSFORMERS (HUGGINGFACE)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚡ HuggingFace — NLP in 5 Lines
 *
 * Training a BERT from scratch takes weeks on 64 GPUs. HuggingFace gives you pretrained state-of-the-art models you can fine-tune in hours on a single GPU.
 *
 * ---
 *
 * ### 🏆 Key Models
 *
 * | Model | Architecture | Best For |
 * |---|---|---|
 * | **BERT** | Encoder-only, bidirectional | Classification, NER, Q&A |
 * | **DistilBERT** | BERT at 60% size, 97% performance | When speed matters |
 * | **GPT-2** | Decoder-only, left-to-right | Text generation, completion |
 * | **T5** | Encoder-Decoder | Translation, summarization, any seq2seq |
 * | **RoBERTa** | Improved BERT training | Better classification than BERT |
 *
 * ---
 *
 * ### 🎯 Fine-tuning Learning Rates
 *
 * | Component | Learning Rate |
 * |---|---|
 * | Pretrained layers (BERT body) | 2e-5 to 5e-5 (very small!) |
 * | Classification head (new layer) | 1e-4 to 1e-3 |
 *
 * > **Catastrophic Forgetting:** Using too high a LR destroys what BERT learned during pretraining. Always use tiny learning rates for fine-tuning.
 */

const huggingfaceCode = `
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    pipeline, Trainer, TrainingArguments
)
from datasets import load_dataset
import torch

# ── Quick Inference (zero-code NLP tasks) ─────────────────
sentiment = pipeline("sentiment-analysis")
results   = sentiment(["I love this!", "This is terrible."])
print(results)   # [{'label': 'POSITIVE', 'score': 0.998}, ...]

qa = pipeline("question-answering")
answer = qa(question="What is the capital of France?",
            context="France is a country in Europe. Paris is its capital.")
print(answer['answer'])  # 'Paris'

generator = pipeline("text-generation", model="gpt2")
out = generator("The future of AI is", max_new_tokens=50)
print(out[0]['generated_text'])

# ── Load and Tokenize ─────────────────────────────────────
model_name = "distilbert-base-uncased"  # Smaller, faster BERT
tokenizer  = AutoTokenizer.from_pretrained(model_name)
model      = AutoModelForSequenceClassification.from_pretrained(
    model_name, num_labels=2
)

# Tokenize raw text
texts    = ["This movie is great!", "Worst film ever."]
encoding = tokenizer(
    texts,
    truncation=True,       # Clip to max_length
    padding=True,          # Pad shorter sequences
    max_length=128,
    return_tensors='pt'    # Return PyTorch tensors
)
print(encoding['input_ids'].shape)   # [2, max_len]

# Forward pass
with torch.no_grad():
    outputs = model(**encoding)
    preds   = torch.argmax(outputs.logits, dim=-1)
    print("Predictions:", preds)   # tensor([1, 0]) — positive, negative

# ── Fine-tuning with Trainer API ──────────────────────────
dataset  = load_dataset("imdb")

def tokenize(batch):
    return tokenizer(batch['text'], truncation=True,
                     padding='max_length', max_length=256)

tokenized = dataset.map(tokenize, batched=True)

training_args = TrainingArguments(
    output_dir="./bert-imdb",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-5,          # Must be small for fine-tuning!
    weight_decay=0.01,
    warmup_steps=500,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    fp16=True,                   # Mixed precision — 2x faster on GPU
    report_to="none"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized['train'].select(range(2000)),  # Subset for demo
    eval_dataset=tokenized['test'].select(range(500)),
    tokenizer=tokenizer
)
trainer.train()
results = trainer.evaluate()
print(f"Eval Accuracy: {results['eval_accuracy']:.4f}")
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 RNN / NLP / TRANSFORMER CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **RNN/LSTM/GRU**
 * - Basic RNN → use only for toy examples (vanishing gradient)
 * - **LSTM** → 4 gates, cell state, handles long sequences well
 * - **GRU** → 2 gates, simpler, similar performance, train faster
 * - `batch_first=True` → input/output shape is `[batch, seq, features]`
 * - Bidirectional → doubles hidden size in output
 *
 * **Attention Formula**
 * - `Attention(Q, K, V) = softmax(QKᵀ / √d_k) × V`
 * - Scale by √d_k prevents softmax from saturating
 * - Multi-head = run h attention functions in parallel, concatenate
 *
 * **Why Transformers Win**
 * - **Parallelizable** — process entire sequence simultaneously
 * - **O(1) path length** — any two positions connect directly via attention
 * - Scales with data: more data + more compute = consistently better
 *
 * **BERT vs GPT**
 * - BERT (Encoder): bidirectional, masked language modeling → classification, NER, Q&A
 * - GPT (Decoder): left-to-right, next token prediction → generation, completion
 * - T5 (Encoder-Decoder): seq2seq tasks → translation, summarization
 *
 * **HuggingFace Fine-tuning**
 * - LR for BERT body: `2e-5` (tiny — avoid catastrophic forgetting)
 * - LR for classifier head: `1e-4` to `1e-3`
 * - Always use `warmup_steps` (500 is a good default)
 * - `fp16=True` for 2× speed on NVIDIA GPUs with Tensor Cores
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 12_Reinforcement_Learning
// ─────────────────────────────────────────────────────────────────

export { };
