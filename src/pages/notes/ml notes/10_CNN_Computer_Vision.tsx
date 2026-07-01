/**
 * # 🧠 Part 10: CNNs & Computer Vision
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 10_CNN_Computer_Vision\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHY CNNs? THE PROBLEM WITH PLAIN MLPs ON IMAGES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Newspaper Analogy
 *
 * Imagine you're looking for a dog in a newspaper photo. You don't read the entire page at once — you scan small regions, looking for dog-shaped patterns (ears, snout, fur). CNNs do exactly this: they slide a small detector (a **filter**) over the image, scanning for patterns region by region.
 *
 * ---
 *
 * ### 🚫 Why Not Just Use an MLP?
 *
 * A 224×224 RGB image has `224 × 224 × 3 = 150,528` pixels. A single MLP hidden layer with 1,000 neurons would need **150 million weights** — just for one layer! It would overfit massively on any realistic dataset.
 *
 * **CNNs solve this with two key ideas:**
 *
 * | Idea | Meaning | Benefit |
 * |---|---|---|
 * | **Parameter Sharing** | The same filter scans every location in the image | A single 3×3 filter has only 27 weights, regardless of image size |
 * | **Translation Invariance** | A cat in the top-left and a cat in the bottom-right are detected by the same filters | The model doesn't need to re-learn patterns at every location |
 *
 * ---
 *
 * ### 🧠 What Each Layer Learns
 *
 * - **Early layers (layer 1–2):** Edges, corners, color gradients
 * - **Middle layers (layer 3–5):** Textures, parts (wheels, eyes, fur patterns)
 * - **Deep layers (layer 6+):** Complete objects (faces, cars, animals)
 *
 * This **hierarchical feature learning** is why CNNs are so powerful for vision.
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: THE CONVOLUTION OPERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📐 How Convolution Works
 *
 * A **filter** (also called a kernel) is a small matrix (e.g., 3×3) with learnable values. It slides across the image, computing a dot product at each position. The result is a **feature map** — a 2D grid showing where that pattern was found.
 *
 * **Output Size Formula:**
 * > **out_size = ⌊(W − K + 2P) / S⌋ + 1**
 * - `W` = input width, `K` = kernel size, `P` = padding, `S` = stride
 *
 * ---
 *
 * ### ⚙️ Key Parameters
 *
 * | Parameter | Values | Effect |
 * |---|---|---|
 * | **Kernel Size** | 3×3 (most common), 5×5, 7×7 | Larger = bigger receptive field, more compute |
 * | **Stride** | 1 (default), 2 (downsampling) | Stride 2 halves spatial dimensions (like pooling) |
 * | **Padding = 'same'** | `P = kernel // 2` | Output same size as input — recommended default |
 * | **out_channels** | 32, 64, 128, 256... | Number of filters = number of patterns to detect |
 *
 * ---
 *
 * ### 🏊 Pooling Layers
 *
 * Pooling reduces spatial dimensions (height × width) while keeping depth (channels). This reduces computation and provides some translation invariance.
 *
 * | Pooling Type | Operation | Use Case |
 * |---|---|---|
 * | **MaxPool2d** | Take the maximum value in each window | Detects presence of feature (most common) |
 * | **AvgPool2d** | Average of the window | Smoother, less aggressive downsampling |
 * | **AdaptiveAvgPool2d** | Outputs any target size regardless of input | Use before FC layers — handles variable input sizes |
 */

const convBasicsCode = `
import torch
import torch.nn as nn

# ── Conv2d Parameters ─────────────────────────────────────
conv = nn.Conv2d(
    in_channels=3,    # Input depth: RGB=3, grayscale=1
    out_channels=64,  # Number of filters to learn (creates 64 feature maps)
    kernel_size=3,    # 3×3 filter — most common choice
    stride=1,         # Slide 1 pixel at a time
    padding=1         # 'same' padding for 3×3 kernel: keeps H and W unchanged
)

# Input shape: [batch_size, channels, height, width]
x   = torch.randn(8, 3, 32, 32)   # 8 images, RGB, 32×32 pixels
out = conv(x)
print(f"Input:  {x.shape}")     # torch.Size([8, 3, 32, 32])
print(f"Output: {out.shape}")   # torch.Size([8, 64, 32, 32]) — same HxW, 64 channels

# Parameters = out_ch × in_ch × kH × kW + bias
params = 64 * (3 * 3 * 3) + 64
print(f"Conv params: {params:,}")   # 1,792 — very efficient!
# An MLP equivalent would need: (32×32×3) × (32×32×64) ≈ 201 MILLION params!

# ── Pooling ───────────────────────────────────────────────
max_pool = nn.MaxPool2d(kernel_size=2, stride=2)      # Halves H and W
glob_avg = nn.AdaptiveAvgPool2d((1, 1))               # Any HxW → 1×1

pooled = max_pool(out)
print(f"After MaxPool: {pooled.shape}")    # [8, 64, 16, 16]

flat = glob_avg(pooled).flatten(1)
print(f"After GlobalAvgPool: {flat.shape}")  # [8, 64]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: BUILDING A CNN FROM SCRATCH
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏗️ Standard CNN Design Pattern
 *
 * ![CNN Architecture](/cnn_architecture.svg)
 * 
 * **Design Rules:**
 *
 * | Rule | Reasoning |
 * |---|---|
 * | **Channels increase** (32 → 64 → 128 → 256) | Deeper layers learn more abstract patterns, need more filters |
 * | **Spatial size decreases** (via pooling or stride=2) | Reduces compute and forces spatial invariance |
 * | **BatchNorm after Conv, before ReLU** | Stabilizes activations — dramatically speeds up training |
 * | **Dropout before FC layers** | Prevents the dense classifier from overfitting |
 * | **GlobalAvgPool → FC** | Replaces flattening — far fewer params, works with any input size |
 */

const customCNNCode = `
import torch
import torch.nn as nn

class ConvBlock(nn.Module):
    """Reusable Conv → BatchNorm → ReLU block."""
    def __init__(self, in_ch, out_ch, kernel_size=3, stride=1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size, stride,
                      padding=kernel_size // 2, bias=False),  # bias=False when using BN
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.block(x)

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # Feature Extraction (Conv backbone)
        self.features = nn.Sequential(
            ConvBlock(3, 32),              # 3 → 32 channels, HxW unchanged
            ConvBlock(32, 32),
            nn.MaxPool2d(2, 2),            # HxW halved (e.g., 32 → 16)
            nn.Dropout2d(0.25),            # Spatial dropout — zeros whole channels

            ConvBlock(32, 64),             # 32 → 64 channels
            ConvBlock(64, 64),
            nn.MaxPool2d(2, 2),            # HxW halved again (16 → 8)
            nn.Dropout2d(0.25),

            ConvBlock(64, 128),
            nn.AdaptiveAvgPool2d((4, 4))   # Always 4×4, regardless of input size
        )

        # Classifier (FC head)
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))

# Test
model = SimpleCNN(num_classes=10)
x     = torch.randn(4, 3, 32, 32)
print(model(x).shape)   # [4, 10] — 4 images, 10 class scores

total = sum(p.numel() for p in model.parameters())
print(f"Total params: {total:,}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: RESIDUAL CONNECTIONS (THE KEY INNOVATION)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Telephone Game Problem
 *
 * In a very deep network, the gradient signal must travel backwards through 100+ layers. Like a message in a telephone game, it gets distorted (vanishes) before reaching the early layers. Those layers barely learn anything.
 *
 * **ResNet's solution (2015): Skip connections**
 *
 * > **output = F(x) + x**
 *
 * Instead of learning the full transformation F(x), the layer learns the **residual** (the difference). The identity connection `+x` gives gradients a direct highway to flow backwards through — no matter how deep the network is.
 *
 * ---
 *
 * ### ⚡ Impact
 *
 * - Before ResNet: Deep networks > 20 layers got **worse** (not just slower — actually worse accuracy)
 * - ResNet demonstrated: 152 layers working successfully
 * - Residual connections are now everywhere: ResNet, EfficientNet, BERT, GPT, ViT
 */

const resnetBlockCode = `
import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    """ResNet residual block — same dimensions in and out."""
    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(channels, channels, 3, 1, 1, bias=False),
            nn.BatchNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, 3, 1, 1, bias=False),
            nn.BatchNorm2d(channels)
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        residual = x               # Save input (the skip connection)
        out = self.block(x)
        out = out + residual       # ADD input back — key: F(x) + x
        return self.relu(out)      # Activate AFTER adding residual

class ResidualBlockStride(nn.Module):
    """When we need to change channels/size, use 1×1 conv shortcut."""
    def __init__(self, in_ch, out_ch, stride=2):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, stride, 1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, 1, 1, bias=False),
            nn.BatchNorm2d(out_ch)
        )
        # 1×1 projection to match dimensions in the skip connection
        self.shortcut = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 1, stride, bias=False),
            nn.BatchNorm2d(out_ch)
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.block(x) + self.shortcut(x))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: TRANSFER LEARNING ⭐ MOST PRACTICAL TECHNIQUE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Expert Student Analogy
 *
 * Imagine hiring a medical student who already studied 4 years of biology, anatomy, and chemistry. You only need to teach them your specific specialty — not start from scratch. Transfer learning does the same: use a model pre-trained on 1.2 million images (ImageNet), and adapt it to your specific task.
 *
 * ---
 *
 * ### 📋 Two Strategies
 *
 * | Strategy | When to use | What you train |
 * |---|---|---|
 * | **Feature Extraction** | Small dataset (< 1,000 images per class), similar domain | Only the final FC head (1–2 layers) |
 * | **Fine-tuning** | Larger dataset OR very different domain | FC head + last few conv blocks |
 *
 * ---
 *
 * ### 🏆 Popular Pretrained Models
 *
 * | Model | Params | Accuracy | Best For |
 * |---|---|---|---|
 * | **ResNet-50** | 25M | Good | Reliable baseline, well understood |
 * | **EfficientNet-B0** | 5.3M | Very Good | Best accuracy/param tradeoff — start here |
 * | **ConvNeXt-Tiny** | 28M | Excellent | Modern CNN, matches ViT |
 * | **ViT-B/16** | 86M | Excellent | Large datasets (>100k images) |
 *
 * > **Practical tip:** EfficientNet-B0 is the best default starting point. Small, fast, and accurate.
 */

const transferLearningCode = `
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms

num_classes = 5
device      = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ── Strategy 1: Feature Extraction (small dataset) ────────
model = models.efficientnet_b0(weights='IMAGENET1K_V1')

# Freeze ALL pretrained layers — don't change what ImageNet taught them
for param in model.parameters():
    param.requires_grad = False

# Only replace and train the final classifier head
model.classifier[-1] = nn.Sequential(
    nn.Linear(model.classifier[-1].in_features, 256),
    nn.ReLU(),
    nn.Dropout(0.4),
    nn.Linear(256, num_classes)
)
model = model.to(device)
# Only model.classifier[-1] parameters are trainable!

# ── Strategy 2: Fine-tuning (larger or different domain) ──
model2 = models.resnet50(weights='IMAGENET1K_V2')
model2.fc = nn.Linear(model2.fc.in_features, num_classes)

# Freeze early layers, unfreeze last 2 blocks + head
for param in model2.parameters():
    param.requires_grad = False
for param in model2.layer3.parameters(): param.requires_grad = True
for param in model2.layer4.parameters(): param.requires_grad = True
for param in model2.fc.parameters():     param.requires_grad = True

# Different learning rates! Small for pretrained, large for head
optimizer = torch.optim.AdamW([
    {'params': model2.layer3.parameters(), 'lr': 1e-4},   # Low LR — pretrained
    {'params': model2.layer4.parameters(), 'lr': 3e-4},
    {'params': model2.fc.parameters(),     'lr': 1e-3},   # High LR — fresh head
], weight_decay=1e-4)

# ── MANDATORY: ImageNet Normalization for pretrained models ──
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],   # ImageNet stats
                         std=[0.229, 0.224, 0.225])     # Must use these!
])
val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: DATA AUGMENTATION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎲 Why Augmentation?
 *
 * If you only have 500 photos of cats, your model will memorize them. Augmentation creates **artificial diversity** by applying random transformations — the model sees a slightly different version of each image each epoch. It's forced to learn the underlying pattern, not the exact pixels.
 *
 * > **Key Rule:** Apply augmentation **only during training**. The validation/test transform should only do Resize + CenterCrop + Normalize.
 *
 * ---
 *
 * ### 🛠️ Augmentation Techniques
 *
 * | Technique | What it does | Strength |
 * |---|---|---|
 * | `RandomHorizontalFlip` | Mirror left-right | ⭐ Always use |
 * | `RandomResizedCrop` | Random crop + resize | ⭐ Always use |
 * | `ColorJitter` | Random brightness/contrast/saturation | Medium |
 * | `RandomRotation` | Rotate ±N degrees | Medium |
 * | `RandAugment` | Auto-selects best augmentations | ⭐⭐ Strong, easy |
 * | `CutMix` / `MixUp` | Blend two training images + labels | ⭐⭐ State-of-the-art |
 */

const augmentationCode = `
from torchvision import transforms

# ── Standard augmentation (good starting point) ───────────
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # Random crop
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
    transforms.RandomRotation(degrees=10),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.2)   # Random rectangular patch erased (Cutout)
])

# ── RandAugment (strong, minimal tuning needed) ───────────
rand_aug = transforms.Compose([
    transforms.RandAugment(num_ops=2, magnitude=9),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# ── CutMix / MixUp (state-of-the-art, ~1-2% accuracy boost) ──
from torchvision.transforms.v2 import CutMix, MixUp

cutmix = CutMix(alpha=1.0, num_classes=num_classes)

for images, labels in train_loader:
    images, labels = cutmix(images, labels)  # Blends two images together
    outputs = model(images)
    loss    = criterion(outputs, labels)      # labels is now soft (mixed)!
    # Only use CrossEntropyLoss or similar that accepts soft targets
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 CNN CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Architecture Design**
 * - Pattern: `[Conv → BN → ReLU] × N → GlobalAvgPool → Dropout → FC`
 * - Channels grow: 32 → 64 → 128 → 256
 * - Spatial dims shrink: via MaxPool(2,2) or stride=2 Conv
 * - `bias=False` in Conv when followed by BatchNorm (BN has its own bias)
 *
 * **Output Size Formula**
 * - `out = ⌊(W − K + 2P) / S⌋ + 1`
 * - 'same' padding: `P = K // 2` (keeps HxW unchanged)
 *
 * **Transfer Learning Rules**
 * - Always use ImageNet normalization: `mean=[0.485, 0.456, 0.406]`
 * - Small dataset → freeze backbone, train head only
 * - Fine-tune with 5–10× lower LR for pretrained layers vs head
 * - EfficientNet-B0 or ResNet-50 are great default choices
 *
 * **Residual Connections**
 * - `output = F(x) + x` — identity shortcut
 * - When dimensions change: use 1×1 Conv shortcut
 * - Solves vanishing gradient for very deep networks
 *
 * **Data Augmentation**
 * - Always augment only the TRAINING set
 * - `RandAugment(num_ops=2, magnitude=9)` is the easiest strong augmentation
 * - CutMix / MixUp for extra +1-2% accuracy boost
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 11_RNN_NLP_Transformers
// ─────────────────────────────────────────────────────────────────

export { };
