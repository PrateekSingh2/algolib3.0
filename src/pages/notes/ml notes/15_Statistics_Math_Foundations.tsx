/**
 * # 🧠 Part 15: Statistics & Math Foundations
 * > **AlgoLib ML Notes** — *Comprehensive AI/ML Reference*
 *
 * \`FILE: 15_Statistics_Math_Foundations\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: PROBABILITY & BAYES' THEOREM
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🩺 The Medical Test Trap (Bayes' Theorem)
 *
 * Suppose a disease affects 1% of the population. A test is 99% accurate. You test positive.
 * What is the probability you actually have the disease? **The real answer is 50%.**
 *
 * Why? Out of 10,000 people:
 * - 100 are sick. 99 test positive (True Positives).
 * - 9,900 are healthy. 1% (99 people) test positive (False Positives).
 * - Total positives = 198. Your chance of being sick = 99 / 198 = **50%**.
 *
 * This is the heart of **Bayes' Theorem**:
 *
 * > **P(H | E) = [ P(E | H) × P(H) ] / P(E)**
 *
 * | Term | Name | Meaning |
 * |---|---|---|
 * | **P(H \| E)** | **Posterior** | Belief *after* seeing Evidence. |
 * | **P(E \| H)** | **Likelihood**| How likely is Evidence if Hypothesis is true? |
 * | **P(H)** | **Prior** | Belief *before* seeing Evidence. |
 * | **P(E)** | **Evidence** | Normalizing constant. |
 */

const probabilityCode = `
import numpy as np
from scipy.stats import norm, binom

# ── 1. The 68-95-99.7 Rule (Normal Distribution) ──────────
# ![Normal Distribution](/normal_distribution.svg)
rv_norm = norm(loc=0, scale=1) # Mean=0, StdDev=1

print(f"Within 1 StdDev: {rv_norm.cdf(1) - rv_norm.cdf(-1):.3f}")  # 0.683 (68%)
print(f"Within 2 StdDev: {rv_norm.cdf(2) - rv_norm.cdf(-2):.3f}")  # 0.954 (95%)
print(f"Within 3 StdDev: {rv_norm.cdf(3) - rv_norm.cdf(-3):.3f}")  # 0.997 (99.7%)

# ── 2. Binomial Distribution ──────────────────────────────
# Example: Probability of exactly 3 successes in 10 trials with 30% win rate
rv_binom = binom(n=10, p=0.3)
print(f"P(X=3) = {rv_binom.pmf(3):.4f}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: STATISTICAL TESTING & EDA
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚖️ Hypothesis Testing
 *
 * - **H₀ (Null Hypothesis):** The default assumption ("No difference").
 * - **H₁ (Alternative Hypothesis):** What you are trying to prove.
 *
 * **The p-value:** The probability of seeing your data *assuming H₀ is true*.
 * If `p < 0.05`, we **reject H₀** (statistically significant).
 *
 * | Test | What it does | Example |
 * |---|---|---|
 * | **T-Test (2-sample)** | Compares means of exactly 2 groups | Is height of men different from women? |
 * | **ANOVA** | Compares means of 3+ groups | Does diet A, B, or C differ? |
 * | **Chi-Square (χ²)** | Tests categorical independence | Is color preference independent of gender? |
 * | **KS Test** | Compares continuous distributions | Has data drifted in production? |
 *
 * > **Warning:** Statistical significance ≠ Practical significance! Always measure **Effect Size** (Cohen's d).
 */

const statsCode = `
from scipy import stats
import pandas as pd
import numpy as np

group_a = np.array([21, 23, 22, 25, 24])
group_b = np.array([27, 29, 28, 31, 30])

# ── 1. Two-sample t-test ──────────────────────────────────
t_stat, p_val = stats.ttest_ind(group_a, group_b)
print(f"t-test: p={p_val:.4f}")   # p < 0.05 -> significant difference

# ── 2. Effect Size (Cohen's d) ────────────────────────────
def cohens_d(g1, g2):
    n1, n2 = len(g1), len(g2)
    pooled_std = np.sqrt(((n1-1)*np.var(g1) + (n2-1)*np.var(g2)) / (n1+n2-2))
    return (np.mean(g1) - np.mean(g2)) / pooled_std

print(f"Effect Size (d): {cohens_d(group_a, group_b):.2f}") # |d| > 0.8 is large

# ── 3. Correlation & Normality in EDA ─────────────────────
df = pd.DataFrame({'x': np.random.randn(100), 'y': np.random.randn(100)})

# Pearson (linear), Spearman (monotonic/rank-based)
pearson_r, p = stats.pearsonr(df['x'], df['y'])
spearman_r, p = stats.spearmanr(df['x'], df['y'])

# Shapiro-Wilk (is it normal?)
stat, p_val = stats.shapiro(df['x'])
print(f"Is normal? {p_val > 0.05}")

# 95% Confidence Interval for the mean
ci_95 = stats.t.interval(0.95, df=len(df)-1, loc=df['x'].mean(), scale=stats.sem(df['x']))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: LINEAR ALGEBRA IN ML
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📏 Vectors and Matrices
 *
 * | Concept | Formula / Meaning | Used in ML for... |
 * |---|---|---|
 * | **Dot Product** | `a·b = Σaᵢbᵢ` | Multiplying inputs by weights |
 * | **Cosine Similarity** | `(a·b) / (\|a\|\|b\|)` | Measuring NLP Embedding similarity |
 * | **L1 Norm** | `\|x\|₁ = Σ\|xᵢ\|` | Lasso Regularization (sparse weights) |
 * | **L2 Norm** | `\|x\|₂ = √Σxᵢ²` | Ridge Regularization (smooth weights) |
 * | **SVD** | `A = UΣVᵀ` | Principal Component Analysis (PCA) |
 */

const linalgCode = `
import numpy as np

# ── 1. Cosine Similarity ──────────────────────────────────
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

king  = np.array([0.9, 0.1, 0.5])
queen = np.array([0.8, 0.2, 0.6])
print(f"King & Queen Cosine: {cosine_similarity(king, queen):.3f}")

# ── 2. Vector Norms ───────────────────────────────────────
weights = np.array([3.0, -4.0])
print(f"L1 (Lasso): {np.linalg.norm(weights, ord=1)}")  # 7.0
print(f"L2 (Ridge): {np.linalg.norm(weights, ord=2)}")  # 5.0

# ── 3. Singular Value Decomposition (SVD for PCA) ─────────
X = np.random.randn(100, 20)
X_centered = X - X.mean(axis=0)

U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
X_pca_2d = X_centered @ Vt[:2].T  # Project 20D data to 2D!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: CALCULUS (GRADIENT DESCENT)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏔️ The Blindfolded Hiker
 *
 * Imagine you are blindfolded on a mountain and want to find the lowest valley (minimum loss). You tap your foot around you to feel the slope (**the Gradient/Derivative**). You take a step downward. Repeat until flat. This is **Gradient Descent**.
 *
 * > **θ_new = θ_old − α × ∇L**
 * - `θ`: Weights
 * - `α`: Learning rate
 * - `∇L`: Gradient (steepest upward slope vector)
 *
 * **Backpropagation** uses the Calculus Chain Rule (`dL/dx = dL/dz · dz/dx`) to pass errors backward from the output layer to the input.
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: INFORMATION THEORY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎲 Entropy & Cross-Entropy
 *
 * | Concept | Meaning | ML Use Case |
 * |---|---|---|
 * | **Entropy** | Unpredictability of a distribution. | Decision Trees (Information Gain). |
 * | **Cross-Entropy** | Difference between distributions. | **Standard Loss Function for Classification.** |
 * | **KL Divergence** | Asymmetric measure of difference. | VAE latent constraints, PPO policy limits. |
 */

const infoTheoryCode = `
import numpy as np

def entropy(p):
    p = np.array(p); p = p[p > 0]
    return -np.sum(p * np.log2(p))

print(f"Uniform (Max Entropy): {entropy([0.25, 0.25, 0.25, 0.25]):.2f} bits")
print(f"Peaked (Low Entropy):  {entropy([0.97, 0.01, 0.01, 0.01]):.2f} bits")

# ── Information Gain (Decision Trees) ─────────────────────
def information_gain(parent, children, weights):
    parent_entropy = entropy(np.bincount(parent) / len(parent))
    child_entropy = sum(w * entropy(np.bincount(c) / len(c)) for c, w in zip(children, weights))
    return parent_entropy - child_entropy

# Parent split into pure left node and impure right node
ig = information_gain([0,0,0,1,1,1,1], [[0,0,0], [1,1,1,1]], [3/7, 4/7])
print(f"Information Gain: {ig:.4f}")
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 MATH CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * - **T-Test** for 2 means, **ANOVA** for 3+ means.
 * - **Correlation is NOT Causation.**
 * - `p < 0.05` means significant, but always check Cohen's d effect size.
 * - **L1 Regularization** creates sparse weights.
 * - **Cross-Entropy Loss** gradient with Softmax simplifies beautifully to `Prediction - True_Label`.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 16_Quick_Reference_Index
// ─────────────────────────────────────────────────────────────────

export {};
