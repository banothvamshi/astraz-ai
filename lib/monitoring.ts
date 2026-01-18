/**
 * Monitoring and analytics for production
 */

interface Metric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  error?: string;
}

const metrics: Metric[] = [];
const MAX_METRICS = 1000; // Keep last 1000 metrics

/**
 * Log API metric
 */
export function logMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  error?: string
): void {
  const metric: Metric = {
    endpoint,
    method,
    statusCode,
    duration,
    timestamp: Date.now(),
    error,
  };

  metrics.push(metric);

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // Log errors
  if (statusCode >= 400) {
    console.error("API Error:", {
      endpoint,
      method,
      statusCode,
      duration,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(): {
  total: number;
  errors: number;
  averageDuration: number;
  errorRate: number;
  byEndpoint: Record<string, { count: number; errors: number }>;
} {
  const summary = {
    total: metrics.length,
    errors: 0,
    totalDuration: 0,
    byEndpoint: {} as Record<string, { count: number; errors: number }>,
  };

  for (const metric of metrics) {
    if (metric.statusCode >= 400) {
      summary.errors++;
    }
    summary.totalDuration += metric.duration;

    if (!summary.byEndpoint[metric.endpoint]) {
      summary.byEndpoint[metric.endpoint] = { count: 0, errors: 0 };
    }
    summary.byEndpoint[metric.endpoint].count++;
    if (metric.statusCode >= 400) {
      summary.byEndpoint[metric.endpoint].errors++;
    }
  }

  return {
    total: summary.total,
    errors: summary.errors,
    averageDuration: summary.total > 0 ? summary.totalDuration / summary.total : 0,
    errorRate: summary.total > 0 ? summary.errors / summary.total : 0,
    byEndpoint: summary.byEndpoint,
  };
}
