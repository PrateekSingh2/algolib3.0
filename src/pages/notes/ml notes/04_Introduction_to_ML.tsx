/**
 * # 🧠 Part 4: Introduction to Machine Learning
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 04_Introduction_to_ML\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS MACHINE LEARNING?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Best Analogy Ever
 *
 * Imagine teaching a child to recognize a cat.
 *
 * - **Traditional Programming:** You write rules — *"If it has pointy ears AND whiskers AND fur, it's a cat."* But what about a hairless cat? It breaks the rules.
 * - **Machine Learning:** You show the child **10,000 photos** of cats and non-cats. The child learns the concept by itself, without you writing a single rule.
 *
 * That's Machine Learning — instead of writing rules, you **feed data** and let the algorithm find the rules on its own.
 *
 * ---
 *
 * ### 📖 Two Famous Definitions
 *
 * **Arthur Samuel (1959)** — the man who coined the term:
 * > *"Field of study that gives computers the ability to learn without being explicitly programmed."*
 *
 * **Tom Mitchell (1998)** — the formal engineering definition:
 * > *"A computer program is said to learn from experience **E** with respect to task **T** and performance measure **P**, if its performance at **T** improves with **E**."*
 *
 * **Spam Filter Example:**
 * - **Task (T):** Classify emails as spam or not spam
 * - **Experience (E):** 1 million past emails labeled by humans
 * - **Performance (P):** Percentage of emails correctly classified
 *
 * ---
 *
 * ### 🔄 The Paradigm Shift
 *
 * | Approach | Formula |
 * |---|---|
 * | **Traditional Programming** | Data + Rules → Output |
 * | **Machine Learning** | Data + Output → Rules (the Model!) |
 *
 * In ML, the "Rules" are the model weights — learned automatically from data.
 */


// =================================================================
//  AI vs ML vs Deep Learning — The Hierarchy
// =================================================================

/**
 * ### 🪆 The Nested Hierarchy
 *
 * Think of them like Russian nesting dolls — each one lives inside the previous:
 */

/**
 * ![AI Hierarchy Diagram](/ai_hierarchy.svg)
 */

/**
 * - **AI** → The big dream: make computers smart like humans
 * - **ML** → The engine that makes most of AI work today
 * - **DL** → A powerful subset that handles images, speech, text
 * - **GenAI** → DL models that *create* new content (text, images, code)
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: THE FOUR TYPES OF MACHINE LEARNING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🗺️ The Big Picture Formula
 *
 * The core goal of ALL machine learning is finding a function:
 *
 * > **Y = f(X) + ε**
 *
 * - **X** → The input features (the data you have)
 * - **f()** → The model you're trying to learn
 * - **Y** → The prediction / output
 * - **ε (epsilon)** → Irreducible noise in the real world
 *
 * ---
 *
 * ### 📚 The Four Types
 *
 * | Type | Data Needed | Goal | Real Examples |
 * |---|---|---|---|
 * | **Supervised Learning** | Labeled data (X + Y) | Predict Y for new X | Spam filter, house prices, disease diagnosis |
 * | **Unsupervised Learning** | Unlabeled data (X only) | Discover hidden patterns | Customer segments, anomaly detection |
 * | **Semi-Supervised** | Small labeled + huge unlabeled | Best of both worlds | Google Photos face grouping |
 * | **Reinforcement Learning** | Reward signals | Learn via trial & error | AlphaGo, self-driving cars, ChatGPT RLHF |
 *
 * ---
 *
 * ### Supervised Learning Sub-types
 *
 * - **Regression** → Predict a **continuous number** (e.g., house price = ₹45,00,000)
 * - **Classification** → Predict a **category** (e.g., email = Spam / Not Spam)
 *
 * ### Unsupervised Learning Sub-types
 *
 * - **Clustering** → Group similar items together (e.g., customer segments)
 * - **Dimensionality Reduction** → Compress data while keeping key information (e.g., PCA)
 */

const mlTypesDemo = `
# ─── SUPERVISED LEARNING (Regression example) ─────────────────────
from sklearn.linear_model import LinearRegression
import numpy as np

# Labeled training data: hours studied → exam score
X_train = np.array([[1], [2], [3], [4], [5]])  # Input: hours studied
y_train = np.array([50, 60, 65, 75, 85])         # Output: exam score

model = LinearRegression()
model.fit(X_train, y_train)  # Model finds the best line: y = mx + c

prediction = model.predict([[6]])   # Predict for 6 hours of study
print(f"Predicted score for 6 hrs: {prediction[0]:.1f}")
# Output: ~92.0

# ─── UNSUPERVISED LEARNING (Clustering example) ───────────────────
from sklearn.cluster import KMeans

# Unlabeled data — no Y provided!
X_unlabeled = np.array([[1,2],[1,4],[1,0],[10,2],[10,4],[10,0]])

kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
kmeans.fit(X_unlabeled)

print("Cluster labels:", kmeans.labels_)
# Output: [1, 1, 1, 0, 0, 0] — Two groups found automatically!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: THE ML PROJECT WORKFLOW (CRISP-DM)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏭 How a Real ML Project Actually Works
 *
 * The industry-standard lifecycle is called **CRISP-DM** (Cross-Industry Standard Process for Data Mining).
 *
 * > ⚠️ **Reality Check:** Training the model is only ~10% of the work. The other 90% is everything else listed here.
 *
 * | Step | Phase | What you do |
 * |---|---|---|
 * | 1 | **Business Understanding** | Define the problem. Do you even need ML? Set success metrics. |
 * | 2 | **Data Collection** | Gather data from DBs, APIs, logs, web scraping |
 * | 3 | **EDA** | Visualize distributions, find correlations, spot anomalies |
 * | 4 | **Data Preprocessing** | Fix missing values, encode categories, scale features |
 * | 5 | **Feature Engineering** | Create new, smarter columns from existing ones |
 * | 6 | **Model Training** | Split data, train multiple baseline models |
 * | 7 | **Evaluation & Tuning** | Test on hold-out set, tune hyperparameters |
 * | 8 | **Deployment (MLOps)** | Wrap in API, deploy, monitor for concept drift |
 *
 * ---
 *
 * ### 🚨 The Most Important Rule
 *
 * > **"A simple algorithm on great data beats a great algorithm on bad data."**
 *
 * This is why Steps 3, 4, and 5 matter MORE than which model you choose.
 */

const mlWorkflow = `
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ── STEP 1: Load & Inspect ─────────────────────────────────
df = pd.read_csv("dataset.csv")
print(df.info())           # See column types and missing counts
print(df.describe())       # Statistical summary

# ── STEP 2: Preprocess ────────────────────────────────────
df.fillna(df.median(numeric_only=True), inplace=True)  # Fill missing values

X = df.drop('target', axis=1)   # Features
y = df['target']                 # Target label

# ── STEP 3: Train-Test Split ──────────────────────────────
# stratify=y → ensures both splits have same class distribution
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── STEP 4: Feature Scaling ───────────────────────────────
# FIT on training data ONLY — prevents data leakage!
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)  # Use train's mean/std

# ── STEP 5: Train ─────────────────────────────────────────
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# ── STEP 6: Evaluate ──────────────────────────────────────
y_pred = model.predict(X_test_scaled)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: KEY TERMINOLOGY DICTIONARY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📖 Essential ML Vocabulary
 *
 * | Term | Plain English Meaning |
 * |---|---|
 * | **Feature (X)** | An input column / variable (e.g., Age, Income, City) |
 * | **Label / Target (Y)** | The thing you want to predict (e.g., Spam/NotSpam) |
 * | **Instance / Sample** | One single row of data (one observation) |
 * | **Model Weights** | The internal numbers the model learns during training |
 * | **Hyperparameter** | A setting you configure *before* training (e.g., tree depth) |
 * | **Epoch** | One complete pass through the entire training dataset |
 * | **Batch** | A small chunk of data processed at once (saves RAM) |
 * | **Loss / Cost Function** | A number that measures how wrong the model's predictions are |
 * | **Gradient Descent** | The algorithm that tweaks weights to minimize the loss |
 * | **Data Leakage** | When test set info accidentally bleeds into training — gives fake accuracy |
 * | **Generalization** | How well the model performs on *new, unseen* data |
 * | **Inference** | Using a trained model to make predictions on new data |
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: BIAS-VARIANCE TRADEOFF ⭐ THE HOLY GRAIL
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎯 The Most Important Concept in All of ML
 *
 * **Total Error = Bias² + Variance + Irreducible Noise**
 *
 * Every ML model makes two kinds of avoidable mistakes:
 *
 * ---
 *
 * ### 📉 High Bias → Underfitting
 *
 * The model is **too simple**. It makes rigid, wrong assumptions.
 *
 * - **Analogy:** A student who studied only one chapter for a 10-chapter exam.
 * - **Symptom:** High error on BOTH training and test data.
 * - **Real example:** Using a straight line to fit a curved dataset.
 * - **Fix:** Use a more complex model, add more features, reduce regularization.
 *
 * ---
 *
 * ### 📈 High Variance → Overfitting
 *
 * The model is **too complex**. It memorizes the training data including noise.
 *
 * - **Analogy:** A student who memorized every answer in the textbook *exactly*, but fails when the exam asks the same concept in a different way.
 * - **Symptom:** Very low training error, HIGH test error. Big gap between them.
 * - **Fix:** Get more data, add regularization (L1/L2), simplify the model.
 *
 * ---
 *
 * ### 🎯 The Sweet Spot
 *
 * | | Bias | Variance | Result |
 * |---|---|---|---|
 * | Too Simple | **High** | Low | Underfitting |
 * | Too Complex | Low | **High** | Overfitting |
 * | **Just Right** ✅ | **Low** | **Low** | **Good Generalization** |
 *
 * > **Rule:** Start simple, add complexity only until validation performance stops improving.
 */

const biasVarianceDemo = `
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
import numpy as np

# Generate a noisy sine-wave dataset
np.random.seed(42)
X = np.sort(np.random.uniform(0, 1, 30)).reshape(-1, 1)
y = np.sin(2 * np.pi * X.ravel()) + np.random.normal(0, 0.3, 30)

# ── Model 1: UNDERFIT (degree=1 line vs curved data) ──────
underfit = Pipeline([
    ('poly', PolynomialFeatures(degree=1)),   # Straight line
    ('lr', LinearRegression())
])
underfit.fit(X, y)
print(f"Underfit  Train R²: {underfit.score(X, y):.3f}")   # Low R²

# ── Model 2: GOOD FIT (degree=3 curve — just right) ───────
good_fit = Pipeline([
    ('poly', PolynomialFeatures(degree=3)),   # Gentle curve
    ('lr', LinearRegression())
])
good_fit.fit(X, y)
print(f"Good Fit  Train R²: {good_fit.score(X, y):.3f}")   # Good R²

# ── Model 3: OVERFIT (degree=15 wildly wiggly curve) ──────
overfit = Pipeline([
    ('poly', PolynomialFeatures(degree=15)),  # Wild wiggles
    ('lr', LinearRegression())
])
overfit.fit(X, y)
print(f"Overfit   Train R²: {overfit.score(X, y):.3f}")    # Deceptively perfect!
# On NEW test data, the overfit model would fail catastrophically!
# It memorized noise, not the true pattern.
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 GOLDEN RULES OF MACHINE LEARNING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Rules Every ML Engineer Must Know
 *
 * **1. Garbage In, Garbage Out (GIGO)**
 * > A simple algorithm on high-quality data beats a complex model on bad data. Data quality always wins.
 *
 * **2. Data Leakage is the Silent Killer**
 * > If your model performs suspiciously well (e.g., 99.9% accuracy on a hard problem), you almost certainly have data leakage — the test set's information leaked into training.
 *
 * **3. The Test Set is Sacred**
 * > Never look at the test set until final evaluation. Use a validation set or cross-validation for all tuning. The test set should be touched **exactly once**.
 *
 * **4. Start Simple, Then Scale**
 * > Always build a simple baseline first (Logistic Regression, Linear Regression). Only move to complex models (XGBoost, Neural Networks) if the baseline is provably insufficient.
 *
 * **5. More Data > Better Algorithm**
 * > Doubling your training data usually beats spending a week tuning your model. If you can get more data, get it first.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 05_Data_Preprocessing to learn how to master the
//       80% of ML work: cleaning and engineering features!
// ─────────────────────────────────────────────────────────────────

export { };
