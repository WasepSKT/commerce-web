import { Request, Response, NextFunction } from 'express';

interface Metrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  memoryUsage: process.memoryUsage(),
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metrics.requestCount++;
    metrics.totalResponseTime += responseTime;
    metrics.memoryUsage = process.memoryUsage();
    
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
    
    // Log jika memory usage tinggi (> 200 MB)
    if (metrics.memoryUsage.heapUsed > 200 * 1024 * 1024) {
      console.warn('⚠️ High memory usage:', {
        heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)} MB`,
      });
    }
  });
  
  next();
};

export const getMetrics = () => ({
  ...metrics,
  averageResponseTime: metrics.requestCount > 0 
    ? Math.round(metrics.totalResponseTime / metrics.requestCount) 
    : 0,
  errorRate: metrics.requestCount > 0 
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) 
    : '0.00',
  memoryUsageMB: {
    heapUsed: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(metrics.memoryUsage.external / 1024 / 1024),
  }
});
