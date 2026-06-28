import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export interface TraceStep {
  event: string;
  line: number;
  stdout: string;
  globals?: Record<string, any>;
  ordered_globals?: string[];
  stack_to_render?: Array<{
    frame_id: number;
    func_name: string;
    encoded_locals: Record<string, any>;
    ordered_varnames: string[];
    is_highlighted: boolean;
  }>;
  heap?: Record<string, any>;
  exception_msg?: string;
}

export interface TraceData {
  code: string;
  trace: TraceStep[];
}

export function useTraceEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = traceData?.trace.length || 0;
  const currentTrace = traceData?.trace[currentStep];

  const fetchTrace = useCallback(async (code: string, language: string, customInput: string) => {
    if (!code.trim()) return;
    
    setIsProcessing(true);
    setTraceData(null);
    setCurrentStep(0);

    try {
      // Use the local serverless proxy
      const response = await fetch('/.netlify/functions/trace-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, customInput })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trace');
      }

      if (!data.trace || !Array.isArray(data.trace)) {
        throw new Error('Invalid trace format received from engine');
      }

      setTraceData(data);
      setCurrentStep(0);
      toast.success('Trace generated successfully!');
    } catch (error: any) {
      console.error('Trace error:', error);
      toast.error(error.message || 'An error occurred during execution');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
  }, [totalSteps]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const jumpToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  // Derived state for the UI
  const stdout = useMemo(() => {
    if (!currentTrace) return '';
    return currentTrace.stdout || '';
  }, [currentTrace]);

  const exception = useMemo(() => {
    if (!currentTrace) return null;
    return currentTrace.event === 'uncaught_exception' || currentTrace.exception_msg 
      ? currentTrace.exception_msg 
      : null;
  }, [currentTrace]);

  return {
    isProcessing,
    traceData,
    currentStep,
    totalSteps,
    currentTrace,
    stdout,
    exception,
    fetchTrace,
    stepForward,
    stepBackward,
    reset,
    jumpToStep,
    clearTrace: () => setTraceData(null),
    setTraceData // Add this so we can inject remote trace data
  };
}
