/**
 * # 🧠 Part 13: Generative Models & LLMs
 * > **AlgoLib ML Notes** — *Comprehensive AI/ML Reference*
 *
 * \`FILE: 13_Generative_Models_LLMs\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: TYPES OF GENERATIVE MODELS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎨 Generative vs Discriminative
 * Generative Models learn the DATA DISTRIBUTION `p(x)` to generate NEW samples that look like real data.
 *
 * | Model Type | Mechanism | Best For |
 * |---|---|---|
 * | **VAE** | Encode → latent `z` → Decode | Smooth latent space, controllable generation |
 * | **GAN** | Generator vs Discriminator game | High-quality photorealistic images |
 * | **Diffusion** | Add/Remove noise iteratively | SOTA image gen (DALL·E, Stable Diffusion) |
 * | **Autoregressive** | Predict next token left to right | Text generation (GPT, LLaMA) |
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: VAE — VARIATIONAL AUTOENCODER
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🗜️ Compress and Sample
 *
 * VAEs encode inputs into a **distribution** (mean and std), not a single point.
 *
 * **Reparameterization Trick:** `z = μ + σ·ε,  ε ~ N(0,1)`
 * This allows gradients to flow backwards through the random sampling step!
 *
 * **Loss = Reconstruction Loss + KL Divergence**
 * The KL term forces the latent space to be continuous and smooth.
 */

const vaeCode = `
import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, in_dim=784, hidden_dim=512, latent_dim=32):
        super().__init__()
        # Encoder
        self.enc = nn.Sequential(nn.Linear(in_dim, hidden_dim), nn.ReLU())
        self.mu_layer  = nn.Linear(hidden_dim, latent_dim)
        self.log_var_layer = nn.Linear(hidden_dim, latent_dim)
        
        # Decoder
        self.dec = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, in_dim), nn.Sigmoid()
        )
    
    def reparameterize(self, mu, log_var):
        std = torch.exp(0.5 * log_var)
        eps = torch.randn_like(std)
        return mu + eps * std
    
    def forward(self, x):
        h = self.enc(x)
        mu, log_var = self.mu_layer(h), self.log_var_layer(h)
        z = self.reparameterize(mu, log_var)
        return self.dec(z), mu, log_var

def vae_loss(x_recon, x, mu, log_var, beta=1.0):
    recon_loss = F.binary_cross_entropy(x_recon, x, reduction='sum')
    kl_loss = -0.5 * torch.sum(1 + log_var - mu.pow(2) - log_var.exp())
    return recon_loss + beta * kl_loss
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: GANs — GENERATIVE ADVERSARIAL NETWORKS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🕵️‍♂️ The Forger and the Detective Analogy
 * 
 * ![GAN Architecture](/gan_architecture.svg)
 *
 * - **Generator (Forger):** Creates fake data from random noise.
 * - **Discriminator (Detective):** Classifies real vs fake.
 *
 * They play a minimax game until the Generator is so good, the Discriminator is at 50/50 guessing.
 *
 * > **Warning: Mode Collapse**
 * > A common GAN failure where the generator only generates a few specific types of samples because it found a vulnerability in the discriminator.
 */

const ganCode = `
import torch
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self, z_dim=100, out_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(z_dim, 256), nn.LeakyReLU(0.2), nn.BatchNorm1d(256),
            nn.Linear(256, 512), nn.LeakyReLU(0.2), nn.BatchNorm1d(512),
            nn.Linear(512, out_dim), nn.Tanh()  # Output in [-1, 1]
        )
    def forward(self, z): return self.net(z)

class Discriminator(nn.Module):
    def __init__(self, in_dim=784):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 512), nn.LeakyReLU(0.2), nn.Dropout(0.3),
            nn.Linear(512, 256), nn.LeakyReLU(0.2), nn.Dropout(0.3),
            nn.Linear(256, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

# Training sketch:
# 1. D_loss = BCE(D(real), 1) + BCE(D(G(z).detach()), 0)
# 2. G_loss = BCE(D(G(z)), 1)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: DIFFUSION MODELS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📺 The Static TV Analogy
 *
 * - **Forward Process:** Gradually add Gaussian noise to an image until it's pure static.
 * - **Reverse Process:** Train a U-Net to predict and subtract the noise at each step.
 *
 * **Latent Diffusion (Stable Diffusion):** Runs the diffusion process in a tiny, compressed VAE latent space (e.g., 64x64) instead of pixel space. This is why SD runs on consumer GPUs!
 */

const diffusionUsageCode = `
# pip install diffusers accelerate
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

# ── Text-to-Image ─────────────────────────────────────────
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16     # FP16 for memory efficiency
).to(device)

image = pipe(
    prompt="A photorealistic cat wearing a space suit, 4k",
    negative_prompt="blurry, deformed",
    num_inference_steps=30,     # More steps = better quality
    guidance_scale=7.5          # CFG: how much to follow prompt
).images[0]

# ── Image-to-Image ────────────────────────────────────────
from PIL import Image
img2img = StableDiffusionImg2ImgPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16
).to(device)

init_image = Image.open("sketch.jpg")
output = img2img(
    prompt="Detailed oil painting", image=init_image,
    strength=0.75, guidance_scale=7.5
).images[0]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: LARGE LANGUAGE MODELS (LLMs) & PROMPTING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ✍️ The World's Best Autocomplete
 *
 * LLMs are autoregressive transformers predicting the next token.
 *
 * | Hyperparameter | What it does |
 * |---|---|
 * | **Temperature** | Controls randomness (0 = deterministic, 1 = creative). |
 * | **Top-p (Nucleus)** | Samples from smallest set of tokens with cumulative prob > p. |
 *
 * **Prompting Techniques:**
 * 1. **Zero-shot:** Ask directly.
 * 2. **Few-shot:** Provide examples.
 * 3. **Chain-of-Thought (CoT):** Add *"Let's think step by step"* to improve reasoning.
 */

const llmPromptingCode = `
# ── OpenAI API ────────────────────────────────────────────
from openai import OpenAI
client = OpenAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful expert."},
        {"role": "user", "content": "Explain the vanishing gradient problem."}
    ],
    temperature=0.7
)
print(response.choices[0].message.content)

# ── Local LLMs (HuggingFace) ──────────────────────────────
from transformers import pipeline
import torch

pipe = pipeline(
    "text-generation", 
    model="meta-llama/Meta-Llama-3-8B-Instruct", 
    model_kwargs={"torch_dtype": torch.float16}, 
    device_map="auto"
)

response = pipe([{"role": "user", "content": "What is gradient descent?"}], max_new_tokens=256)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: RAG — RETRIEVAL AUGMENTED GENERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📚 The Open-Book Exam Analogy
 *
 * RAG prevents LLM hallucination by fetching real documents.
 * 1. **INDEX:** Split private docs into chunks → Embed into vectors → Store in Vector DB.
 * 2. **RETRIEVE:** Search DB for chunks matching the user's question.
 * 3. **GENERATE:** Inject retrieved chunks into the LLM prompt.
 */

const ragCode = `
# pip install langchain langchain-openai langchain-chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain.chains import RetrievalQA

# 1. Load & Chunk
docs = TextLoader("company_policy.txt").load()
chunks = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_documents(docs)

# 2. Embed & Store
vectorstore = Chroma.from_documents(chunks, OpenAIEmbeddings())
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# 3. RAG Chain
llm = ChatOpenAI(model="gpt-4o", temperature=0)
qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

result = qa_chain.invoke({"query": "What is the vacation policy?"})
print(result["result"])
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 REMEMBER: KEY POINTS SUMMARY
// ═══════════════════════════════════════════════════════════════════

/**
 * 📌 MUST REMEMBER:
 *
 * 1. **VAE Trick:** Reparameterization (`z = μ + σ·ε`) makes it differentiable.
 * 2. **Diffusion Params:** `num_inference_steps` (20-50), `guidance_scale` (7-8).
 * 3. **RAG vs Fine-tuning:** Use RAG for adding factual knowledge; fine-tuning for changing format/tone.
 * 4. **LLM Temp:** Lower temp (0.0) for coding/factual tasks, higher (0.7+) for creative.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 14_MLOps_Deployment
// ─────────────────────────────────────────────────────────────────

export {};
