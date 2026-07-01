/**
 * # 🧠 Part 9: Neural Networks & Deep Learning
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 09_Neural_Networks_Deep_Learning\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS A NEURAL NETWORK?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Brain Inspiration
 *
 * Your brain has ~86 billion neurons. Each neuron receives electrical signals from others, processes them, and fires an output signal to the next neuron — but only if the input is strong enough.
 *
 * An **Artificial Neuron** mimics this exactly:
 * 
 * ![Neural Network Architecture](/neural_network.svg)
 */

/**
 * - `x` = inputs (your features)
 * - `w` = weights (importance of each input — LEARNED from data)
 * - `b` = bias (shifts the activation threshold)
 * - `z` = weighted sum (pre-activation value)
 * - `f()` = activation function (adds non-linearity)
 * - `a` = final output of the neuron
 *
 * ---
 *
 * ### ⚡ Activation Functions
 *
 * Without activation functions, a neural network is just linear regression, no matter how many layers you add. Activation functions introduce **non-linearity**, enabling the network to learn complex patterns.
 *
 * | Function | Formula | Range | Best For |
 * |---|---|---|---|
 * | **Sigmoid** | `1 / (1 + e⁻ᶻ)` | (0, 1) | Binary output layer only |
 * | **Tanh** | `(eᶻ − e⁻ᶻ) / (eᶻ + e⁻ᶻ)` | (−1, 1) | Old networks — avoid in deep layers |
 * | **ReLU** | `max(0, z)` | [0, ∞) | **Best default for hidden layers** |
 * | **Leaky ReLU** | `max(0.01z, z)` | (−∞, ∞) | Fixes dying ReLU problem |
 * | **GELU** | `z × Φ(z)` | (−∞, ∞) | Transformers (BERT, GPT) |
 * | **Softmax** | `eᶻᵢ / Σeᶻⱼ` | (0, 1), sum=1 | Multiclass output layer |
 *
 * > **The Dying ReLU Problem:** If a neuron's input is always negative, ReLU always outputs 0. The neuron "dies" and never learns. Fix: Use Leaky ReLU or ELU, or initialize weights carefully.
 */

const activationFunctionsCode = `
import torch
import torch.nn.functional as F

z = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])

# Common activations
sigmoid = torch.sigmoid(z)         # Output: [0.12, 0.27, 0.5, 0.73, 0.88]
tanh    = torch.tanh(z)            # Output: [-0.96, -0.76, 0.0, 0.76, 0.96]
relu    = F.relu(z)                # Output: [0.0, 0.0, 0.0, 1.0, 2.0]
lrelu   = F.leaky_relu(z, 0.01)   # Negative values get small gradient
gelu    = F.gelu(z)                # Smooth, used in Transformers

# Softmax for multiclass output
logits  = torch.tensor([2.0, 1.0, 0.1])
softmax = F.softmax(logits, dim=0)
print(f"Softmax: {softmax}")  # [0.659, 0.242, 0.099] — always sums to 1.0

# Rule: hidden layers → ReLU/GELU, binary output → Sigmoid, multiclass → Softmax
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: BACKPROPAGATION — HOW NETWORKS LEARN
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Student Feedback Analogy
 *
 * Imagine a student answers an exam question wrong. The teacher gives feedback (the error). The student adjusts their understanding slightly. This is backpropagation in one sentence.
 *
 * ---
 *
 * ### 📐 The Two Phases
 *
 * **Forward Pass:** Data flows left → right through the network, producing a prediction.
 *
 * **Backward Pass:** The error is propagated right → left. Using the **chain rule of calculus**, the gradient of the loss with respect to every single weight is computed. Each weight is then adjusted slightly in the direction that reduces the error.
 *
 * **Weight Update:**
 * > **W = W − α × ∂Loss/∂W**
 * - `α` = learning rate (how big each step is)
 * - `∂Loss/∂W` = gradient (which direction the error comes from)
 *
 * ---
 *
 * ### 💥 Two Gradient Problems
 *
 * | Problem | Cause | Fix |
 * |---|---|---|
 * | **Vanishing Gradient** | Gradients → 0 in deep networks using sigmoid/tanh. Weights in early layers barely update. | Use ReLU. Use Residual connections. Use BatchNorm. |
 * | **Exploding Gradient** | Gradients → ∞. Weights become NaN. | Gradient clipping (`max_norm=1.0`). Proper weight init. |
 */

const backpropCode = `
import torch
import torch.nn as nn

# ── PyTorch Autograd — Automatic Backpropagation ──────────
# PyTorch builds a dynamic computation graph on every forward pass.
# .backward() automatically computes ALL gradients via chain rule.

x = torch.randn(4, 3, requires_grad=True)   # Input
W = torch.randn(3, 2, requires_grad=True)   # Weight matrix
b = torch.zeros(2, requires_grad=True)      # Bias

z    = x @ W + b    # Matrix multiply + bias
loss = z.sum()      # Simple loss for demonstration

loss.backward()     # Chain rule: compute dL/dx, dL/dW, dL/db

print("dL/dW:", W.grad)   # Used to update W in optimizer.step()
print("dL/dx:", x.grad)   # Gradient flows all the way back to inputs

# ── Proper Weight Initialization ──────────────────────────
class InitializedNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 64)
        self.fc2 = nn.Linear(64, 1)
        self._init_weights()

    def _init_weights(self):
        # He (Kaiming) init — correct for ReLU networks
        # Prevents vanishing gradients at initialization
        nn.init.kaiming_normal_(self.fc1.weight, nonlinearity='relu')
        nn.init.zeros_(self.fc1.bias)
        # Xavier init — for output with linear/sigmoid
        nn.init.xavier_uniform_(self.fc2.weight)
        nn.init.zeros_(self.fc2.bias)

    def forward(self, x):
        return self.fc2(torch.relu(self.fc1(x)))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: BUILDING NETWORKS WITH PYTORCH
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏗️ PyTorch Core Concepts
 *
 * | Concept | What it is |
 * |---|---|
 * | **Tensor** | Like a NumPy array, but can live on GPU and supports autograd |
 * | **nn.Module** | Base class for all neural networks — subclass this |
 * | **nn.Sequential** | Chain layers together in order without writing forward() |
 * | **DataLoader** | Handles batching, shuffling, parallel loading of your dataset |
 * | **Optimizer** | Applies gradient updates to weights (`optimizer.step()`) |
 * | **Loss Function** | Measures how wrong predictions are — the number to minimize |
 *
 * > **Framework Choice:** PyTorch is the dominant choice for research (80%+ of ML papers). TensorFlow/Keras is still common in production at some companies. Both do the same things.
 */

const pytorchModelCode = `
import torch
import torch.nn as nn

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using: {device}")   # cuda:0 is ~50-100x faster than cpu for large nets

# ── Feedforward Neural Network (MLP) ─────────────────────
class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dims, output_dim, dropout=0.3):
        super(MLP, self).__init__()

        layers  = []
        in_dim  = input_dim

        for h_dim in hidden_dims:
            layers.extend([
                nn.Linear(in_dim, h_dim),
                nn.BatchNorm1d(h_dim),  # Normalize activations → stable training
                nn.ReLU(),
                nn.Dropout(dropout)     # Randomly zero dropout% of neurons
            ])
            in_dim = h_dim

        layers.append(nn.Linear(in_dim, output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)

# Instantiate the model
model = MLP(
    input_dim=20,
    hidden_dims=[256, 128, 64],  # Three hidden layers
    output_dim=1,                # Binary: 1 neuron + sigmoid threshold
    dropout=0.3
).to(device)

# Count parameters
total   = sum(p.numel() for p in model.parameters())
trained = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total params: {total:,}")
print(f"Trainable:    {trained:,}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: THE TRAINING LOOP
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔄 The 5-Step Training Loop
 *
 * Every single training iteration follows exactly these 5 steps:
 *
 * | Step | Code | Why |
 * |---|---|---|
 * | **1. Zero gradients** | `optimizer.zero_grad()` | PyTorch accumulates grads by default — must reset each batch |
 * | **2. Forward pass** | `output = model(X)` | Compute predictions for this batch |
 * | **3. Compute loss** | `loss = criterion(output, y)` | Measure how wrong the predictions are |
 * | **4. Backward pass** | `loss.backward()` | Compute gradients for all weights via chain rule |
 * | **5. Update weights** | `optimizer.step()` | Adjust weights in direction that reduces loss |
 *
 * ---
 *
 * ### 📋 Loss Function Guide
 *
 * | Task | Loss Function | Note |
 * |---|---|---|
 * | Binary Classification | `BCEWithLogitsLoss` | Includes sigmoid internally — more stable |
 * | Multiclass Classification | `CrossEntropyLoss` | Includes softmax internally |
 * | Regression | `MSELoss` or `L1Loss` | L1 is robust to outliers |
 *
 * > **Critical:** Do NOT apply sigmoid before `BCEWithLogitsLoss` or softmax before `CrossEntropyLoss`. They do it internally in a numerically stable way.
 */

const trainingLoopCode = `
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# ── Prepare DataLoader ────────────────────────────────────
X_t = torch.FloatTensor(X_train_scaled)
y_t = torch.FloatTensor(y_train).unsqueeze(1)  # Shape: [n, 1]

dataset = TensorDataset(X_t, y_t)
loader  = DataLoader(dataset, batch_size=64, shuffle=True)

X_val_t = torch.FloatTensor(X_val_scaled).to(device)
y_val_t = torch.FloatTensor(y_val).unsqueeze(1).to(device)

# ── Model + Loss + Optimizer + Scheduler ─────────────────
model     = MLP(20, [128, 64], 1).to(device)
criterion = nn.BCEWithLogitsLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=5)

# ── Training Loop with Early Stopping ────────────────────
best_val_loss    = float('inf')
patience_counter = 0
PATIENCE         = 15

for epoch in range(200):
    # ─ Training phase ─
    model.train()
    train_loss = 0.0

    for batch_X, batch_y in loader:
        batch_X = batch_X.to(device)
        batch_y = batch_y.to(device)

        optimizer.zero_grad()                   # Step 1
        output = model(batch_X)                 # Step 2
        loss   = criterion(output, batch_y)     # Step 3
        loss.backward()                         # Step 4
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # Safety
        optimizer.step()                        # Step 5

        train_loss += loss.item() * len(batch_X)

    train_loss /= len(loader.dataset)

    # ─ Validation phase ─
    model.eval()
    with torch.no_grad():
        val_logits = model(X_val_t)
        val_loss   = criterion(val_logits, y_val_t).item()
        val_preds  = (torch.sigmoid(val_logits) > 0.5).float()
        val_acc    = (val_preds == y_val_t).float().mean().item()

    scheduler.step(val_loss)

    if (epoch + 1) % 20 == 0:
        print(f"Epoch {epoch+1:3d} | Loss: {train_loss:.4f} | Val: {val_loss:.4f} | Acc: {val_acc:.4f}")

    # ─ Early stopping ─
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        patience_counter = 0
        torch.save(model.state_dict(), 'best_model.pt')
    else:
        patience_counter += 1
        if patience_counter >= PATIENCE:
            print(f"Early stopping at epoch {epoch+1}")
            break

# Load the best checkpoint
model.load_state_dict(torch.load('best_model.pt'))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: OPTIMIZERS & LEARNING RATE SCHEDULERS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚙️ Optimizer Comparison
 *
 * | Optimizer | Key Feature | When to Use |
 * |---|---|---|
 * | **SGD** | Pure gradient descent, optionally with momentum | When you have time to tune carefully — often wins long-term |
 * | **Adam** | Adaptive learning rate per parameter | Fast convergence, great default |
 * | **AdamW** | Adam + decoupled weight decay (better regularization) | **Best default for most tasks** |
 * | **RAdam** | Rectified Adam — stable early training | When Adam diverges early |
 *
 * ---
 *
 * ### 📉 Learning Rate Schedulers
 *
 * | Scheduler | Behavior | Best For |
 * |---|---|---|
 * | `ReduceLROnPlateau` | Halve LR when val loss stops improving | General training |
 * | `CosineAnnealingLR` | Smoothly decrease LR following cosine curve | Long training runs |
 * | `OneCycleLR` | Warmup → peak → decay in one cycle | Fast training (superconvergence) |
 * | `StepLR` | Multiply by gamma every N epochs | Simple, predictable |
 */

const optimizersCode = `
import torch.optim as optim

# AdamW — best default
optimizer = optim.AdamW(
    model.parameters(),
    lr=1e-3,            # Start here; tune between 1e-4 and 1e-2
    betas=(0.9, 0.999), # Exponential decay rates for moment estimates
    weight_decay=1e-4   # L2 regularization strength
)

# SGD with Nesterov momentum — powerful with careful tuning
sgd = optim.SGD(
    model.parameters(),
    lr=0.01, momentum=0.9,
    weight_decay=1e-4, nesterov=True
)

# ── Schedulers ────────────────────────────────────────────
# Reduce on plateau (most common)
sched = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=5, verbose=True
)

# Cosine annealing (smooth)
sched_cos = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

# One-cycle (fast training) — call sched.step() EVERY BATCH
sched_one = optim.lr_scheduler.OneCycleLR(
    optimizer, max_lr=1e-3,
    steps_per_epoch=len(loader), epochs=50,
    pct_start=0.1    # 10% warmup
)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: REGULARIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🛡️ Fighting Overfitting in Deep Networks
 *
 * Deep networks have millions of parameters — they can memorize the training set perfectly if not constrained. Regularization techniques force the model to generalize.
 *
 * | Technique | How it works | Easy to add? |
 * |---|---|---|
 * | **Weight Decay (L2)** | Penalizes large weights via `weight_decay` in optimizer | ✅ One line |
 * | **Dropout** | Randomly zeros out neurons during training — forces redundancy | ✅ One line |
 * | **Batch Normalization** | Normalizes layer activations — stabilizes and regularizes | ✅ One line |
 * | **Early Stopping** | Stop when validation loss stops improving | ✅ Few lines |
 * | **Data Augmentation** | Add noise/transforms to training data — creates more variety | Medium |
 * | **Label Smoothing** | Soften one-hot targets — prevents overconfident predictions | ✅ One param |
 * | **Gradient Clipping** | Cap gradient magnitude — prevents NaN from exploding gradients | ✅ One line |
 *
 * > **Recommended order to try:** Early Stopping → Dropout → Weight Decay → BatchNorm → Data Augmentation
 */

const regularizationCode = `
import torch.nn as nn
import torch

# ── Dropout — randomly zeros neurons (only during training) ─
class ModelWithDropout(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(100, 256),
            nn.ReLU(),
            nn.Dropout(0.5),     # 50% of neurons dropped during training
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),     # 30% dropped in second layer
            nn.Linear(128, 1)
        )
    def forward(self, x):
        return self.layers(x)

# model.train()  → Dropout ACTIVE (training mode)
# model.eval()   → Dropout DISABLED (inference mode) ← very important!

# ── Batch Normalization — normalize activations ─────────
class ModelWithBN(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(100, 256),
            nn.BatchNorm1d(256),  # Normalize BEFORE activation
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )
    def forward(self, x):
        return self.layers(x)

# ── Label Smoothing — prevents overconfident predictions ──
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
# [0, 0, 1, 0] → [0.033, 0.033, 0.9, 0.033]

# ── Gradient Clipping — prevents exploding gradients ──────
loss.backward()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 NEURAL NETWORKS CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Activation Functions**
 * - Hidden layers → **ReLU** (fast, simple) or **GELU** (transformers)
 * - Binary output → **Sigmoid** (or skip and use BCEWithLogitsLoss)
 * - Multiclass output → **Softmax** (or skip and use CrossEntropyLoss)
 * - Never use Sigmoid/Tanh in deep hidden layers → vanishing gradients
 *
 * **Training Loop Must-Knows**
 * - `optimizer.zero_grad()` → first step, every batch, always
 * - `model.train()` → during training, `model.eval()` → during validation
 * - `torch.no_grad()` → wraps validation to save memory and speed
 * - Gradient clipping → add `clip_grad_norm_(model.parameters(), 1.0)` for deep/RNN models
 *
 * **Loss Functions**
 * - Binary: `BCEWithLogitsLoss` (do NOT add sigmoid before this)
 * - Multiclass: `CrossEntropyLoss` (do NOT add softmax before this)
 * - Regression: `MSELoss` (or `L1Loss` for outlier robustness)
 *
 * **Optimizer**
 * - Start with **AdamW** (lr=1e-3, weight_decay=1e-4)
 * - Add `ReduceLROnPlateau` scheduler
 * - Switch to SGD + momentum for long fine-tuning runs
 *
 * **Save Best Model**
 * - Save `model.state_dict()` (not the full model) every time val loss improves
 * - `torch.save(model.state_dict(), 'best.pt')`
 * - Load with `model.load_state_dict(torch.load('best.pt'))`
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 10_CNN_Computer_Vision
// ─────────────────────────────────────────────────────────────────

export { };
