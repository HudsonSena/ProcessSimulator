// /core/cpu/scheduler.ts

import { Process } from "../models/process";

export class Scheduler {
  queue: Process[] = [];

  add(process: Process) {
    process.state = "ready";
    this.queue.push(process);
  }

  next(): Process | null {
    return this.queue.shift() || null;
  }

  requeue(process: Process) {
    if (process.state !== "terminated") {
      process.state = "ready";
      this.queue.push(process);
    }
  }
}