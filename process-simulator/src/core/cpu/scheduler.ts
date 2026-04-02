// core/cpu/scheduler.ts

import { Process } from "./process";

export class Scheduler {
  private queue: Process[] = [];
  private quantum: number;
  private currentQuantum: number = 0;

  constructor(quantum: number = 2) {
    this.quantum = quantum;
  }

  addProcess(process: Process) {
    process.state = "ready";
    this.queue.push(process);
  }

  getNextProcess(): Process | null {
    this.currentQuantum = 0;
    return this.queue.shift() || null;
  }

  tick(process: Process): Process | null {
    this.currentQuantum++;

    if (process.remainingTime <= 0) {
      return null;
    }

    if (this.currentQuantum >= this.quantum) {
      process.state = "ready";
      this.queue.push(process);
      return this.getNextProcess();
    }

    return process;
  }

  hasProcess() {
    return this.queue.length > 0;
  }
}