/**
 * # 🧠 Part 1: NumPy
 * ### Your Math Superpower in Python
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 01_NumPy\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS NUMPY?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Think of it Like This
 *
 * You have a basket of **1000 apples** and you want to weigh each one.
 *
 * - **Old way (Python List):** Pick up every apple, weigh it, write it down, then go to the next one. *Very slow!*
 * - **NumPy way:** A magical scale that weighs **all 1000 apples at the same time.** Done in one second!
 *
 * That's NumPy — it does math on **entire groups of numbers all at once.**
 *
 * ---
 *
 * ### 📖 Official Definition
 *
 * **NumPy (Numerical Python)** is a Python library that provides fast, powerful N-dimensional arrays and mathematical tools. It is the **foundation** that almost every ML library (TensorFlow, PyTorch, Scikit-learn) is secretly built on top of.
 *
 * ---
 *
 * ### 🤔 Why Not Just Use Python Lists?
 *
 * Let's say you want to multiply every number in a list by 2:
 *
 * - **Python List (slow):** You must loop through every item one by one.
 * - **NumPy (instant!):** One command does it all.
 *
 * NumPy is **50x to 100x faster** than Python lists on large data. This is why it's non-negotiable for Machine Learning.
 *
 * ---
 *
 * ### 📊 Memory Comparison
 *
 * | Data Type | Memory Per Number |
 * |---|---|
 * | Python integer | ~28 bytes |
 * | NumPy `int8` | 1 byte |
 * | NumPy `float64` | 8 bytes |
 *
 * For a dataset with 1 million rows and 50 columns → that's 50 million numbers. **NumPy saves gigabytes of RAM** versus Python lists!
 */

const numpyInstall = `
# First, install NumPy (if you haven't already)
# pip install numpy

import numpy as np   # 'np' is the universal nickname everyone uses
print(np.__version__)  # See which version you have
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: CREATING YOUR FIRST NUMPY ARRAY
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 What is an Array?
 * 
 * ![NumPy Arrays](/numpy_arrays.svg)
 *
 * Think of an array like a **row of boxes**, each holding one number.
 *
 * - **1D array** → ONE row of boxes (like a single column in Excel)
 * - **2D array (matrix)** → A grid of boxes, like a spreadsheet
 * - **3D array** → Like a cube of boxes (used for images: width × height × color)
 *
 * ---
 *
 * ### 🔑 Key Concept — ndarray
 *
 * The main NumPy object is the **ndarray** (N-Dimensional Array). Every ML dataset you'll ever work with is secretly an ndarray.
 *
 * - A CSV file loaded into memory → **2D ndarray** (rows × columns)
 * - A color image → **3D ndarray** (height × width × 3 colors)
 * - A video → **4D ndarray** (frames × height × width × 3 colors)
 */

const creatingArrays = `
import numpy as np

# ── From a Python list ────────────────────────────────────
# 1D Array (like a single row in Excel)
scores = np.array([85, 92, 78, 95, 88])
print(scores)       # [85 92 78 95 88]

# 2D Array (like a table with rows and columns)
grades = np.array([
    [85, 92, 78],    # Student 1's scores
    [90, 88, 95],    # Student 2's scores
    [70, 75, 80]     # Student 3's scores
])
print(grades.shape)  # (3, 3) → 3 rows, 3 columns

# ── Smart ways to create arrays ───────────────────────────

zeros = np.zeros((3, 4))         # 3 rows, 4 columns, all 0.0
ones  = np.ones((2, 3))          # 2 rows, 3 columns, all 1.0
eye   = np.eye(4)                # 4x4 identity matrix (1s on diagonal)

random_arr = np.random.rand(3, 3)    # Uniform random values in [0.0, 1.0)
normal_arr = np.random.randn(3, 3)   # Gaussian (bell-curve) distribution

seq1 = np.arange(0, 10, 2)   # [0 2 4 6 8]  (start, stop, step)
seq2 = np.linspace(0, 1, 5)  # [0.  0.25  0.5  0.75  1.0]
                              # → 5 evenly spaced points between 0 and 1
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: THE THREE MOST IMPORTANT ARRAY PROPERTIES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Know Your Array!
 *
 * Before doing anything with an array, always check these three things:
 *
 * | Property | What it tells you | Example |
 * |---|---|---|
 * | `arr.shape` | How big is it? (rows, columns) | `(200, 10)` |
 * | `arr.dtype` | What type of numbers? | `float64`, `int32` |
 * | `arr.ndim` | How many dimensions? | `1`, `2`, `3` |
 *
 * ---
 *
 * ### 🚨 Critical ML Fact
 *
 * Most ML model errors that say **"shape mismatch"** happen because the programmer didn't check `.shape` first. **ALWAYS check `.shape` before feeding data into a model!**
 */

const arrayProperties = `
import numpy as np

data = np.array([[1.5, 2.3, 3.1],
                 [4.0, 5.7, 6.2]])

print("Shape:", data.shape)        # (2, 3) → 2 rows, 3 columns
print("Dimensions:", data.ndim)    # 2 (it's a 2D matrix)
print("Data type:", data.dtype)    # float64
print("Total elements:", data.size)  # 6 (2 × 3)
print("Memory usage:", data.nbytes, "bytes")  # 48 bytes

# ── Changing the Data Type ────────────────────────────────
# ML often requires float32 to save GPU memory
int_arr   = np.array([1, 2, 3])
float_arr = int_arr.astype(np.float32)
print(float_arr.dtype)  # float32

# ── Reshaping (Change shape WITHOUT changing data) ─────────
# Like folding a 1x12 piece of paper into a 3x4 grid
flat   = np.arange(1, 13)     # [1  2  3  ...  12]
matrix = flat.reshape(3, 4)   # 3-row, 4-column matrix
print(matrix)
# [[ 1  2  3  4]
#  [ 5  6  7  8]
#  [ 9 10 11 12]]

# Use -1 to let NumPy auto-calculate a dimension
col_vector = flat.reshape(-1, 1)  # Shape becomes (12, 1) automatically
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: INDEXING & SLICING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Like a LEGO Grid
 *
 * If you have a big grid of LEGOs, you can say: *"Give me the LEGO in Row 2, Column 3!"*
 * That's indexing. NumPy uses the same idea.
 *
 * > **Remember:** Python starts counting at **0**, not 1!
 * > Row 0 = First row, Row 1 = Second row.
 *
 * ---
 *
 * ### Boolean Masking — Super Powerful!
 *
 * You can filter an array by writing a condition in plain English, like:
 * `scores[scores > 60]` → *"Give me only the scores above 60."*
 *
 * This is used **constantly** in data preprocessing to filter outliers, select classes, and create masks.
 */

const indexingSlicing = `
import numpy as np

grid = np.array([
    [10, 20, 30, 40],   # Row 0
    [50, 60, 70, 80],   # Row 1
    [90, 100, 110, 120] # Row 2
])

# ── Single Element ────────────────────────────────────────
print(grid[1, 2])   # 70  →  Row 1, Column 2
print(grid[0, 0])   # 10  →  Top-left corner
print(grid[-1, -1]) # 120 →  Bottom-right corner

# ── Slicing Rows and Columns ──────────────────────────────
print(grid[0:2, :])     # First 2 rows, ALL columns
print(grid[:, 1:3])     # ALL rows, columns 1 and 2 only
print(grid[1, :])       # Entire second row as a 1D array

# ── Boolean Masking (Filter data with conditions) ─────────
scores = np.array([45, 82, 91, 67, 55, 78, 95, 33])

passing_mask   = scores > 60
passing_scores = scores[passing_mask]  # [82 91 67 78 95]
print("Passing scores:", passing_scores)

# One-liner version:
high_scorers = scores[scores >= 80]    # [82 91 95]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: MATH OPERATIONS — THE REAL POWER
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 Add 5 Bonus Marks to the Whole Class
 *
 * Imagine a teacher wants to **add 5 bonus marks** to every student's score.
 *
 * - **Old way:** Go to each student, add 5, write it down. Repeat 30 times.
 * - **NumPy way:** `scores + 5` — One command. All 30 students. Done.
 *
 * This is called **Vectorization** — doing operations on entire arrays at once instead of item by item.
 *
 * ---
 *
 * ### 🔑 Element-wise vs Dot Product
 *
 * | Operation | Symbol | What it does |
 * |---|---|---|
 * | Element-wise multiply | `A * B` | Multiply each pair: `[1,2] * [3,4]` = `[3, 8]` |
 * | Dot (matrix) product | `A @ B` | Rows × Columns — used in **every** neural network layer! |
 */

const mathOperations = `
import numpy as np

# ── Element-wise operations ───────────────────────────────
prices   = np.array([100, 200, 300, 400])
discount = np.array([10, 20, 30, 40])

final_prices  = prices - discount          # [90, 180, 270, 360]
with_tax      = prices * 1.18             # 18% GST added to all prices
discount_pct  = (discount / prices) * 100  # [10, 10, 10, 10]

# ── Statistical functions ─────────────────────────────────
data = np.array([4, 7, 13, 2, 8, 11, 5])

print("Mean:", np.mean(data))     # 7.14
print("Median:", np.median(data)) # 7 (middle value when sorted)
print("Std Dev:", np.std(data))   # How spread out the data is
print("Min:", np.min(data))       # 2
print("Max:", np.max(data))       # 13

# ── Matrix Dot Product (the core of neural networks!) ─────
# In a neural net layer: output = weights @ inputs + bias

weights = np.array([[0.5, 0.3],   # 3 neurons, 2 inputs each
                    [0.8, 0.1],
                    [0.2, 0.9]])   # Shape: (3, 2)

inputs  = np.array([1.0, 2.0])    # Shape: (2,)

output = weights @ inputs          # Shape: (3,) → one value per neuron
# = [0.5*1 + 0.3*2,   → 1.1
#    0.8*1 + 0.1*2,   → 1.0
#    0.2*1 + 0.9*2]   → 2.0
print("Neuron outputs:", output)   # [1.1, 1.0, 2.0]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: BROADCASTING — NUMPY'S MAGIC TRICK
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Yellow Filter Analogy
 *
 * You have a big class photo (a grid of 30 students). You want to apply a yellow filter over the **whole photo**. You don't create 30 separate yellow squares — you apply **one filter** and it automatically stretches to cover everything.
 *
 * **That's Broadcasting.** NumPy automatically "stretches" a smaller array to match the shape of a larger one.
 *
 * ---
 *
 * ### 📏 Broadcasting Rules
 *
 * When two arrays have different shapes, NumPy compares them from **right to left**. Dimensions are compatible if:
 *
 * - **Rule 1:** They are equal
 * - **Rule 2:** One of them is `1` (it gets "stretched")
 *
 * ```
 * Dataset shape:  (1000, 3)   → 1000 rows, 3 features
 * Mean shape:        (3,)     → just 3 numbers
 * Result shape:   (1000, 3)   → each row gets each mean subtracted ✅
 * ```
 *
 * This is literally what **sklearn's StandardScaler** does internally!
 */

const broadcasting = `
import numpy as np

# ── Scalar broadcasting ───────────────────────────────────
# Convert Celsius to Fahrenheit: F = C * 9/5 + 32
temps_celsius     = np.array([0, 20, 37, 100])
temps_fahrenheit  = temps_celsius * 9/5 + 32    # 9/5 and 32 broadcast to all 4 elements
print(temps_fahrenheit)  # [32.   68.   98.6  212.]

# ── Real ML use case: Standardizing a dataset ─────────────
dataset = np.array([
    [170, 65, 25],    # Person 1: height(cm), weight(kg), age
    [155, 50, 30],    # Person 2
    [180, 80, 22],    # Person 3
    [165, 60, 28],    # Person 4
])  # Shape: (4, 3)

col_mean = np.mean(dataset, axis=0)  # Mean of each COLUMN  → shape (3,)
col_std  = np.std(dataset,  axis=0)  # Std of each COLUMN   → shape (3,)

# Broadcasting: (4,3) - (3,) → NumPy stretches (3,) to (4,3)
standardized = (dataset - col_mean) / col_std
print("Standardized:")
print(standardized)
# Each column now has mean ≈ 0 and std ≈ 1
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 7: USEFUL NUMPY FUNCTIONS FOR ML
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🛠️ Your NumPy Toolbox
 *
 * These are the functions you'll use most often in real ML projects:
 *
 * - `np.hstack` / `np.vstack` → Combine arrays side-by-side or top-to-bottom
 * - `np.argsort` → Returns the *indices* that would sort the array (useful for Top-K predictions)
 * - `np.clip` → Clamp values to a safe range (critical for numerical stability in neural nets)
 * - `np.unique` → Find all unique classes and their counts (detects class imbalance!)
 * - `np.random.seed` → Make your random results reproducible
 */

const usefulFunctions = `
import numpy as np

# ── Combining arrays ──────────────────────────────────────
features  = np.array([[1, 2], [3, 4], [5, 6]])   # Shape: (3, 2)
extra_col = np.array([[10], [20], [30]])           # Shape: (3, 1)

combined  = np.hstack([features, extra_col])  # Side by side → (3, 3)
more_data = np.vstack([combined, [[7, 8, 40]]])  # Add row at bottom → (4, 3)

# ── Sorting and Top-K ─────────────────────────────────────
predictions = np.array([0.3, 0.9, 0.1, 0.7, 0.5])

sorted_idx  = np.argsort(predictions)          # Indices from smallest to largest
top3_idx    = np.argsort(predictions)[::-1][:3] # Top 3 indices (largest first)
print("Top 3 confidence indices:", top3_idx)   # [1, 3, 4]

# ── Clip (keep values within a safe range) ────────────────
# Neural networks sometimes produce extreme values. Clipping keeps them stable.
raw_output = np.array([-2.5, 0.3, 1.1, -0.1, 3.8])
clipped    = np.clip(raw_output, -1.0, 1.0)
print("Clipped:", clipped)  # [-1.   0.3  1.  -0.1  1. ]

# ── Unique values (detect class imbalance!) ───────────────
labels = np.array([0, 1, 2, 1, 0, 0, 2, 1, 0])
unique_classes, counts = np.unique(labels, return_counts=True)
print("Classes:", unique_classes)  # [0 1 2]
print("Counts:", counts)           # [4 3 2]
# → 4 samples of class 0, 3 of class 1, 2 of class 2 → Class imbalance exists!

# ── Random seed (for reproducible experiments) ────────────
np.random.seed(42)
print(np.random.rand(3))  # Always gives SAME 3 numbers when seed=42
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 NUMPY CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Creating Arrays**
 * - `np.array([1,2,3])` → From list
 * - `np.zeros((m,n))` → m×n matrix of zeros
 * - `np.ones((m,n))` → m×n matrix of ones
 * - `np.eye(n)` → n×n identity matrix
 * - `np.random.rand(m,n)` → m×n random values in `[0,1)`
 * - `np.arange(start, stop, step)` → Count sequence
 * - `np.linspace(start, stop, n)` → n evenly-spaced points
 *
 * **Properties**
 * - `arr.shape` → Dimensions (rows, cols)
 * - `arr.dtype` → Data type (`float64`, `int32`, etc.)
 * - `arr.ndim` → Number of dimensions
 * - `arr.size` → Total number of elements
 *
 * **Math**
 * - `+, -, *, /` → Element-wise operations
 * - `A @ B` → Dot/Matrix product (used in neural nets!)
 * - `np.sum()`, `np.mean()`, `np.std()`, `np.min()`, `np.max()`
 *
 * **Shape Manipulation**
 * - `arr.reshape(m, n)` → Change shape (same data)
 * - `np.hstack([a, b])` → Combine side by side
 * - `np.vstack([a, b])` → Stack top to bottom
 *
 * > **🔑 Golden Rule:** ALWAYS check `.shape` when debugging ML code! 90% of "dimension mismatch" errors are solved by checking shapes first.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 02_Pandas — where you'll use NumPy inside a powerful
//       table-like structure to wrangle real-world datasets!
// ─────────────────────────────────────────────────────────────────

export { };
