type Job = { callback: () => void; remaining: number; interval: number; handle?: ReturnType<typeof setTimeout>; started: number };
/** Session-local timers: pause preserves remaining delays, dispose cancels stale callbacks. */
export class GameClock {
  private jobs = new Map<number, Job>();
  private sequence = 0;
  private paused = false;
  private disposed = false;
  private schedule(id: number, job: Job) {
    if (this.paused || this.disposed) return;
    job.started = Date.now();
    job.handle = globalThis.setTimeout(() => {
      if (!this.jobs.has(id)) return;
      job.handle = undefined;
      if (!job.interval) this.jobs.delete(id);
      job.callback();
      if (job.interval && this.jobs.has(id)) { job.remaining = job.interval; this.schedule(id, job); }
    }, job.remaining);
  }
  private add(callback: () => void, delay: number, interval: number) {
    const id = ++this.sequence;
    const job = { callback, remaining: delay, interval, started: 0 };
    this.jobs.set(id, job);
    this.schedule(id, job);
    return id;
  }
  setTimeout = (callback: () => void, delay = 0) => this.add(callback, delay, 0);
  setInterval = (callback: () => void, delay = 0) => this.add(callback, delay, Math.max(1, delay));
  clearTimeout = (id: number) => {
    const job = this.jobs.get(id);
    if (job?.handle !== undefined) globalThis.clearTimeout(job.handle);
    this.jobs.delete(id);
  };
  clearInterval = this.clearTimeout;
  isPaused = () => this.paused;
  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    this.jobs.forEach((job, id) => {
      if (paused) {
        if (job.handle !== undefined) {
          globalThis.clearTimeout(job.handle);
          job.remaining = Math.max(0, job.remaining - (Date.now() - job.started));
          job.handle = undefined;
        }
      } else this.schedule(id, job);
    });
  }
  activate() { this.disposed = false; }
  dispose() { this.jobs.forEach((_, id) => this.clearTimeout(id)); this.disposed = true; }
}
