/**
 * # 🧠 Part 14: MLOps, Deployment & Production
 * > **AlgoLib ML Notes** — *Comprehensive AI/ML Reference*
 *
 * \`FILE: 14_MLOps_Deployment\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: WHAT IS MLOps?
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🍳 The Restaurant Analogy
 * 
 * ![MLOps Lifecycle](/mlops_lifecycle.svg)
 *
 * Training a model in a Jupyter Notebook is like cooking a meal for yourself at home. It's fun, it works, and if you mess up, you just start over.
 *
 * Deploying a model to production is like running a **commercial restaurant**. You need supply chains (data pipelines), quality control (monitoring), health inspections (testing), and the ability to serve 1,000 customers concurrently without the kitchen catching fire (scaling).
 *
 * **MLOps (Machine Learning Operations)** is the set of engineering practices that keeps the restaurant running smoothly.
 *
 * ---
 *
 * ### 🔄 The MLOps Lifecycle
 *
 * | Phase | Goal | Key Tools |
 * |---|---|---|
 * | **1. Experiment Tracking** | Log all parameters, metrics, and models to make research reproducible. | MLflow, Weights & Biases (W&B) |
 * | **2. Model Registry** | Version control for models (Staging vs. Production). | MLflow Registry, HuggingFace Hub |
 * | **3. Serving / Deployment** | Wrap the model in an API so apps can send data and get predictions. | FastAPI, Docker, TorchServe, BentoML |
 * | **4. Monitoring** | Watch for degrading accuracy and shifting data in the real world. | Evidently AI, Grafana, WhyLogs |
 * | **5. CI/CD & Retraining** | Automatically retrain and deploy the model when performance drops. | GitHub Actions, Kubeflow, Airflow |
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: EXPERIMENT TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🧪 Stop Using Spreadsheets!
 *
 * Experiment trackers log every run automatically, allowing you to easily compare them on a dashboard.
 *
 * > **Rule of Thumb:** If it's a parameter that affects the model's performance, log it. Always log a random seed.
 */

const mlflowCode = `
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier

# ── 1. MLflow Tracking ────────────────────────────────────
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("fraud-detection")

with mlflow.start_run(run_name="rf_baseline"):
    params = {"n_estimators": 100, "max_depth": 10}
    mlflow.log_params(params)
    
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)
    
    mlflow.log_metric("test_accuracy", model.score(X_test, y_test))
    mlflow.sklearn.log_model(model, "model")
    mlflow.log_artifact("confusion_matrix.png")
`;

const wandbCode = `
import wandb
import torch

# ── 2. Weights & Biases ───────────────────────────────────
run = wandb.init(
    project="my-ml-project",
    config={"learning_rate": 1e-4, "batch_size": 32, "epochs": 50}
)

for epoch in range(wandb.config.epochs):
    # ... training loop ...
    wandb.log({"train/loss": train_loss, "val/accuracy": val_acc})

# Log images and models
wandb.log({"predictions": [wandb.Image(img)]})
artifact = wandb.Artifact("best-model", type="model")
artifact.add_file("best_model.pt")
run.log_artifact(artifact)
run.finish()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: SERVING MODELS WITH FASTAPI & DOCKER
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🚀 Serving Architecture
 *
 * Wrap your model in a **FastAPI** REST API, then package it in a **Docker** container.
 *
 * **Critical Production Rules:**
 * 1. **Load the model ONCE** at server startup (never per-request).
 * 2. **Include `/health`** for load balancer checks.
 * 3. **Use Pydantic** to validate incoming JSON types.
 */

const fastapiCode = `
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, conlist
import joblib
import numpy as np

app = FastAPI(title="ML API")
model, scaler = None, None

@app.on_event("startup")
async def load_model():
    global model, scaler
    model = joblib.load("model.pkl")    # LOAD ONCE!
    scaler = joblib.load("scaler.pkl")

class PredictRequest(BaseModel):
    features: conlist(float, min_length=10, max_length=10)

@app.get("/health")
async def health():
    return {"status": "ok", "model_ready": model is not None}

@app.post("/predict")
async def predict(req: PredictRequest):
    try:
        X_scaled = scaler.transform(np.array(req.features).reshape(1, -1))
        pred = model.predict(X_scaled)[0]
        prob = model.predict_proba(X_scaled)[0].max()
        return {"prediction": int(pred), "confidence": float(prob)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`;

const dockerCode = `
# ── Dockerfile ────────────────────────────────────────────
# FROM python:3.11-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

# ── docker-compose.yml ────────────────────────────────────
version: '3.8'
services:
  ml-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: MODEL MONITORING & DRIFT
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📉 Why Models Degrade
 *
 * Models don't break because code rots; they break because the world changes.
 *
 * | Drift Type | Meaning | Example |
 * |---|---|---|
 * | **Data Drift** | Input feature distribution changes | Demographics of users shift |
 * | **Concept Drift** | Target variable definition changes | COVID-19 alters purchasing behavior completely |
 *
 * **PSI (Population Stability Index):**
 * - PSI < 0.1: No significant change.
 * - 0.1 < PSI < 0.25: Moderate change. Monitor closely.
 * - PSI > 0.25: Significant shift! Time to retrain.
 */

const monitoringCode = `
# pip install evidently
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, DataQualityPreset
from scipy.stats import ks_2samp

# Reference (Training) vs Current (Production) Data
reference_data = pd.read_csv("training_data.csv")
current_data   = pd.read_csv("production_data.csv")

# ── 1. Automated Dashboard with Evidently ─────────────────
report = Report(metrics=[DataDriftPreset(), DataQualityPreset()])
report.run(reference_data=reference_data, current_data=current_data)
report.save_html("drift_report.html")

# ── 2. Manual Statistical Check (KS Test) ─────────────────
# Checks if two continuous distributions are significantly different
stat, p_value = ks_2samp(reference_data['age'], current_data['age'])
if p_value < 0.05:
    print(f"⚠️ Drift detected in 'age' (KS p={p_value:.4f})")
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: INFERENCE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * ### ⚡ Making Models Faster
 *
 * | Technique | What it does | Benefit |
 * |---|---|---|
 * | **Quantization** | FP32 → INT8/FP16 | 4x smaller, 2-3x faster, minimal accuracy loss. |
 * | **Pruning** | Sets unimportant weights to zero | Creates sparse, compressible networks. |
 * | **ONNX Export** | Converts model to optimized C++ format | Often doubles inference speed on CPUs. |
 */

const optimizationCode = `
import torch
import torch.nn as nn

# ── 1. FP16 Quantization (GPU Only) ───────────────────────
model = model.half().to('cuda')
with torch.no_grad():
    output = model(input_tensor.half().to('cuda'))

# ── 2. Dynamic INT8 Quantization (CPU Friendly) ───────────
quantized_model = torch.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)

# ── 3. ONNX Export (Universal Runtime) ────────────────────
import torch.onnx
dummy_input = torch.randn(1, 10)

torch.onnx.export(
    model, dummy_input, "model.onnx",
    input_names=['input'], output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}}  # Allow dynamic batch sizes
)

# ── 4. TorchScript (JIT Compilation) ──────────────────────
scripted_model = torch.jit.script(model)
scripted_model.save("model_scripted.pt")
# Can be loaded in C++ without a Python runtime!
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 MLOps CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📌 Quick Reference
 *
 * **Deployment Rules**
 * - Use **FastAPI** + **Docker**.
 * - Load `.pkl` / `.pt` models globally at server startup.
 * - Set random seeds explicitly in **MLflow / W&B**.
 *
 * **Monitoring & Retraining**
 * - Monitor for **Data Drift** (inputs change) and **Concept Drift** (target definition changes).
 * - **PSI > 0.25** or **KS-Test p < 0.05** are strong signals to trigger an automated retraining pipeline.
 *
 * **Speed**
 * - Try **ONNX** first to double CPU speed.
 * - Use **FP16** on GPUs for free memory and speed boosts.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 15_Statistics_Math_Foundations
// ─────────────────────────────────────────────────────────────────

export {};
