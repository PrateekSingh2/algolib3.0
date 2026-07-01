/**
 * # 🧠 Part 7: Model Evaluation & Metrics
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 07_Model_Evaluation_Metrics\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHY METRICS MATTER SO MUCH
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The 99% Accuracy Trap
 *
 * Imagine building a model to detect cancer. Your dataset has:
 * - **990 healthy patients**
 * - **10 cancer patients**
 *
 * A model that **always says "healthy"** gets **99% accuracy** — but it misses every single cancer case! It's a completely useless model with great accuracy.
 *
 * > **This is why accuracy alone is dangerous for imbalanced data.**
 *
 * The choice of metric must align with what **actually matters** in your problem domain.
 *
 * ---
 *
 * ### 🗺️ Metric Selection Guide
 *
 * | Scenario | Right Metric | Why |
 * |---|---|---|
 * | Balanced classes | Accuracy | Fair representation of all classes |
 * | Imbalanced classes | **F1 Score or ROC-AUC** | Accounts for minority class performance |
 * | False Positives are costly | **Precision** | e.g., spam filter: annoying to mark good email as spam |
 * | False Negatives are costly | **Recall** | e.g., cancer detection: missing a real case is catastrophic |
 * | Comparing models overall | **ROC-AUC** | Threshold-independent comparison |
 * | Very severe imbalance | **PR-AUC** | More informative than ROC-AUC when positives are rare |
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: CONFUSION MATRIX & CLASSIFICATION METRICS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🟦 The Confusion Matrix — Understanding Every Prediction
 *
 * A confusion matrix shows the complete breakdown of where your model is right and where it's wrong:
 * 
 * ![Confusion Matrix](/confusion_matrix.svg)
 */

/**
 * - **TP (True Positive):** Model says Yes, it IS Yes ✅
 * - **TN (True Negative):** Model says No, it IS No ✅
 * - **FP (False Positive):** Model says Yes, but it's actually No ❌ — "False Alarm"
 * - **FN (False Negative):** Model says No, but it's actually Yes ❌ — "Missed case"
 *
 * ---
 *
 * ### 📐 The Four Key Metrics Derived
 *
 * | Metric | Formula | Plain English |
 * |---|---|---|
 * | **Accuracy** | `(TP + TN) / Total` | "What % of ALL predictions were correct?" |
 * | **Precision** | `TP / (TP + FP)` | "Of everything I called Positive, how many actually were?" |
 * | **Recall (Sensitivity)** | `TP / (TP + FN)` | "Of all actual Positives, how many did I catch?" |
 * | **F1 Score** | `2 × (P × R) / (P + R)` | Harmonic mean of Precision & Recall — use when both matter |
 * | **Specificity** | `TN / (TN + FP)` | "Of all actual Negatives, how many did I correctly identify?" |
 *
 * ---
 *
 * ### ⚖️ Precision vs Recall — The Trade-off
 *
 * You cannot maximize both simultaneously. Improving one usually hurts the other:
 *
 * - **Spam filter** → Prioritize **Precision**. A false positive (marking a real email as spam) is very annoying.
 * - **Cancer detection** → Prioritize **Recall**. A false negative (missing cancer) can cost a life.
 */

const classificationMetricsCode = `
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report,
    precision_recall_curve, roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

y_true = [1, 0, 1, 1, 0, 1, 0, 0, 1, 0]
y_pred = [1, 0, 1, 0, 0, 1, 1, 0, 1, 0]
y_prob = [0.9, 0.1, 0.8, 0.4, 0.2, 0.95, 0.6, 0.05, 0.85, 0.3]

# ── Core Metrics ──────────────────────────────────────────
print(f"Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
print(f"Precision: {precision_score(y_true, y_pred):.4f}")
print(f"Recall:    {recall_score(y_true, y_pred):.4f}")
print(f"F1 Score:  {f1_score(y_true, y_pred):.4f}")
print(f"ROC-AUC:   {roc_auc_score(y_true, y_prob):.4f}")

# Full report — shows per-class metrics + macro/weighted averages
print(classification_report(y_true, y_pred))

# ── Confusion Matrix breakdown ────────────────────────────
cm = confusion_matrix(y_true, y_pred)
fig, ax = plt.subplots(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Pred: No', 'Pred: Yes'],
            yticklabels=['True: No', 'True: Yes'])
plt.title("Confusion Matrix")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)

# ── ROC Curve (plots all possible thresholds) ─────────────
fpr, tpr, thresholds = roc_curve(y_true, y_prob)
auc = roc_auc_score(y_true, y_prob)

plt.figure(figsize=(6, 5))
plt.plot(fpr, tpr, label=f"AUC = {auc:.3f}", color='royalblue', lw=2)
plt.plot([0,1],[0,1], 'k--', label="Random classifier (AUC = 0.5)")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate (Recall)")
plt.title("ROC Curve")
plt.legend()
plt.tight_layout()
plt.savefig("roc_curve.png", dpi=150)

# ── Precision-Recall Curve (better for severe imbalance) ──
prec, rec, thresh = precision_recall_curve(y_true, y_prob)
pr_auc = average_precision_score(y_true, y_prob)

plt.figure(figsize=(6, 5))
plt.plot(rec, prec, label=f"PR-AUC = {pr_auc:.3f}", color='darkorange', lw=2)
plt.xlabel("Recall")
plt.ylabel("Precision")
plt.title("Precision-Recall Curve")
plt.legend()
plt.tight_layout()
plt.savefig("pr_curve.png", dpi=150)

# ── Multiclass metrics ────────────────────────────────────
# averaging options: 'macro' treats all classes equally (ignores imbalance)
#                    'weighted' accounts for class support (better for imbalance)
f1_macro    = f1_score(y_true, y_pred, average='macro')
f1_weighted = f1_score(y_true, y_pred, average='weighted')
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: REGRESSION METRICS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📏 Measuring Regression Errors
 *
 * For regression (predicting numbers), you can't use accuracy — you need to measure **how far off** the predictions are.
 *
 * | Metric | Formula | What it penalizes | When to use |
 * |---|---|---|---|
 * | **MSE** | `mean((y − ŷ)²)` | Severely penalizes large errors (squares them) | When large errors are unacceptable |
 * | **RMSE** | `√MSE` | Same as MSE but in original units | Standard regression metric — easy to interpret |
 * | **MAE** | `mean(|y − ŷ|)` | All errors equally (no squaring) | When outliers shouldn't be over-penalized |
 * | **MAPE** | `mean(|y − ŷ| / y) × 100` | Relative % error | Business reporting, but fails when y ≈ 0 |
 * | **R²** | `1 − SS_res/SS_tot` | Variance explained (0=baseline, 1=perfect) | Understanding how much variance is captured |
 * | **Adjusted R²** | `1 − (1−R²)(n−1)/(n−k−1)` | Like R² but penalizes extra features | Comparing models with different feature counts |
 *
 * ---
 *
 * ### 🚨 Don't Use R² to Compare Different Models!
 *
 * R² tells you how much variance your model explains on *that specific dataset*. It changes with the data — it's not a universal quality measure. Use **RMSE or MAE** for model comparisons.
 */

const regressionMetricsCode = `
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error,
    mean_absolute_percentage_error, r2_score
)
import numpy as np

y_true = np.array([3.0, -0.5, 2.0, 7.0, 4.5])
y_pred = np.array([2.5,  0.0, 2.0, 8.0, 5.0])

mse  = mean_squared_error(y_true, y_pred)
rmse = np.sqrt(mse)
mae  = mean_absolute_error(y_true, y_pred)
mape = mean_absolute_percentage_error(y_true, y_pred) * 100
r2   = r2_score(y_true, y_pred)

print(f"MSE:  {mse:.4f}")    # Average squared error
print(f"RMSE: {rmse:.4f}")   # In same units as target variable
print(f"MAE:  {mae:.4f}")    # Average absolute error
print(f"MAPE: {mape:.2f}%")  # % error — easy for business teams to understand
print(f"R²:   {r2:.4f}")     # Proportion of variance explained

# ── Adjusted R² (penalizes for adding useless features) ───
n     = len(y_true)
k     = 5    # Number of features
adj_r2 = 1 - (1 - r2) * (n - 1) / (n - k - 1)
print(f"Adjusted R²: {adj_r2:.4f}")

# ── Residual Analysis ─────────────────────────────────────
# Residuals = actual - predicted (should be random/centered around 0)
residuals = y_true - y_pred
print(f"Residual mean (should be ≈ 0): {residuals.mean():.6f}")
print(f"Residual std:                  {residuals.std():.4f}")
# If residuals show a pattern → model is missing something important!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: CROSS-VALIDATION STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Why Cross-Validation?
 *
 * A single train/test split can be misleading. If you got lucky and the test set happened to be easy, your accuracy looks great. If you were unlucky, it looks bad.
 *
 * **Cross-validation** tests your model on multiple different splits and averages the results — giving a much more **reliable, realistic** estimate of performance.
 *
 * ---
 *
 * ### 🔄 K-Fold Cross-Validation
 *
 * Split data into K equal "folds". Train on K-1 folds, test on the remaining 1. Rotate and repeat K times. Average all K scores.
 *
 * ```
 * K=5 example:
 * Fold 1: [TEST][TRAIN][TRAIN][TRAIN][TRAIN]  → Score 1
 * Fold 2: [TRAIN][TEST][TRAIN][TRAIN][TRAIN]  → Score 2
 * Fold 3: [TRAIN][TRAIN][TEST][TRAIN][TRAIN]  → Score 3
 * Fold 4: [TRAIN][TRAIN][TRAIN][TEST][TRAIN]  → Score 4
 * Fold 5: [TRAIN][TRAIN][TRAIN][TRAIN][TEST]  → Score 5
 * Final Score = mean(Score 1...5) ± std(Score 1...5)
 * ```
 *
 * ---
 *
 * ### 📋 CV Strategy Guide
 *
 * | Strategy | When to Use |
 * |---|---|
 * | **K-Fold** | Regression tasks or balanced classification |
 * | **Stratified K-Fold** | Classification — ensures equal class ratios in every fold |
 * | **Leave-One-Out (LOO)** | Very small datasets (< 100 rows) — extremely expensive! |
 * | **TimeSeriesSplit** | Time-ordered data — train always precedes validation in time |
 * | **GroupKFold** | Same person/entity never appears in both train and test (e.g., patient data) |
 *
 * > **Key Rule:** For classification, ALWAYS use `StratifiedKFold`. It ensures your folds aren't accidentally all one class.
 */

const crossValidationCode = `
from sklearn.model_selection import (
    cross_val_score, cross_validate, StratifiedKFold,
    TimeSeriesSplit, cross_val_predict
)
from sklearn.ensemble import RandomForestClassifier
import numpy as np

model = RandomForestClassifier(n_estimators=100, random_state=42)

# ── Simple K-Fold ─────────────────────────────────────────
cv_scores = cross_val_score(model, X, y, cv=5, scoring='f1')
print(f"CV F1 Scores: {cv_scores.round(4)}")
print(f"Mean ± Std:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
# Report as: "F1 = 0.87 ± 0.03" — shows stability across folds

# ── Stratified K-Fold (recommended for classification) ────
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_auc = cross_val_score(model, X, y, cv=skf, scoring='roc_auc')
print(f"Stratified CV AUC: {cv_auc.mean():.4f} ± {cv_auc.std():.4f}")

# ── Multiple metrics at once ──────────────────────────────
results = cross_validate(
    model, X, y, cv=5,
    scoring=['accuracy', 'f1', 'roc_auc'],
    return_train_score=True   # Compare train vs test to diagnose overfitting!
)
print("Test F1:   ", results['test_f1'].mean().round(4))
print("Train F1:  ", results['train_f1'].mean().round(4))
# If Train F1 >> Test F1 → OVERFITTING

# ── Time Series CV (walk-forward validation) ──────────────
tscv = TimeSeriesSplit(n_splits=5)
for train_idx, val_idx in tscv.split(X_ts):
    X_tr, X_val = X_ts[train_idx], X_ts[val_idx]
    y_tr, y_val = y_ts[train_idx], y_ts[val_idx]
    model.fit(X_tr, y_tr)
    print(f"Val score: {model.score(X_val, y_val):.4f}")
# Train always BEFORE val — no future data leaks into training!

# ── Out-of-fold predictions (for stacking) ────────────────
oof_preds = cross_val_predict(model, X, y, cv=5, method='predict_proba')
# Each prediction is made by a model that NEVER saw that row → gold standard!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: HYPERPARAMETER TUNING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔧 What Are Hyperparameters?
 *
 * **Parameters** are learned from data during training (e.g., model weights).
 * **Hyperparameters** are settings you choose *before* training (e.g., tree depth, learning rate, regularization strength).
 *
 * Choosing the wrong hyperparameters can make the difference between 70% and 90% accuracy.
 *
 * ---
 *
 * ### 🔍 Three Tuning Methods
 *
 * | Method | How it works | Best for |
 * |---|---|---|
 * | **Grid Search** | Tries ALL combinations exhaustively | Small search spaces (< 20 total combinations) |
 * | **Random Search** | Tries random combinations | Larger spaces — often finds good solutions 10x faster than Grid Search |
 * | **Bayesian (Optuna)** | Uses past trial results to intelligently guide the next search | Large spaces — the modern professional standard |
 *
 * > **Rule of thumb:** Fewer than 20 total combinations → GridSearch. Otherwise → Optuna.
 */

const hyperparamTuningCode = `
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from scipy.stats import randint, uniform
import optuna

# ── Grid Search ───────────────────────────────────────────
param_grid = {
    'n_estimators':  [50, 100, 200],
    'max_depth':     [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1]
}
# 3×3×3 = 27 combinations × 5-fold CV = 135 model fits

grid_cv = GridSearchCV(
    GradientBoostingClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,      # Use all CPU cores in parallel
    verbose=1
)
grid_cv.fit(X_train, y_train)
print("Best params:", grid_cv.best_params_)
print("Best CV AUC:", grid_cv.best_score_)

best_model = grid_cv.best_estimator_   # Use this for final predictions!

# ── Random Search (faster for large spaces) ──────────────
param_dist = {
    'n_estimators':  randint(50, 500),
    'max_depth':     randint(2, 15),
    'learning_rate': uniform(0.01, 0.3),   # Uniform random between 0.01 and 0.31
    'subsample':     uniform(0.5, 0.5)     # Uniform between 0.5 and 1.0
}
rand_cv = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=42),
    param_dist,
    n_iter=50,         # Only try 50 random combos — much faster!
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    random_state=42
)
rand_cv.fit(X_train, y_train)
print("Random Search Best:", rand_cv.best_params_)

# ── Optuna (Bayesian — the modern way) ────────────────────
optuna.logging.set_verbosity(optuna.logging.WARNING)

def objective(trial):
    params = {
        'n_estimators':  trial.suggest_int('n_estimators', 50, 500),
        'max_depth':     trial.suggest_int('max_depth', 2, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'subsample':     trial.suggest_float('subsample', 0.5, 1.0)
    }
    from sklearn.model_selection import cross_val_score
    model = GradientBoostingClassifier(**params, random_state=42)
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc').mean()
    return score

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)  # 100 smart trials

print(f"Best AUC:   {study.best_value:.4f}")
print(f"Best Params: {study.best_params}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: HANDLING CLASS IMBALANCE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚖️ The Imbalanced Data Problem
 *
 * Class imbalance means one class has far fewer samples. Real-world examples:
 *
 * - Fraud detection: 99.9% normal, 0.1% fraud
 * - Disease screening: 95% healthy, 5% sick
 * - Equipment failure: 98% normal operation, 2% failure
 *
 * **The naive model problem:** A model that always predicts "normal" gets 99.9% accuracy but catches ZERO fraud cases!
 *
 * ---
 *
 * ### 🛠️ Techniques to Fix Imbalance
 *
 * | Technique | How it works | Pros | Cons |
 * |---|---|---|---|
 * | **Class weights** | Penalize misclassifying minority class more | Simple, no new data | May not fully compensate |
 * | **Oversample (SMOTE)** | Create synthetic minority samples | Increases minority class size | Can create noisy synthetic data |
 * | **Undersample** | Remove majority class samples | Faster training | Loses real data |
 * | **Combined (SMOTE+Tomek)** | Oversample minority + clean boundary | Best of both | More complex |
 *
 * > **Golden Rule:** ONLY apply resampling (SMOTE, undersampling) to the TRAINING set. NEVER to the test/validation set!
 */

const imbalanceCode = `
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling  import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine        import SMOTETomek
from imblearn.pipeline       import Pipeline as ImbPipeline
from sklearn.ensemble        import RandomForestClassifier
import numpy as np

# ── Check imbalance ratio ─────────────────────────────────
unique, counts = np.unique(y_train, return_counts=True)
print(dict(zip(unique, counts)))  # e.g., {0: 9000, 1: 1000} → 9:1 ratio

# ── Method 1: Class Weights (simplest, try first) ─────────
weights      = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
class_weights = dict(enumerate(weights))
print("Weights:", class_weights)  # e.g., {0: 0.56, 1: 5.0}

# Most sklearn models accept class_weight:
rf_bal = RandomForestClassifier(class_weight='balanced', n_estimators=100)

# XGBoost: use scale_pos_weight = count_negative / count_positive
import xgboost as xgb
xgb_bal = xgb.XGBClassifier(scale_pos_weight=9)   # 9000/1000 = 9

# ── Method 2: SMOTE — create synthetic minority samples ───
smote = SMOTE(sampling_strategy=0.5, random_state=42)
# sampling_strategy=0.5 → make minority class 50% the size of majority
X_sm, y_sm = smote.fit_resample(X_train, y_train)
print("Before SMOTE:", dict(zip(*np.unique(y_train, return_counts=True))))
print("After SMOTE: ", dict(zip(*np.unique(y_sm,    return_counts=True))))

# ── Method 3: Random Undersampling ───────────────────────
rus = RandomUnderSampler(sampling_strategy=0.5, random_state=42)
X_us, y_us = rus.fit_resample(X_train, y_train)

# ── Method 4: Best — Combined (SMOTE + Tomek cleanup) ─────
smote_tomek = SMOTETomek(random_state=42)
X_comb, y_comb = smote_tomek.fit_resample(X_train, y_train)

# !! CRITICAL: Use ImbPipeline so SMOTE only applies inside CV !!
imblearn_pipeline = ImbPipeline([
    ('smote', SMOTE(random_state=42)),
    ('model', RandomForestClassifier())
])
imblearn_pipeline.fit(X_train, y_train)
# SMOTE is applied INSIDE each CV fold → no data leakage!
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 EVALUATION CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **For Classification:**
 * - Balanced data → **Accuracy**
 * - Imbalanced data → **F1 Score** or **ROC-AUC**
 * - Minimize false alarms (spam filter) → **Precision**
 * - Minimize missed cases (cancer, fraud) → **Recall**
 * - Very severe imbalance → **PR-AUC** (more informative than ROC-AUC)
 *
 * **For Regression:**
 * - Standard metric → **RMSE** (same units as target)
 * - Robust to outliers → **MAE**
 * - Business reporting → **MAPE** (% error, easy to explain)
 * - Variance explained → **R²** (do not use for model comparison)
 *
 * **Cross-Validation:**
 * - Classification → always use `StratifiedKFold`
 * - Time series → `TimeSeriesSplit` (no shuffling!)
 * - Always report `mean ± std` across folds
 * - Fit preprocessors INSIDE the CV loop using Pipeline
 *
 * **Hyperparameter Tuning:**
 * - Small search space (< 20 combos) → `GridSearchCV`
 * - Large search space → `RandomizedSearchCV` or **Optuna** (best)
 *
 * **Class Imbalance:**
 * - Try `class_weight='balanced'` first — simplest fix
 * - For more improvement: `SMOTE` only on training data
 * - Evaluate with F1 or ROC-AUC — **never just accuracy!**
 *
 * > **🔑 Golden Rule:** The metric you optimize during training should be the same metric that determines business success. Misaligned metrics lead to models that look good on paper but fail in production.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 08_Unsupervised_Learning to explore clustering,
//       PCA, and finding patterns without labeled data!
// ─────────────────────────────────────────────────────────────────

export { };
