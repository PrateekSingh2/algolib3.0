/**
 * # 🧠 Part 6: Supervised Learning Algorithms
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 06_Supervised_Learning_Algorithms\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: LINEAR REGRESSION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Idea: Drawing the Best Fitting Line
 *
 * Imagine you have a scatter plot of "hours studied" vs "exam score". You want to draw **one straight line** that best represents the trend. Linear Regression does exactly that — it finds the mathematically optimal line.
 *
 * ---
 *
 * ### 📐 The Math
 *
 * **Equation:** `ŷ = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ`
 *
 * - `β₀` is the **intercept** — where the line crosses the Y-axis
 * - `β₁...βₙ` are the **coefficients** (weights) — how much each feature matters
 *
 * **Loss Function (what the model minimizes):**
 * > **MSE = (1/n) × Σ(yᵢ − ŷᵢ)²**
 *
 * The model adjusts weights until this sum of squared errors is as small as possible.
 *
 * ---
 *
 * ### 🔒 Regularization: Taming Overfitting
 *
 * | Variant | Penalty Added | Effect | When to Use |
 * |---|---|---|---|
 * | **Linear Regression** | None | No regularization | Simple, few features |
 * | **Ridge (L2)** | `λ × Σβ²` | Shrinks all coefficients towards zero | Many correlated features |
 * | **Lasso (L1)** | `λ × Σ|β|` | Drives irrelevant coefficients to **exactly zero** | Built-in feature selection |
 * | **ElasticNet** | `L1 + L2` combined | Best of both worlds | High-dimensional sparse data |
 *
 * > **Tip:** Lasso is essentially doing automatic feature selection — features with zero coefficients are eliminated entirely!
 *
 * ---
 *
 * ### 4 Assumptions (LINE)
 *
 * - **L**inearity between X and y
 * - **I**ndependence of errors
 * - **N**ormality of residuals
 * - **E**qual variance (Homoscedasticity)
 */

const linearRegressionCode = `
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, RidgeCV, LassoCV
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np

# ── Basic Linear Regression ───────────────────────────────
lr = LinearRegression()
lr.fit(X_train, y_train)
y_pred = lr.predict(X_test)

mse  = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae  = mean_absolute_error(y_test, y_pred)
r2   = r2_score(y_test, y_pred)

print(f"RMSE: {rmse:.4f}")
print(f"MAE:  {mae:.4f}")
print(f"R²:   {r2:.4f}")          # 1.0 = perfect fit, 0 = baseline (just predict mean)

print("Feature coefficients:", lr.coef_)   # Positive = increases y, Negative = decreases y
print("Intercept:",            lr.intercept_)

# ── Ridge Regression (L2 — shrinks large coefficients) ────
ridge = Ridge(alpha=1.0)      # alpha = regularization strength (higher = more shrinkage)
ridge.fit(X_train, y_train)

# ── Lasso (L1 — zeros out irrelevant features) ─────────────
lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)
print("Features eliminated by Lasso:", np.sum(lasso.coef_ == 0))

# ── ElasticNet (L1 + L2 combined) ─────────────────────────
enet = ElasticNet(alpha=0.1, l1_ratio=0.5)   # 50% L1, 50% L2
enet.fit(X_train, y_train)

# ── Auto-select best alpha with cross-validation ──────────
ridge_cv = RidgeCV(alphas=[0.01, 0.1, 1.0, 10.0, 100.0], cv=5)
ridge_cv.fit(X_train, y_train)
print(f"Best Ridge alpha: {ridge_cv.alpha_}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: LOGISTIC REGRESSION (Classification)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Despite the Name — It's a Classifier!
 *
 * Logistic Regression predicts the **probability** that something belongs to a class. It outputs a number between 0 and 1 (a probability), not a raw number.
 *
 * ---
 *
 * ### 📐 How it Works
 *
 * 1. Compute a linear combination: `z = β₀ + β₁x₁ + ... + βₙxₙ`
 * 2. Squash `z` through the **Sigmoid function**: `σ(z) = 1 / (1 + e⁻ᶻ)`
 * 3. Sigmoid always outputs a value in `[0, 1]` — interpret as probability
 * 4. If `P ≥ 0.5` → predict class 1; else → predict class 0
 *
 * **Loss Function:** Binary Cross-Entropy
 * > `Loss = −[y · log(ŷ) + (1−y) · log(1−ŷ)]`
 *
 * ---
 *
 * ### ⚙️ Key Parameters
 *
 * | Parameter | What it controls |
 * |---|---|
 * | `C` | Inverse of regularization strength. High C = less regularization |
 * | `penalty` | `'l2'` (default), `'l1'` (sparsity), `'elasticnet'` |
 * | `solver` | Optimization algorithm: `'lbfgs'` (default), `'liblinear'`, `'saga'` |
 * | `threshold` | Decision boundary (default 0.5). Lowering it → more positives detected |
 *
 * > **When to lower the threshold:** In medical screening (cancer detection), it's better to **over-predict positives** (catch more sick patients) even at the cost of some false alarms. Lower the threshold to, say, 0.3.
 */

const logisticRegressionCode = `
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, confusion_matrix, classification_report,
    roc_auc_score, roc_curve
)
import matplotlib.pyplot as plt

# ── Train ─────────────────────────────────────────────────
logreg = LogisticRegression(
    C=1.0,           # High C = less regularization (trust the data more)
    penalty='l2',    # 'l1', 'l2', 'elasticnet', or 'none'
    solver='lbfgs',  # Good default; use 'saga' for large datasets + L1
    max_iter=1000,   # Increase if you see ConvergenceWarning
    random_state=42
)
logreg.fit(X_train, y_train)

# ── Predict ───────────────────────────────────────────────
y_pred      = logreg.predict(X_test)          # Class labels (0 or 1)
y_pred_prob = logreg.predict_proba(X_test)[:, 1]  # Probability of class 1

# ── Evaluate ──────────────────────────────────────────────
print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
print(f"ROC-AUC:   {roc_auc_score(y_test, y_pred_prob):.4f}")
print(classification_report(y_test, y_pred))

# ── Confusion Matrix breakdown ────────────────────────────
cm = confusion_matrix(y_test, y_pred)
TN, FP, FN, TP = cm.ravel()
precision = TP / (TP + FP)   # Of all we called positive, how many truly are?
recall    = TP / (TP + FN)   # Of all actual positives, how many did we catch?
f1        = 2 * precision * recall / (precision + recall)
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")

# ── Custom Threshold (lower = more positives caught) ──────
threshold = 0.3   # Catch more positives (higher recall, lower precision)
y_custom  = (y_pred_prob >= threshold).astype(int)

# ── Multiclass classification ─────────────────────────────
logreg_mc = LogisticRegression(multi_class='ovr', solver='lbfgs')
# 'ovr' = One-vs-Rest  |  'multinomial' = softmax (true multi-class)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: DECISION TREES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🌳 The Idea: 20 Questions for Data
 *
 * A Decision Tree is like a game of 20 Questions. It asks a series of yes/no questions about the data and follows branches until it reaches a final answer.
 *
 * **Example:**
 * - *"Is age > 35?"* → Yes → *"Is income > 50k?"* → Yes → Predict: "Will buy"
 *
 * ---
 *
 * ### 🔬 How Does it Choose Which Question to Ask First?
 *
 * The tree picks the feature and threshold that **reduces uncertainty the most**:
 *
 * | Criterion | Formula | How it works |
 * |---|---|---|
 * | **Gini Impurity** | `1 − Σpᵢ²` | Measures how "mixed" the group is. Lower = purer. Default in sklearn. |
 * | **Entropy (Info Gain)** | `−Σpᵢ·log₂(pᵢ)` | Information theory measure. More sensitive to small probabilities. |
 *
 * ---
 *
 * ### ✅ Pros vs ❌ Cons
 *
 * | Pros | Cons |
 * |---|---|
 * | Extremely interpretable — visualize the tree | Prone to overfitting (can grow infinitely deep) |
 * | No feature scaling required | Unstable — small data changes → very different tree |
 * | Handles mixed numeric + categorical data | Single tree has high variance |
 * | Fast training and prediction | Poor generalization compared to ensembles |
 *
 * > **Overfitting fix:** Limit depth with `max_depth`, `min_samples_split`, `min_samples_leaf`
 */

const decisionTreeCode = `
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text, plot_tree
import matplotlib.pyplot as plt

# ── Classification Tree ───────────────────────────────────
dt = DecisionTreeClassifier(
    criterion='gini',       # 'gini' (default) or 'entropy'
    max_depth=5,            # Max depth — prevents overfitting
    min_samples_split=20,   # Min samples in a node to split
    min_samples_leaf=10,    # Min samples required at any leaf
    random_state=42
)
dt.fit(X_train, y_train)

print(f"Train Accuracy: {dt.score(X_train, y_train):.4f}")
print(f"Test  Accuracy: {dt.score(X_test, y_test):.4f}")
# If Train >> Test, the tree is overfitting → reduce max_depth

# ── Feature Importances (Gini-based) ─────────────────────
importances = dict(zip(feature_names, dt.feature_importances_))
sorted_imp  = sorted(importances.items(), key=lambda x: -x[1])
print("Feature importances:", sorted_imp)

# ── Print the tree in text form ───────────────────────────
print(export_text(dt, feature_names=feature_names))

# ── Visualize the tree ────────────────────────────────────
plt.figure(figsize=(16, 8))
plot_tree(dt, feature_names=feature_names, class_names=['0','1'],
          filled=True, rounded=True)
plt.tight_layout()
plt.savefig("decision_tree.png", dpi=150)

# ── Regression Tree (predicts continuous values) ──────────
dt_reg = DecisionTreeRegressor(max_depth=4, min_samples_leaf=10)
dt_reg.fit(X_train, y_train)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: RANDOM FOREST & ENSEMBLE METHODS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Wisdom of the Crowd
 *
 * One decision tree is unstable and prone to overfitting. But what if you built **500 different trees** — each slightly different — and let them all vote on the final answer?
 *
 * That's a **Random Forest**. The collective wisdom of 500 imperfect trees almost always beats one "perfect" tree.
 *
 * ---
 *
 * ### 🏗️ Three Types of Ensembles
 * 
 * ![Bias-Variance Tradeoff](/bias_variance.svg)
 *
 * | Type | How it works | Fixes | Example |
 * |---|---|---|---|
 * | **Bagging** | Train models on different random subsets of data, then average/vote | Reduces **Variance** (overfitting) | Random Forest |
 * | **Boosting** | Train models **sequentially** — each one focuses on correcting the last one's mistakes | Reduces **Bias** (underfitting) | XGBoost, LightGBM, AdaBoost |
 * | **Stacking** | Train multiple models, then train a **meta-model** on their predictions | Combines strengths of different algorithms | Used in Kaggle winning solutions |
 *
 * ---
 *
 * ### 🌲 Random Forest Key Concepts
 *
 * - **Bootstrap sampling:** Each tree trains on a random subset (with replacement) of the training data
 * - **Feature randomness:** Each split considers only `sqrt(n_features)` randomly selected features — forces diversity between trees
 * - **OOB Score:** The samples not used for training a tree act as a free validation set — `oob_score=True` gives you validation accuracy without a separate split!
 */

const randomForestCode = `
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, VotingClassifier
)
from sklearn.model_selection import GridSearchCV

# ── Random Forest ─────────────────────────────────────────
rf = RandomForestClassifier(
    n_estimators=200,      # Number of trees (more = better, up to a point)
    max_depth=None,        # None = grow until pure leaves (but can overfit)
    min_samples_leaf=5,    # Each leaf must have at least 5 samples
    max_features='sqrt',   # Features per split = sqrt(total) — promotes diversity
    bootstrap=True,        # Sample with replacement
    oob_score=True,        # Free validation estimate!
    n_jobs=-1,             # Use all CPU cores
    random_state=42
)
rf.fit(X_train, y_train)
print(f"OOB Score (free validation!): {rf.oob_score_:.4f}")
print(f"Test Score:                   {rf.score(X_test, y_test):.4f}")

# ── Hyperparameter tuning with Grid Search ────────────────
param_grid = {
    'n_estimators':    [100, 200, 300],
    'max_depth':       [None, 5, 10],
    'min_samples_leaf': [1, 5, 10],
    'max_features':    ['sqrt', 'log2']
}
gs = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid, cv=5, scoring='roc_auc', n_jobs=-1
)
gs.fit(X_train, y_train)
print("Best params:", gs.best_params_)

# ── Gradient Boosting (sequential correction) ─────────────
gbm = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,    # How much each tree contributes
    max_depth=3,          # Keep trees shallow for boosting
    subsample=0.8,        # Stochastic GBM — helps prevent overfitting
    random_state=42
)
gbm.fit(X_train, y_train)

# ── Voting Classifier (simple ensemble of different models) ─
voting_clf = VotingClassifier(
    estimators=[
        ('rf',  RandomForestClassifier(n_estimators=100)),
        ('gbm', GradientBoostingClassifier()),
    ],
    voting='soft'   # 'soft' = average probabilities (better than hard voting)
)
voting_clf.fit(X_train, y_train)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: XGBOOST, LIGHTGBM, CATBOOST — INDUSTRY FAVORITES ⭐
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏆 Why These Three Dominate
 *
 * XGBoost, LightGBM, and CatBoost are all **gradient boosting** implementations — but each is heavily optimized and battle-tested in production and competitions.
 *
 * > "If in doubt, try XGBoost or LightGBM first on tabular data."
 *
 * ---
 *
 * ### ⚖️ Comparison
 *
 * | Property | XGBoost | LightGBM | CatBoost |
 * |---|---|---|---|
 * | **Speed** | Fast | **Fastest** | Fast |
 * | **Memory** | High | **Lowest** | Medium |
 * | **Categoricals** | Needs encoding | Can handle | **Built-in (best)** |
 * | **Large datasets** | Good | **Excellent** | Good |
 * | **Small datasets** | Good | Can overfit | Good |
 * | **Early stopping** | ✅ | ✅ | ✅ |
 */

const xgboostCode = `
import xgboost  as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

# ── XGBoost ───────────────────────────────────────────────
xgb_model = xgb.XGBClassifier(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,          # Row sampling per tree
    colsample_bytree=0.8,   # Feature sampling per tree
    reg_alpha=0,            # L1 regularization
    reg_lambda=1,           # L2 regularization
    eval_metric='logloss',
    random_state=42
)
xgb_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    early_stopping_rounds=50,   # Stop if no improvement for 50 rounds
    verbose=100
)
print(f"Best iteration: {xgb_model.best_iteration}")
print(f"Test score:     {xgb_model.score(X_test, y_test):.4f}")

# ── LightGBM ──────────────────────────────────────────────
lgb_model = lgb.LGBMClassifier(
    n_estimators=1000,
    learning_rate=0.05,
    num_leaves=31,          # 2^max_depth → key LGB parameter
    feature_fraction=0.8,   # Same as colsample_bytree
    bagging_fraction=0.8,   # Same as subsample
    bagging_freq=5,
    random_state=42
)
lgb_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)]
)

# ── CatBoost (best for categorical features) ──────────────
cat_features = ['city', 'gender', 'category']  # No encoding needed!
cb_model = CatBoostClassifier(
    iterations=500, learning_rate=0.05, depth=6,
    cat_features=cat_features,   # Just pass column names!
    verbose=100, random_state=42
)
cb_model.fit(X_train, y_train, eval_set=(X_test, y_test))
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: SVM — SUPPORT VECTOR MACHINES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏈 The Widest Street Analogy
 *
 * Imagine two groups of people standing in a field. You want to draw a line between them. SVM doesn't just find any line — it finds the line that leaves the **widest possible gap** (street) between the two groups.
 *
 * The data points on the edge of each group (the ones closest to the boundary) are called **Support Vectors** — they literally "support" the boundary.
 *
 * ---
 *
 * ### 🔧 Key Parameters
 *
 * | Parameter | Effect |
 * |---|---|
 * | **C (regularization)** | High C = narrow margin, low bias, risk of overfitting. Low C = wider margin, more regularized. |
 * | **Kernel** | `'linear'` for text/linearly separable data. `'rbf'` (default) for nonlinear patterns. |
 * | **Gamma (RBF)** | High gamma = complex, wiggly boundary. Low gamma = smooth boundary. |
 *
 * ---
 *
 * ### 🚨 Critical: SVM Requires Feature Scaling!
 *
 * SVM is distance-based. Without scaling, large-scale features completely dominate the margin calculation. Always scale before SVM.
 */

const svmCode = `
from sklearn.svm import SVC, SVR
from sklearn.model_selection import GridSearchCV

# !! ALWAYS scale before SVM !!
# svc.fit(X_train_scaled, y_train) → correct
# svc.fit(X_train_raw, y_train)    → wrong (terrible results)

svc = SVC(
    C=1.0,
    kernel='rbf',     # 'linear', 'rbf' (best default), 'poly', 'sigmoid'
    gamma='scale',    # 'scale' = 1/(n_features × X.var()) → good default
    probability=True, # Enables predict_proba() — slightly slower
    random_state=42
)
svc.fit(X_train_scaled, y_train)
print(f"SVM Accuracy: {svc.score(X_test_scaled, y_test):.4f}")

# ── Tune C and gamma together ─────────────────────────────
param_grid = {
    'C':     [0.1, 1, 10, 100],
    'gamma': [0.001, 0.01, 0.1, 'scale']
}
gs = GridSearchCV(SVC(kernel='rbf'), param_grid, cv=5, scoring='accuracy')
gs.fit(X_train_scaled, y_train)
print("Best params:", gs.best_params_)

# ── SVR for regression tasks ──────────────────────────────
svr = SVR(kernel='rbf', C=100, gamma=0.1, epsilon=0.1)
svr.fit(X_train_scaled, y_train)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 7: K-NEAREST NEIGHBORS (KNN)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 "Tell Me Your Neighbors, I'll Tell You Who You Are"
 *
 * KNN is the simplest ML algorithm conceptually. When a new unknown data point arrives:
 *
 * 1. Measure the distance to **every** training point
 * 2. Find the `K` closest ones (the nearest neighbors)
 * 3. **Vote** — whichever class the majority belongs to, that's your prediction
 *
 * ---
 *
 * ### 📐 Distance Metrics
 *
 * | Metric | Formula | Best For |
 * |---|---|---|
 * | **Euclidean** | `√Σ(xᵢ − yᵢ)²` | Continuous, low-dimensional data |
 * | **Manhattan** | `Σ|xᵢ − yᵢ|` | Less sensitive to outliers |
 * | **Cosine** | Angle between vectors | Text/NLP features |
 *
 * ---
 *
 * ### ⚠️ Critical Weaknesses
 *
 * - **Requires scaling** — KNN is entirely distance-based
 * - **Slow at inference** — must compute distance to ALL training points every time
 * - **Curse of Dimensionality** — in high-dimensional spaces, all points become equidistant, making "nearest neighbors" meaningless
 * - **K selection** — use cross-validation; odd K avoids ties in binary classification
 */

const knnCode = `
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
import numpy as np

# ── Find the best K using cross-validation ────────────────
k_range  = range(1, 31)
k_scores = []

for k in k_range:
    knn    = KNeighborsClassifier(n_neighbors=k, metric='euclidean')
    scores = cross_val_score(knn, X_train_scaled, y_train, cv=5, scoring='accuracy')
    k_scores.append(scores.mean())

best_k = list(k_range)[np.argmax(k_scores)]
print(f"Best K:    {best_k}")
print(f"Best Score: {max(k_scores):.4f}")

# ── Final KNN with optimal K ──────────────────────────────
knn = KNeighborsClassifier(
    n_neighbors=best_k,
    weights='distance',  # 'uniform' = all equal weight, 'distance' = closer = more weight
    metric='euclidean',  # 'euclidean', 'manhattan', 'cosine'
    n_jobs=-1
)
knn.fit(X_train_scaled, y_train)
print(f"Test Accuracy: {knn.score(X_test_scaled, y_test):.4f}")
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 ALGORITHM SELECTION CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 When to Use Which Algorithm
 *
 * | Situation | Best Choice |
 * |---|---|
 * | Tabular data (competition / production) | **XGBoost / LightGBM** |
 * | Need to explain the model to stakeholders | **Logistic Regression / Decision Tree** |
 * | Text classification | **Naive Bayes / Logistic Regression** |
 * | Many categorical features | **CatBoost** |
 * | Small dataset (< 1,000 rows) | **KNN / SVM / Logistic Regression** |
 * | Large dataset (millions of rows) | **LightGBM / Logistic Regression** |
 * | First baseline model (always do this first!) | **Logistic Regression / Linear Regression** |
 * | Many irrelevant features | **Lasso / Random Forest** (both do feature selection) |
 *
 * ---
 *
 * ### 🚨 Must-Remember Rules
 *
 * - **SVM and KNN REQUIRE feature scaling** — skip this and results are garbage
 * - **Tree-based methods** (RF, XGBoost) do **NOT** need scaling
 * - **Always start with a simple baseline** — then prove you need something complex
 * - **Use `early_stopping_rounds`** with XGBoost/LightGBM — prevents overfitting and saves time
 * - **Logistic Regression ConvergenceWarning** → increase `max_iter` to 1000+
 * - **Random Forest OOB score** = free validation estimate without a separate split
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 07_Model_Evaluation_Metrics to learn how to measure
//       how good (or bad) your model truly is!
// ─────────────────────────────────────────────────────────────────

export { };
