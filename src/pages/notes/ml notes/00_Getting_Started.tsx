/**
 * # 🚀 Part 0: Getting Started with ML
 * ### Setting up your AI Workspace
 * > **AlgoLib ML Notes** — *Easy & Comprehensive AI/ML Reference*
 *
 * `FILE: 00_Getting_Started`
 *
 * ---
 */

// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: THE ML TOOLKIT & DOWNLOADS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🛠️ Essential Tools We Use
 * 
 * To build Machine Learning models, you need the right environment. Below is the ultimate tech stack used throughout this curriculum.
 * 
 * | Tool | Purpose | Download Link |
 * |---|---|---|
 * | **Python (3.11+ or latest)** | The core language of AI | [Download Python](https://www.python.org/downloads/) |
 * | **VS Code** | The best code editor for ML | [Download VS Code](https://code.visualstudio.com/) |
 * | **Jupyter Notebooks** | Interactive data science | [Get Jupyter](https://jupyter.org/install) |
 * | **Anaconda (Miniconda)** | Environment management | [Download Miniconda](https://docs.anaconda.com/free/miniconda/miniconda-install/) |
 * | **Git & GitHub** | Version control | [Download Git](https://git-scm.com/downloads) |
 *
 * > **💡 Pro Tip:** We highly recommend installing **Miniconda** instead of vanilla Python. It automatically handles complex C++ dependencies that some ML libraries (like TensorFlow and PyTorch) require.
 */

// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: PIP INSTALL INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📦 Installing Core ML Modules
 * 
 * Once Python is installed, you need to grab the foundational libraries. Open your **Command Prompt (Terminal)** and run the following commands.
 * 
 * #### 1. Data Science Fundamentals
 * These libraries handle math, datasets, and plotting.
 */

const dataScienceInstall = `
# Install NumPy (Math), Pandas (DataFrames), and Matplotlib (Graphs)
pip install numpy pandas matplotlib seaborn
`;

/**
 * #### 2. Traditional Machine Learning
 * Scikit-Learn is the industry standard for traditional ML (Random Forests, SVMs, etc).
 */

const mlInstall = `
# Install Scikit-Learn
pip install scikit-learn
`;

/**
 * #### 3. Deep Learning & AI
 * PyTorch and TensorFlow are the engines behind modern AI (ChatGPT, Midjourney).
 * *Note: Only install one to start! PyTorch is recommended for beginners.*
 */

const deepLearningInstall = `
# Recommended: PyTorch
pip install torch torchvision torchaudio

# Alternative: TensorFlow
pip install tensorflow
`;

/**
 * #### 4. NLP & Transformers
 * The libraries behind Large Language Models (LLMs).
 */

const nlpInstall = `
# Install Hugging Face Transformers
pip install transformers datasets tokenizers
`;

// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: HOW TO USE THESE NOTES
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📖 Navigation Instructions
 * 
 * This curriculum is designed to be interactive and execution-ready. 
 * 
 * - **Sequential Learning:** Start from \`01_NumPy\` and move sequentially. The math builds upon itself.
 * - **Code Blocks:** Every code snippet is fully functional. Use the **Copy Code** button on the top-right of code blocks to paste them directly into your Jupyter Notebook or VS Code.
 * - **Cheat Sheets:** Keep an eye out for the 📌 **Quick Reference Index** at the end for exam or interview prep.
 * 
 * ---
 */

// ─────────────────────────────────────────────────────────────────
// Note: These are neither affiliated with AlgoLib nor paid endorsements.
// ─────────────────────────────────────────────────────────────────

/**
 * ### 📚 External Resources for Deep Dives
 * 
 * If you want to go beyond these notes, here are the gold-standard free resources:
 * 
 * - **StatQuest with Josh Starmer** (YouTube) — Best visual explanations for ML math.
 * - **3Blue1Brown** (YouTube) — Unparalleled Neural Network & Linear Algebra visuals.
 * - **Kaggle** ([kaggle.com](https://www.kaggle.com)) — Free datasets and interactive notebooks to practice.
 * - **Hugging Face** ([huggingface.co](https://huggingface.co)) — The GitHub of AI models.
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: Proceed to Module 01_NumPy to begin your coding journey!
// ─────────────────────────────────────────────────────────────────

export { };
