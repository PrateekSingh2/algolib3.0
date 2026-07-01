/**
 * # 🧠 Part 16: Master Index & Quick Reference
 * ### Complete Cheat Sheets
 * > **AlgoLib ML Notes** — *Comprehensive AI/ML Reference*
 *
 * \`FILE: 16_Quick_Reference_Index\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  📚 COMPLETE INDEX OF ALL NOTES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📑 Curriculum Master Index
 *
 * | File / Module | Key Topics Covered |
 * |---|---|
 * | **01_NumPy** | Matrices, broadcasting, array operations |
 * | **02_Pandas** | DataFrames, groupby, missing data, merging |
 * | **03_Matplotlib**| Line plots, scatter, histograms, Seaborn |
 * | **04_Intro_to_ML**| ML types, workflow, bias-variance tradeoff |
 * | **05_Preprocessing**| Scaling, encoding, outliers, feature engineering |
 * | **06_Supervised**| Linear/Logistic Regression, Trees, RF, XGBoost, SVM |
 * | **07_Evaluation**| Confusion matrix, Precision/Recall, ROC-AUC, CV |
 * | **08_Unsupervised**| K-Means, DBSCAN, Hierarchical, PCA, t-SNE |
 * | **09_Neural_Nets**| Activations, backprop, training loop, optimizers |
 * | **10_CNN_Vision**| Convolutions, ResNet, Transfer learning |
 * | **11_RNN_NLP** | LSTM, attention, Transformers, BERT |
 * | **12_RL** | MDP, Q-Learning, DQN, PPO, RLHF |
 * | **13_Generative**| VAE, GAN, Diffusion, LLM prompting, RAG |
 * | **14_MLOps** | MLflow, FastAPI, Docker, Drift detection (PSI) |
 * | **15_Stats_Math**| Probability, Bayes, Hypothesis tests, Calculus |
 * | **16_Quick_Reference_Index** | ← THIS FILE: Cheat sheets & quick lookup guides |
 */


// ═══════════════════════════════════════════════════════════════════
//  🔥 ALGORITHM SELECTION GUIDE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🏆 The Supervised Learning Decision Matrix
 * 
 * ![ML Cheatsheet](/ml_cheatsheet.svg)
 *
 * | Data Type & Scenario | 🥇 First Choice | 🥈 Second Choice | Why? |
 * |---|---|---|---|
 * | **Tabular Data** (CSVs) | **XGBoost / LightGBM** | Random Forest | Tree ensembles dominate structured tabular data. |
 * | **Need Explainability**| **Logistic Reg / Tree**| Random Forest | Easy to explain coefficients/splits to stakeholders. |
 * | **Images / Vision** | **CNN (ResNet)** | ViT (Transformer)| CNNs are optimized for spatial patterns. |
 * | **Text (Classification)** | **DistilBERT** | Naive Bayes | Pretrained transformers understand deep context. |
 * | **Text (Generation)** | **LLM (GPT-4/Llama)** | - | Autoregressive transformers are unmatched for generation. |
 * | **Time Series** | **LSTM / GRU** | 1D CNN | LSTMs retain long-term memory for forecasting. |
 * | **Tiny Data** (<1k rows) | **Random Forest** | SVM | Complex models (NNs, XGBoost) will easily overfit. |
 */


// ═══════════════════════════════════════════════════════════════════
//  🔥 METRICS QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📏 Classification Metrics
 *
 * | Metric | Formula | When to use |
 * |---|---|---|
 * | **Accuracy** | \`(TP+TN) / Total\` | ONLY when classes are perfectly balanced. |
 * | **Precision** | \`TP / (TP+FP)\` | When False Positives are expensive (Spam filters). |
 * | **Recall** | \`TP / (TP+FN)\` | When False Negatives are expensive (Cancer detection). |
 * | **F1-Score** | \`2PR / (P+R)\` | Imbalanced data where you care about both P and R. |
 * | **ROC-AUC** | Area under curve | Best for overall comparison between different models. |
 *
 * ---
 *
 * ### 📉 Regression Metrics
 *
 * | Metric | Meaning | Characteristic |
 * |---|---|---|
 * | **MSE / RMSE** | Mean Squared Error | Heavily penalizes large outliers. Most common default. |
 * | **MAE** | Mean Absolute Error | Robust to outliers. Easy to interpret (actual units). |
 * | **R²** | R-Squared | Explained variance (1.0 = perfect prediction). |
 */


// ═══════════════════════════════════════════════════════════════════
//  🔥 HYPERPARAMETER QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎛️ Starting Hyperparameters
 *
 * Use these industry-standard defaults as a reliable starting point before tuning:
 *
 * | Algorithm | Recommended Starting Hyperparameters |
 * |---|---|
 * | **Random Forest** | \`n_estimators=200\`, \`max_depth=None\`, \`min_samples_leaf=5\`, \`max_features='sqrt'\` |
 * | **XGBoost** | \`n_estimators=500\`, \`learning_rate=0.05\`, \`max_depth=6\`, \`subsample=0.8\`, \`colsample_bytree=0.8\`, \`early_stopping_rounds=50\` |
 * | **LightGBM** | \`n_estimators=1000\`, \`learning_rate=0.05\`, \`num_leaves=31\`, \`feature_fraction=0.8\`, \`bagging_fraction=0.8\`, \`early_stopping=50\` |
 * | **Neural Network** | **AdamW Optimizer**, \`learning_rate=1e-3\` (or \`3e-4\`), \`weight_decay=1e-4\`, \`batch_size=32-256\`, \`dropout=0.3-0.5\` |
 * | **BERT Fine-tuning**| \`learning_rate=2e-5\` to \`5e-5\`, \`batch_size=16-32\`, \`epochs=3-5\`, \`warmup_steps=500\`, \`weight_decay=0.01\` |
 * | **Stable Diffusion**| \`num_inference_steps=20-50\`, \`guidance_scale=7.5\` |
 * | **PPO (RL)** | \`learning_rate=3e-4\`, \`n_steps=2048\`, \`batch_size=64\`, \`n_epochs=10\`, \`gamma=0.99\`, \`clip_range=0.2\` |
 * | **K-Means** | \`n_init=10\`, \`init='k-means++'\`, \`max_iter=300\` |
 */


// ═══════════════════════════════════════════════════════════════════
//  🔥 PYTHON PACKAGE ECOSYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📦 Essential Packages
 *
 * | Category | Top Industry Packages |
 * |---|---|
 * | **Data Processing** | \`numpy\`, \`pandas\`, \`scipy\`, \`polars\` (faster pandas) |
 * | **Visualization** | \`matplotlib\`, \`seaborn\`, \`plotly\`, \`bokeh\` |
 * | **Classical ML** | \`scikit-learn\`, \`xgboost\`, \`lightgbm\`, \`catboost\` |
 * | **Deep Learning** | \`torch\` (PyTorch), \`tensorflow/keras\`, \`jax/flax\` |
 * | **NLP** | \`transformers\` (HuggingFace), \`datasets\`, \`tokenizers\`, \`spacy\`, \`nltk\`, \`sentence-transformers\` |
 * | **Computer Vision** | \`torchvision\`, \`timm\` (pretrained models), \`albumentations\`, \`opencv-python\`, \`Pillow\`, \`diffusers\` |
 * | **RL** | \`gymnasium\` (gym), \`stable-baselines3\`, \`tianshou\`, \`rllib\` |
 * | **MLOps & Tracking**| \`mlflow\`, \`wandb\`, \`bentoml\`, \`fastapi\`, \`uvicorn\`, \`evidently\`, \`optuna\` (tuning) |
 * | **Vector DBs** | \`chromadb\`, \`pinecone\`, \`weaviate\`, \`faiss-cpu\`, \`pgvector\` |
 * | **LLM Frameworks** | \`langchain\`, \`llamaindex\`, \`trl\` (RLHF), \`peft\` (LoRA) |
 * | **Hardware Speed** | \`numba\` (JIT), \`cupy\` (GPU numpy), \`rapids.ai\` (GPU pandas) |
 */

const installCommands = `
# Data & ML Basics
pip install numpy pandas scikit-learn matplotlib seaborn

# PyTorch (Check pytorch.org for specific CUDA version)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# NLP & Generative
pip install transformers datasets accelerate

# Advanced ML Models
pip install xgboost lightgbm catboost

# MLOps & Tracking
pip install mlflow wandb optuna

# APIs
pip install fastapi uvicorn python-multipart
`;


// ═══════════════════════════════════════════════════════════════════
//  🔥 SKLEARN API QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════════

const sklearnAPI = `
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# 1. The Universal API (Every Sklearn Model Works Like This)
model = RandomForestClassifier()
model.fit(X_train, y_train)            # Train the model
model.predict(X_test)                  # Predict labels
model.predict_proba(X_test)            # Predict probabilities
model.score(X_test, y_test)            # Returns Accuracy (or R² for regression)

# 2. Pipelines (The Right Way to Prevent Data Leakage)
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', RandomForestClassifier())
])
# The scaler will automatically fit on X_train ONLY, 
# then apply transformations to both train and test!
pipe.fit(X_train, y_train)
pipe.predict(X_test)   

# 3. Cross Validation (The Right Way to Evaluate)
# Splits data 5 times, trains 5 models, returns 5 scores
scores = cross_val_score(pipe, X, y, cv=5, scoring='f1')
print(f"F1 Score: {scores.mean():.4f} ± {scores.std():.4f}")

# 4. Save and Load Models
import joblib
joblib.dump(pipe, 'production_model.pkl')
loaded_model = joblib.load('production_model.pkl')
`;


// ═══════════════════════════════════════════════════════════════════
//  🔥 PYTORCH QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════════

const pytorchQuickRef = `
import torch
import torch.nn as nn
import torch.optim as optim

# 1. Device Setup
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# 2. Standard Training Loop Template
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
criterion = nn.CrossEntropyLoss()

for epoch in range(epochs):
    # --- TRAINING PHASE ---
    model.train()  # Activates Dropout & BatchNorm
    for X_batch, y_batch in train_loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        
        optimizer.zero_grad()                 # 1. Clear old gradients
        output = model(X_batch)               # 2. Forward pass
        loss = criterion(output, y_batch)     # 3. Compute loss
        loss.backward()                       # 4. Backward pass (compute gradients)
        optimizer.step()                      # 5. Update weights
    
    # --- EVALUATION PHASE ---
    model.eval()   # Deactivates Dropout & freezes BatchNorm
    with torch.no_grad(): # Saves memory & speed (no gradients needed)
        for X_val, y_val in val_loader:
            val_output = model(X_val.to(device))
            # compute validation loss/accuracy...

# 3. Save and Load
# Always save the state_dict, not the whole model object!
torch.save(model.state_dict(), 'model_weights.pt')
model.load_state_dict(torch.load('model_weights.pt'))
`;


// ═══════════════════════════════════════════════════════════════════
//  🔥 COMMON MISTAKES TO AVOID
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚠️ The "Silent Killer" ML Mistakes
 *
 * 1. **Data Leakage (The #1 Mistake):** Calling \`StandardScaler.fit_transform(X)\` *before* doing your \`train_test_split\`. You just leaked information about the test set into your training features! Always split first, then \`fit\` on train, and \`transform\` on train and test.
 * 2. **Using Accuracy for Imbalanced Data:** If 99% of your data is Class A, a model that guesses "Class A" every time has 99% accuracy but is completely useless.
 * 3. **Not using \`.eval()\` or \`torch.no_grad()\`:** In PyTorch, evaluating without these will leave Dropout turned on (randomly killing neurons) and waste massive amounts of GPU memory storing gradients.
 * 4. **Applying Softmax before CrossEntropyLoss:** PyTorch's \`CrossEntropyLoss\` already includes a Softmax operation inside it. If you apply Softmax in your network output layer, you are applying it twice!
 */


// ═══════════════════════════════════════════════════════════════════
//  📌 THE 10 GOLDEN RULES OF ML
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🥇 The Ten Commandments
 *
 * | Rule | Description |
 * |---|---|
 * | **1. Data > Algorithm** | More data and cleaner data will beat a clever algorithm 99% of the time. |
 * | **2. EDA First** | Never build a model before looking at histograms, missing values, and correlations. |
 * | **3. Start Simple** | Always build a Logistic Regression or Random Forest baseline before touching Deep Learning. |
 * | **4. Don't Peek** | Your test set is sacred. Look at it exactly once, at the very end of your project. |
 * | **5. Cross-Validate** | A single train/test split can be lucky. CV gives you statistical confidence. |
 * | **6. Pick the Right Metric** | Align your evaluation metric (Precision vs Recall) with the actual business objective. |
 * | **7. Scale Your Features** | SVMs, KNN, and Neural Networks will fail entirely if features aren't scaled. |
 * | **8. Regularize** | Use Dropout, Weight Decay, or Early Stopping. A complex model *will* overfit. |
 * | **9. Monitor Production** | Models degrade over time as the real world changes. Monitor for Data Drift. |
 * | **10. Iterate Fast** | Don't spend 3 weeks tuning a Random Forest. Build an end-to-end pipeline in 1 day, then iterate. |
 *
 * ---
 *
 * > *"All models are wrong, but some are useful."*
 * > — **George E. P. Box**
 *
 * > *"It's not who has the best algorithm that wins. It's who has the most data."*
 * > — **Andrew Ng**
 *
 * ---
 */

// ─────────────────────────────────────────────────────────────────
// END OF COMPREHENSIVE AI & ML NOTES SERIES
// ─────────────────────────────────────────────────────────────────


export {};
