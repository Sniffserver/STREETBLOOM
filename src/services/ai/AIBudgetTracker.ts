export interface AIBudgetMetrics {
  aiRequestsCount: number;
  tokensUsed: number;
  avgLatencyMs: number;
  aiFailuresCount: number;
  cachedResponsesCount: number;
  fallbackResponsesCount: number;
}

export class AIBudgetTracker {
  private static metrics: AIBudgetMetrics = {
    aiRequestsCount: 0,
    tokensUsed: 0,
    avgLatencyMs: 0,
    aiFailuresCount: 0,
    cachedResponsesCount: 0,
    fallbackResponsesCount: 0,
  };

  public static recordRequest(tokens: number, latencyMs: number, isCached: boolean = false): void {
    if (isCached) {
      this.metrics.cachedResponsesCount += 1;
      return;
    }

    const prevTotal = this.metrics.aiRequestsCount;
    this.metrics.aiRequestsCount += 1;
    this.metrics.tokensUsed += tokens;
    this.metrics.avgLatencyMs = Math.round(
      (this.metrics.avgLatencyMs * prevTotal + latencyMs) / this.metrics.aiRequestsCount
    );
  }

  public static recordFailure(): void {
    this.metrics.aiFailuresCount += 1;
    this.metrics.fallbackResponsesCount += 1;
  }

  public static recordFallback(): void {
    this.metrics.fallbackResponsesCount += 1;
  }

  public static getMetrics(): AIBudgetMetrics {
    return { ...this.metrics };
  }
}
