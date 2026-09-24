/**
 * Development-only GPU timing per render stage, from
 * EXT_disjoint_timer_query_webgl2. Queries resolve a few frames late, so
 * results are polled and averaged over a sampling window.
 */
type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };

export class GpuProfiler {
  private readonly extension: TimerExtension | null;
  private readonly pending: { label: string; query: WebGLQuery }[] = [];
  private totals = new Map<string, { sum: number; count: number }>();
  private open: { label: string; query: WebGLQuery } | null = null;
  active = false;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.extension = gl.getExtension(
      "EXT_disjoint_timer_query_webgl2"
    ) as TimerExtension | null;
  }

  get supported() {
    return this.extension !== null;
  }

  begin(label: string) {
    if (!this.active || !this.extension || this.open) return;
    const query = this.gl.createQuery();
    if (!query) return;
    this.gl.beginQuery(this.extension.TIME_ELAPSED_EXT, query);
    this.open = { label, query };
  }

  end() {
    if (!this.open || !this.extension) return;
    this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.pending.push(this.open);
    this.open = null;
  }

  /** Times one stage; nested calls are ignored rather than corrupting a query. */
  time<T>(label: string, run: () => T): T {
    const outer = this.open === null;
    if (outer) this.begin(label);
    try {
      return run();
    } finally {
      if (outer) this.end();
    }
  }

  poll() {
    if (!this.extension) return;
    const disjoint = this.gl.getParameter(this.extension.GPU_DISJOINT_EXT);
    while (this.pending.length) {
      const { label, query } = this.pending[0];
      if (!this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE))
        break;
      this.pending.shift();
      const nanoseconds = this.gl.getQueryParameter(
        query,
        this.gl.QUERY_RESULT
      ) as number;
      this.gl.deleteQuery(query);
      if (disjoint) continue;
      const total = this.totals.get(label) ?? { sum: 0, count: 0 };
      total.sum += nanoseconds / 1e6;
      total.count++;
      this.totals.set(label, total);
    }
  }

  reset() {
    this.totals = new Map();
  }

  /** Mean milliseconds per stage over the frames sampled since reset. */
  report() {
    const result: Record<string, number> = {};
    this.totals.forEach(({ sum, count }, label) => {
      result[label] = Math.round((sum / Math.max(1, count)) * 1000) / 1000;
    });
    return result;
  }
}
