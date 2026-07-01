/**
 * # 🧠 Part 5: Data Preprocessing
 * ### & Feature Engineering
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 05_Data_Preprocessing\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: HANDLING MISSING VALUES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Why Does Missing Data Break ML?
 *
 * Machine learning algorithms are just math equations. You can't multiply a weight by `NaN`. Most sklearn models will throw an error and refuse to train if your data has missing values.
 *
 * But more importantly — how you handle missing data **changes your model's accuracy** significantly. There's no one-size-fits-all strategy.
 *
 * ---
 *
 * ### 🔬 Three Types of Missing Data
 *
 * Understanding *why* data is missing determines the best fix:
 *
 * | Type | Meaning | Example | Strategy |
 * |---|---|---|---|
 * | **MCAR** (Missing Completely At Random) | Missingness is pure random chance | A sensor randomly failed for 1 second | Safe to drop rows or use simple mean/median |
 * | **MAR** (Missing At Random) | Missingness depends on *other* observed variables | Men less likely to answer mental-health questions | Impute using related features (KNN Imputer) |
 * | **MNAR** (Missing Not At Random) | Missingness depends on the missing value itself | Wealthy people hide their income | Hard! Add a boolean `"Income_is_Missing"` column — the fact it's missing is itself informative! |
 *
 * ---
 *
 * ### 📋 Strategy Comparison
 *
 * | Strategy | When to use |
 * |---|---|
 * | **Drop rows** | Only if missing is < 5% and MCAR |
 * | **Drop columns** | If a feature is > 60% missing — it's probably noise |
 * | **Mean imputation** | Symmetric numeric data, NO outliers |
 * | **Median imputation** | Skewed numeric data or when outliers exist (safer default) |
 * | **Mode imputation** | Categorical columns |
 * | **KNN imputation** | When related features can predict the missing value |
 * | **Add missing indicator** | MNAR data — the fact it's missing is meaningful |
 */

const missingValuesCode = `
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer, KNNImputer

df = pd.read_csv("data.csv")

# ── Diagnose: How much is missing? ────────────────────────
missing_stats = pd.DataFrame({
    'Missing_Count': df.isnull().sum(),
    'Missing_%':     (df.isnull().sum() / len(df)) * 100
})
print(missing_stats[missing_stats['Missing_Count'] > 0])

# ── Strategy 1: Drop rows or columns ──────────────────────
df_clean = df.dropna(subset=['critical_column'])         # Only drop if this col is NaN
df_clean = df.dropna(thresh=int(0.5 * len(df.columns)))  # Keep rows ≥ 50% valid

# ── Strategy 2: Statistical Imputation ────────────────────
imputer_median = SimpleImputer(strategy='median')      # Safe for skewed data
imputer_mode   = SimpleImputer(strategy='most_frequent')  # For categorical

df[['salary', 'age']] = imputer_median.fit_transform(df[['salary', 'age']])
df[['city', 'gender']] = imputer_mode.fit_transform(df[['city', 'gender']])

# ── Strategy 3: KNN Imputation (uses similar rows) ────────
# "Find 5 people with similar age, education, and city. Average their salary."
knn_imputer = KNNImputer(n_neighbors=5, weights='distance')
df_imputed  = pd.DataFrame(
    knn_imputer.fit_transform(df.select_dtypes(include=np.number)),
    columns=df.select_dtypes(include=np.number).columns
)

# ── Strategy 4: Add Missing Indicator (MNAR data) ─────────
df['income_missing'] = df['income'].isnull().astype(int)  # New binary feature!
df['income'].fillna(df['income'].median(), inplace=True)  # Then fill

# ── Strategy 5: Interpolation (time-series data) ──────────
df_ts = df.sort_values('date')
df_ts['stock_price'].interpolate(method='linear', inplace=True)  # Connects the dots
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: FEATURE SCALING — MATHEMATICAL NECESSITY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Why Do We Scale?
 *
 * Imagine a dataset with `Age` (range 18–80) and `Salary` (range ₹30,000–₹2,50,000).
 *
 * KNN and SVM calculate the **Euclidean distance** between points:
 *
 * > **Distance = √ [ (Age₁ − Age₂)² + (Salary₁ − Salary₂)² ]**
 *
 * Because salary numbers are **thousands of times bigger** than age, the salary difference completely dominates. The algorithm practically **ignores Age**! Scaling fixes this.
 *
 * ---
 *
 * ### ⚖️ Three Scaling Methods
 *
 * | Method | Formula | Best For |
 * |---|---|---|
 * | **StandardScaler** | `z = (x − μ) / σ` | General ML, Gradient Descent, Neural Nets |
 * | **MinMaxScaler** | `x_norm = (x − min) / (max − min)` | Image pixels, Neural Nets with bounded inputs |
 * | **RobustScaler** | `x_rob = (x − Median) / IQR` | Data with many outliers — completely ignores them! |
 *
 * ---
 *
 * ### 🚨 The Golden Rule of Scaling
 *
 * > **ALWAYS fit the scaler on TRAINING data only. Never on the full dataset.**
 *
 * If you fit on the full dataset, the scaler learns the test set's mean and variance — that's **Data Leakage**. It makes your model look better than it actually is.
 *
 * ```
 * ✅ CORRECT:  scaler.fit(X_train) → scaler.transform(X_train) + scaler.transform(X_test)
 * ❌ WRONG:    scaler.fit(X_full)  → scaler.transform(X_train) + scaler.transform(X_test)
 * ```
 *
 * **Which models need scaling?**
 *
 * | Needs Scaling | Does NOT Need Scaling |
 * |---|---|
 * | KNN, SVM, Logistic Regression | Decision Trees |
 * | Neural Networks | Random Forest |
 * | PCA, K-Means | XGBoost, LightGBM |
 */

const scalingCode = `
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.model_selection import train_test_split

# !! ALWAYS split FIRST, then scale !!
X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

# ── StandardScaler (Z-score) — General purpose ────────────
std_scaler = StandardScaler()
X_train_std = std_scaler.fit_transform(X_train)  # Learn mean/std from TRAIN
X_test_std  = std_scaler.transform(X_test)        # Apply train's stats to test

print("Mean after scaling:", X_train_std.mean(axis=0))   # ≈ 0 for all features
print("Std after scaling:",  X_train_std.std(axis=0))    # ≈ 1 for all features

# ── MinMaxScaler — for image pixels or [0,1] bounded inputs ──
mm_scaler = MinMaxScaler(feature_range=(0, 1))
X_train_mm = mm_scaler.fit_transform(X_train)
X_test_mm  = mm_scaler.transform(X_test)

# ── RobustScaler — when outliers exist ────────────────────
# Uses Median and IQR instead of Mean and Std → outliers don't skew it
rb_scaler  = RobustScaler()
X_train_rb = rb_scaler.fit_transform(X_train)
X_test_rb  = rb_scaler.transform(X_test)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: ENCODING CATEGORICAL VARIABLES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Why Can't We Use Text Directly?
 *
 * ML models are pure math equations. You can't multiply a weight by the word `"Paris"` or `"Red"`. Every piece of text must be converted to a **number**.
 *
 * ---
 *
 * ### 🔢 Three Encoding Methods
 *
 * | Method | How it works | When to use | Warning |
 * |---|---|---|---|
 * | **Label Encoding** | Maps categories to integers: `Red=0, Green=1, Blue=2` | Only for *ordinal* data (Small→Medium→Large) | ❌ Implies fake order for nominal data |
 * | **One-Hot Encoding (OHE)** | Creates a new 0/1 column for every category | Nominal data with few unique values (< 20) | ❌ Curse of dimensionality if many values |
 * | **Target Encoding** | Replaces category with its historical average target value | High-cardinality data (Zipcodes, User IDs) | ⚠️ Risk of leakage — use cross-fold encoding |
 *
 * ---
 *
 * ### 🚨 The Dummy Variable Trap
 *
 * If you OHE a column with `[Male, Female]`, you get two columns: `Male` and `Female`.
 * But `Female = 1 - Male` — they are **perfectly correlated!** This breaks linear models.
 *
 * **Fix:** Always use `drop='first'` in OneHotEncoder to remove one column (N-1 encoding).
 */

const encodingCode = `
import pandas as pd
from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder

df = pd.DataFrame({
    'color':  ['red', 'green', 'blue', 'red'],         # Nominal — no natural order
    'size':   ['small', 'medium', 'large', 'medium'],  # Ordinal — has natural order
    'target': [1, 0, 1, 0]
})

# ── Ordinal Encoding — for data WITH a natural order ──────
ord_enc = OrdinalEncoder(categories=[['small', 'medium', 'large']])
df['size_encoded'] = ord_enc.fit_transform(df[['size']])
# small=0, medium=1, large=2 → the model correctly learns the hierarchy

# ── One-Hot Encoding — for data WITHOUT a natural order ───
# drop='first' avoids the Dummy Variable Trap!
ohe = OneHotEncoder(drop='first', sparse_output=False)
color_encoded = ohe.fit_transform(df[['color']])
color_cols    = ohe.get_feature_names_out(['color'])
# If categories are [blue, green, red], 'blue' is dropped.
# green → [1, 0], red → [0, 1], blue → [0, 0]

# ── Pandas get_dummies (quick alternative) ─────────────────
df_encoded = pd.get_dummies(df, columns=['color'], drop_first=True)

# ── Target Encoding — for high-cardinality columns ────────
# Replace each category with its average target value
target_means = df.groupby('color')['target'].mean()
df['color_target_enc'] = df['color'].map(target_means)
# 'red' → average target for red rows, etc.
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: OUTLIER DETECTION & TREATMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 What's an Outlier and Why Does It Matter?
 *
 * An outlier is a data point that is **unusually far** from the rest. Think of exam scores: `[55, 60, 62, 58, 61, 99]` — that 99 is suspicious.
 *
 * **Why they hurt ML models:**
 * Linear regression minimizes *squared* error. Squaring a massive outlier error creates an **astronomical penalty**, pulling the entire regression line toward the outlier. One bad point can ruin the model.
 *
 * ---
 *
 * ### 📐 Two Ways to Define an Outlier
 *
 * | Method | Formula | Works best when |
 * |---|---|---|
 * | **Z-Score** | `z = (x − μ) / σ`, flag if `|z| > 3` | Data is normally distributed (bell-curve) |
 * | **IQR Method** | `Lower = Q1 − 1.5×IQR`, `Upper = Q3 + 1.5×IQR` | Any data shape — robust to skewness |
 *
 * > **Why 1.5 in the IQR rule?** It mathematically approximates the 3-sigma rule but uses medians instead of means, making it *immune to the outliers themselves*.
 *
 * ---
 *
 * ### 🛠️ Treatment Options
 *
 * | Treatment | What it does | When to use |
 * |---|---|---|
 * | **Delete** | Remove outlier rows | Only if outliers are data entry errors |
 * | **Winsorization (Capping)** | Cap values at the IQR bounds — don't delete, just clip | Most cases — preserves data volume |
 * | **Log Transformation** | `log(x)` compresses large values | Right-skewed data (salaries, prices) |
 * | **Keep as is** | Don't touch them | If outliers are real and informative (fraud detection!) |
 */

const outlierCode = `
import numpy as np
import pandas as pd
from scipy import stats

data = pd.Series([10, 12, 11, 13, 100, 12, 11, 9, -200, 10])

# ── Method 1: Z-Score ─────────────────────────────────────
z_scores  = np.abs(stats.zscore(data))
outliers_z = data[z_scores > 3]
print("Z-Score outliers:", outliers_z.tolist())

# ── Method 2: IQR (Gold Standard — works on any distribution)
Q1  = data.quantile(0.25)
Q3  = data.quantile(0.75)
IQR = Q3 - Q1

lower_bound  = Q1 - 1.5 * IQR
upper_bound  = Q3 + 1.5 * IQR
outliers_iqr = data[(data < lower_bound) | (data > upper_bound)]
print("IQR outliers:", outliers_iqr.tolist())

# ── Treatment: Winsorization (Cap, don't delete) ──────────
data_capped = data.clip(lower=lower_bound, upper=upper_bound)
print("After capping:", data_capped.tolist())
# 100 becomes upper_bound, -200 becomes lower_bound

# ── Treatment: Log Transformation (for right-skewed data) ─
# np.log1p = log(1 + x) → handles 0 values safely
salaries    = pd.Series([30000, 35000, 40000, 250000, 500000])
log_salaries = np.log1p(salaries)
print("Log-transformed:", log_salaries.round(2).tolist())
# Extreme values are pulled toward the center
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: FEATURE ENGINEERING — THE ART OF ML
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎨 What is Feature Engineering?
 *
 * > *"Applied machine learning is basically feature engineering."* — Andrew Ng
 *
 * Feature Engineering is using **domain knowledge** to create new, smarter columns that make hidden patterns visible to the algorithm.
 *
 * ML models can only see what you give them. If the relevant signal is hidden inside two columns, the model might miss it. But if you create a new column that explicitly captures that relationship — the model's accuracy can jump dramatically.
 *
 * ---
 *
 * ### 💡 Real Examples
 *
 * | Raw Features | Engineered Feature | Why it helps |
 * |---|---|---|
 * | `Price`, `Area` | `Price_Per_SqFt = Price / Area` | Exposes value density |
 * | `Checkout_Time`, `Cart_Add_Time` | `Decision_Time = Checkout - Cart` | Captures hesitation |
 * | `Date` column (2023-12-25) | `Is_Holiday`, `Day_of_Week`, `Month` | Model can't understand raw dates |
 * | `Latitude`, `Longitude` | `Distance_to_City_Center` | One number captures location context |
 * | `Width`, `Height` | `Area = Width × Height`, `Aspect_Ratio` | Non-linear interaction made explicit |
 */

const featureEngineeringCode = `
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures

df = pd.DataFrame({
    'width':  [10, 5, 8],
    'length': [20, 10, 15],
    'date':   pd.to_datetime(['2023-12-25', '2023-07-04', '2023-10-31'])
})

# ── Domain knowledge engineering ──────────────────────────
df['area']         = df['width'] * df['length']       # Non-linear interaction
df['aspect_ratio'] = df['width'] / df['length']       # Proportional shape
df['perimeter']    = 2 * (df['width'] + df['length']) # Extra geometry feature

# ── Temporal feature extraction ───────────────────────────
df['month']        = df['date'].dt.month               # 1-12
df['day_of_week']  = df['date'].dt.dayofweek           # 0=Monday, 6=Sunday
df['is_weekend']   = df['day_of_week'].isin([5,6]).astype(int)
df['quarter']      = df['date'].dt.quarter             # 1, 2, 3, or 4

# ── Polynomial features (automatic brute-force engineering)
# Generates: x1, x2, x1², x2², x1*x2
poly   = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(df[['width', 'length']])
print("Original features: 2")
print("After degree-2 poly:", X_poly.shape[1], "features")
# → 5 features: width, length, width², width×length, length²
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: SKLEARN PIPELINES — THE PROFESSIONAL WAY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏭 Why Pipelines?
 * 
 * ![ML Pipeline](/ml_pipeline.svg)
 *
 * If you manually run imputation → encoding → scaling → training, you must write the same code **twice**: once for training data, once for production/inference data.
 *
 * This leads to:
 * - **Data Leakage** (fitting scaler on whole dataset)
 * - **Bugs in production** (different preprocessing order)
 * - **Messy, unmaintainable code**
 *
 * A **Pipeline** chains all preprocessing steps and the model into **one single object**. You call `.fit()` once. Everything happens in the right order, automatically.
 *
 * > **Rule:** In professional ML, if you're not using Pipelines, you're doing it wrong.
 */

const pipelineExample = `
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

numeric_features     = ['age', 'income', 'credit_score']
categorical_features = ['city', 'profession']

# ── Numeric pipeline: impute → scale ──────────────────────
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler',  StandardScaler())
])

# ── Categorical pipeline: impute → one-hot encode ─────────
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('ohe',     OneHotEncoder(handle_unknown='ignore', drop='first'))
])

# ── Combine both pipelines with ColumnTransformer ─────────
preprocessor = ColumnTransformer(transformers=[
    ('num', numeric_transformer,     numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

# ── Final master pipeline: preprocess + model ─────────────
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model',        RandomForestClassifier(n_estimators=100))
])

# Pass raw, messy data — pipeline handles everything!
full_pipeline.fit(X_train_raw, y_train)

# In production, just pass raw data to predict:
predictions = full_pipeline.predict(X_new_raw)
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 PREPROCESSING CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Missing Values**
 * - Check with `df.isnull().sum()`
 * - < 5% missing & MCAR → `dropna()`
 * - Numeric, no outliers → `SimpleImputer(strategy='mean')`
 * - Numeric, with outliers → `SimpleImputer(strategy='median')` ✅ safer
 * - Categorical → `SimpleImputer(strategy='most_frequent')`
 * - Related features available → `KNNImputer(n_neighbors=5)`
 *
 * **Scaling**
 * - Always **split first, scale second**
 * - Always **fit on train only**, transform both train and test
 * - KNN, SVM, LogReg, Neural Nets → need scaling
 * - Tree models (RF, XGBoost) → don't need scaling
 *
 * **Encoding**
 * - Ordered categories → `OrdinalEncoder` with explicit order
 * - Unordered categories, few values → `OneHotEncoder(drop='first')`
 * - Many unique values → Target Encoding
 *
 * **Outliers**
 * - Detect with IQR method (works for any distribution)
 * - Treat with Winsorization (`.clip()`) — preserves data size
 * - Right-skewed data (prices, salaries) → `np.log1p()`
 *
 * > **🔑 Golden Rule:** Use `sklearn Pipeline` for all preprocessing. It prevents data leakage, is reproducible, and works correctly in production.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 06_Supervised_Learning_Algorithms to see how models
//       actually learn from this prepared data mathematically!
// ─────────────────────────────────────────────────────────────────

export { };
