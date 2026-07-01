/**
 * # 🧠 Part 8: Unsupervised Learning
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * \`FILE: 08_Unsupervised_Learning\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS UNSUPERVISED LEARNING?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Toy Box Analogy
 *
 * Imagine a child is given a huge box of mixed toys — cars, dolls, blocks, and puzzles. With no adult instruction, the child naturally starts grouping similar toys together. Cars here, dolls there. No one told the child what a "category" is — they figured it out themselves.
 *
 * **That's unsupervised learning.** The algorithm receives data with **no labels**, and finds hidden structure entirely on its own.
 *
 * ---
 *
 * ### 📖 Key Distinction
 *
 * | Type | Data | Goal |
 * |---|---|---|
 * | Supervised Learning | X + Y (labeled) | Learn to predict Y for new X |
 * | **Unsupervised Learning** | X only (no labels) | Discover hidden patterns in X |
 *
 * ---
 *
 * ### 🗺️ Main Categories
 *
 * | Category | What it does | Example Algorithms |
 * |---|---|---|
 * | **Clustering** | Group similar items together | K-Means, DBSCAN, GMM |
 * | **Dimensionality Reduction** | Compress features while keeping key info | PCA, t-SNE, UMAP |
 * | **Anomaly Detection** | Find unusual data points | Isolation Forest, LOF |
 * | **Generative Models** | Learn the data distribution to generate new samples | VAE, GAN |
 *
 * ---
 *
 * ### 💼 Real-World Applications
 *
 * - **Customer Segmentation** — Group shoppers by purchasing behavior (no one tells you the groups upfront)
 * - **Document Clustering** — Automatically group 10,000 news articles by topic
 * - **Anomaly Detection** — Spot credit card fraud without examples of every fraud type
 * - **Image Compression** — PCA reduces a high-res image to fewer dimensions without losing key features
 * - **Recommendation Systems** — "Users like you also watched..."
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: K-MEANS CLUSTERING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The King's Provinces Analogy
 * 
 * ![K-Means Clustering](/kmeans_clustering.svg)
 *
 * A king wants to divide his kingdom into K provinces, each with one capital city. He places K capital pins randomly on the map, then assigns every village to its nearest capital. Next, he moves each capital to the **center** of all villages assigned to it. He repeats this until the capitals stop moving.
 *
 * That's K-Means — it's finding the optimal K "center points" (centroids) that minimize total distance.
 *
 * ---
 *
 * ### 📐 The Math
 *
 * **Objective:** Minimize Within-Cluster Sum of Squares (WCSS):
 * > **WCSS = Σ Σ ‖xᵢ − μₖ‖²**
 *
 * K-Means++ is the smart initialization — it picks the first centroids far apart from each other, dramatically reducing the chance of bad local minima.
 *
 * ---
 *
 * ### 🔢 How to Choose K
 *
 * | Method | How it works | When to use |
 * |---|---|---|
 * | **Elbow Method** | Plot WCSS vs K. Find where the curve "elbows" — adding more clusters gives diminishing returns | First quick check |
 * | **Silhouette Score** | Measures how similar a point is to its own cluster vs others. Range [-1, 1]. Higher = better | More reliable than elbow |
 * | **Gap Statistic** | Compare WCSS to random reference data | When elbow is ambiguous |
 *
 * ---
 *
 * ### ⚠️ K-Means Limitations
 *
 * - Assumes **spherical, equal-sized** clusters — fails on elongated or irregular shapes
 * - **Sensitive to outliers** — one extreme point can drag a centroid far away
 * - Must specify **K in advance** — you need domain knowledge or the methods above
 * - Different random initializations can give **different results** — always use `n_init=10`
 */

const kmeansCode = `
from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# !! Scale first — K-Means is distance-based !!
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Step 1: Find optimal K using Elbow + Silhouette ───────
wcss       = []
sil_scores = []
k_range    = range(2, 11)

for k in k_range:
    km = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42)
    labels = km.fit_predict(X_scaled)
    wcss.append(km.inertia_)                               # Lower = better
    sil_scores.append(silhouette_score(X_scaled, labels))  # Higher = better

best_k = list(k_range)[np.argmax(sil_scores)]
print(f"Best K by Silhouette: {best_k}")

# ── Step 2: Fit final model ───────────────────────────────
km_final = KMeans(
    n_clusters=best_k,
    init='k-means++',   # Smart init — much better than random
    n_init=10,          # Try 10 different seeds, keep the best
    max_iter=300,
    random_state=42
)
labels    = km_final.fit_predict(X_scaled)
centroids = km_final.cluster_centers_

print(f"Silhouette Score: {silhouette_score(X_scaled, labels):.4f}")  # >0.5 is good
print(f"WCSS (Inertia):   {km_final.inertia_:.4f}")
print(f"Cluster sizes:    {np.unique(labels, return_counts=True)}")

# ── Step 3: Analyze cluster characteristics ───────────────
df['cluster'] = labels
print(df.groupby('cluster').mean())   # What's the typical customer in each segment?

# ── For very large datasets — use MiniBatchKMeans ─────────
mb_km = MiniBatchKMeans(n_clusters=best_k, batch_size=1000, random_state=42)
mb_km.fit(X_scaled)   # Trains on mini-batches → much faster, slightly less accurate
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: DBSCAN — DENSITY-BASED CLUSTERING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Crowded City Analogy
 *
 * Imagine you're looking at a satellite map of a country. You can see dense city clusters and sparse countryside. DBSCAN does the same — it finds dense regions in data and calls them clusters, ignoring the sparse outlier points.
 *
 * ---
 *
 * ### 🔑 Three Types of Points
 *
 * | Point Type | Definition | Label |
 * |---|---|---|
 * | **Core Point** | Has ≥ `min_samples` neighbours within `eps` radius | Part of a cluster |
 * | **Border Point** | Within `eps` of a core point, but not core itself | Part of a cluster (edge) |
 * | **Noise Point** | Neither core nor border — a lonely outlier | Labeled **-1** |
 *
 * ---
 *
 * ### ✅ Why DBSCAN beats K-Means for certain problems
 *
 * - **No need to specify K** — finds clusters automatically
 * - **Finds arbitrarily shaped clusters** — crescent shapes, rings, irregular blobs
 * - **Naturally handles outliers** — noise points get label -1, not forced into a cluster
 *
 * ---
 *
 * ### ⚙️ Tuning `eps` and `min_samples`
 *
 * > **Rule of thumb:** Set `min_samples = 2 × number_of_features`. Then use the K-distance plot to find `eps` — look for the "knee" in the graph.
 */

const dbscanCode = `
from sklearn.cluster import DBSCAN
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import silhouette_score
import numpy as np
import matplotlib.pyplot as plt

# ── Step 1: Find optimal eps using K-distance plot ────────
k    = 5  # Set to min_samples
nbrs = NearestNeighbors(n_neighbors=k).fit(X_scaled)
distances, _ = nbrs.kneighbors(X_scaled)
distances = np.sort(distances[:, k-1])  # Sort k-th nearest distances

plt.figure(figsize=(8, 4))
plt.plot(distances)
plt.xlabel("Points sorted by distance")
plt.ylabel(f"{k}-NN Distance")
plt.title("K-Distance Plot — find the knee = good eps value")
plt.tight_layout()
plt.savefig("kdist_plot.png", dpi=150)

# ── Step 2: Fit DBSCAN ────────────────────────────────────
dbscan = DBSCAN(
    eps=0.5,            # Neighbourhood radius — from the knee in the plot
    min_samples=5,      # Min points to qualify as a core point
    metric='euclidean',
    n_jobs=-1
)
labels = dbscan.fit_predict(X_scaled)

n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise    = list(labels).count(-1)
print(f"Clusters found: {n_clusters}")
print(f"Noise points:   {n_noise} ({n_noise/len(labels)*100:.1f}%)")

# Only compute silhouette on non-noise points
if n_clusters > 1:
    mask = labels != -1
    sil  = silhouette_score(X_scaled[mask], labels[mask])
    print(f"Silhouette (excl. noise): {sil:.4f}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: HIERARCHICAL CLUSTERING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🌳 The Family Tree Analogy
 *
 * In **Agglomerative** (bottom-up) clustering:
 * - Start: every single data point is its own cluster
 * - Repeatedly merge the two closest clusters
 * - Continue until everything is one big cluster
 *
 * The result is a **dendrogram** (tree diagram). You cut the tree at a chosen height to get K clusters — no need to specify K upfront!
 *
 * ---
 *
 * ### 🔗 Linkage Criteria (How to Measure Distance Between Clusters)
 *
 * | Linkage | Distance measured | Best for |
 * |---|---|---|
 * | **Ward** | Minimize variance within merged cluster | General purpose — **best default** |
 * | **Complete** | Max distance between any two points in clusters | Compact, equal-sized clusters |
 * | **Average** | Average of all pairwise distances | Balance between single and complete |
 * | **Single** | Minimum distance (one closest pair) | Elongated clusters — prone to "chaining" |
 *
 * > **Warning:** Hierarchical clustering is O(n²) in memory. Don't use it on datasets > 10,000 rows — it will run out of RAM.
 */

const hierarchicalCode = `
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt

# ── Step 1: Plot dendrogram to choose K visually ──────────
Z = linkage(X_scaled, method='ward')  # Compute linkage matrix

plt.figure(figsize=(12, 5))
dendrogram(
    Z,
    truncate_mode='level',  # Only show last few merges
    p=5,
    show_leaf_counts=True,
    leaf_rotation=90
)
plt.title("Dendrogram (Ward Linkage) — cut the tree where gaps are largest")
plt.xlabel("Sample index / cluster size")
plt.ylabel("Merge distance")
plt.tight_layout()
plt.savefig("dendrogram.png", dpi=150)

# ── Step 2: Cut at chosen K and fit ───────────────────────
n_clusters = 4   # Choose based on where dendrogram has the biggest gap

agg = AgglomerativeClustering(
    n_clusters=n_clusters,
    linkage='ward',       # 'ward', 'complete', 'average', 'single'
    metric='euclidean'
)
labels = agg.fit_predict(X_scaled)
print(f"Silhouette Score: {silhouette_score(X_scaled, labels):.4f}")
print(f"Cluster sizes:    {dict(zip(*np.unique(labels, return_counts=True)))}")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: PCA — PRINCIPAL COMPONENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧒 The Shadow Analogy
 *
 * Hold a 3D cube up to a light. Its shadow on the wall is a 2D shape. PCA does the same — it projects high-dimensional data onto fewer dimensions (the "shadow"), choosing the **angle that preserves the most information** (variance).
 *
 * ---
 *
 * ### 📐 How PCA Works
 *
 * 1. Center the data (subtract the mean)
 * 2. Find the directions (**principal components**) of maximum variance
 * 3. Project data onto the top `n` components — each component is orthogonal (uncorrelated)
 *
 * ---
 *
 * ### 📊 Dimensionality Reduction Methods Compared
 *
 * | Method | Type | Preserves | Best For |
 * |---|---|---|---|
 * | **PCA** | Linear | Global structure + variance | General preprocessing, any size |
 * | **t-SNE** | Non-linear | Local neighborhoods | Visualization only (2D/3D) |
 * | **UMAP** | Non-linear | Local + some global | Visualization AND preprocessing |
 * | **LDA** | Linear + Supervised | Class separability | Classification feature reduction |
 *
 * > **🚨 Critical:** t-SNE is **only for visualization**. Never use t-SNE-reduced features to train a model — the axes have no real meaning and the method is not reproducible in production. Use UMAP if you need to preprocess.
 */

const pcaCode = `
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import numpy as np
import matplotlib.pyplot as plt

# !! Always scale before PCA — PCA is variance-sensitive !!
# scaler.fit_transform(X_train) already done

# ── Step 1: Find how many components to keep ──────────────
pca_full           = PCA().fit(X_scaled)
cumulative_variance = pca_full.explained_variance_ratio_.cumsum()

plt.figure(figsize=(8, 4))
plt.plot(cumulative_variance, 'b-o', markersize=4)
plt.axhline(y=0.95, color='red', linestyle='--', label='95% threshold')
plt.xlabel("Number of Components")
plt.ylabel("Cumulative Explained Variance")
plt.title("How Many Components Capture 95% of Variance?")
plt.legend()
plt.tight_layout()
plt.savefig("pca_variance.png", dpi=150)

n_comp = int(np.argmax(cumulative_variance >= 0.95)) + 1
print(f"Components needed for 95% variance: {n_comp}")

# ── Step 2: Apply PCA ─────────────────────────────────────
# FIT on train only! Transform both train and test.
pca     = PCA(n_components=n_comp, random_state=42)
X_pca   = pca.fit_transform(X_train_scaled)
X_test_pca = pca.transform(X_test_scaled)   # Same components!

print(f"Original shape: {X_train_scaled.shape}")
print(f"After PCA:      {X_pca.shape}")
print(f"Variance kept:  {pca.explained_variance_ratio_.sum():.4f}")

# ── 2D Visualization with PCA ─────────────────────────────
pca_2d = PCA(n_components=2)
X_2d   = pca_2d.fit_transform(X_scaled)

plt.figure(figsize=(8, 6))
scatter = plt.scatter(X_2d[:,0], X_2d[:,1], c=y, cmap='tab10', alpha=0.7, s=20)
plt.colorbar(scatter, label='Class')
plt.title("PCA 2D Projection")
plt.tight_layout()
plt.savefig("pca_2d.png", dpi=150)

# ── t-SNE (ONLY for visualization, never for preprocessing) ──
tsne   = TSNE(n_components=2, perplexity=30, n_iter=1000, random_state=42)
X_tsne = tsne.fit_transform(X_scaled)
# perplexity = roughly the number of nearest neighbours to consider [5-50]
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🔍 Finding the Unusual
 *
 * Anomaly detection finds data points that are **significantly different** from the majority. The key challenge: you often have very few (or zero) labeled examples of anomalies to train on — so you train purely on "normal" data and flag anything that doesn't fit.
 *
 * ---
 *
 * ### 🛠️ Three Main Approaches
 *
 * | Algorithm | How it works | Best For |
 * |---|---|---|
 * | **Isolation Forest** | Anomalies are easier to isolate by random splits — they need fewer splits to be separated | General purpose, tabular data, fast |
 * | **Local Outlier Factor (LOF)** | Compares the local density of a point to its neighbours — outliers have lower density | Non-spherical anomaly regions |
 * | **One-Class SVM** | Learns a boundary around normal data — anything outside is anomaly | High-dimensional data, NLP features |
 *
 * > **Most common in production:** Isolation Forest. Start with it. Only switch to LOF if you need local anomaly sensitivity.
 */

const anomalyCode = `
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
import numpy as np

# ── Isolation Forest (best general-purpose detector) ──────
iso = IsolationForest(
    n_estimators=100,
    contamination=0.05,    # Expected % of anomalies in data (5%)
    max_samples='auto',
    random_state=42
)
labels = iso.fit_predict(X)   # 1 = normal, -1 = anomaly
scores = iso.score_samples(X) # Lower score = more anomalous

anomaly_idx = np.where(labels == -1)[0]
print(f"Detected anomalies: {len(anomaly_idx)}")

# Threshold-based (instead of using contamination):
threshold = np.percentile(scores, 5)  # Bottom 5% = anomalies
custom_anomalies = X[scores < threshold]

# ── Local Outlier Factor ───────────────────────────────────
lof = LocalOutlierFactor(
    n_neighbors=20,
    contamination=0.05
)
labels_lof = lof.fit_predict(X)
lof_scores = lof.negative_outlier_factor_  # More negative = more anomalous

# ── One-Class SVM ──────────────────────────────────────────
oc_svm = OneClassSVM(kernel='rbf', gamma='scale', nu=0.05)
# nu ≈ upper bound on fraction of outliers AND lower bound on support vectors
labels_svm = oc_svm.fit_predict(X_scaled)  # Needs scaling!
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 UNSUPERVISED LEARNING CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Algorithm Selection Guide
 *
 * | Situation | Best Choice |
 * |---|---|
 * | Know number of clusters, spherical clusters | **K-Means** |
 * | Don't know K, irregular shapes, have outliers | **DBSCAN** |
 * | Want a dendrogram / hierarchy view | **Agglomerative** |
 * | Overlapping clusters, need probabilities | **GMM** |
 * | Reduce features while keeping structure | **PCA** |
 * | Visualize in 2D (only visualization!) | **t-SNE or UMAP** |
 * | Need preprocessing-safe reduction | **PCA or UMAP** |
 * | Detect outliers — general purpose | **Isolation Forest** |
 * | Detect local density anomalies | **LOF** |
 *
 * ---
 *
 * ### 🚨 Golden Rules
 *
 * - **Always scale before K-Means and DBSCAN** — both are distance-based
 * - **Always scale before PCA** — it's variance-sensitive
 * - **t-SNE is visualization ONLY** — never use its output to train a model
 * - **K-Means label -1 doesn't exist** — DBSCAN label -1 means NOISE (not a cluster!)
 * - **Fit PCA on train only**, transform both train and test separately
 * - **Silhouette Score > 0.5** is generally considered a good clustering result
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 09_Neural_Networks_Deep_Learning
// ─────────────────────────────────────────────────────────────────

export { };
