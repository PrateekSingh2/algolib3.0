/**
 * realTimeVisualizer.js — AlgoLib Ultimate AI Visualization Engine
 * Provider: Groq
 * Model   : llama-3.3-70b-versatile 
 */
const { stream } = require('@netlify/functions'); 
const { rateLimit } = require('./utils/rate-limit');

const API_ENDPOINT  = 'https://api.groq.com/openai/v1/chat/completions';
const TARGET_MODEL  = 'llama-3.3-70b-versatile';
const TEMPERATURE   = 0.1; 
const MAX_TOKENS    = 4096;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = [
  'You are an elite staff engineer specializing in interactive Data Structures and Algorithms (DSA) visualizers.',
  'Your task is to produce an incredibly polished, responsive, and completely self-contained interactive React visualization component.',
  '',
  'OUTPUT FORMAT — Your output must NOT be JSON. Provide plain text strictly in this structure:',
  '',
  'Title: <Concise name of algorithm/problem>',
  'Summary: <2-3 lines explaining the core logic, optimization strategy, and Big-O complexities>',
  '',
  '```jsx',
  '<Complete, self-contained React code — see rules below. Use Javascript/JSX only, NO Typescript.>',
  '```',
  '',
  '════════════════════════════════════════════════════════════════════',
  'CRITICAL REACT EXPORT & SYNTAX RULES',
  '════════════════════════════════════════════════════════════════════',
  '1. COMPONENT STRUCTURE: The component name must be exactly "Visualizer". It takes zero props.',
  '2. RENDER CALL: The final line of code must be exactly: render(<Visualizer />);',
  '3. NO IMPORTS & NO TYPESCRIPT: Do not use import or require statements. All necessary React hooks and Lucide icons will be provided globally. Use vanilla JS/JSX ONLY (no type annotations).',
  '4. AVAILABLE GLOBALS (DO NOT IMPORT):',
  '   Hooks: useState, useEffect, useRef, useMemo, useCallback',
  '   Icons: Play, Pause, RotateCcw, SkipForward, SkipBack, ChevronRight, Info, AlertTriangle, Check, Layers, Code, PlayCircle',
  '5. STYLING: Use ONLY inline React style objects. Never use Tailwind classes or external CSS styles.',
  '6. ESCAPING: You are free to use template literals (``) and quotes inside the code block as long as it is valid React syntax.',
  '',
  '════════════════════════════════════════════════════════════════════',
  'REQUIRED LAYOUT STRUCTURE (Every component must build these 4 sections inside a sleek layout)',
  '════════════════════════════════════════════════════════════════════',
  'SECTION 1: CUSTOM INPUT CONTROL PANEL (At the top)',
  '  - Provide appropriate native HTML controls for the problem (e.g., a text input for comma-separated arrays, target values, node count, or sliders).',
  '  - Include an "Apply & Restart" button.',
  '  - On click, parse the input safely, pre-compute the execution timeline arrays, set the active step to 0, and pause playback. Display a brief inline message if input format validation fails.',
  '  - Panel Style: Background #161b22, border 1px solid #30363d, padding 14px, border-radius 10px.',
  '',
  'SECTION 2: DYNAMIC GRAPHIC CANVAS (Center)',
  '  - Render an intuitive, modern visualization mapping out the structure:',
  '    * For linear items (Arrays, Trees, Matrices): show cells with index indicators, value tags, and tracking pointers.',
  '    * For Graphs/Trees: use beautifully placed canvas/SVG representations.',
  '  - Every moving element must include a smooth layout transition: style={{ transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}.',
  '',
  'SECTION 3: STATE METRICS & RUNTIME EXECUTION TRACE LOG (Below Canvas)',
  '  - Split into a 2-column details card.',
  '  - Column A (Variables Tracker): Renders a grid showing key variables (e.g., pointers like `i`, `j`, active values, min/max metrics, or tracking states).',
  '  - Column B (Narration & Step Trace): Renders a 1-sentence plain-English explanation detailing why the current pointer shift or mutation is occurring.',
  '',
  'SECTION 4: PROFESSIONAL PLAYER TOOLBAR (At the bottom)',
  '  - Layout a centralized media-player deck containing: Step Back, Play/Pause, Step Forward, and Reset buttons.',
  '  - Display a clean step metric text badge: "Step [currentStep] / [totalSteps]".',
  '  - MUST Include a speed control selector or slider (e.g., tracking a dynamic state delay interval from 200ms to 1200ms) to update playback speeds in real time.',
  '',
  '════════════════════════════════════════════════════════════════════',
  'COLOR LANGUAGE (Strict brand theme palettes)',
  '════════════════════════════════════════════════════════════════════',
  '  - Canvas Canvas Area: #0a0a0f',
  '  - Element Cards: #0d1117',
  '  - Interacting Inputs & Badges: #161b22',
  '  - Buttons: #21262d',
  '  - Borders: #30363d (Default), #6366f1 (Active Focus Target)',
  '  - Typography: Primary text #e6edf3, Secondary descriptive text #8b949e, Accents #a5b4fc',
  '  - States: Highlighting #6366f1, Matched/Sorted #10b981, Swapping/Alerts #ef4444',
  '',
  'Ensure the generation is complete and syntactically flawless. Do not omit any elements.',
].join('\n');

exports.handler = stream(async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  
  try {
      rateLimit(event, 10, 60000);
  } catch (err) {
      return { statusCode: 429, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
  
  let body = {};
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Malformed JSON payload.' }) }; }

  const { problemInput } = body;
  if (!problemInput) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Input problem criteria is empty.' }) };

  // Updated to look for Groq API Key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Groq target authentication key is missing.' }) };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TARGET_MODEL,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        stream: true, 
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: problemInput.trim() }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { statusCode: response.status, headers: CORS_HEADERS, body: JSON.stringify({ error: `Groq API error: ${errorText}` }) };
    }

    // Pipe the active stream directly to the frontend
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: response.body
    };

  } catch (globalErr) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Internal server stream execution fault.' }) };
  }
});