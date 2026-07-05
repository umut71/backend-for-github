import { Injectable } from '@nestjs/common';

/**
 * ADIM 8 — Bağımlılıksız Prometheus metrik toplayıcı.
 * prom-client eklemeden Prometheus text formatı üretir (düşük kardinalite).
 */
interface CounterEntry {
  count: number;
  durationSumSec: number;
}

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private readonly httpCounters = new Map<string, CounterEntry>();
  private static readonly MAX_SERIES = 500; // kardinalite koruması

  /** HTTP isteğini kaydeder. route düşük kardinalite için şablon yolu olmalı. */
  recordHttp(
    method: string,
    route: string,
    status: number,
    durationMs: number,
  ): void {
    const key = `${method}|${route}|${status}`;
    let entry = this.httpCounters.get(key);
    if (!entry) {
      if (this.httpCounters.size >= MetricsService.MAX_SERIES) return;
      entry = { count: 0, durationSumSec: 0 };
      this.httpCounters.set(key, entry);
    }
    entry.count += 1;
    entry.durationSumSec += durationMs / 1000;
  }

  /** Prometheus text exposition formatında metrikleri döndürür. */
  render(): string {
    const lines: string[] = [];
    const mem = process.memoryUsage();

    lines.push(
      '# HELP buzz_process_uptime_seconds Sürecin çalışma süresi',
      '# TYPE buzz_process_uptime_seconds gauge',
      `buzz_process_uptime_seconds ${((Date.now() - this.startedAt) / 1000).toFixed(0)}`,
      '# HELP buzz_process_resident_memory_bytes RSS bellek',
      '# TYPE buzz_process_resident_memory_bytes gauge',
      `buzz_process_resident_memory_bytes ${mem.rss}`,
      '# HELP buzz_nodejs_heap_used_bytes V8 heap kullanımı',
      '# TYPE buzz_nodejs_heap_used_bytes gauge',
      `buzz_nodejs_heap_used_bytes ${mem.heapUsed}`,
    );

    lines.push(
      '# HELP buzz_http_requests_total Toplam HTTP istek sayısı',
      '# TYPE buzz_http_requests_total counter',
    );
    for (const [key, entry] of this.httpCounters) {
      const [method, route, status] = key.split('|');
      const labels = `method="${method}",route="${route}",status="${status}"`;
      lines.push(`buzz_http_requests_total{${labels}} ${entry.count}`);
    }

    lines.push(
      '# HELP buzz_http_request_duration_seconds HTTP istek süresi toplamı',
      '# TYPE buzz_http_request_duration_seconds summary',
    );
    for (const [key, entry] of this.httpCounters) {
      const [method, route, status] = key.split('|');
      const labels = `method="${method}",route="${route}",status="${status}"`;
      lines.push(
        `buzz_http_request_duration_seconds_sum{${labels}} ${entry.durationSumSec.toFixed(4)}`,
        `buzz_http_request_duration_seconds_count{${labels}} ${entry.count}`,
      );
    }

    return lines.join('\n') + '\n';
  }
}
