"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import * as LucideIcons from 'lucide-react';

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class SandboxErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#0a0a0f', border: '1px solid #ef4444', borderRadius: '12px', margin: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '10px' }}>
            <LucideIcons.AlertTriangle size={18} />
            <strong style={{ fontSize: '15px' }}>Sandbox Execution Failure</strong>
          </div>
          <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 14px' }}>
            The code failed to execute due to an unexpected runtime exception.
          </p>
          <pre style={{ color: '#f87171', background: 'rgba(239,68,68,0.06)', padding: '12px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', fontFamily: 'monospace' }}>
            {this.state.errorMsg}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            style={{ padding: '8px 14px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '12px' }}
          >
            Clear Exception & Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── SANDBOX COMPONENT ───────────────────────────────────────────────────────
interface LiveSandboxProps {
  code: string;
}

export default function LiveSandbox({ code }: LiveSandboxProps) {
  // Inject globals that the AI generated code is allowed to use
  const LIVE_SCOPE = { 
    React, useState, useEffect, useRef, useMemo, useCallback, ...LucideIcons 
  };

  return (
    <SandboxErrorBoundary>
      <LiveProvider code={code} scope={LIVE_SCOPE} noInline={true}>
        <div style={{ position: 'relative', width: '100%', minHeight: '450px', background: '#0a0a0f', overflowX: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2, padding: '20px' }}>
            <LivePreview />
          </div>
        </div>
        <LiveError 
          style={{ 
            margin: '16px', padding: '14px', borderRadius: '8px', 
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', 
            color: '#f87171', fontFamily: 'monospace', fontSize: '12px', 
            whiteSpace: 'pre-wrap', lineHeight: 1.5 
          }} 
        />
      </LiveProvider>
    </SandboxErrorBoundary>
  );
}