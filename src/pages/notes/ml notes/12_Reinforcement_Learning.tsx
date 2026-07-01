/**
 * # 🧠 Part 12: Reinforcement Learning
 * > **AlgoLib ML Notes** — *Comprehensive AI/ML Reference*
 *
 * \`FILE: 12_Reinforcement_Learning\`
 *
 * ---
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: CORE CONCEPTS OF RL
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🐶 The Dog Training Analogy
 * 
 * ![RL Loop](/rl_loop.svg)
 *
 * You want to teach a dog (the **Agent**) to sit. You don't give the dog a labeled dataset of 1,000 sitting photos (Supervised Learning). Instead, you observe the dog in your living room (the **Environment**).
 *
 * When you say "Sit" (the **State**), the dog tries various things (**Actions**). If it barks, you do nothing. If it sits, you give it a treat (a **Reward**). Over time, through trial and error, the dog learns a rule: "When state=Sit, action=Sit yields high reward." This learned rule is its **Policy**.
 *
 * ---
 *
 * ### 🧩 Core Components
 *
 * | Term | Symbol | Meaning | Example (Chess) |
 * |---|---|---|---|
 * | **Agent** | - | The decision maker | The AI player |
 * | **Environment** | - | What the agent interacts with | The chessboard and opponent |
 * | **State** | **S** | Current situation | The positions of all pieces |
 * | **Action** | **A** | What the agent can do | Moving Knight to F3 |
 * | **Reward** | **R** | Feedback signal | +1 for winning, 0 for moving |
 * | **Policy** | **π** | The agent's strategy: `S → A` | "If pieces are here, move Knight" |
 * | **Value** | **V** | Expected *total* future reward | "This board looks winning for me" |
 * | **Q-Value**| **Q** | Expected reward for Action A in State S| "Moving Knight to F3 leads to a win"|
 *
 * > **Goal:** Learn policy π that maximizes expected cumulative reward:
 * > `G_t = r_t + γ·r_{t+1} + γ²·r_{t+2} + ... = Σ γᵏ·r_{t+k}`
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: MARKOV DECISION PROCESS (MDP)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 📐 The Mathematical Framework
 *
 * An MDP is how we mathematically formalize RL problems. It consists of `(S, A, P, R, γ)`:
 *
 * - **S, A, R:** State, Action, Reward
 * - **P (Transition Probability):** `P(s' | s, a)` — The probability of ending up in state `s'` if you take action `a` in state `s`.
 * - **γ (Discount Factor):** `[0,1]` Determines how much to value future rewards.
 *
 * ### 🧠 The Markov Property
 *
 * > *"The future is independent of the past given the present"*
 * > `P(s_{t+1}|s_t, a_t) = P(s_{t+1}|s_0,...,s_t, a_0,...,a_t)`
 *
 * ### 📊 Value Functions & Bellman Equations
 *
 * | Function | What it evaluates | Formula |
 * |---|---|---|
 * | **State Value (V)** | How good is state `s`? | `V^π(s) = E_π[G_t | S_t = s]` |
 * | **Action Value (Q)**| How good is action `a` in state `s`?| `Q^π(s,a) = E_π[G_t | S_t = s, A_t = a]` |
 *
 * **Bellman Optimality Equation for Q:**
 * `Q*(s,a) = Σ_s' P(s'|s,a)[R + γ·max_{a'} Q*(s',a')]`
 */


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: Q-LEARNING & DEEP Q-NETWORK (DQN)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🤖 Q-Learning (Tabular)
 *
 * Q-learning updates values based on the temporal difference (TD):
 * `Q(s,a) ← Q(s,a) + α[r + γ·max_{a'} Q(s',a') - Q(s,a)]`
 *
 * **ε-GREEDY Exploration:**
 * - Prob `ε` → random action (EXPLORE)
 * - Prob `1-ε` → best action (EXPLOIT)
 *
 * ### 🧠 Deep Q-Network (DQN)
 *
 * Replaces Q-table with a Neural Network (DeepMind, 2013).
 *
 * | Key Innovation | What it solves | How it works |
 * |---|---|---|
 * | **Experience Replay** | Breaks temporal correlations in data | Store `(s,a,r,s')` tuples, sample random batches for training |
 * | **Target Network** | Prevents oscillation in training | Separate network for computing TD targets, updated slowly |
 */

const dqnCode = `
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from collections import deque
import random

# ── Q-Network ─────────────────────────────────────────────
class QNetwork(nn.Module):
    def __init__(self, state_dim: int, action_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, action_dim)
        )
    def forward(self, x): return self.net(x)

# ── Replay Buffer ─────────────────────────────────────────
class ReplayBuffer:
    def __init__(self, capacity: int = 10000):
        self.buffer = deque(maxlen=capacity)
    
    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size: int):
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        return (
            torch.FloatTensor(np.array(states)),
            torch.LongTensor(actions),
            torch.FloatTensor(rewards),
            torch.FloatTensor(np.array(next_states)),
            torch.FloatTensor(dones)
        )
    def __len__(self): return len(self.buffer)

# ── DQN Agent ─────────────────────────────────────────────
class DQNAgent:
    def __init__(self, state_dim: int, action_dim: int):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.q_net = QNetwork(state_dim, action_dim).to(self.device)
        self.target_net = QNetwork(state_dim, action_dim).to(self.device)
        self.target_net.load_state_dict(self.q_net.state_dict())
        
        self.optimizer = optim.Adam(self.q_net.parameters(), lr=1e-4)
        self.buffer = ReplayBuffer(capacity=100000)
        self.gamma, self.batch_size = 0.99, 64
        
    def train_step(self):
        if len(self.buffer) < self.batch_size: return
        
        states, actions, rewards, next_states, dones = self.buffer.sample(self.batch_size)
        states, actions, rewards = states.to(self.device), actions.to(self.device), rewards.to(self.device)
        next_states, dones = next_states.to(self.device), dones.to(self.device)
        
        # Current Q values
        current_q = self.q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Target Q values (no gradient needed for target!)
        with torch.no_grad():
            next_q = self.target_net(next_states).max(1)[0]
            target_q = rewards + self.gamma * next_q * (1 - dones)
        
        loss = nn.SmoothL1Loss()(current_q, target_q)  # Huber loss
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_net.parameters(), 1.0)
        self.optimizer.step()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: POLICY GRADIENT METHODS
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🎯 Policy Gradient Methods
 *
 * Instead of learning Q-values, directly learn the POLICY `π(a|s)`.
 *
 * **REINFORCE Algorithm (Monte Carlo Policy Gradient):**
 * `∇_θ J(θ) = E[∇_θ log π_θ(a|s) · G_t]`
 * - Increase probability of actions that led to HIGH rewards.
 * - Decrease probability of actions that led to LOW rewards.
 *
 * **Actor-Critic:**
 * - **Actor:** Policy network `π_θ(a|s)` — decides actions.
 * - **Critic:** Value network `V_φ(s)` — evaluates states.
 * - **Advantage `A(s,a)`** = `Q(s,a) - V(s) = r + γV(s') - V(s)`
 */

const reinforceCode = `
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical
import gymnasium as gym

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, action_dim)
        )
    def forward(self, x):
        return Categorical(logits=self.net(x))   # Returns distribution

def reinforce(env_name="CartPole-v1", n_episodes=500):
    env = gym.make(env_name)
    policy = PolicyNetwork(4, 2)
    optimizer = optim.Adam(policy.parameters(), lr=1e-3)
    gamma = 0.99
    
    for ep in range(n_episodes):
        state, _ = env.reset()
        log_probs, rewards = [], []
        
        # Collect episode trajectory
        while True:
            dist = policy(torch.FloatTensor(state))
            action = dist.sample()
            log_probs.append(dist.log_prob(action))
            state, reward, term, trunc, _ = env.step(action.item())
            rewards.append(reward)
            if term or trunc: break
        
        # Compute discounted returns
        G = 0; returns = []
        for r in reversed(rewards):
            G = r + gamma * G
            returns.insert(0, G)
        
        returns = torch.tensor(returns)
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)
        
        # Policy gradient loss
        loss = -torch.stack([lp * G for lp, G in zip(log_probs, returns)]).sum()
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: PPO (PROXIMAL POLICY OPTIMIZATION)
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 👑 PPO: Proximal Policy Optimization
 *
 * PPO is THE most widely used RL algorithm (used in ChatGPT RLHF, robotics).
 * Core idea: Prevent policy from changing TOO much in one update.
 *
 * **Clipped Objective:**
 * `L^CLIP = E[min(r_t(θ)·Â_t, clip(r_t(θ), 1-ε, 1+ε)·Â_t)]`
 * - `r_t(θ)` = probability ratio (`new / old`)
 * - `ε` = clip range (typically 0.1-0.2). This forms a "trust region".
 */

const ppoSkeletonCode = `
# Using Stable-Baselines3 (best practical RL library)
import gymnasium as gym
from stable_baselines3 import PPO

# ── Simple PPO Training ───────────────────────────────────
env = gym.make("CartPole-v1")
model = PPO(
    "MlpPolicy",
    env,
    learning_rate=3e-4,
    n_steps=2048,         # Steps per rollout
    batch_size=64,
    n_epochs=10,          # Gradient updates per rollout
    gamma=0.99,
    clip_range=0.2,       # ε in clip objective
    verbose=1
)

model.learn(total_timesteps=100_000)
model.save("ppo_cartpole")

# Evaluate
obs, _ = env.reset()
for _ in range(1000):
    action, _states = model.predict(obs, deterministic=True)
    obs, reward, terminated, truncated, info = env.step(action)
    if terminated or truncated:
        obs, _ = env.reset()
`;


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: RLHF — RL FROM HUMAN FEEDBACK
// ═══════════════════════════════════════════════════════════════════

/**
 * ### 🗣️ How ChatGPT Learned to Talk
 *
 * RLHF is how language models are aligned with human intent.
 *
 * | Stage | Name | What happens |
 * |---|---|---|
 * | **1** | **SFT (Supervised Fine-Tuning)** | Start with base LLM, train on high-quality human (prompt, response) pairs. |
 * | **2** | **Reward Model** | Humans rank responses (A is better than B). Train a model `R(prompt, response) → scalar score` to mimic human preference. |
 * | **3** | **RL (PPO)** | Use PPO to optimize the SFT policy against the Reward Model. Includes a KL penalty so the model doesn't drift too far from the SFT base. |
 *
 * > **Modern Alternative:** DPO (Direct Preference Optimization) skips the reward model and directly optimizes the policy on preference data!
 */

const rlhfConceptCode = `
import torch
import torch.nn as nn
from transformers import AutoModel

# ── Reward Model Sketch ───────────────────────────────────
class RewardModel(nn.Module):
    def __init__(self, model_name="gpt2"):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(model_name)
        self.reward_head = nn.Linear(self.backbone.config.hidden_size, 1)
    
    def forward(self, input_ids, attention_mask):
        outputs = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        # Use last token's hidden state
        last_hidden = outputs.last_hidden_state[:, -1, :]
        return self.reward_head(last_hidden).squeeze(-1)

# ── Preference Loss ───────────────────────────────────────
def preference_loss(reward_chosen, reward_rejected):
    # preferred response should have higher reward
    logits = reward_chosen - reward_rejected
    return -torch.log(torch.sigmoid(logits)).mean()

# In practice: Use the 'trl' library from HuggingFace
# from trl import PPOTrainer, PPOConfig
`;


// ═══════════════════════════════════════════════════════════════════
//  📌 REMEMBER: KEY POINTS SUMMARY
// ═══════════════════════════════════════════════════════════════════

/**
 * 📌 MUST REMEMBER:
 *
 * 1. **DQN Innovations:** Experience Replay (breaks correlation) + Target Network (stabilizes).
 * 2. **Algorithm Selection:**
 *    - Discrete actions: DQN, PPO
 *    - Continuous actions: PPO, SAC, TD3
 *    - LLM alignment: PPO (RLHF) or DPO
 * 3. **PPO Key Params:** `clip_range=0.2` prevents destructive policy updates.
 * 4. **RLHF Pipeline:** SFT → Reward Model → PPO (with KL constraint).
 */

// ─────────────────────────────────────────────────────────────────
// NEXT: See 13_Generative_Models_LLMs
// ─────────────────────────────────────────────────────────────────

export {};
