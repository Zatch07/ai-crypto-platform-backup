import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory counter for API request volume tracking
let apiRequestCount = 0;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  apiRequestCount += 1;

  const memory = process.memoryUsage();
  const uptimeSeconds = process.uptime();
  const cpuUsage = process.cpuUsage();
  const environment = process.env.NODE_ENV || 'production';

  // Format metrics in standard Prometheus exposition format (text/plain; version=0.0.4)
  const metrics = [
    '# HELP process_uptime_seconds Total time the process has been running in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptimeSeconds.toFixed(2)}`,
    '',
    '# HELP nodejs_memory_heap_total_bytes Process heap total memory in bytes.',
    '# TYPE nodejs_memory_heap_total_bytes gauge',
    `nodejs_memory_heap_total_bytes ${memory.heapTotal}`,
    '',
    '# HELP nodejs_memory_heap_used_bytes Process heap used memory in bytes.',
    '# TYPE nodejs_memory_heap_used_bytes gauge',
    `nodejs_memory_heap_used_bytes ${memory.heapUsed}`,
    '',
    '# HELP nodejs_memory_rss_bytes Resident Set Size memory in bytes.',
    '# TYPE nodejs_memory_rss_bytes gauge',
    `nodejs_memory_rss_bytes ${memory.rss}`,
    '',
    '# HELP nodejs_memory_external_bytes Memory used by C++ objects bound to JavaScript objects in bytes.',
    '# TYPE nodejs_memory_external_bytes gauge',
    `nodejs_memory_external_bytes ${memory.external}`,
    '',
    '# HELP nodejs_cpu_user_seconds_total Total user CPU time spent in seconds.',
    '# TYPE nodejs_cpu_user_seconds_total counter',
    `nodejs_cpu_user_seconds_total ${(cpuUsage.user / 1_000_000).toFixed(4)}`,
    '',
    '# HELP nodejs_cpu_system_seconds_total Total system CPU time spent in seconds.',
    '# TYPE nodejs_cpu_system_seconds_total counter',
    `nodejs_cpu_system_seconds_total ${(cpuUsage.system / 1_000_000).toFixed(4)}`,
    '',
    '# HELP crypto_app_status Health status of the crypto web application (1 = UP, 0 = DOWN).',
    '# TYPE crypto_app_status gauge',
    `crypto_app_status{environment="${environment}"} 1`,
    '',
    '# HELP http_api_requests_total Total number of HTTP API requests processed.',
    '# TYPE http_api_requests_total counter',
    `http_api_requests_total{endpoint="/api/metrics",status="200"} ${apiRequestCount}`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics);
}
