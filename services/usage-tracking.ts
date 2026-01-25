// API Usage Tracking Service
export interface ApiUsageLog {
  id: string;
  timestamp: string;
  operation: 'text' | 'image' | 'audio';
  model: string;
  success: boolean;
  estimatedCost: number;
  wordId?: string;
}

export interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalEstimatedCost: number;
  textCalls: number;
  imageCalls: number;
  audioCalls: number;
  todayCost: number;
  monthCost: number;
}

const STORAGE_KEY = 'wot_api_usage';

// Cost estimates (in USD) - adjust these based on actual Gemini pricing
const COST_ESTIMATES = {
  text: 0.0005,        // ~$0.0005 per text generation
  image: 0.04,         // ~$0.04 per image (Imagen pricing)
  audio: 0.002,        // ~$0.002 per audio generation
};

export const logApiUsage = (
  operation: 'text' | 'image' | 'audio',
  model: string,
  success: boolean,
  wordId?: string
) => {
  const log: ApiUsageLog = {
    id: Date.now().toString() + Math.random(),
    timestamp: new Date().toISOString(),
    operation,
    model,
    success,
    estimatedCost: success ? COST_ESTIMATES[operation] : 0,
    wordId
  };

  const logs = getUsageLogs();
  logs.push(log);
  
  // Keep only last 1000 logs to prevent storage issues
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const getUsageLogs = (): ApiUsageLog[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getUsageStats = (): UsageStats => {
  const logs = getUsageLogs();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats: UsageStats = {
    totalCalls: logs.length,
    successfulCalls: logs.filter(l => l.success).length,
    failedCalls: logs.filter(l => !l.success).length,
    totalEstimatedCost: logs.reduce((sum, l) => sum + l.estimatedCost, 0),
    textCalls: logs.filter(l => l.operation === 'text' && l.success).length,
    imageCalls: logs.filter(l => l.operation === 'image' && l.success).length,
    audioCalls: logs.filter(l => l.operation === 'audio' && l.success).length,
    todayCost: logs
      .filter(l => new Date(l.timestamp) >= todayStart)
      .reduce((sum, l) => sum + l.estimatedCost, 0),
    monthCost: logs
      .filter(l => new Date(l.timestamp) >= monthStart)
      .reduce((sum, l) => sum + l.estimatedCost, 0),
  };

  return stats;
};

export const clearUsageLogs = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
};

export const exportUsageLogs = () => {
  const logs = getUsageLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-usage-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
