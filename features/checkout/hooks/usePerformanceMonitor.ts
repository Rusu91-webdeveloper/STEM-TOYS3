import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  stepLoadTime: number;
  totalTime: number;
  stepCount: number;
  errors: string[];
}

interface UsePerformanceMonitorProps {
  step: string;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitor({
  step,
  onMetricsUpdate,
}: UsePerformanceMonitorProps) {
  const startTime = useRef<number>(Date.now());
  const stepStartTime = useRef<number>(Date.now());
  const metrics = useRef<PerformanceMetrics>({
    stepLoadTime: 0,
    totalTime: 0,
    stepCount: 0,
    errors: [],
  });

  const recordStep = useCallback(() => {
    const now = Date.now();
    const stepTime = now - stepStartTime.current;

    metrics.current = {
      ...metrics.current,
      stepLoadTime: stepTime,
      totalTime: now - startTime.current,
      stepCount: metrics.current.stepCount + 1,
    };

    // Reset step timer
    stepStartTime.current = now;

    // Report metrics if callback provided
    onMetricsUpdate?.(metrics.current);

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] Step "${step}" loaded in ${stepTime}ms`);
    }
  }, [step, onMetricsUpdate]);

  const recordError = useCallback(
    (error: string) => {
      metrics.current.errors.push(error);

      if (process.env.NODE_ENV === "development") {
        console.error(`[Performance] Error in step "${step}":`, error);
      }
    },
    [step]
  );

  const getMetrics = useCallback(() => {
    return { ...metrics.current };
  }, []);

  const resetMetrics = useCallback(() => {
    startTime.current = Date.now();
    stepStartTime.current = Date.now();
    metrics.current = {
      stepLoadTime: 0,
      totalTime: 0,
      stepCount: 0,
      errors: [],
    };
  }, []);

  // Record step completion when step changes
  useEffect(() => {
    if (stepStartTime.current > 0) {
      recordStep();
    }
  }, [step, recordStep]);

  return {
    recordStep,
    recordError,
    getMetrics,
    resetMetrics,
  };
}
