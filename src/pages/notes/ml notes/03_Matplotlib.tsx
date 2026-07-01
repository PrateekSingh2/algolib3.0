/**
 * # 🧠 Part 3: Matplotlib & Seaborn
 * ### See Your Data!
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 03_Matplotlib\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHY VISUALIZE?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Imagine This
 *
 * A doctor has **1,000 patients' blood pressure readings**. Just looking at 1,000 numbers tells you almost nothing. But **one chart** reveals: *"Blood pressure goes UP after age 45!"*
 *
 * That instant understanding? That's what visualization gives you.
 *
 * ---
 *
 * ### 🎭 The Famous Proof: Anscombe's Quartet (1973)
 *
 * Francis Anscombe created **4 completely different datasets** that all had:
 * - Same mean (average): **7.5**
 * - Same variance (spread): **4.12**
 * - Same correlation: **0.816**
 * - Same linear regression line!
 *
 * Only when **plotted** could you see the truth:
 * - Dataset 1: A perfect linear relationship ✅
 * - Dataset 2: A curved (non-linear) pattern — linear regression is **wrong**!
 * - Dataset 3: One extreme outlier ruining the line
 * - Dataset 4: One leverage point controlling everything
 *
 * > ⚠️ **Lesson:** NEVER skip visualization. Statistics alone can lie. Always **look at your data** before building any ML model!
 *
 * ---
 *
 * ### 📦 The Two Main Libraries
 *
 * | Library | Role | Analogy |
 * |---|---|---|
 * | **Matplotlib** | The foundation. Full control, low-level. | Microsoft Paint — powerful but manual |
 * | **Seaborn** | Built on Matplotlib. High-level and beautiful. | Canva — gorgeous defaults, less code |
 *
 * **Rule:** Quick EDA? Use **Seaborn**. Custom/publication plots? Use **Matplotlib** directly.
 */

const setupCode = `
# pip install matplotlib seaborn

import matplotlib.pyplot as plt  # 'plt' is the standard nickname
import seaborn as sns            # 'sns' is the standard nickname
import numpy as np
import pandas as pd

# Set style for nicer-looking Seaborn plots
sns.set_theme(style="darkgrid", palette="husl", font_scale=1.1)
# Other styles: "whitegrid", "ticks", "dark", "white"
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: ANATOMY OF A MATPLOTLIB FIGURE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏗️ The Building Blocks
 *
 * ![Matplotlib Anatomy](/matplotlib_anatomy.svg)
 * 
 * Every Matplotlib chart is made of nested containers:
 *
 * - **Figure** → The entire canvas (the "paper" you draw on)
 *   - **Axes** → The actual plot area inside the canvas
 *     - X-axis → Horizontal axis with labels and ticks
 *     - Y-axis → Vertical axis with labels and ticks
 *     - Title → The plot heading
 *     - Legend → Key explaining what each color/line means
 *     - Plot elements → Lines, bars, dots, etc.
 *
 * > You can have **multiple Axes** on ONE Figure — this is called **subplots**.
 *
 * ---
 *
 * ### 🎯 The Standard Workflow
 *
 * 1. Create a Figure and Axes with `plt.figure()` or `plt.subplots()`
 * 2. Draw your data (`plt.plot()`, `plt.scatter()`, `plt.bar()`, ...)
 * 3. Label everything (title, xlabel, ylabel, legend)
 * 4. Show or save: `plt.show()` or `plt.savefig()`
 */

const matplotlibBasics = `
import matplotlib.pyplot as plt
import numpy as np

# ── 1. Line Plot — for trends over time ───────────────────
x     = np.linspace(0, 10, 100)
y_sin = np.sin(x)
y_cos = np.cos(x)

plt.figure(figsize=(10, 4))    # Width=10 inches, Height=4 inches
plt.plot(x, y_sin, color='royalblue',  linewidth=2, label='sin(x)')
plt.plot(x, y_cos, color='orangered',  linewidth=2, linestyle='--', label='cos(x)')

plt.title("Sine and Cosine Waves", fontsize=16, fontweight='bold')
plt.xlabel("X values (radians)", fontsize=12)
plt.ylabel("Y values", fontsize=12)
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.tight_layout()    # Fixes spacing issues automatically
plt.show()

# ── 2. Subplots — multiple charts on one canvas ───────────
fig, axes = plt.subplots(1, 2, figsize=(12, 4))  # 1 row, 2 columns

axes[0].plot(x, y_sin, 'b-', linewidth=2)
axes[0].set_title("Sine Wave")
axes[0].set_xlabel("X")
axes[0].set_ylabel("sin(x)")

axes[1].plot(x, y_cos, 'r--', linewidth=2)
axes[1].set_title("Cosine Wave")
axes[1].set_xlabel("X")
axes[1].set_ylabel("cos(x)")

plt.tight_layout()    # ← Always add this with subplots!
plt.show()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: CHOOSING THE RIGHT CHART
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎨 Chart Type Guide
 *
 * | What you want to show | Best chart type |
 * |---|---|
 * | Trend over time / sequence | **Line plot** |
 * | Relationship between two numbers | **Scatter plot** |
 * | Distribution of one number | **Histogram / KDE** |
 * | Compare groups / categories | **Bar plot** |
 * | Spread and outliers in groups | **Box plot / Violin** |
 * | Correlation between many features | **Heatmap** |
 * | Count of categories | **Count plot** |
 *
 * > **Tip:** Start with a **scatter plot** and **histogram** for any new dataset. They'll tell you the most in the shortest time.
 */

const chartTypes = `
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

np.random.seed(42)
df = pd.DataFrame({
    "score":         np.random.normal(72, 15, 200).clip(0, 100),
    "hours_studied": np.random.uniform(0, 10, 200),
    "gender":        np.random.choice(["Male", "Female"], 200),
    "city":          np.random.choice(["Mumbai", "Delhi", "Chennai"], 200)
})
df["passed"] = (df["score"] >= 50).astype(int)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ── Scatter Plot: "Does studying more lead to higher scores?" ──
fig, ax = plt.subplots(figsize=(7, 5))
scatter = ax.scatter(
    df["hours_studied"], df["score"],
    c=df["passed"],       # Color by pass/fail
    cmap="RdYlGn",        # Red=Fail, Green=Pass
    alpha=0.6,
    edgecolors="white", linewidths=0.5
)
ax.set_xlabel("Hours Studied")
ax.set_ylabel("Exam Score")
ax.set_title("Study Hours vs Exam Score", fontsize=14)
plt.colorbar(scatter, label="Passed (1=Yes, 0=No)")
plt.tight_layout()
plt.show()
# Positive trend visible: more hours → higher scores!

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ── Histogram + KDE: "How are scores distributed?" ────────
fig, ax = plt.subplots(figsize=(7, 4))
ax.hist(df["score"], bins=25, color="steelblue",
        edgecolor="white", alpha=0.7, density=True, label="Histogram")
df["score"].plot.kde(ax=ax, color="navy", linewidth=2, label="KDE curve")
ax.axvline(df["score"].mean(), color="red", linestyle="--",
           linewidth=1.5, label=f"Mean = {df['score'].mean():.1f}")
ax.set_xlabel("Score")
ax.set_ylabel("Density")
ax.set_title("Score Distribution")
ax.legend()
plt.tight_layout()
plt.show()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ── Bar Plot: "What is the average score per city?" ───────
city_avg = df.groupby("city")["score"].mean().sort_values(ascending=False)
fig, ax = plt.subplots(figsize=(6, 4))
bars = ax.bar(city_avg.index, city_avg.values,
              color=["#2196F3","#4CAF50","#FF9800"],
              edgecolor="white", linewidth=1)
for bar in bars:
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
            f'{bar.get_height():.1f}', ha='center', va='bottom', fontweight='bold')
ax.set_xlabel("City")
ax.set_ylabel("Average Score")
ax.set_title("Average Score by City")
plt.tight_layout()
plt.show()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: SEABORN — BEAUTIFUL STATS PLOTS WITH LESS CODE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🌊 Seaborn's Superpower
 *
 * Seaborn directly understands **Pandas DataFrames**. You pass column **names as strings**, and it handles everything — including computing statistics, grouping, and adding confidence intervals automatically.
 *
 * Instead of:
 * - Calculating means
 * - Creating bars manually
 * - Adding error bars by hand
 *
 * You just write: `sns.barplot(x="city", y="score", data=df)` — Seaborn does the rest!
 *
 * ---
 *
 * ### The Pairplot — Your Best First EDA Chart
 *
 * `sns.pairplot(df, hue="species")` shows **scatter plots of every feature pair** at once, plus the distribution of each feature on the diagonal. In one chart, you can immediately see which features are useful for classification and which ones overlap.
 */

const seabornPlots = `
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_theme(style="darkgrid")

# Using the built-in iris dataset (classic ML benchmark)
iris = sns.load_dataset("iris")  # 150 flowers, 4 measurements, 3 species

# ── Pairplot: The BEST first EDA chart ────────────────────
sns.pairplot(iris, hue="species", diag_kind="kde", height=2)
plt.suptitle("Iris Dataset: All Feature Relationships", y=1.02)
plt.tight_layout()
plt.show()
# In one chart you can see:
# → setosa is easily separable from the others
# → petal length/width are the best features for classification!

# ── Boxplot + Violin: Distribution per group ──────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

sns.boxplot(data=iris, x="species", y="sepal_length",
            palette="Set2", ax=axes[0])
axes[0].set_title("Sepal Length by Species")

sns.violinplot(data=iris, x="species", y="petal_length",
               palette="Set2", ax=axes[1])
axes[1].set_title("Petal Length Distribution")
# Violin plot = Boxplot + KDE curve (shows the full distribution shape!)

plt.tight_layout()
plt.show()

# ── Heatmap: Correlation Matrix ───────────────────────────
# PURPOSE: "Which features are related to each other?"
# CRITICAL for Feature Selection in ML!
fig, ax = plt.subplots(figsize=(7, 5))
corr_matrix = iris.drop("species", axis=1).corr()

sns.heatmap(
    corr_matrix,
    annot=True,        # Show numbers in each cell
    fmt=".2f",         # Round to 2 decimal places
    cmap="coolwarm",   # Red=positive, Blue=negative correlation
    vmin=-1, vmax=1,   # Force color scale from -1 to +1
    square=True,
    linewidths=0.5,
    ax=ax
)
ax.set_title("Feature Correlation Matrix", fontsize=14)
plt.tight_layout()
plt.show()
`;


// ─────────────────────────────────────────────────────────────────
//  How to Read the Heatmap
// ─────────────────────────────────────────────────────────────────

/**
 * ### 🔍 Reading a Correlation Heatmap
 *
 * | Cell color | Value | Meaning |
 * |---|---|---|
 * | 🔴 Deep Red | Close to **+1.0** | Strong **positive** correlation — both features go up together |
 * | 🔵 Deep Blue | Close to **-1.0** | Strong **negative** correlation — one goes up, other goes down |
 * | ⚪ White/Grey | Close to **0** | **No relationship** between the features |
 *
 * > **Action point:** If two features are `> 0.95` correlated, one is **redundant** — you can safely remove it to reduce noise in your model. This is called **removing multicollinearity**.
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: ML-SPECIFIC VISUALIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📊 Charts You'll Use After Training a Model
 *
 * These are the specific plots you'll create when evaluating ML models:
 *
 * - **Confusion Matrix** → See exactly where your classifier makes mistakes
 * - **Learning Curves** → Diagnose overfitting or underfitting
 * - **Feature Importance** → Which input features matter most to the model
 */

const mlVisualization = `
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import confusion_matrix

# ── Confusion Matrix Heatmap ──────────────────────────────
y_true = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]   # Actual labels
y_pred = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0]   # Model predictions

cm = confusion_matrix(y_true, y_pred)
fig, ax = plt.subplots(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Pred: Negative","Pred: Positive"],
            yticklabels=["True: Negative","True: Positive"])
ax.set_title("Confusion Matrix")
plt.tight_layout()
plt.show()
# Top-Left:    True Negatives  (correctly said NO)
# Bottom-Right: True Positives (correctly said YES)
# Top-Right:   False Positives (said YES, was actually NO)
# Bottom-Left: False Negatives (said NO, was actually YES)

# ── Learning Curves (Diagnose overfitting!) ───────────────
epochs     = range(1, 51)
train_loss = [1/(i**0.5) + 0.02 for i in epochs]  # Goes down smoothly
val_loss   = [1/(i**0.4) + 0.1  for i in epochs]  # Slower to improve

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(epochs, train_loss, 'b-',  label="Training Loss",   linewidth=2)
ax.plot(epochs, val_loss,   'r--', label="Validation Loss", linewidth=2)
ax.set_xlabel("Epoch")
ax.set_ylabel("Loss")
ax.set_title("Learning Curves")
ax.legend()
plt.tight_layout()
plt.show()
# ✅ Both losses going down → Model is learning well
# ⚠️ Train goes down, Val stays high → OVERFITTING!
# ⚠️ Both stay high → UNDERFITTING (model too simple)

# ── Feature Importance Bar Chart ──────────────────────────
feature_names = ["Age", "Income", "Education", "Experience", "City", "Gender"]
importances   = [0.35, 0.28, 0.18, 0.12, 0.05, 0.02]

fig, ax = plt.subplots(figsize=(7, 4))
colors = ["#2196F3" if i < 3 else "#90CAF9" for i in range(len(importances))]
bars   = ax.barh(feature_names, importances, color=colors, edgecolor="white")
ax.set_xlabel("Importance Score")
ax.set_title("Feature Importance")
ax.invert_yaxis()  # Most important at top
for bar, val in zip(bars, importances):
    ax.text(val + 0.005, bar.get_y() + bar.get_height()/2,
            f'{val:.2f}', va='center', fontweight='bold')
plt.tight_layout()
plt.show()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: SAVING YOUR PLOTS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 💾 Always Save Before Show
 *
 * `plt.show()` **clears the figure** from memory. If you save after showing, you'll get a blank file. Always call `plt.savefig()` **before** `plt.show()`.
 */

const savingPlots = `
import matplotlib.pyplot as plt

# Create any chart
plt.figure(figsize=(8, 5))
plt.plot([1,2,3,4,5], [10,20,15,30,25], marker='o', color='royalblue')
plt.title("My Chart")

# ── Save BEFORE plt.show() ────────────────────────────────
plt.savefig("my_chart.png",
            dpi=300,               # 300 DPI = print-quality resolution
            bbox_inches="tight",   # No clipping of labels
            facecolor="white")     # White background

plt.savefig("my_chart.svg")    # Vector format — scales perfectly (great for web)
plt.savefig("my_chart.pdf")    # PDF — preferred for academic papers

plt.show()    # Display AFTER saving
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 VISUALIZATION CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * | Task | Command |
 * |---|---|
 * | Line plot | `plt.plot(x, y)` / `sns.lineplot()` |
 * | Scatter plot | `plt.scatter(x, y)` / `sns.scatterplot()` |
 * | Histogram | `plt.hist(data)` / `sns.histplot()` |
 * | Bar chart | `plt.bar(x, y)` / `sns.barplot()` |
 * | Box plot | `sns.boxplot()` |
 * | Violin plot | `sns.violinplot()` |
 * | Heatmap | `sns.heatmap(corr, annot=True)` |
 * | Pair plot | `sns.pairplot(df, hue="category")` |
 * | Multiple charts | `fig, axes = plt.subplots(rows, cols)` |
 * | Save chart | `plt.savefig("name.png", dpi=300)` |
 *
 * ---
 *
 * ### 🔑 Golden Rules
 *
 * - **Always visualize before modeling** — numbers alone can fool you (Anscombe!)
 * - **Pairplot first** — shows all feature relationships at once
 * - **Heatmap for correlation** — find and remove redundant features
 * - **Box plot for outliers** — know what to clean before training
 * - **Learning curves after training** — diagnose over/underfitting
 * - `plt.tight_layout()` → **always add this** to prevent label clipping
 * - `plt.savefig()` **before** `plt.show()` — or you'll get a blank file!
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 04_Introduction_to_ML — Now that you know the tools,
//       let's learn how Machine Learning actually works!
// ─────────────────────────────────────────────────────────────────

export { };
