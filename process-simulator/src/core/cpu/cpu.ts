// core/cpu/cpu.ts

import { Process } from "./process";

export class CPU {
  currentProcess: Process | null = null;
  time: number = 0;

  execute() {
    if (!this.currentProcess) return;

    this.currentProcess.state = "running";
    this.currentProcess.remainingTime--;
    this.time++;

    if (this.currentProcess.remainingTime <= 0) {
      this.currentProcess.state = "terminated";
      this.currentProcess = null;
    }
  }

  assignProcess(process: Process) {
    this.currentProcess = process;
  }

  isIdle() {
    return this.currentProcess === null;
  }
}