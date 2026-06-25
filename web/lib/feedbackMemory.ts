export type FeedbackRow = {
  signalType?: string;
  taskType?: string;
  verdict?: string;
  platform?: string;
  sessionDate?: string;
};

const memoryFeedback: FeedbackRow[] = [];

export function pushFeedback(rows: FeedbackRow[]) {
  memoryFeedback.push(...rows);
}

export function getFeedbackAggregate() {
  const bySignal: Record<string, { wrong: number; total: number }> = {};
  const byTask: Record<string, { wrong: number; total: number }> = {};

  for (const row of memoryFeedback) {
    const sig = row.signalType || "unknown";
    const task = row.taskType || "general";
    bySignal[sig] = bySignal[sig] || { wrong: 0, total: 0 };
    byTask[task] = byTask[task] || { wrong: 0, total: 0 };
    bySignal[sig].total += 1;
    byTask[task].total += 1;
    if (row.verdict === "wrong") {
      bySignal[sig].wrong += 1;
      byTask[task].wrong += 1;
    }
  }

  return {
    rates: Object.entries(bySignal).map(([signalType, counts]) => ({
      signalType,
      falsePositiveRate: counts.total ? Math.round((counts.wrong / counts.total) * 100) : 0,
      samples: counts.total,
    })),
    byTaskType: Object.entries(byTask).map(([taskType, counts]) => ({
      taskType,
      wrong: counts.wrong,
      total: counts.total,
    })),
    totalSamples: memoryFeedback.length,
  };
}
