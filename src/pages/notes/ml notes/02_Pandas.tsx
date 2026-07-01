/**
 * # 🧠 Part 2: Pandas
 * ### Your Data's Best Friend
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 02_Pandas\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS PANDAS?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Imagine This
 *
 * You have a huge Excel spreadsheet with **10,000 rows** of student data: Name, Age, Score, City, Passed/Failed...
 *
 * Now you want to:
 * - Find all students from "Mumbai" who scored **above 80**
 * - Calculate the **average score per city**
 * - Fix **200 missing values** automatically
 *
 * In regular Python you'd write 50+ lines of messy code. With Pandas? **3 lines. Done.**
 *
 * ---
 *
 * ### 📖 Official Definition
 *
 * **Pandas** is a Python library for data manipulation and analysis. It provides two main data structures:
 *
 * - **Series** → A single column (like one column of a spreadsheet)
 * - **DataFrame** → A full table (multiple columns, like a full spreadsheet)
 *
 * ---
 *
 * ### 💡 The Relationship: NumPy + Pandas
 *
 * Pandas is built **on top of NumPy**. Under the hood, every Pandas column is a NumPy array. But Pandas adds: column names, row labels, mixed data types, powerful query tools, and beautiful table display.
 *
 * ---
 *
 * ### ⏰ Time Reality Check
 *
 * | Phase | % of Total ML Project Time |
 * |---|---|
 * | Cleaning & preparing data (Pandas work) | **~70-80%** |
 * | Building and training the model | ~10-20% |
 * | Tuning and deploying the model | ~5-10% |
 *
 * This is why **Pandas mastery is more important** than knowing fancy algorithms!
 */

const pandasInstall = `
# Install pandas (usually comes pre-installed with Anaconda)
# pip install pandas

import pandas as pd  # 'pd' is the standard nickname everyone uses
import numpy as np
print(pd.__version__)
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: SERIES — A SINGLE COLUMN OF DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 What is a Series?
 *
 * Imagine **one single column** from your spreadsheet. That's a Series.
 *
 * It has two parts:
 * - **Values** → the actual data: `[10, 20, 30, ...]`
 * - **Index** → labels for each row: `0, 1, 2, ...` or `"Jan", "Feb", ...`
 *
 * A Series works **exactly like a NumPy array** but with named labels attached.
 */

const pandasSeries = `
import pandas as pd

# ── Create a Series ───────────────────────────────────────
marks = pd.Series([85, 92, 78, 95, 88])
print(marks)
# 0    85
# 1    92
# 2    78
# 3    95
# 4    88

# With custom index labels
monthly_sales = pd.Series(
    data=[4500, 5200, 4800, 6100, 5700],
    index=["Jan", "Feb", "Mar", "Apr", "May"],
    name="Sales (USD)"
)
print(monthly_sales["Mar"])   # 4800  (access by label)
print(monthly_sales[1])       # 5200  (access by position)

# ── Series math operations ────────────────────────────────
print(monthly_sales.mean())   # 5260.0
print(monthly_sales.max())    # 6100
print(monthly_sales * 1.10)   # Add 10% to every month
print(monthly_sales[monthly_sales > 5000])  # Only months above 5000
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: DATAFRAME — YOUR FULL DATA TABLE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 What is a DataFrame?
 *
 * ![Pandas DataFrame](/pandas_dataframe.svg)
 * 
 * A DataFrame is the **main Pandas object** — think of it as a table in Excel. It has:
 *
 * - **Rows** → each observation (one student, one house, one transaction)
 * - **Columns** → each feature/attribute (name, age, score)
 * - **Index** → a label for each row (usually `0, 1, 2, ...`)
 *
 * > **Every column in a DataFrame is a Series!**
 *
 * ---
 *
 * ### 🔑 Must-Know First Steps
 *
 * When you receive **any new dataset**, run these commands first to understand it:
 *
 * | Command | What it shows |
 * |---|---|
 * | `df.head()` | First 5 rows |
 * | `df.info()` | Column names, data types, and missing value counts |
 * | `df.describe()` | Stats summary: mean, min, max, quartiles |
 * | `df.shape` | `(rows, columns)` count |
 * | `df.isnull().sum()` | How many missing values per column |
 */

const dataframeBasics = `
import pandas as pd
import numpy as np

# ── Create a DataFrame from a dictionary ──────────────────
students = pd.DataFrame({
    "Name":    ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    "Age":     [20, 22, 21, 23, 20],
    "Score":   [88, 75, 91, 68, 82],
    "City":    ["Mumbai", "Delhi", "Mumbai", "Chennai", "Delhi"],
    "Passed":  [True, True, True, False, True]
})

print(students)
#       Name  Age  Score     City  Passed
# 0    Alice   20     88   Mumbai    True
# 1      Bob   22     75    Delhi    True
# 2  Charlie   21     91   Mumbai    True
# 3    Diana   23     68  Chennai   False
# 4      Eve   20     82    Delhi    True

# ── The 5 Must-Know Inspection Commands ───────────────────
print(students.head(3))        # First 3 rows
print(students.info())         # Column types + null counts
print(students.describe())     # Statistical summary (numeric columns only)
print(students.shape)          # (5, 5)
print(students.isnull().sum()) # Missing values per column

# ── Loading from CSV (The most common way in ML) ──────────
# df = pd.read_csv("data.csv")
# df = pd.read_csv("data.csv", index_col="ID")          # Use ID as row index
# df = pd.read_csv("data.csv", nrows=1000)              # Load only first 1000 rows
# df = pd.read_csv("data.csv", na_values=["-","N/A"])   # Mark custom null values

# ── Saving to CSV ──────────────────────────────────────────
# df.to_csv("cleaned_data.csv", index=False)  # index=False → don't save row numbers
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: SELECTING DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Three Ways to Get Your Data
 *
 * Think of it like finding a seat in a cinema:
 *
 * - `df["column"]` → "Give me the **Name column**" (simplest)
 * - `df.loc[row, col]` → "Give me seat **Row A, Column 3**" (by Label)
 * - `df.iloc[row, col]` → "Give me the **1st seat in the 3rd row**" (by Position)
 *
 * ---
 *
 * ### 🚨 Most Common Mistake
 *
 * | Method | Range behaviour |
 * |---|---|
 * | `df.loc[0:2]` | **Inclusive** of 2 (label-based) |
 * | `df.iloc[0:2]` | **Exclusive** of 2 (position-based, like Python slices) |
 *
 * ---
 *
 * ### Conditional Filtering
 *
 * Use conditions inside `[]` to filter rows — just like a **SQL WHERE clause**:
 * - `df[df["Score"] > 80]` → All rows where Score is above 80
 * - `df[(df["Score"] > 75) & (df["City"] == "Mumbai")]` → AND condition
 * - `df[df["City"].isin(["Mumbai", "Delhi"])]` → Match multiple values
 */

const selectingData = `
import pandas as pd

df = pd.DataFrame({
    "Name":  ["Alice", "Bob", "Charlie", "Diana"],
    "Score": [88, 75, 91, 68],
    "City":  ["Mumbai", "Delhi", "Mumbai", "Chennai"]
}, index=["a", "b", "c", "d"])   # Custom string index labels

# ── Select Columns ─────────────────────────────────────────
ages   = df["Score"]              # One column → returns a Series
subset = df[["Name", "City"]]     # Multiple columns → returns a DataFrame

# ── loc: by LABEL ──────────────────────────────────────────
print(df.loc["b"])                    # Row with label "b" → Bob's data
print(df.loc["a":"c"])                # Rows "a" to "c" (INCLUSIVE of "c")
print(df.loc["a":"c", "Name":"Score"])  # Rows a-c, columns Name to Score
print(df.loc["b", "Score"])           # Single value: Bob's Score → 75

# ── iloc: by POSITION ─────────────────────────────────────
print(df.iloc[0])           # First row (Alice), ignores label names
print(df.iloc[0:2])         # Rows at position 0 and 1 (EXCLUSIVE of 2)
print(df.iloc[:, 0:2])      # ALL rows, first 2 columns
print(df.iloc[1, 1])        # Row 1, Column 1 → 75

# ── Conditional Filtering ─────────────────────────────────
high_scorers  = df[df["Score"] > 80]
mumbai_top    = df[(df["Score"] > 75) & (df["City"] == "Mumbai")]
metro_cities  = df[df["City"].isin(["Mumbai", "Delhi"])]

# query() lets you write conditions as a readable string
result = df.query("Score > 80 and City in ['Mumbai', 'Delhi']")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: HANDLING MISSING DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 What is Missing Data?
 *
 * Imagine a form where some people skipped questions. Those empty boxes are **missing values** — Pandas represents them as `NaN` (Not a Number).
 *
 * **Missing data is everywhere in the real world:**
 * - A customer didn't fill in their phone number
 * - A sensor failed for one minute and recorded nothing
 * - Someone refused to state their salary
 *
 * ---
 *
 * ### 🚨 Why It Matters
 *
 * If you try to train an ML model with `NaN` values, it will **crash** or give completely wrong results. Fixing missing data is one of the most critical steps!
 *
 * ---
 *
 * ### Strategies for Handling Missing Data
 *
 * | Strategy | When to use it |
 * |---|---|
 * | `dropna()` | When less than ~5% of rows are missing and it's random |
 * | Fill with `mean` | Numeric columns with a roughly normal distribution |
 * | Fill with `median` | Numeric columns with outliers (safer than mean) |
 * | Fill with `mode` | Categorical columns (most common value) |
 * | Forward fill (`ffill`) | Time-series data ("use yesterday's value") |
 */

const missingData = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "Name":  ["Alice", "Bob", "Charlie", None, "Eve"],
    "Age":   [25, None, 22, 30, None],
    "Score": [88.0, 75.0, None, 68.0, 82.0],
    "City":  ["Mumbai", "Delhi", None, None, "Delhi"]
})

# ── Detect Missing Values ─────────────────────────────────
print(df.isnull().sum())
# Name     1
# Age      2
# Score    1
# City     2

# Percentage missing per column
missing_pct = (df.isnull().sum() / len(df)) * 100
print(missing_pct.round(1))

# ── Strategy 1: Drop rows/columns ─────────────────────────
df_clean = df.dropna()                        # Drop any row with a NaN
df_clean = df.dropna(subset=["Score"])        # Drop only if Score is NaN

# ── Strategy 2: Fill with statistical values ──────────────
df["Age"].fillna(df["Age"].median(), inplace=True)    # Safer for skewed data
df["Score"].fillna(df["Score"].mean(), inplace=True)  # For normal distribution
df["City"].fillna("Unknown", inplace=True)            # String fill for categories

# ── Strategy 3: Forward fill (time-series) ────────────────
time_data = pd.Series([100.0, None, None, 104.0, None])
filled    = time_data.fillna(method="ffill")   # [100, 100, 100, 104, 104]

# ── Verify: No more missing values ────────────────────────
print(df.isnull().sum())   # Should all be 0 now!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: GROUPBY — SUMMARIZE BY CATEGORY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Classroom Analogy
 *
 * You have test scores for students from 3 different cities. A teacher wants: *"What is the average score per city?"*
 *
 * - **Without Pandas:** Manually filter each city, calculate the average, repeat...
 * - **With groupby:** `df.groupby("City")["Score"].mean()` — **One line. All cities. Done!**
 *
 * ---
 *
 * ### How groupby Works (3 Steps)
 *
 * 1. **SPLIT** → Divide the table into groups by a category
 * 2. **APPLY** → Run a function (`mean`, `sum`, `count`, `max`...) on each group
 * 3. **COMBINE** → Merge the results back into a table
 *
 * This is also called the **"Split-Apply-Combine"** pattern.
 */

const groupByOps = `
import pandas as pd

sales = pd.DataFrame({
    "Region":  ["North","South","North","East","South","North","East"],
    "Product": ["A","B","A","C","A","C","B"],
    "Revenue": [1000, 1500, 800, 1200, 900, 1100, 1300],
    "Units":   [10, 15, 8, 12, 9, 11, 13]
})

# ── Basic groupby ─────────────────────────────────────────
avg_by_region = sales.groupby("Region")["Revenue"].mean()
print(avg_by_region)
# Region
# East     1250.0
# North     966.7
# South    1200.0

# ── Multiple aggregations at once ─────────────────────────
stats = sales.groupby("Region").agg({
    "Revenue": ["mean", "sum", "max"],
    "Units":   ["sum", "count"]
})

# ── Group by multiple columns ──────────────────────────────
combo = sales.groupby(["Region", "Product"])["Revenue"].sum()

# ── Add aggregated values back to the original rows ────────
# (Used for feature engineering — "target encoding")
sales["RegionAvgRevenue"] = sales.groupby("Region")["Revenue"].transform("mean")
# Each row now carries its region's average as a new feature!
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 7: APPLYING FUNCTIONS & TRANSFORMATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔧 Power Tools
 *
 * - `apply()` → Run **any custom function** on each row or each column
 * - `map()` → Replace values using a dictionary (great for encoding labels)
 * - `pd.cut()` → Convert a numeric column into **categories** (bins)
 * - `str.strip()`, `str.lower()` → Clean messy text data in a column
 *
 * These are used constantly during the **data cleaning phase** of any ML project.
 */

const applyAndTransform = `
import pandas as pd

df = pd.DataFrame({
    "Name":  ["  alice SMITH  ", "BOB jones ", " Charlie Brown"],
    "Score": [88, 45, 92],
    "Grade": ["B+", "F", "A"]
})

# ── apply(): Run a custom function on each value ───────────
def classify_score(score):
    if score >= 90:   return "Excellent"
    elif score >= 70: return "Good"
    elif score >= 50: return "Average"
    else:             return "Needs Improvement"

df["Performance"] = df["Score"].apply(classify_score)

# ── map(): Replace values with a dictionary ────────────────
grade_gpa_map = {"A": 4.0, "B+": 3.5, "B": 3.0, "C": 2.0, "F": 0.0}
df["GPA"] = df["Grade"].map(grade_gpa_map)

# ── pd.cut(): Bin continuous data into categories ─────────
ages       = pd.Series([8, 15, 22, 35, 52, 68, 80])
age_groups = pd.cut(
    ages,
    bins=[0, 12, 17, 25, 60, 100],
    labels=["Child", "Teen", "Young Adult", "Adult", "Senior"]
)
print(age_groups)
# [Child, Teen, Young Adult, Adult, Adult, Senior, Senior]

# ── String cleaning (very common in real datasets) ─────────
names   = df["Name"]
cleaned = names.str.strip().str.title()  # Remove spaces + Title Case
print(cleaned)
# ["Alice Smith", "Bob Jones", "Charlie Brown"]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 8: MERGING & JOINING TABLES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Joining Two Tables
 *
 * In the real world, data lives in **multiple separate tables**:
 * - Table 1: Student names and IDs
 * - Table 2: Student IDs and exam scores
 *
 * You need to **combine them** to get: Names + Scores together. That's a JOIN.
 *
 * ---
 *
 * ### Four Types of Joins
 *
 * | Join Type | What you get |
 * |---|---|
 * | `inner` | **Only rows** that exist in **both** tables |
 * | `left` | **All rows from left** table, match from right if available (NaN if not) |
 * | `right` | **All rows from right** table, match from left if available |
 * | `outer` | **Everything** from both tables (NaN where data is missing) |
 */

const mergingData = `
import pandas as pd

students = pd.DataFrame({
    "student_id": [101, 102, 103, 104],
    "name": ["Alice", "Bob", "Charlie", "Diana"]
})

scores = pd.DataFrame({
    "student_id": [101, 102, 103, 105],
    "score": [88, 75, 91, 60]
})

# ── INNER JOIN: Only students in BOTH tables ───────────────
inner = pd.merge(students, scores, on="student_id", how="inner")
#    student_id     name  score
# 0         101    Alice     88
# 1         102      Bob     75
# 2         103  Charlie     91
# (Diana dropped — no score. Student 105 dropped — no name.)

# ── LEFT JOIN: All students, scores if available ───────────
left = pd.merge(students, scores, on="student_id", how="left")
#    student_id     name  score
# 0         101    Alice   88.0
# 1         102      Bob   75.0
# 2         103  Charlie   91.0
# 3         104    Diana    NaN  ← Diana kept but score is missing

# ── OUTER JOIN: Everything from both tables ────────────────
outer = pd.merge(students, scores, on="student_id", how="outer")
# All 5 unique IDs included, NaN wherever data is missing on either side
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 PANDAS CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Loading Data**
 * - `pd.read_csv("file.csv")` → Load a CSV file
 * - `pd.DataFrame({dict})` → Create from dictionary
 *
 * **Inspection (Do this FIRST for any dataset!)**
 * - `df.head(n)` → First n rows
 * - `df.info()` → Column types + null counts
 * - `df.describe()` → Statistical summary
 * - `df.shape` → (rows, cols)
 * - `df.isnull().sum()` → Missing values per column
 *
 * **Selection**
 * - `df["col"]` → One column (Series)
 * - `df[["c1","c2"]]` → Multiple columns (DataFrame)
 * - `df.loc[rows, cols]` → By **Label**
 * - `df.iloc[rows, cols]` → By **Position**
 * - `df[df["col"] > value]` → Filter by condition
 *
 * **Cleaning**
 * - `df.dropna()` → Remove rows with NaN
 * - `df.fillna(value)` → Replace NaN with value
 * - `df.drop_duplicates()` → Remove duplicate rows
 * - `df.rename(columns={"old": "new"})` → Rename columns
 *
 * **Aggregation**
 * - `df.groupby("col").agg({"col2": "mean"})` → Group + summarize
 * - `df.merge(df2, on="key", how="left")` → SQL-style join
 *
 * > **🔑 Golden Rule:** When debugging, always print `df.head()` and `df.info()` FIRST. Understanding your data structure prevents 80% of ML errors!
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 03_Matplotlib to learn how to VISUALIZE this data
//       and spot patterns that numbers alone can't show!
// ─────────────────────────────────────────────────────────────────

export { };
